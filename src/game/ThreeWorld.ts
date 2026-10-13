import * as THREE from 'three';
import { Enemy, OtherPlayer, CharacterClassId, WorldDrop, Skill, WarpPoint, DuelOpponent } from '../types/game';
import { sound } from '../utils/audio';
import { WARP_POINTS } from './worldData';

export interface CombatEvent {
  type: 'damage' | 'heal' | 'exp' | 'level_up' | 'loot' | 'kill';
  targetId?: string;
  sourceId?: string;
  amount?: number;
  isCrit?: boolean;
  text?: string;
  x: number;
  y: number;
  z: number;
  color?: string;
}

export class ThreeWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Camera Orbit State
  public cameraDistance: number = 11.0;
  public cameraYaw: number = 0;
  public cameraPitch: number = 0.38;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Player Entity
  public playerGroup: THREE.Group;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public playerVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public playerRotation: number = 0;
  public isMoving: boolean = false;
  public isJumping: boolean = false;
  public isAttacking: boolean = false;
  public attackTimer: number = 0;
  public playerClassId: CharacterClassId = 'paladin';
  private playerLimbs: {
    head: THREE.Object3D;
    torso: THREE.Object3D;
    leftArm: THREE.Object3D;
    rightArm: THREE.Object3D;
    leftLeg: THREE.Object3D;
    rightLeg: THREE.Object3D;
    weapon: THREE.Object3D;
    cape?: THREE.Mesh;
  } = {} as any;

  // Enemies & Other Players Meshes
  private enemyMeshes: Map<string, THREE.Group> = new Map();
  private otherPlayerMeshes: Map<string, THREE.Group> = new Map();
  private dropMeshes: Map<string, THREE.Group> = new Map();

  // Particle & FX systems
  private particles: {
    mesh: THREE.Points;
    geometry: THREE.BufferGeometry;
    positions: Float32Array;
    velocities: Float32Array;
    colors: Float32Array;
    lifetimes: Float32Array;
    maxLifetimes: Float32Array;
    count: number;
  }[] = [];
  private activeFXGroups: { group: THREE.Group; update: (dt: number) => boolean }[] = [];

  // Raycaster for target picking
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();

  // Callbacks
  public onTargetSelect?: (target: { id: string; type: 'enemy' | 'player' | 'npc'; name: string } | null) => void;
  public onCombatEvent?: (evt: CombatEvent) => void;

  // Clock
  private clock: THREE.Clock = new THREE.Clock();
  private walkTime: number = 0;

  // Target Marker Mesh
  private targetMarker: THREE.Mesh;
  public selectedTargetId: string | null = null;

  // Warp & Teleport
  public onNearWarpPortal?: (wp: WarpPoint | null) => void;
  public nearWarpPoint: WarpPoint | null = null;
  private portalMeshes: { group: THREE.Group; vortex: THREE.Mesh; beam: THREE.Mesh; wp: WarpPoint }[] = [];

  // Duel Arena & NPC Master Artorius
  public onNearDuelMaster?: (isNear: boolean) => void;
  public isNearDuelMaster: boolean = false;
  public isDuelActive: boolean = false;
  public activeDuelOpponent: DuelOpponent | null = null;
  public currentDuelOpponentHp: number = 0;
  private duelMasterMesh: THREE.Group | null = null;
  private duelNPCMesh: THREE.Group | null = null;
  private duelBarrierMesh: THREE.Mesh | null = null;
  private duelNPCLimbs: any = null;
  private duelNPCAITimer: number = 0;
  public onDuelDamageTaken?: (dmg: number) => void;
  public onDuelVictory?: (opponent: DuelOpponent) => void;
  public onDuelDefeat?: (opponent: DuelOpponent) => void;

  // Dash Visual FX
  public isDashing: boolean = false;
  private dashTrailParticles: THREE.Points | null = null;

  constructor(container: HTMLElement, classId: CharacterClassId = 'paladin') {
    this.container = container;
    this.playerClassId = classId;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x131d33, 0.009);

    // 2. Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 800);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLighting();

    // 5. Environment & Sky
    this.buildWorldEnvironment();

    // 6. Player Character
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);
    this.buildPlayerModel(classId);

    // 7. Target Marker Ring
    const markerGeo = new THREE.RingGeometry(1.6, 1.9, 32);
    markerGeo.rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.targetMarker = new THREE.Mesh(markerGeo, markerMat);
    this.targetMarker.visible = false;
    this.scene.add(this.targetMarker);

    // 8. Event Listeners
    this.initEvents();

    // 9. Start Loop
    this.startLoop();
  }

  private setupLighting() {
    // Ambient Light (subtle cool blue fill)
    const ambientLight = new THREE.AmbientLight(0x7dd3fc, 0.65);
    this.scene.add(ambientLight);

    // Sun / Key Directional Light with Soft Shadows
    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.45);
    sunLight.position.set(45, 75, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 250;
    const d = 60;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Secondary Hemisphere Light for fantasy radiance
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.5);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);
  }

  private buildWorldEnvironment() {
    // Large Ground Plane
    const groundGeo = new THREE.PlaneGeometry(350, 350, 64, 64);
    groundGeo.rotateX(-Math.PI / 2);

    // Displace vertices gently for natural terrain undulation
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      // Keep town center (radius < 25) flat
      const distFromCenter = Math.sqrt(vx * vx + vz * vz);
      if (distFromCenter > 28) {
        const hill = Math.sin(vx * 0.04) * Math.cos(vz * 0.04) * 2.2 + Math.sin(vx * 0.09) * 0.8;
        posAttr.setY(i, Math.max(-0.5, hill));
      } else {
        posAttr.setY(i, 0);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1b382b, // Lush deep fantasy green
      roughness: 0.85,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // --- SANCTUARY TOWN (Center 0,0) ---
    // Cobblestone Plaza circular base
    const plazaGeo = new THREE.CylinderGeometry(24, 25, 0.25, 48);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x475569, // Slate stone
      roughness: 0.75,
      metalness: 0.2
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.12;
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Central Sanctuary Fountain
    this.buildFountain(0, 0);

    // Town Entrance Pillars & Lanterns
    this.buildTownPillars();

    // Quest Bulletin Board & Market Stalls
    this.buildTownDecorations();

    // --- SURROUNDING BIOMES ---
    // 1. Verdant Forest (East, x: 25 to 80, z: -40 to 30)
    this.buildForestArea();

    // 2. Ancient Ruins (North-West, x: -30 to -70, z: 25 to 65)
    this.buildRuinsArea();

    // 3. Crystal Gorge (West, x: -50 to -90, z: -30 to -80)
    this.buildCrystalArea();

    // 4. Volcanic Crater / Dragon Lair (South-East, x: 75 to 110, z: 65 to 105)
    this.buildVolcanoArea();

    // 5. Realistic SkyDome with deep celestial gradient and twinkling stars
    this.buildSkyDome();

    // 6. Winding Cobblestone Pathways connecting Sanctuary to all 4 biomes and duel arena
    this.buildPathways();

    // 7. Duel Training Arena & Duel Master NPC Artorius (at 18, 26)
    this.buildDuelArena(18, 26);

    // 8. Interactive 3D Warp Portals across the 6 landmark zones
    this.buildWarpPortals();

    // 9. Floating Atmospheric Firefly particles in the forest
    this.createFireflies();

    // 10. Ambient Golden sacred dust in Sanctuary Plaza
    this.createAtmosphericMotes();

    // 11. Dash speed line trail system
    this.createDashTrail();
  }

  private buildFountain(x: number, z: number) {
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(x, 0, z);

    // Outer stone basin ring
    const basinGeo = new THREE.CylinderGeometry(5.2, 5.5, 1.2, 32);
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.y = 0.6;
    basin.castShadow = true;
    basin.receiveShadow = true;
    fountainGroup.add(basin);

    // Water surface
    const waterGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.2, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.y = 1.1;
    fountainGroup.add(water);

    // Central fountain pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.4, 1.8, 3.2, 16);
    const pedestal = new THREE.Mesh(pedestalGeo, basinMat);
    pedestal.position.y = 2.0;
    pedestal.castShadow = true;
    fountainGroup.add(pedestal);

    // Levitating Magic Crystal at center
    const crystalGeo = new THREE.OctahedronGeometry(1.3, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.9
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 4.5;
    fountainGroup.add(crystal);

    // Glowing point light from crystal
    const crystalLight = new THREE.PointLight(0x60a5fa, 2.5, 20);
    crystalLight.position.set(0, 4.5, 0);
    fountainGroup.add(crystalLight);

    // Animate crystal rotation
    this.activeFXGroups.push({
      group: fountainGroup,
      update: (dt) => {
        crystal.rotation.y += dt * 0.8;
        crystal.position.y = 4.5 + Math.sin(this.walkTime * 2) * 0.25;
        return true;
      }
    });

    this.scene.add(fountainGroup);
  }

  private buildTownPillars() {
    const pillarCoords = [
      [-12, -12], [12, -12], [-12, 12], [12, 12],
      [-18, 0], [18, 0], [0, -18], [0, 18]
    ];

    const pillarGeo = new THREE.CylinderGeometry(0.65, 0.85, 4.8, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });

    pillarCoords.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 2.4, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      // Lantern on top
      const lanternGeo = new THREE.BoxGeometry(0.7, 0.9, 0.7);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9
      });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(px, 5.0, pz);
      this.scene.add(lantern);

      // Warm lantern point light
      const pLight = new THREE.PointLight(0xfbbf24, 1.2, 12);
      pLight.position.set(px, 5.0, pz);
      this.scene.add(pLight);
    });
  }

  private buildTownDecorations() {
    // Quest Bulletin Board at (x: 8, z: -6)
    const boardGroup = new THREE.Group();
    boardGroup.position.set(8, 0, -6);
    boardGroup.rotation.y = -Math.PI / 4;

    const post1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    post1.position.set(-1.2, 1.6, 0);
    const post2 = post1.clone();
    post2.position.set(1.2, 1.6, 0);

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.6, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
    );
    board.position.set(0, 2.2, 0);
    board.castShadow = true;

    boardGroup.add(post1, post2, board);
    this.scene.add(boardGroup);

    // Market Tent / Blacksmith Stall at (x: -8, z: 6)
    const stallGroup = new THREE.Group();
    stallGroup.position.set(-8, 0, 6);
    stallGroup.rotation.y = Math.PI / 3;

    const table = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1.0, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x92400e })
    );
    table.position.y = 0.5;
    table.castShadow = true;
    stallGroup.add(table);

    // Anvil
    const anvil = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.7, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
    );
    anvil.position.set(0, 1.35, 0);
    anvil.castShadow = true;
    stallGroup.add(anvil);

    // Tent Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 1.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 })
    );
    roof.position.y = 3.6;
    roof.rotation.y = Math.PI / 4;
    stallGroup.add(roof);

    this.scene.add(stallGroup);
  }

  private buildForestArea() {
    // Generate stylized trees around x: 20 to 80, z: -50 to 30
    const treeGeoCone1 = new THREE.ConeGeometry(2.4, 4.0, 7);
    const treeGeoCone2 = new THREE.ConeGeometry(1.8, 3.2, 7);
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 2.2, 6);

    const treeMat1 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const treeMat2 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.9 });

    for (let i = 0; i < 45; i++) {
      const tx = 25 + Math.random() * 60;
      const tz = -45 + Math.random() * 75;
      // Skip town center
      if (Math.sqrt(tx * tx + tz * tz) < 26) continue;

      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);
      const s = 0.75 + Math.random() * 0.7;
      tree.scale.set(s, s, s);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      tree.add(trunk);

      const foilage1 = new THREE.Mesh(treeGeoCone1, treeMat1);
      foilage1.position.y = 3.2;
      foilage1.castShadow = true;
      tree.add(foilage1);

      const foilage2 = new THREE.Mesh(treeGeoCone2, treeMat2);
      foilage2.position.y = 5.2;
      foilage2.castShadow = true;
      tree.add(foilage2);

      this.scene.add(tree);
    }
  }

  private buildRuinsArea() {
    // Ancient stone pillars & crumbled arches in North-West
    const ruinMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x6366f1,
      emissiveIntensity: 0.8,
      roughness: 0.3
    });

    for (let i = 0; i < 18; i++) {
      const rx = -30 - Math.random() * 40;
      const rz = 25 + Math.random() * 45;

      const ruin = new THREE.Group();
      ruin.position.set(rx, 0, rz);

      const h = 3.5 + Math.random() * 4.5;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, h, 8), ruinMat);
      col.position.y = h / 2;
      col.rotation.z = (Math.random() - 0.5) * 0.25;
      col.castShadow = true;
      ruin.add(col);

      // Embedded glowing rune cube
      if (i % 3 === 0) {
        const rune = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), runeMat);
        rune.position.set(0, h * 0.7, 0.8);
        ruin.add(rune);

        const rLight = new THREE.PointLight(0x818cf8, 1.0, 10);
        rLight.position.set(0, h * 0.7, 1.0);
        ruin.add(rLight);
      }

      this.scene.add(ruin);
    }
  }

  private buildCrystalArea() {
    // Crystal Gorge with glowing giant crystals (West: x: -50 to -90, z: -30 to -80)
    const crystalGeo = new THREE.OctahedronGeometry(2.4, 0);
    const mats = [
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.9
      }),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.9
      })
    ];

    for (let i = 0; i < 20; i++) {
      const cx = -52 - Math.random() * 38;
      const cz = -35 - Math.random() * 45;

      const cry = new THREE.Mesh(crystalGeo, mats[i % 2]);
      const sc = 0.8 + Math.random() * 1.6;
      cry.scale.set(sc * 0.6, sc * 1.8, sc * 0.6);
      cry.position.set(cx, sc * 1.2, cz);
      cry.rotation.x = (Math.random() - 0.5) * 0.6;
      cry.rotation.z = (Math.random() - 0.5) * 0.6;
      cry.castShadow = true;
      this.scene.add(cry);

      if (i % 4 === 0) {
        const cLight = new THREE.PointLight(i % 2 === 0 ? 0x38bdf8 : 0xa855f7, 2.0, 16);
        cLight.position.set(cx, sc * 1.6, cz);
        this.scene.add(cLight);
      }
    }
  }

  private buildVolcanoArea() {
    // Dragon Lair / Volcanic Rift (South-East: x: 75 to 110, z: 65 to 105)
    const riftGroup = new THREE.Group();
    riftGroup.position.set(95, 0, 85);

    // Volcanic Basin Ring
    const basaltGeo = new THREE.TorusGeometry(18, 2.8, 8, 24);
    basaltGeo.rotateX(Math.PI / 2);
    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.95,
      metalness: 0.2
    });
    const basaltRing = new THREE.Mesh(basaltGeo, basaltMat);
    basaltRing.position.y = 0.5;
    riftGroup.add(basaltRing);

    // Glowing Lava Pool center
    const lavaGeo = new THREE.CircleGeometry(16, 32);
    lavaGeo.rotateX(-Math.PI / 2);
    const lavaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.position.y = 0.15;
    riftGroup.add(lava);

    // Red/Orange Point Light from Dragon Crater
    const lavaLight = new THREE.PointLight(0xf97316, 4.0, 35);
    lavaLight.position.set(0, 4.0, 0);
    riftGroup.add(lavaLight);

    this.scene.add(riftGroup);
  }

  private createFireflies() {
    const fireflyCount = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(fireflyCount * 3);

    for (let i = 0; i < fireflyCount; i++) {
      pos[i * 3 + 0] = 20 + Math.random() * 65;
      pos[i * 3 + 1] = 0.8 + Math.random() * 4.5;
      pos[i * 3 + 2] = -40 + Math.random() * 70;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x86efac,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const fireflies = new THREE.Points(geo, mat);
    this.scene.add(fireflies);

    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        const positions = geo.attributes.position.array as Float32Array;
        for (let i = 0; i < fireflyCount; i++) {
          positions[i * 3 + 1] += Math.sin(this.walkTime * 2 + i) * 0.015;
          positions[i * 3 + 0] += Math.cos(this.walkTime + i) * 0.01;
        }
        geo.attributes.position.needsUpdate = true;
        return true;
      }
    });
  }

  // --- REALISTIC SKYDOME & ATMOSPHERE ---
  private buildSkyDome() {
    const skyGeo = new THREE.SphereGeometry(320, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x0c192c,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Realistic Starfield
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.5; // Hemisphere
      const r = 310;
      starPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.max(20, r * Math.cos(phi));
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  // --- WINDING COBBLESTONE PATHWAYS ---
  private buildPathways() {
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Cobblestone slate
      roughness: 0.85,
      metalness: 0.1
    });

    // 5 paths branching out from Plaza center (radius 24)
    const paths = [
      { start: { x: 22, z: 0 }, end: { x: 50, z: -10 }, width: 3.5 }, // To Forest
      { start: { x: -16, z: 16 }, end: { x: -45, z: 42 }, width: 3.5 }, // To Ruins
      { start: { x: -20, z: -10 }, end: { x: -65, z: -50 }, width: 3.5 }, // To Crystal
      { start: { x: 16, z: 16 }, end: { x: 82, z: 75 }, width: 3.5 }, // To Volcano
      { start: { x: 14, z: 10 }, end: { x: 18, z: 26 }, width: 4.0 }, // To Arena
    ];

    paths.forEach(({ start, end, width }) => {
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);

      const pathGeo = new THREE.PlaneGeometry(width, dist, 4, 16);
      pathGeo.rotateX(-Math.PI / 2);
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.position.set(start.x + dx / 2, 0.08, start.z + dz / 2);
      pathMesh.rotation.y = angle;
      pathMesh.receiveShadow = true;
      this.scene.add(pathMesh);
    });
  }

  // --- INTERACTIVE 3D WARP PORTALS ---
  private buildWarpPortals() {
    WARP_POINTS.forEach((wp) => {
      const group = new THREE.Group();
      group.position.set(wp.x, 0, wp.z);

      // Base stone ring
      const baseGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 24);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.17;
      base.receiveShadow = true;
      group.add(base);

      // Inner glowing runic circle
      const runeGeo = new THREE.RingGeometry(0.8, 2.2, 32);
      runeGeo.rotateX(-Math.PI / 2);
      const colorHex = parseInt(wp.color.replace('#', '0x'), 16) || 0x38bdf8;
      const runeMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const rune = new THREE.Mesh(runeGeo, runeMat);
      rune.position.y = 0.36;
      group.add(rune);

      // Two portal monolith pillars
      const pillarGeo = new THREE.BoxGeometry(0.5, 3.8, 0.6);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-1.8, 1.9, 0);
      leftPillar.castShadow = true;
      const rightPillar = leftPillar.clone();
      rightPillar.position.x = 1.8;
      group.add(leftPillar, rightPillar);

      // Swirling vertical portal vortex disk
      const vortexGeo = new THREE.RingGeometry(0.3, 1.6, 24);
      const vortexMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending
      });
      const vortex = new THREE.Mesh(vortexGeo, vortexMat);
      vortex.position.set(0, 2.0, 0);
      group.add(vortex);

      // Sky beam light
      const beamGeo = new THREE.CylinderGeometry(0.7, 1.2, 22, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 11.0;
      group.add(beam);

      // Point light
      const pLight = new THREE.PointLight(colorHex, 2.5, 14);
      pLight.position.set(0, 2.2, 0);
      group.add(pLight);

      this.scene.add(group);
      this.portalMeshes.push({ group, vortex, beam, wp });
    });

    // Animate vortices
    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        this.portalMeshes.forEach((p) => {
          p.vortex.rotation.z += dt * 2.2;
          p.beam.rotation.y -= dt * 0.4;
          (p.vortex.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(this.walkTime * 3) * 0.15;
        });
        return true;
      }
    });
  }

  // --- DUEL TRAINING ARENA & DUEL MASTER NPC ARTORIUS ---
  private buildDuelArena(x: number, z: number) {
    const arenaGroup = new THREE.Group();
    arenaGroup.position.set(x, 0, z);

    // Stone Arena Raised Platform
    const platformGeo = new THREE.CylinderGeometry(13.0, 13.5, 0.45, 48);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dark slate
      roughness: 0.8,
      metalness: 0.2
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0.22;
    platform.receiveShadow = true;
    arenaGroup.add(platform);

    // Golden boundary ring
    const ringGeo = new THREE.RingGeometry(11.8, 12.8, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.46;
    arenaGroup.add(ring);

    // 4 Corner Arena Banners
    const bannerPositions = [
      [9.5, 9.5], [-9.5, 9.5], [-9.5, -9.5], [9.5, -9.5]
    ];
    bannerPositions.forEach(([bx, bz]) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 5.0),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      pole.position.set(bx, 2.5, bz);
      pole.castShadow = true;
      arenaGroup.add(pole);

      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 2.2),
        new THREE.MeshStandardMaterial({ color: 0xef4444, side: THREE.DoubleSide })
      );
      flag.position.set(bx, 3.8, bz + 0.7);
      arenaGroup.add(flag);
    });

    // Sparring dummy
    const dummy = new THREE.Group();
    dummy.position.set(-5, 0.45, -5);
    const dPole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.2), new THREE.MeshStandardMaterial({ color: 0x92400e }));
    dPole.position.y = 1.1;
    const dBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    dBody.position.y = 1.3;
    dummy.add(dPole, dBody);
    arenaGroup.add(dummy);

    // Duel Forcefield Barrier (Active during duel)
    const barrierGeo = new THREE.CylinderGeometry(13.2, 13.2, 6.0, 32, 1, true);
    const barrierMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.duelBarrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
    this.duelBarrierMesh.position.y = 3.2;
    this.duelBarrierMesh.visible = false;
    arenaGroup.add(this.duelBarrierMesh);

    // Duel Master Artorius 3D NPC
    this.duelMasterMesh = this.buildArtoriusModel();
    this.duelMasterMesh.position.set(0, 0.45, 0);
    arenaGroup.add(this.duelMasterMesh);

    this.scene.add(arenaGroup);
  }

  private buildArtoriusModel(): THREE.Group {
    const artorius = new THREE.Group();
    artorius.userData = { type: 'npc', name: '決闘師範 アルトリウス', id: 'npc_artorius' };

    // Shiny gold armor
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.25 });
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, side: THREE.DoubleSide });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.55), goldMat);
    torso.position.y = 1.7;
    torso.castShadow = true;
    artorius.add(torso);

    // Head with knight helmet
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.65), goldMat);
    helm.position.y = 0.95;
    torso.add(helm);

    // Helmet Plume
    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    plume.position.y = 0.55;
    helm.add(plume);

    // Cape
    const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.8), capeMat);
    cape.position.set(0, -0.3, -0.32);
    cape.rotation.x = 0.15;
    torso.add(cape);

    // Greatsword on back
    const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.08), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
    swordBlade.position.set(0.35, 0.2, -0.4);
    swordBlade.rotation.z = 0.45;
    torso.add(swordBlade);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.35, 1.1, 0.35);
    const leftLeg = new THREE.Mesh(legGeo, goldMat);
    leftLeg.position.set(-0.25, 0.55, 0);
    const rightLeg = new THREE.Mesh(legGeo, goldMat);
    rightLeg.position.set(0.25, 0.55, 0);
    artorius.add(leftLeg, rightLeg);

    return artorius;
  }

  // --- ATMOSPHERIC PARTICLES & DASH TRAIL ---
  private createAtmosphericMotes() {
    const moteCount = 60;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = 0.5 + Math.random() * 4.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.4,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const motes = new THREE.Points(geo, mat);
    this.scene.add(motes);

    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        const pArr = geo.attributes.position.array as Float32Array;
        for (let i = 0; i < moteCount; i++) {
          pArr[i * 3 + 1] += Math.sin(this.walkTime + i) * 0.01;
        }
        geo.attributes.position.needsUpdate = true;
        return true;
      }
    });
  }

  private createDashTrail() {
    const trailCount = 30;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(trailCount * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.dashTrailParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dashTrailParticles);
  }

  // --- TELEPORT ACTION ---
  public teleportPlayer(x: number, y: number, z: number) {
    sound.playWarp();

    // Spawn warp portal flash FX at origin
    this.spawnExplosion(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z, 0x38bdf8);

    // Update position
    this.playerPos.set(x, y, z);
    this.playerVel.set(0, 0, 0);

    // Spawn arrival flash FX
    this.spawnExplosion(x, y + 1.2, z, 0x60a5fa);
  }

  // --- DUEL COMBAT SYSTEM ---
  public setDuelActive(active: boolean, opponent: DuelOpponent | null = null) {
    this.isDuelActive = active;
    this.activeDuelOpponent = opponent;
    if (this.duelBarrierMesh) {
      this.duelBarrierMesh.visible = active;
    }

    if (active && opponent) {
      this.currentDuelOpponentHp = opponent.maxHp;
      this.spawnDuelNPC(opponent);
    } else {
      this.removeDuelNPC();
    }
  }

  private spawnDuelNPC(opponent: DuelOpponent) {
    this.removeDuelNPC();

    const npc = new THREE.Group();
    npc.position.set(18, 0.45, 32); // Inside arena opposite to master
    npc.userData = { id: opponent.id, type: 'duel_opponent', name: opponent.name };

    const colorHex = opponent.classId === 'paladin' ? 0xfacc15 : opponent.classId === 'mage' ? 0xc084fc : 0x4ade80;
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.7 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.15, 0.5), mat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    npc.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
    head.position.y = 0.95;
    torso.add(head);

    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), mat);
    rArm.position.set(0.65, 0, 0);
    torso.add(rArm);

    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), mat);
    lArm.position.set(-0.65, 0, 0);
    torso.add(lArm);

    this.duelNPCLimbs = { torso, rArm, lArm };
    this.duelNPCMesh = npc;
    this.scene.add(npc);
  }

  private removeDuelNPC() {
    if (this.duelNPCMesh) {
      this.scene.remove(this.duelNPCMesh);
      this.duelNPCMesh = null;
      this.duelNPCLimbs = null;
    }
  }

  public damageDuelNPC(damage: number): boolean {
    if (!this.isDuelActive || !this.activeDuelOpponent) return false;

    this.currentDuelOpponentHp = Math.max(0, this.currentDuelOpponentHp - damage);

    if (this.duelNPCMesh) {
      this.spawnExplosion(this.duelNPCMesh.position.x, this.duelNPCMesh.position.y + 1.5, this.duelNPCMesh.position.z, 0xf59e0b);
    }

    if (this.currentDuelOpponentHp <= 0) {
      // Victory!
      sound.playFanfare();
      if (this.onDuelVictory && this.activeDuelOpponent) {
        this.onDuelVictory(this.activeDuelOpponent);
      }
      this.setDuelActive(false, null);
      return true;
    }
    return false;
  }

  public getDuelNPC(): THREE.Group | null {
    return this.duelNPCMesh;
  }

  // --- PLAYER MODEL CONSTRUCTION ---
  public setPlayerClass(classId: CharacterClassId) {
    this.playerClassId = classId;
    this.buildPlayerModel(classId);
  }

  private buildPlayerModel(classId: CharacterClassId) {
    // Clear previous limbs
    while (this.playerGroup.children.length > 0) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }

    const isPaladin = classId === 'paladin';
    const isMage = classId === 'mage';
    const isRanger = classId === 'ranger';

    // Materials based on class
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 });
    const armorColor = isPaladin ? 0x94a3b8 : isMage ? 0x475569 : 0x3f6212;
    const trimColor = isPaladin ? 0xfacc15 : isMage ? 0xc084fc : 0x86efac;

    const armorMat = new THREE.MeshStandardMaterial({
      color: armorColor,
      metalness: isPaladin ? 0.85 : 0.3,
      roughness: isPaladin ? 0.35 : 0.7
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: trimColor,
      emissive: isMage ? 0x7e22ce : 0x000000,
      emissiveIntensity: isMage ? 0.4 : 0,
      metalness: 0.7,
      roughness: 0.4
    });

    // Torso / Chest
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.15, 0.55), armorMat);
    torso.position.y = 1.6;
    torso.castShadow = true;
    this.playerGroup.add(torso);

    // Chest trim crest
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.6), trimMat);
    crest.position.set(0, 0.1, 0);
    torso.add(crest);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), skinMat);
    head.position.y = 0.95;
    head.castShadow = true;
    torso.add(head);

    // Helmet / Hood
    if (isPaladin) {
      const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 12), armorMat);
      helm.position.y = 0.1;
      head.add(helm);
      // Golden Crest
      const plume = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.65), trimMat);
      plume.position.set(0, 0.4, -0.05);
      head.add(plume);
    } else if (isMage) {
      const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.1, 12), trimMat);
      hatCone.position.set(0, 0.6, -0.1);
      hatCone.rotation.x = -0.15;
      head.add(hatCone);
    } else {
      // Ranger Hood
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), armorMat);
      hood.position.set(0, 0.05, -0.05);
      head.add(hood);
    }

    // Left Arm (Shield or casting orb)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.62, 0.4, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.3), armorMat);
    leftArmMesh.position.y = -0.45;
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);
    torso.add(leftArm);

    // Right Arm (Weapon Hand)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.62, 0.4, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.3), armorMat);
    rightArmMesh.position.y = -0.45;
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);
    torso.add(rightArm);

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.25, -0.6, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.34), armorMat);
    leftLegMesh.position.y = -0.48;
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);
    torso.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.25, -0.6, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.34), armorMat);
    rightLegMesh.position.y = -0.48;
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);
    torso.add(rightLeg);

    // Weapons / Offhands
    let weaponObj: THREE.Object3D;
    if (isPaladin) {
      // Broadsword
      const sword = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 1.8, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
      );
      blade.position.y = 0.9;
      blade.castShadow = true;
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.15), trimMat);
      guard.position.y = 0.15;
      const hilt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      hilt.position.y = -0.15;
      sword.add(blade, guard, hilt);
      sword.position.set(0, -0.85, 0.4);
      sword.rotation.x = Math.PI / 4;
      rightArm.add(sword);
      weaponObj = sword;

      // Shield on Left Arm
      const shield = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 1.1, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.8, roughness: 0.3 })
      );
      shield.position.set(-0.25, -0.45, 0.1);
      shield.castShadow = true;
      leftArm.add(shield);
    } else if (isMage) {
      // Magic Staff
      const staff = new THREE.Group();
      const staffRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 2.4),
        new THREE.MeshStandardMaterial({ color: 0x581c87, metalness: 0.4 })
      );
      staffRod.position.y = 0.5;
      staffRod.castShadow = true;
      // Glowing Amethyst Crystal
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshStandardMaterial({
          color: 0xc084fc,
          emissive: 0x9333ea,
          emissiveIntensity: 1.2,
          roughness: 0.1
        })
      );
      orb.position.y = 1.8;
      staff.add(staffRod, orb);
      staff.position.set(0, -0.6, 0.3);
      staff.rotation.x = Math.PI / 6;
      rightArm.add(staff);
      weaponObj = staff;
    } else {
      // Recurve Bow
      const bow = new THREE.Group();
      const bowMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.06, 8, 24, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
      );
      bowMesh.rotation.z = Math.PI / 2;
      bowMesh.position.set(0, 0, 0.3);
      bow.add(bowMesh);
      bow.position.set(0, -0.5, 0.2);
      rightArm.add(bow);
      weaponObj = bow;
    }

    // Cape
    const capeGeo = new THREE.PlaneGeometry(0.75, 1.4, 4, 6);
    const capeMat = new THREE.MeshStandardMaterial({
      color: isPaladin ? 0x1e3a8a : isMage ? 0x4c1d95 : 0x14532d,
      side: THREE.DoubleSide,
      roughness: 0.7
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.3, -0.32);
    cape.rotation.x = 0.15;
    torso.add(cape);

    this.playerLimbs = {
      head,
      torso,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      weapon: weaponObj,
      cape
    };
  }

  // --- ENEMIES MANAGEMENT ---
  public syncEnemies(enemies: Enemy[]) {
    const activeIds = new Set(enemies.map((e) => e.id));

    // Remove dead/unlisted
    this.enemyMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.enemyMeshes.delete(id);
      }
    });

    // Create / Update active
    enemies.forEach((enemy) => {
      let group = this.enemyMeshes.get(enemy.id);
      if (!group) {
        group = this.buildEnemyMesh(enemy);
        this.scene.add(group);
        this.enemyMeshes.set(enemy.id, group);
      }

      if (enemy.isDead) {
        group.visible = false;
      } else {
        group.visible = true;
        // Smooth position interpolation
        group.position.set(enemy.x, enemy.y, enemy.z);

        // Face player or wander target
        const dx = this.playerPos.x - enemy.x;
        const dz = this.playerPos.z - enemy.z;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);
        if (distToPlayer < enemy.aggroRadius) {
          group.rotation.y = Math.atan2(dx, dz);
        }
      }
    });

    // Update Target Marker Ring
    if (this.selectedTargetId) {
      const selectedEnemy = enemies.find((e) => e.id === this.selectedTargetId);
      if (selectedEnemy && !selectedEnemy.isDead) {
        this.targetMarker.visible = true;
        this.targetMarker.position.set(selectedEnemy.x, 0.05, selectedEnemy.z);
        this.targetMarker.scale.set(selectedEnemy.scale, selectedEnemy.scale, selectedEnemy.scale);
      } else {
        this.targetMarker.visible = false;
      }
    } else {
      this.targetMarker.visible = false;
    }
  }

  private buildEnemyMesh(enemy: Enemy): THREE.Group {
    const group = new THREE.Group();
    group.name = enemy.id;
    group.userData = { id: enemy.id, type: enemy.type, name: enemy.name };

    const sc = enemy.scale || 1.0;
    const type = enemy.type;

    // --- 1. SLIMES (Green, Blue, Red, King) ---
    if (type === 'slime' || type === 'blue_slime' || type === 'red_slime' || type === 'king_slime') {
      const isKing = type === 'king_slime';
      const colorMap: Record<string, { body: number; core: number; em: number }> = {
        slime: { body: 0x4ade80, core: 0x16a34a, em: 0x15803d },
        blue_slime: { body: 0x38bdf8, core: 0x0284c7, em: 0x0369a1 },
        red_slime: { body: 0xf87171, core: 0xdc2626, em: 0x991b1b },
        king_slime: { body: 0x60a5fa, core: 0x2563eb, em: 0x1d4ed8 }
      };
      const colors = colorMap[type] || colorMap.slime;

      const slimeGeo = new THREE.SphereGeometry(1.0 * sc, 16, 16);
      slimeGeo.scale(1.0, 0.85, 1.0);
      const slimeMat = new THREE.MeshStandardMaterial({
        color: colors.body,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: isKing ? 0.9 : 0.82
      });
      const slime = new THREE.Mesh(slimeGeo, slimeMat);
      slime.position.y = 0.8 * sc;
      slime.castShadow = true;
      group.add(slime);

      // Nucleus core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.38 * sc, 10, 10),
        new THREE.MeshStandardMaterial({ color: colors.core, emissive: colors.em, emissiveIntensity: 0.7 })
      );
      core.position.y = 0.8 * sc;
      group.add(core);

      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12 * sc, 8, 8), eyeMat);
      leftEye.position.set(-0.35 * sc, 0.95 * sc, 0.7 * sc);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.35 * sc;
      group.add(leftEye, rightEye);

      // King Slime Golden Crown
      if (isKing) {
        const crownGroup = new THREE.Group();
        crownGroup.position.set(0, 1.65 * sc, 0);

        const circlet = new THREE.Mesh(
          new THREE.CylinderGeometry(0.65 * sc, 0.55 * sc, 0.3 * sc, 16, 1, true),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 })
        );
        crownGroup.add(circlet);

        // 5 Crown Spikes
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.14 * sc, 0.5 * sc, 5),
            new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.95, roughness: 0.1 })
          );
          spike.position.set(Math.sin(angle) * 0.6 * sc, 0.3 * sc, Math.cos(angle) * 0.6 * sc);
          crownGroup.add(spike);

          // Ruby Jewels on Spikes
          const gem = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.08 * sc, 0),
            new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.8 })
          );
          gem.position.set(Math.sin(angle) * 0.6 * sc, 0.15 * sc, Math.cos(angle) * 0.6 * sc);
          crownGroup.add(gem);
        }
        group.add(crownGroup);
      }
    }

    // --- 2. BEASTS & QUADRUPEDS (Forest Wolf, Dire Wolf, Shadow Panther, Lava Hound) ---
    else if (type === 'forest_wolf' || type === 'dire_wolf' || type === 'shadow_panther' || type === 'lava_hound') {
      const isLava = type === 'lava_hound';
      const isPanther = type === 'shadow_panther';
      const isDire = type === 'dire_wolf';

      const coatColor = isLava ? 0x1c1917 : isPanther ? 0x0f172a : isDire ? 0x1e293b : 0x475569;
      const eyeColor = isLava ? 0xf97316 : isPanther ? 0xa855f7 : isDire ? 0xef4444 : 0xfacc15;

      const wolfMat = new THREE.MeshStandardMaterial({
        color: coatColor,
        roughness: isPanther ? 0.4 : 0.8,
        metalness: isPanther ? 0.3 : 0.1,
        emissive: isLava ? 0x9a3412 : 0x000000,
        emissiveIntensity: isLava ? 0.35 : 0
      });

      // Body Torso
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9 * sc, 0.8 * sc, 1.8 * sc), wolfMat);
      body.position.y = 0.9 * sc;
      body.castShadow = true;
      group.add(body);

      // Head & Snout
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6 * sc, 0.6 * sc, 0.7 * sc), wolfMat);
      head.position.set(0, 1.4 * sc, 1.0 * sc);
      group.add(head);

      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.4 * sc, 0.3 * sc, 0.6 * sc), wolfMat);
      snout.position.set(0, 1.3 * sc, 1.45 * sc);
      group.add(snout);

      // Ears
      const earGeo = new THREE.ConeGeometry(0.15 * sc, 0.4 * sc, 4);
      const earL = new THREE.Mesh(earGeo, wolfMat);
      earL.position.set(-0.25 * sc, 1.8 * sc, 0.9 * sc);
      const earR = earL.clone();
      earR.position.x = 0.25 * sc;
      group.add(earL, earR);

      // Glowing Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08 * sc, 6, 6), eyeMat);
      leftEye.position.set(-0.2 * sc, 1.5 * sc, 1.35 * sc);
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.2 * sc;
      group.add(leftEye, rightEye);

      // 4 Legs
      const legGeo = new THREE.CylinderGeometry(0.14 * sc, 0.12 * sc, 0.9 * sc, 6);
      [[-0.35, 0.65], [0.35, 0.65], [-0.35, -0.65], [0.35, -0.65]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, wolfMat);
        leg.position.set(lx * sc, 0.45 * sc, lz * sc);
        group.add(leg);
      });

      // Tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * sc, 0.12 * sc, 1.1 * sc, 5), wolfMat);
      tail.position.set(0, 0.9 * sc, -1.2 * sc);
      tail.rotation.x = -Math.PI / 3;
      group.add(tail);
    }

    // --- 3. WILD BOAR ---
    else if (type === 'wild_boar') {
      const boarMat = new THREE.MeshStandardMaterial({ color: 0x543621, roughness: 0.9 });
      const tuskMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2 * sc, 1.0 * sc, 1.7 * sc), boarMat);
      body.position.y = 0.95 * sc;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8 * sc, 0.8 * sc, 0.8 * sc), boarMat);
      head.position.set(0, 1.1 * sc, 1.1 * sc);
      group.add(head);

      // Curved Tusks
      const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.1 * sc, 0.6 * sc, 5), tuskMat);
      tuskL.position.set(-0.45 * sc, 1.05 * sc, 1.35 * sc);
      tuskL.rotation.x = Math.PI / 4;
      const tuskR = tuskL.clone();
      tuskR.position.x = 0.45 * sc;
      group.add(tuskL, tuskR);

      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08 * sc, 6, 6), eyeMat);
      eyeL.position.set(-0.35 * sc, 1.25 * sc, 1.3 * sc);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.35 * sc;
      group.add(eyeL, eyeR);
    }

    // --- 4. MUSHROOM SPORE ---
    else if (type === 'mushroom_spore') {
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.5 });
      const capMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.4 });
      const spotMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });

      // Stem
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * sc, 0.5 * sc, 1.1 * sc, 12), stemMat);
      stem.position.y = 0.55 * sc;
      stem.castShadow = true;
      group.add(stem);

      // Mushroom Cap Dome
      const cap = new THREE.Mesh(new THREE.SphereGeometry(1.1 * sc, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), capMat);
      cap.position.y = 1.1 * sc;
      cap.castShadow = true;
      group.add(cap);

      // Spots on cap
      for (let i = 0; i < 6; i++) {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.18 * sc, 6, 6), spotMat);
        const a = (i / 6) * Math.PI * 2;
        spot.position.set(Math.sin(a) * 0.7 * sc, 1.5 * sc, Math.cos(a) * 0.7 * sc);
        group.add(spot);
      }

      // Cute Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09 * sc, 6, 6), eyeMat);
      eyeL.position.set(-0.2 * sc, 0.65 * sc, 0.45 * sc);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.2 * sc;
      group.add(eyeL, eyeR);
    }

    // --- 5. TREANT (Walking Ancient Tree) ---
    else if (type === 'treant') {
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x543621, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

      // Tree Trunk Body
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * sc, 1.2 * sc, 2.6 * sc, 8), woodMat);
      trunk.position.y = 1.6 * sc;
      trunk.castShadow = true;
      group.add(trunk);

      // Foliage Canopies
      const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4 * sc, 0), leafMat);
      f1.position.y = 3.2 * sc;
      group.add(f1);

      const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0 * sc, 0), leafMat);
      f2.position.set(0.6 * sc, 3.8 * sc, 0);
      group.add(f2);

      // Branch Arms
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * sc, 0.25 * sc, 1.6 * sc, 6), woodMat);
      armL.position.set(-1.2 * sc, 2.2 * sc, 0.3 * sc);
      armL.rotation.z = Math.PI / 3;
      const armR = armL.clone();
      armR.position.x = 1.2 * sc;
      armR.rotation.z = -Math.PI / 3;
      group.add(armL, armR);

      // Amber Eyes in Bark
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12 * sc, 6, 6), eyeMat);
      eyeL.position.set(-0.35 * sc, 1.9 * sc, 0.9 * sc);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.35 * sc;
      group.add(eyeL, eyeR);
    }

    // --- 6. SKELETONS (Warrior, Archer, Knight) ---
    else if (type === 'skeleton_warrior' || type === 'skeleton_archer' || type === 'skeleton_knight') {
      const isKnight = type === 'skeleton_knight';
      const isArcher = type === 'skeleton_archer';

      const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
      const armorMat = new THREE.MeshStandardMaterial({
        color: isKnight ? 0x1e293b : 0x475569,
        metalness: isKnight ? 0.9 : 0.7,
        roughness: 0.3
      });

      // Ribs / Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7 * sc, 1.0 * sc, 0.4 * sc), isKnight ? armorMat : boneMat);
      torso.position.y = 1.4 * sc;
      torso.castShadow = true;
      group.add(torso);

      // Skull
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.3 * sc, 12, 12), boneMat);
      skull.position.set(0, 2.1 * sc, 0);
      skull.castShadow = true;
      group.add(skull);

      // Red/Blue Eye Glow
      const eyeMat = new THREE.MeshBasicMaterial({ color: isKnight ? 0xef4444 : 0x38bdf8 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06 * sc, 6, 6), eyeMat);
      eyeL.position.set(-0.12 * sc, 2.15 * sc, 0.26 * sc);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.12 * sc;
      group.add(eyeL, eyeR);

      if (isKnight) {
        // Tower Shield
        const shield = new THREE.Mesh(
          new THREE.BoxGeometry(0.7 * sc, 1.4 * sc, 0.15 * sc),
          armorMat
        );
        shield.position.set(-0.65 * sc, 1.3 * sc, 0.3 * sc);
        group.add(shield);

        // Heavy Axe
        const axe = new THREE.Mesh(new THREE.BoxGeometry(0.12 * sc, 1.2 * sc, 0.3 * sc), armorMat);
        axe.position.set(0.65 * sc, 1.3 * sc, 0.3 * sc);
        group.add(axe);
      } else if (isArcher) {
        // Bow
        const bow = new THREE.Mesh(
          new THREE.TorusGeometry(0.7 * sc, 0.05 * sc, 6, 16, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x78350f })
        );
        bow.rotation.y = Math.PI / 2;
        bow.position.set(0.6 * sc, 1.4 * sc, 0.2 * sc);
        group.add(bow);
      } else {
        // Dual Swords
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.1 * sc, 1.0 * sc, 0.1 * sc),
          new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9 })
        );
        blade.position.set(0.6 * sc, 1.3 * sc, 0.3 * sc);
        blade.rotation.x = Math.PI / 4;
        group.add(blade);
      }
    }

    // --- 7. GHOST WRAITH ---
    else if (type === 'ghost_wraith') {
      const robeMat = new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        roughness: 0.3,
        transparent: true,
        opacity: 0.82
      });

      // Flowing ghostly cone body
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.75 * sc, 2.0 * sc, 12, 1, true), robeMat);
      body.position.y = 1.4 * sc;
      body.rotation.x = Math.PI;
      group.add(body);

      // Cowl Hood
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.42 * sc, 12, 12), robeMat);
      hood.position.set(0, 2.0 * sc, 0);
      group.add(hood);

      // Deep glowing violet eyes inside hood
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07 * sc, 6, 6), eyeMat);
      eyeL.position.set(-0.15 * sc, 2.05 * sc, 0.35 * sc);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.15 * sc;
      group.add(eyeL, eyeR);

      // Floating Wisps
      const wispLight = new THREE.PointLight(0xa855f7, 1.5, 8);
      wispLight.position.set(0, 1.5 * sc, 0);
      group.add(wispLight);
    }

    // --- 8. MUMMY ---
    else if (type === 'mummy') {
      const bandageMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.9 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8 * sc, 1.3 * sc, 0.5 * sc), bandageMat);
      torso.position.y = 1.5 * sc;
      group.add(torso);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6 * sc, 0.7 * sc, 0.6 * sc), bandageMat);
      head.position.set(0, 2.4 * sc, 0);
      group.add(head);

      // Pharaoh Headpiece
      const crown = new THREE.Mesh(new THREE.BoxGeometry(0.7 * sc, 0.3 * sc, 0.7 * sc), goldMat);
      crown.position.set(0, 2.8 * sc, 0);
      group.add(crown);

      // Cursed yellow eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08 * sc, 6, 6), eyeMat);
      eyeL.position.set(-0.18 * sc, 2.45 * sc, 0.32 * sc);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.18 * sc;
      group.add(eyeL, eyeR);
    }

    // --- 9. GARGOYLE ---
    else if (type === 'gargoyle') {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9 * sc, 1.2 * sc, 0.6 * sc), stoneMat);
      body.position.y = 1.6 * sc;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.4 * sc, 8, 8), stoneMat);
      head.position.set(0, 2.4 * sc, 0);
      group.add(head);

      // Horns
      const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.12 * sc, 0.6 * sc, 4), stoneMat);
      hornL.position.set(-0.25 * sc, 2.9 * sc, -0.1 * sc);
      hornL.rotation.x = -0.3;
      const hornR = hornL.clone();
      hornR.position.x = 0.25 * sc;
      group.add(hornL, hornR);

      // Stone Bat Wings
      const wingGeo = new THREE.BoxGeometry(1.6 * sc, 0.08 * sc, 1.0 * sc);
      const wingL = new THREE.Mesh(wingGeo, stoneMat);
      wingL.position.set(-1.1 * sc, 2.1 * sc, -0.4 * sc);
      wingL.rotation.y = 0.4;
      const wingR = wingL.clone();
      wingR.position.x = 1.1 * sc;
      wingR.rotation.y = -0.4;
      group.add(wingL, wingR);
    }

    // --- 10. LICH (Arch-Lich Sorcerer) ---
    else if (type === 'lich') {
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.5 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 });

      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * sc, 0.9 * sc, 2.0 * sc, 12), darkMat);
      robe.position.y = 1.6 * sc;
      group.add(robe);

      const skull = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 * sc, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9 })
      );
      skull.position.set(0, 2.8 * sc, 0);
      group.add(skull);

      // Floating Ornate Crown
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * sc, 0.35 * sc, 0.35 * sc, 8, 1, true), goldMat);
      crown.position.set(0, 3.2 * sc, 0);
      group.add(crown);

      // Glowing Lich Staff
      const staffRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 * sc, 0.08 * sc, 2.6 * sc, 6),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b })
      );
      staffRod.position.set(0.9 * sc, 1.8 * sc, 0.4 * sc);
      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32 * sc, 0),
        new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 1.2 })
      );
      orb.position.set(0.9 * sc, 3.2 * sc, 0.4 * sc);
      group.add(staffRod, orb);

      const pLight = new THREE.PointLight(0xc084fc, 2.0, 10);
      pLight.position.set(0.9 * sc, 3.2 * sc, 0.4 * sc);
      group.add(pLight);
    }

    // --- 11. GOLEMS (Crystal, Amethyst, Volcano, Diamond Colossus) ---
    else if (type === 'crystal_golem' || type === 'amethyst_golem' || type === 'volcano_golem' || type === 'diamond_colossus') {
      const isAmethyst = type === 'amethyst_golem';
      const isVolcano = type === 'volcano_golem';
      const isDiamond = type === 'diamond_colossus';

      const rockColor = isVolcano ? 0x1c1917 : isDiamond ? 0xe0f2fe : isAmethyst ? 0x2e1065 : 0x083344;
      const coreColor = isVolcano ? 0xf97316 : isDiamond ? 0x38bdf8 : isAmethyst ? 0xa855f7 : 0x06b6d4;

      const rockMat = new THREE.MeshStandardMaterial({
        color: rockColor,
        roughness: isDiamond ? 0.1 : 0.85,
        metalness: isDiamond ? 0.9 : 0.2
      });
      const coreMat = new THREE.MeshStandardMaterial({
        color: coreColor,
        emissive: coreColor,
        emissiveIntensity: 1.2
      });

      const body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 * sc, 0), rockMat);
      body.position.y = 1.8 * sc;
      body.castShadow = true;
      group.add(body);

      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.55 * sc, 0), coreMat);
      core.position.set(0, 1.8 * sc, 0.8 * sc);
      group.add(core);

      const leftFist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 * sc, 0), rockMat);
      leftFist.position.set(-1.6 * sc, 1.2 * sc, 0.4 * sc);
      const rightFist = leftFist.clone();
      rightFist.position.x = 1.6 * sc;
      group.add(leftFist, rightFist);
    }

    // --- 12. CRYSTAL SPIDER ---
    else if (type === 'crystal_spider') {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      });

      // Cephalothorax & Abdomen
      const abdomen = new THREE.Mesh(new THREE.OctahedronGeometry(0.9 * sc, 0), mat);
      abdomen.position.set(0, 0.7 * sc, -0.6 * sc);
      abdomen.scale.set(1.0, 0.8, 1.4);
      group.add(abdomen);

      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 * sc, 0), mat);
      head.position.set(0, 0.6 * sc, 0.5 * sc);
      group.add(head);

      // 6 Crystal Legs
      const legGeo = new THREE.CylinderGeometry(0.08 * sc, 0.05 * sc, 1.6 * sc, 4);
      for (let i = 0; i < 6; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const row = Math.floor(i / 2);
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(side * 0.9 * sc, 0.5 * sc, (row - 1) * 0.45 * sc);
        leg.rotation.z = side * 0.7;
        group.add(leg);
      }
    }

    // --- 13. CRYSTAL BAT ---
    else if (type === 'crystal_bat') {
      const batMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.7,
        roughness: 0.3
      });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.4 * sc, 8, 8), batMat);
      body.position.y = 1.8 * sc;
      group.add(body);

      // Wings
      const wingGeo = new THREE.BoxGeometry(1.2 * sc, 0.05 * sc, 0.7 * sc);
      const wingL = new THREE.Mesh(wingGeo, batMat);
      wingL.position.set(-0.8 * sc, 1.8 * sc, 0);
      wingL.rotation.z = -0.3;
      const wingR = wingL.clone();
      wingR.position.x = 0.8 * sc;
      wingR.rotation.z = 0.3;
      group.add(wingL, wingR);
    }

    // --- 14. CAVE SCORPION ---
    else if (type === 'cave_scorpion') {
      const chitinMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.7 });
      const poisonMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, emissive: 0x4d7c0f, emissiveIntensity: 1.0 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8 * sc, 0.5 * sc, 1.4 * sc), chitinMat);
      body.position.y = 0.5 * sc;
      group.add(body);

      // Pincers
      const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.4 * sc, 0.25 * sc, 0.6 * sc), chitinMat);
      clawL.position.set(-0.7 * sc, 0.5 * sc, 0.9 * sc);
      const clawR = clawL.clone();
      clawR.position.x = 0.7 * sc;
      group.add(clawL, clawR);

      // Arched Tail
      const tailSegment = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * sc, 0.16 * sc, 1.5 * sc, 6), chitinMat);
      tailSegment.position.set(0, 1.2 * sc, -1.0 * sc);
      tailSegment.rotation.x = Math.PI / 3;
      group.add(tailSegment);

      // Poison Stinger Bulb
      const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.2 * sc, 0.5 * sc, 6), poisonMat);
      stinger.position.set(0, 1.8 * sc, -0.6 * sc);
      stinger.rotation.x = -Math.PI / 4;
      group.add(stinger);
    }

    // --- 15. FIRE ELEMENTAL ---
    else if (type === 'fire_elemental') {
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

      const core = new THREE.Mesh(new THREE.SphereGeometry(0.6 * sc, 12, 12), coreMat);
      core.position.y = 1.8 * sc;
      group.add(core);

      // Rotating Flame Shell
      const flame = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 * sc, 1), fireMat);
      flame.position.y = 1.8 * sc;
      group.add(flame);

      const fLight = new THREE.PointLight(0xf97316, 2.5, 12);
      fLight.position.set(0, 1.8 * sc, 0);
      group.add(fLight);
    }

    // --- 16. FIRE DRAKE ---
    else if (type === 'fire_drake') {
      const drakeMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6, metalness: 0.3 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2 * sc, 1.1 * sc, 2.2 * sc), drakeMat);
      body.position.y = 1.5 * sc;
      group.add(body);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.4 * sc, 0.6 * sc, 1.2 * sc, 6), drakeMat);
      neck.position.set(0, 2.2 * sc, 1.1 * sc);
      neck.rotation.x = Math.PI / 4;
      group.add(neck);

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.5 * sc, 1.2 * sc, 5), drakeMat);
      head.position.set(0, 2.6 * sc, 1.6 * sc);
      head.rotation.x = -Math.PI / 3;
      group.add(head);

      // Wings
      const wingGeo = new THREE.BoxGeometry(2.4 * sc, 0.08 * sc, 1.2 * sc);
      const wingL = new THREE.Mesh(wingGeo, drakeMat);
      wingL.position.set(-1.6 * sc, 2.0 * sc, 0);
      wingL.rotation.z = -0.2;
      const wingR = wingL.clone();
      wingR.position.x = 1.6 * sc;
      wingR.rotation.z = 0.2;
      group.add(wingL, wingR);
    }

    // --- 17. BOSS DRAGON (Ignis the Fire Drake) ---
    else if (type === 'boss_dragon') {
      const dragonMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.65, metalness: 0.4 });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
      const fireEyeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4 * sc, 2.0 * sc, 4.2 * sc), dragonMat);
      body.position.y = 2.4 * sc;
      body.castShadow = true;
      group.add(body);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * sc, 1.2 * sc, 2.0 * sc, 8), dragonMat);
      neck.position.set(0, 3.8 * sc, 2.0 * sc);
      neck.rotation.x = Math.PI / 4;
      group.add(neck);

      const head = new THREE.Mesh(new THREE.ConeGeometry(1.1 * sc, 2.4 * sc, 6), dragonMat);
      head.position.set(0, 4.6 * sc, 3.2 * sc);
      head.rotation.x = -Math.PI / 3;
      group.add(head);

      const hornLeft = new THREE.Mesh(new THREE.ConeGeometry(0.3 * sc, 1.5 * sc, 5), hornMat);
      hornLeft.position.set(-0.8 * sc, 5.4 * sc, 2.4 * sc);
      const hornRight = hornLeft.clone();
      hornRight.position.x = 0.8 * sc;
      group.add(hornLeft, hornRight);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.2 * sc, 8, 8), fireEyeMat);
      eyeL.position.set(-0.6 * sc, 4.8 * sc, 3.6 * sc);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.6 * sc;
      group.add(eyeL, eyeR);

      const wingGeo = new THREE.BoxGeometry(4.5 * sc, 0.15 * sc, 2.2 * sc);
      const wingL = new THREE.Mesh(wingGeo, dragonMat);
      wingL.position.set(-3.2 * sc, 3.4 * sc, 0);
      wingL.rotation.z = -0.25;
      const wingR = wingL.clone();
      wingR.position.x = 3.2 * sc;
      wingR.rotation.z = 0.25;
      group.add(wingL, wingR);
    }

    // --- 18. VOID WATCHER (Floating Eye with Gyroscopic Rings) ---
    else if (type === 'void_watcher') {
      const eyeSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.9 * sc, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
      );
      eyeSphere.position.y = 2.0 * sc;
      group.add(eyeSphere);

      // Cyan Glowing Pupil
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.35 * sc, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5 })
      );
      pupil.position.set(0, 2.0 * sc, 0.75 * sc);
      group.add(pupil);

      // 2 Gyroscopic Orbiting Rings
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.8 });
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4 * sc, 0.08 * sc, 8, 32), ringMat);
      ring1.position.y = 2.0 * sc;
      ring1.rotation.x = Math.PI / 4;
      group.add(ring1);

      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.7 * sc, 0.08 * sc, 8, 32), ringMat);
      ring2.position.y = 2.0 * sc;
      ring2.rotation.y = Math.PI / 3;
      group.add(ring2);
    }

    // --- 19. ASTRAL CHIMERA (World Boss Hybrid) ---
    else if (type === 'astral_chimera') {
      const chimeraMat = new THREE.MeshStandardMaterial({
        color: 0x4338ca,
        roughness: 0.3,
        metalness: 0.7,
        emissive: 0x3730a3,
        emissiveIntensity: 0.5
      });
      const hornMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xeab308,
        emissiveIntensity: 1.2
      });

      // Massive Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.6 * sc, 2.2 * sc, 4.4 * sc), chimeraMat);
      body.position.y = 2.5 * sc;
      group.add(body);

      // Majestic Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.6 * sc, 1.4 * sc, 1.8 * sc), chimeraMat);
      head.position.set(0, 3.8 * sc, 2.6 * sc);
      group.add(head);

      // Single Celestial Unicorn/Dragon Horn
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.3 * sc, 2.2 * sc, 6), hornMat);
      horn.position.set(0, 5.2 * sc, 3.0 * sc);
      horn.rotation.x = Math.PI / 6;
      group.add(horn);

      // Huge Astral Wings
      const wingGeo = new THREE.BoxGeometry(4.8 * sc, 0.12 * sc, 2.5 * sc);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x818cf8,
        emissive: 0x6366f1,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9
      });
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.position.set(-3.5 * sc, 3.6 * sc, 0);
      wingL.rotation.z = -0.25;
      const wingR = wingL.clone();
      wingR.position.x = 3.5 * sc;
      wingR.rotation.z = 0.25;
      group.add(wingL, wingR);
    }

    // Default Fallback
    else {
      const fallback = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.0 * sc, 0),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
      );
      fallback.position.y = 1.0 * sc;
      group.add(fallback);
    }

    return group;
  }

  // --- OTHER PLAYERS (ADVENTURERS) ---
  public syncOtherPlayers(players: OtherPlayer[]) {
    const activeIds = new Set(players.map((p) => p.id));
    this.otherPlayerMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.otherPlayerMeshes.delete(id);
      }
    });

    players.forEach((p) => {
      let group = this.otherPlayerMeshes.get(p.id);
      if (!group) {
        group = this.buildOtherPlayerMesh(p);
        this.scene.add(group);
        this.otherPlayerMeshes.set(p.id, group);
      }

      // Smooth position lerp
      group.position.x += (p.x - group.position.x) * 0.15;
      group.position.z += (p.z - group.position.z) * 0.15;
      group.position.y = p.y;

      const dx = p.targetX - p.x;
      const dz = p.targetZ - p.z;
      if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
        group.rotation.y = Math.atan2(dx, dz);
      }
    });
  }

  private buildOtherPlayerMesh(p: OtherPlayer): THREE.Group {
    const group = new THREE.Group();
    group.name = p.id;
    group.userData = { id: p.id, type: 'player', name: p.name };

    const colorHex = p.classId === 'paladin' ? 0x38bdf8 : p.classId === 'mage' ? 0xc084fc : 0x4ade80;
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.6 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.5), mat);
    torso.position.y = 1.5;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
    head.position.y = 0.9;
    torso.add(head);

    return group;
  }

  // --- WORLD DROPS ---
  public syncDrops(drops: WorldDrop[]) {
    const activeIds = new Set(drops.map((d) => d.id));
    this.dropMeshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(mesh);
        this.dropMeshes.delete(id);
      }
    });

    drops.forEach((drop) => {
      let group = this.dropMeshes.get(drop.id);
      if (!group) {
        group = new THREE.Group();
        group.position.set(drop.x, drop.y + 0.5, drop.z);

        const colorMap = {
          common: 0xffffff,
          rare: 0x3b82f6,
          epic: 0xa855f7,
          legendary: 0xf59e0b
        };
        const color = colorMap[drop.item.rarity] || 0xffffff;

        // Floating diamond gem
        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.4, 0),
          new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.8,
            roughness: 0.1
          })
        );
        gem.castShadow = true;
        group.add(gem);

        // Vertical light beam
        const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.0, 8);
        const beamMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 3.0;
        group.add(beam);

        this.scene.add(group);
        this.dropMeshes.set(drop.id, group);
      }

      // Rotate drop
      group.rotation.y += 0.03;
      group.position.y = drop.y + 0.5 + Math.sin(this.walkTime * 3) * 0.15;
    });
  }

  // --- COMBAT ACTIONS & SPELL FX ---
  public executeSkill(skill: Skill, targetPos?: { x: number; y: number; z: number }) {
    this.isAttacking = true;
    this.attackTimer = 0.35;

    const tX = targetPos ? targetPos.x : this.playerPos.x + Math.sin(this.playerRotation) * 6;
    const tY = targetPos ? targetPos.y : this.playerPos.y;
    const tZ = targetPos ? targetPos.z : this.playerPos.z + Math.cos(this.playerRotation) * 6;

    if (skill.type === 'melee') {
      sound.playSlash();
      this.spawnSlashArc();
    } else if (skill.id === 'm_fireball') {
      sound.playFireball();
      this.spawnFireballProjectile(tX, tY, tZ);
    } else if (skill.id === 'm_frost') {
      sound.playFrost();
      this.spawnFrostNova();
    } else if (skill.type === 'heal') {
      sound.playHeal();
      this.spawnHealingPillar();
    } else if (skill.key === 'R') {
      // ULTIMATE
      if (this.playerClassId === 'paladin') {
        sound.playBossRoar();
        this.spawnDivineJudgment(tX, tZ);
      } else if (this.playerClassId === 'mage') {
        sound.playFireball();
        this.spawnMeteorStorm(tX, tZ);
      } else {
        sound.playArrow();
        this.spawnArrowRain(tX, tZ);
      }
    } else if (skill.type === 'projectile') {
      sound.playArrow();
      this.spawnArrowProjectile(tX, tY, tZ, skill.color);
    } else {
      sound.playSlash();
      this.spawnSlashArc();
    }
  }

  private spawnSlashArc() {
    const arcGeo = new THREE.RingGeometry(1.6, 2.5, 16, 1, 0, Math.PI * 0.85);
    arcGeo.rotateX(-Math.PI / 2);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.position.set(
      this.playerPos.x + Math.sin(this.playerRotation) * 1.5,
      this.playerPos.y + 1.2,
      this.playerPos.z + Math.cos(this.playerRotation) * 1.5
    );
    arc.rotation.y = this.playerRotation - Math.PI / 4;
    this.scene.add(arc);

    let life = 0;
    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        life += dt;
        arc.scale.multiplyScalar(1.08);
        arcMat.opacity = Math.max(0, 0.9 - life * 4);
        if (life >= 0.22) {
          this.scene.remove(arc);
          return false;
        }
        return true;
      }
    });
  }

  private spawnFireballProjectile(targetX: number, targetY: number, targetZ: number) {
    const ballGroup = new THREE.Group();
    ballGroup.position.set(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    ballGroup.add(ball);

    const bLight = new THREE.PointLight(0xf97316, 2.5, 12);
    ballGroup.add(bLight);

    this.scene.add(ballGroup);

    const startPos = ballGroup.position.clone();
    const endPos = new THREE.Vector3(targetX, targetY + 1.0, targetZ);
    let t = 0;

    this.activeFXGroups.push({
      group: ballGroup,
      update: (dt) => {
        t += dt * 3.5;
        if (t >= 1) {
          this.scene.remove(ballGroup);
          this.spawnExplosion(endPos.x, endPos.y, endPos.z, 0xf97316);
          return false;
        }
        ballGroup.position.lerpVectors(startPos, endPos, t);
        return true;
      }
    });
  }

  private spawnArrowProjectile(tx: number, ty: number, tz: number, colorHex: string) {
    const arrow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) })
    );
    arrow.position.set(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);
    this.scene.add(arrow);

    const start = arrow.position.clone();
    const target = new THREE.Vector3(tx, ty + 1.0, tz);
    arrow.lookAt(target);
    arrow.rotateX(Math.PI / 2);

    let t = 0;
    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        t += dt * 5.0;
        if (t >= 1) {
          this.scene.remove(arrow);
          this.spawnExplosion(target.x, target.y, target.z, new THREE.Color(colorHex).getHex());
          return false;
        }
        arrow.position.lerpVectors(start, target, t);
        return true;
      }
    });
  }

  private spawnFrostNova() {
    const ringGeo = new THREE.RingGeometry(0.5, 1.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(this.playerPos.x, 0.15, this.playerPos.z);
    this.scene.add(ring);

    let life = 0;
    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        life += dt;
        ring.scale.addScalar(dt * 14);
        ringMat.opacity = Math.max(0, 0.9 - life * 2.5);
        if (life >= 0.4) {
          this.scene.remove(ring);
          return false;
        }
        return true;
      }
    });
  }

  private spawnHealingPillar() {
    const pillarGeo = new THREE.CylinderGeometry(1.4, 1.4, 8, 16, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(this.playerPos.x, 4.0, this.playerPos.z);
    this.scene.add(pillar);

    let life = 0;
    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        life += dt;
        pillar.position.copy(this.playerPos);
        pillar.position.y += 4.0;
        pillar.rotation.y += dt * 4;
        pillarMat.opacity = Math.max(0, 0.7 - life * 1.5);
        if (life >= 0.5) {
          this.scene.remove(pillar);
          return false;
        }
        return true;
      }
    });
  }

  private spawnDivineJudgment(tx: number, tz: number) {
    const swordBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.2, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      })
    );
    swordBeam.position.set(tx, 12, tz);
    this.scene.add(swordBeam);

    const blastRing = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 2.0, 32),
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      })
    );
    blastRing.rotateX(-Math.PI / 2);
    blastRing.position.set(tx, 0.2, tz);
    this.scene.add(blastRing);

    let life = 0;
    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        life += dt;
        swordBeam.position.y = Math.max(6, 18 - life * 30);
        blastRing.scale.addScalar(dt * 18);
        if (life >= 0.6) {
          this.scene.remove(swordBeam, blastRing);
          this.spawnExplosion(tx, 1.0, tz, 0xfacc15);
          return false;
        }
        return true;
      }
    });
  }

  private spawnMeteorStorm(tx: number, tz: number) {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (this.isDestroyed) return;
        const ox = tx + (Math.random() - 0.5) * 6;
        const oz = tz + (Math.random() - 0.5) * 6;
        this.spawnExplosion(ox, 0.5, oz, 0xef4444);
      }, i * 150);
    }
  }

  private spawnArrowRain(tx: number, tz: number) {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (this.isDestroyed) return;
        const ox = tx + (Math.random() - 0.5) * 5;
        const oz = tz + (Math.random() - 0.5) * 5;
        this.spawnExplosion(ox, 0.5, oz, 0x22c55e);
      }, i * 100);
    }
  }

  private spawnExplosion(x: number, y: number, z: number, colorHex: number) {
    const pCount = 20;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const vels = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      vels[i * 3 + 0] = (Math.random() - 0.5) * 12;
      vels[i * 3 + 1] = Math.random() * 8 + 2;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.6,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const pMesh = new THREE.Points(geo, mat);
    this.scene.add(pMesh);

    let life = 0;
    this.activeFXGroups.push({
      group: new THREE.Group(),
      update: (dt) => {
        life += dt;
        const pArr = geo.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          pArr[i * 3 + 0] += vels[i * 3 + 0] * dt;
          pArr[i * 3 + 1] += vels[i * 3 + 1] * dt;
          pArr[i * 3 + 2] += vels[i * 3 + 2] * dt;
          vels[i * 3 + 1] -= 18 * dt; // gravity
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = Math.max(0, 0.9 - life * 2);
        if (life >= 0.45) {
          this.scene.remove(pMesh);
          return false;
        }
        return true;
      }
    });
  }

  // --- INPUT & EVENT HANDLING ---
  private initEvents() {
    const el = this.renderer.domElement;

    // Pointer down for camera orbit or click picking
    el.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.cameraYaw -= dx * 0.006;
      this.cameraPitch = Math.max(0.08, Math.min(Math.PI / 2.3, this.cameraPitch + dy * 0.005));
    });

    window.addEventListener('pointerup', (e) => {
      this.isDragging = false;
      // If minimal movement, perform click target pick
      const dist = Math.hypot(e.clientX - this.lastMouseX, e.clientY - this.lastMouseY);
      if (dist < 5) {
        this.performRaycastPick(e.clientX, e.clientY);
      }
    });

    // Zoom via wheel
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.cameraDistance = Math.max(4.0, Math.min(24.0, this.cameraDistance + e.deltaY * 0.015));
      },
      { passive: false }
    );

    // Resize
    window.addEventListener('resize', this.handleResize);
  }

  private performRaycastPick(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    const checkObjects: THREE.Object3D[] = [];
    this.enemyMeshes.forEach((mesh) => checkObjects.push(mesh));
    this.otherPlayerMeshes.forEach((mesh) => checkObjects.push(mesh));

    const intersects = this.raycaster.intersectObjects(checkObjects, true);

    if (intersects.length > 0) {
      let topObj: THREE.Object3D | null = intersects[0].object;
      while (topObj && topObj.parent && topObj.parent !== this.scene) {
        if (topObj.userData && topObj.userData.id) break;
        topObj = topObj.parent;
      }

      if (topObj && topObj.userData && topObj.userData.id) {
        this.selectedTargetId = topObj.userData.id;
        if (this.onTargetSelect) {
          this.onTargetSelect({
            id: topObj.userData.id,
            type: topObj.userData.type,
            name: topObj.userData.name
          });
        }
        return;
      }
    }

    // Clicked empty ground
    this.selectedTargetId = null;
    if (this.onTargetSelect) {
      this.onTargetSelect(null);
    }
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // --- GAME ANIMATION LOOP ---
  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;
      const dt = Math.min(this.clock.getDelta(), 0.1);
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private update(dt: number) {
    this.walkTime += dt * 8;

    // 1. Move Player
    this.playerPos.addScaledVector(this.playerVel, dt);
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.y = this.playerRotation;

    // 2. Animate Limbs
    this.animatePlayerLimbs(dt);

    // 3. Update Camera Orbit around Player
    const camX = this.playerPos.x - Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const camY = this.playerPos.y + 1.8 + Math.sin(this.cameraPitch) * this.cameraDistance;
    const camZ = this.playerPos.z - Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(this.playerPos.x, this.playerPos.y + 1.8, this.playerPos.z);

    // 4. Update FX systems
    for (let i = this.activeFXGroups.length - 1; i >= 0; i--) {
      const active = this.activeFXGroups[i];
      const keep = active.update(dt);
      if (!keep) {
        this.activeFXGroups.splice(i, 1);
      }
    }

    // 5. Check warp portal proximity
    let foundWp: WarpPoint | null = null;
    for (const p of this.portalMeshes) {
      const d = Math.hypot(p.wp.x - this.playerPos.x, p.wp.z - this.playerPos.z);
      if (d < 3.8) {
        foundWp = p.wp;
        break;
      }
    }
    if (foundWp !== this.nearWarpPoint) {
      this.nearWarpPoint = foundWp;
      if (this.onNearWarpPortal) {
        this.onNearWarpPortal(foundWp);
      }
    }

    // 6. Check Duel Master Artorius proximity (at 18, 26)
    const distToMaster = Math.hypot(18 - this.playerPos.x, 26 - this.playerPos.z);
    const isNearMaster = distToMaster < 5.0;
    if (isNearMaster !== this.isNearDuelMaster) {
      this.isNearDuelMaster = isNearMaster;
      if (this.onNearDuelMaster) {
        this.onNearDuelMaster(isNearMaster);
      }
    }

    // 7. Update active Duel NPC AI & animation
    if (this.isDuelActive && this.duelNPCMesh && this.activeDuelOpponent) {
      this.updateDuelNPC(dt);
    }

    // 8. Update Dash trail FX
    if (this.dashTrailParticles) {
      this.dashTrailParticles.visible = this.isDashing;
      if (this.isDashing) {
        const pArr = this.dashTrailParticles.geometry.attributes.position.array as Float32Array;
        const count = pArr.length / 3;
        for (let i = count - 1; i > 0; i--) {
          pArr[i * 3 + 0] = pArr[(i - 1) * 3 + 0];
          pArr[i * 3 + 1] = pArr[(i - 1) * 3 + 1];
          pArr[i * 3 + 2] = pArr[(i - 1) * 3 + 2];
        }
        pArr[0] = this.playerPos.x + (Math.random() - 0.5) * 0.8;
        pArr[1] = this.playerPos.y + 0.5 + Math.random() * 0.8;
        pArr[2] = this.playerPos.z + (Math.random() - 0.5) * 0.8;
        this.dashTrailParticles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  private updateDuelNPC(dt: number) {
    if (!this.duelNPCMesh || !this.activeDuelOpponent) return;

    this.duelNPCAITimer += dt;
    const dx = this.playerPos.x - this.duelNPCMesh.position.x;
    const dz = this.playerPos.z - this.duelNPCMesh.position.z;
    const dist = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    this.duelNPCMesh.rotation.y = angle;

    // Arena boundary clamp (radius 11.5 from center 18, 26)
    const fromCenterX = this.duelNPCMesh.position.x - 18;
    const fromCenterZ = this.duelNPCMesh.position.z - 26;
    const distFromCenter = Math.hypot(fromCenterX, fromCenterZ);
    if (distFromCenter > 11.0) {
      this.duelNPCMesh.position.x = 18 + (fromCenterX / distFromCenter) * 10.8;
      this.duelNPCMesh.position.z = 26 + (fromCenterZ / distFromCenter) * 10.8;
    }

    // AI movement: Maintain optimal combat distance
    const optimalDist = this.activeDuelOpponent.classId === 'mage' ? 7.0 : 3.0;
    if (dist > optimalDist + 1.0) {
      // Approach
      const speed = 4.5 * dt;
      this.duelNPCMesh.position.x += Math.sin(angle) * speed;
      this.duelNPCMesh.position.z += Math.cos(angle) * speed;
    } else if (dist < optimalDist - 1.5 && this.activeDuelOpponent.classId === 'mage') {
      // Backpedal
      const speed = 3.5 * dt;
      this.duelNPCMesh.position.x -= Math.sin(angle) * speed;
      this.duelNPCMesh.position.z -= Math.cos(angle) * speed;
    }

    // Duel NPC attacks every 2.0 seconds
    if (this.duelNPCAITimer > 2.0) {
      this.duelNPCAITimer = 0;
      if (dist < 8.5) {
        if (this.duelNPCLimbs && this.duelNPCLimbs.rArm) {
          this.duelNPCLimbs.rArm.rotation.x = -Math.PI / 1.5;
          setTimeout(() => {
            if (this.duelNPCLimbs && this.duelNPCLimbs.rArm) {
              this.duelNPCLimbs.rArm.rotation.x = 0;
            }
          }, 300);
        }

        if (dist <= 4.5 || (this.activeDuelOpponent.classId !== 'paladin' && dist <= 12.0)) {
          const dmg = Math.round(this.activeDuelOpponent.atk * (0.85 + Math.random() * 0.25));
          if (this.onDuelDamageTaken) {
            this.onDuelDamageTaken(dmg);
          }
          if (this.activeDuelOpponent.classId === 'mage') {
            sound.playFireball();
            this.spawnExplosion(this.playerPos.x, this.playerPos.y + 1, this.playerPos.z, 0xef4444);
          } else {
            sound.playSlash();
            this.spawnExplosion(this.playerPos.x, this.playerPos.y + 1, this.playerPos.z, 0xfacc15);
          }
        }
      }
    }
  }

  private animatePlayerLimbs(dt: number) {
    if (!this.playerLimbs.torso) return;

    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
      // Swing animation
      this.playerLimbs.rightArm.rotation.x = -Math.PI / 1.8;
      this.playerLimbs.rightArm.rotation.y = -Math.sin(this.attackTimer * 15) * 0.8;
      return;
    }

    if (this.isMoving) {
      // Walking / Running Stride
      const legAngle = Math.sin(this.walkTime) * 0.7;
      this.playerLimbs.leftLeg.rotation.x = legAngle;
      this.playerLimbs.rightLeg.rotation.x = -legAngle;

      this.playerLimbs.leftArm.rotation.x = -legAngle * 0.6;
      this.playerLimbs.rightArm.rotation.x = legAngle * 0.6;

      // Subtle torso bob
      this.playerLimbs.torso.position.y = 1.6 + Math.abs(Math.sin(this.walkTime)) * 0.12;

      // Cape flutter
      if (this.playerLimbs.cape) {
        this.playerLimbs.cape.rotation.x = 0.45 + Math.sin(this.walkTime * 2) * 0.2;
      }
    } else {
      // Idle Breathing
      const breath = Math.sin(this.walkTime * 0.25) * 0.05;
      this.playerLimbs.leftLeg.rotation.x = 0;
      this.playerLimbs.rightLeg.rotation.x = 0;
      this.playerLimbs.leftArm.rotation.x = breath;
      this.playerLimbs.rightArm.rotation.x = -breath;
      this.playerLimbs.torso.position.y = 1.6 + breath * 0.5;

      if (this.playerLimbs.cape) {
        this.playerLimbs.cape.rotation.x = 0.15 + breath * 0.5;
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    // Dispose renderer
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
