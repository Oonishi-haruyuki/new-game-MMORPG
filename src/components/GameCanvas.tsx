import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeWorld } from '../game/ThreeWorld';
import {
  CharacterClassId,
  Enemy,
  OtherPlayer,
  WorldDrop,
  Skill,
  DamageNumber,
  WarpPoint,
  DuelOpponent
} from '../types/game';
import { sound } from '../utils/audio';
import { multiplayer } from '../utils/multiplayer';

interface FloatingDamage {
  id: string;
  text: string;
  color: string;
  isCrit: boolean;
  x3d: number;
  y3d: number;
  z3d: number;
  screenX: number;
  screenY: number;
  opacity: number;
  offsetY: number;
}

interface GameCanvasProps {
  playerClassId: CharacterClassId;
  enemies: Enemy[];
  otherPlayers: OtherPlayer[];
  drops: WorldDrop[];
  isAutoDash?: boolean;
  onPlayerPosChange: (x: number, y: number, z: number, rotation: number) => void;
  onTargetSelect: (targetId: string | null) => void;
  selectedTargetId: string | null;
  onDamageEnemy: (enemyId: string, damage: number, isCrit: boolean) => void;
  onPlayerDamaged: (amount: number) => void;
  onPickDrop: (dropId: string) => void;
  onTriggerSkillRegister: (fn: (skill: Skill) => void) => void;
  onMobileControlRegister: (fn: {
    move: (dir: { x: number; z: number }) => void;
    jump: () => void;
    dash: (active: boolean) => void;
    attack: () => void;
    tabTarget: () => void;
  }) => void;
  onNearWarpPortal?: (wp: WarpPoint | null) => void;
  onNearDuelMaster?: (isNear: boolean) => void;
  onDuelDamageTaken?: (dmg: number) => void;
  onDuelVictory?: (opp: DuelOpponent) => void;
  onRegisterTeleport?: (fn: (x: number, y: number, z: number) => void) => void;
  onRegisterDuelController?: (fn: {
    setDuelActive: (active: boolean, opp: DuelOpponent | null) => void;
  }) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerClassId,
  enemies,
  otherPlayers,
  drops,
  isAutoDash = false,
  onPlayerPosChange,
  onTargetSelect,
  selectedTargetId,
  onDamageEnemy,
  onPlayerDamaged,
  onPickDrop,
  onTriggerSkillRegister,
  onMobileControlRegister,
  onNearWarpPortal,
  onNearDuelMaster,
  onDuelDamageTaken,
  onDuelVictory,
  onRegisterTeleport,
  onRegisterDuelController
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<ThreeWorld | null>(null);

  // Keyboard state
  const keysDown = useRef<{ [key: string]: boolean }>({});
  const mobileMove = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const mobileDash = useRef<boolean>(false);

  // Floating damage numbers
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);

  // 1. Initialize ThreeWorld
  useEffect(() => {
    if (!containerRef.current) return;

    const world = new ThreeWorld(containerRef.current, playerClassId);
    worldRef.current = world;

    world.onTargetSelect = (target) => {
      onTargetSelect(target ? target.id : null);
    };

    world.onNearWarpPortal = (wp) => {
      if (onNearWarpPortal) onNearWarpPortal(wp);
    };

    world.onNearDuelMaster = (isNear) => {
      if (onNearDuelMaster) onNearDuelMaster(isNear);
    };

    world.onDuelDamageTaken = (dmg) => {
      if (onDuelDamageTaken) onDuelDamageTaken(dmg);
    };

    world.onDuelVictory = (opp) => {
      if (onDuelVictory) onDuelVictory(opp);
    };

    return () => {
      world.destroy();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (onRegisterTeleport) {
      onRegisterTeleport((x, y, z) => {
        if (worldRef.current) {
          worldRef.current.teleportPlayer(x, y, z);
        }
      });
    }
  }, [onRegisterTeleport]);

  useEffect(() => {
    if (onRegisterDuelController) {
      onRegisterDuelController({
        setDuelActive: (active, opp) => {
          if (worldRef.current) {
            worldRef.current.setDuelActive(active, opp);
          }
        }
      });
    }
  }, [onRegisterDuelController]);

  // Update class model if changed
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.setPlayerClass(playerClassId);
    }
  }, [playerClassId]);

  // Sync selected target
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.selectedTargetId = selectedTargetId;
    }
  }, [selectedTargetId]);

  // 2. Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const key = e.key.toLowerCase();
      keysDown.current[key] = true;

      // Space to jump
      if (e.code === 'Space') {
        e.preventDefault();
        performJump();
      }

      // Tab to cycle nearest target
      if (e.key === 'Tab') {
        e.preventDefault();
        cycleNearestTarget();
      }

      // Escape to clear target
      if (e.key === 'Escape') {
        onTargetSelect(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      keysDown.current[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enemies, selectedTargetId]);

  const performJump = () => {
    const world = worldRef.current;
    if (world && !world.isJumping) {
      world.isJumping = true;
      world.playerVel.y = 8.5;
      sound.playSlash();
    }
  };

  const cycleNearestTarget = () => {
    const world = worldRef.current;
    if (!world) return;

    const aliveEnemies = enemies.filter((e) => !e.isDead);
    if (aliveEnemies.length === 0) return;

    // Sort by distance to player
    aliveEnemies.sort((a, b) => {
      const distA = Math.hypot(a.x - world.playerPos.x, a.z - world.playerPos.z);
      const distB = Math.hypot(b.x - world.playerPos.x, b.z - world.playerPos.z);
      return distA - distB;
    });

    const currentIndex = aliveEnemies.findIndex((e) => e.id === selectedTargetId);
    const nextIndex = (currentIndex + 1) % aliveEnemies.length;
    onTargetSelect(aliveEnemies[nextIndex].id);
  };

  // 3. Register Skill Execution Callback
  const executeSkill = useCallback(
    (skill: Skill) => {
      const world = worldRef.current;
      if (!world) return;

      // Find target pos if any
      const targetEnemy = enemies.find((e) => e.id === selectedTargetId && !e.isDead);
      const targetPos = targetEnemy ? { x: targetEnemy.x, y: targetEnemy.y, z: targetEnemy.z } : undefined;

      world.executeSkill(skill, targetPos);

      // Apply skill damage / hit logic
      if (skill.type === 'heal') {
        // Heal handled in App state
        return;
      }

      // Check hit candidates
      enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const dist = Math.hypot(enemy.x - world.playerPos.x, enemy.z - world.playerPos.z);

        const isTargetMatch = targetEnemy && enemy.id === targetEnemy.id && dist <= skill.range;
        const isAoeMatch = skill.radius > 0 && dist <= skill.radius;

        if (isTargetMatch || isAoeMatch) {
          const isCrit = Math.random() < 0.25;
          const baseDmg = 40 * skill.damageMultiplier;
          const finalDmg = Math.round(baseDmg * (isCrit ? 1.75 : 1) * (0.9 + Math.random() * 0.2));

          onDamageEnemy(enemy.id, finalDmg, isCrit);

          // Add floating 3D damage number
          addFloatingDamage(
            finalDmg.toString(),
            enemy.x + (Math.random() - 0.5) * 0.8,
            enemy.y + (enemy.scale || 1) * 1.8,
            enemy.z + (Math.random() - 0.5) * 0.8,
            isCrit ? '#fbbf24' : '#ffffff',
            isCrit
          );
        }
      });

      // Check duel opponent hit if duel active
      if (world.isDuelActive) {
        const duelNpc = world.getDuelNPC();
        if (duelNpc) {
          const dDist = Math.hypot(duelNpc.position.x - world.playerPos.x, duelNpc.position.z - world.playerPos.z);
          if (dDist <= Math.max(skill.range, skill.radius || 4.5)) {
            const isCrit = Math.random() < 0.25;
            const baseDmg = 45 * skill.damageMultiplier;
            const finalDmg = Math.round(baseDmg * (isCrit ? 1.75 : 1) * (0.9 + Math.random() * 0.2));
            world.damageDuelNPC(finalDmg);
            addFloatingDamage(
              finalDmg.toString(),
              duelNpc.position.x + (Math.random() - 0.5) * 0.6,
              duelNpc.position.y + 1.8,
              duelNpc.position.z + (Math.random() - 0.5) * 0.6,
              isCrit ? '#fbbf24' : '#f43f5e',
              isCrit
            );
          }
        }
      }

      // Broadcast skill action to multiplayer clients
      multiplayer.sendAction(skill.id, skill.name, skill.color, targetPos);
    },
    [enemies, selectedTargetId, onDamageEnemy]
  );

  useEffect(() => {
    onTriggerSkillRegister(executeSkill);
  }, [executeSkill, onTriggerSkillRegister]);

  // Register mobile controls
  useEffect(() => {
    onMobileControlRegister({
      move: (dir) => {
        mobileMove.current = dir;
      },
      jump: performJump,
      dash: (active: boolean) => {
        mobileDash.current = active;
      },
      attack: () => {
        const basicSkill: Skill = {
          id: 'basic',
          key: '1',
          name: '基本攻撃',
          description: '',
          cooldown: 0.0,
          currentCooldown: 0,
          manaCost: 0,
          damageMultiplier: 1.0,
          range: 4.5,
          radius: 2.0,
          type: 'melee',
          color: '#38bdf8',
          icon: 'Sword'
        };
        executeSkill(basicSkill);
      },
      tabTarget: cycleNearestTarget
    });
  }, [cycleNearestTarget, executeSkill]);

  const addFloatingDamage = (
    text: string,
    x3d: number,
    y3d: number,
    z3d: number,
    color: string,
    isCrit: boolean
  ) => {
    const id = Math.random().toString();
    setFloatingDamages((prev) => [
      ...prev.slice(-15),
      {
        id,
        text,
        color,
        isCrit,
        x3d,
        y3d,
        z3d,
        screenX: -999,
        screenY: -999,
        opacity: 1,
        offsetY: 0
      }
    ]);
  };

  // 4. Game physics & simulation loop
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      const world = worldRef.current;
      if (world) {
        // Player Movement from WASD / Mobile
        let moveX = 0;
        let moveZ = 0;

        if (keysDown.current['w'] || keysDown.current['arrowup']) moveZ += 1;
        if (keysDown.current['s'] || keysDown.current['arrowdown']) moveZ -= 1;
        if (keysDown.current['a'] || keysDown.current['arrowleft']) moveX -= 1;
        if (keysDown.current['d'] || keysDown.current['arrowright']) moveX += 1;

        // Apply mobile analog stick
        if (mobileMove.current.x !== 0 || mobileMove.current.z !== 0) {
          moveX += mobileMove.current.x;
          moveZ -= mobileMove.current.z;
        }

        const isShiftDown = !!keysDown.current['shift'];
        const isDashActive = isShiftDown || mobileDash.current || isAutoDash;

        // "移動の際にダッシュだけでも動くように設定": Dashing alone moves player forward!
        if (isDashActive && moveX === 0 && moveZ === 0) {
          moveZ = 1;
        }

        const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;
        world.isMoving = isMoving;
        world.isDashing = isMoving && isDashActive;

        if (isMoving) {
          // Normalize and project relative to Camera Yaw
          const len = Math.hypot(moveX, moveZ);
          const nx = moveX / len;
          const nz = moveZ / len;

          const speed = isDashActive ? 16.5 : 9.5;
          const angle = Math.atan2(nx, nz) + world.cameraYaw;

          world.playerVel.x = Math.sin(angle) * speed;
          world.playerVel.z = Math.cos(angle) * speed;
          world.playerRotation = angle;
        } else {
          world.playerVel.x = 0;
          world.playerVel.z = 0;
        }

        // Send real-time movement to multiplayer WebSocket
        multiplayer.sendMove(
          world.playerPos.x,
          world.playerPos.y,
          world.playerPos.z,
          world.playerRotation,
          isMoving,
          world.isDashing
        );

        // Jump & Gravity
        if (world.isJumping) {
          world.playerVel.y -= 22 * 0.016; // gravity
          if (world.playerPos.y + world.playerVel.y * 0.016 <= 0) {
            world.playerPos.y = 0;
            world.playerVel.y = 0;
            world.isJumping = false;
          }
        }

        // Clamp boundaries (-150 to 150)
        world.playerPos.x = Math.max(-145, Math.min(145, world.playerPos.x));
        world.playerPos.z = Math.max(-145, Math.min(145, world.playerPos.z));

        // Sync world meshes
        world.syncEnemies(enemies);
        world.syncOtherPlayers(otherPlayers);
        world.syncDrops(drops);

        // Check loot drop pickups
        drops.forEach((drop) => {
          const dist = Math.hypot(drop.x - world.playerPos.x, drop.z - world.playerPos.z);
          if (dist < 2.5) {
            onPickDrop(drop.id);
            sound.playCoin();
          }
        });

        // Notify parent of player coords
        onPlayerPosChange(world.playerPos.x, world.playerPos.y, world.playerPos.z, world.playerRotation);

        // Update 3D projected coordinates for Floating Damage Text
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setFloatingDamages((prev) =>
            prev
              .map((fd) => {
                const vec = { x: fd.x3d, y: fd.y3d + fd.offsetY, z: fd.z3d };
                const tempVec = new THREE.Vector3(vec.x, vec.y, vec.z);
                tempVec.project(world.camera);

                const sx = ((tempVec.x + 1) * rect.width) / 2;
                const sy = ((-tempVec.y + 1) * rect.height) / 2;

                return {
                  ...fd,
                  screenX: sx,
                  screenY: sy,
                  offsetY: fd.offsetY + 0.035,
                  opacity: fd.opacity - 0.02
                };
              })
              .filter((fd) => fd.opacity > 0)
          );
        }
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [enemies, otherPlayers, drops, onPlayerPosChange, onPickDrop]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden touch-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Damage Numbers Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {floatingDamages.map((fd) => (
          <div
            key={fd.id}
            className={`absolute font-black pointer-events-none drop-shadow-md select-none transition-transform font-mono ${
              fd.isCrit ? 'text-lg sm:text-xl font-black scale-110' : 'text-sm sm:text-base font-bold'
            }`}
            style={{
              left: `${fd.screenX}px`,
              top: `${fd.screenY}px`,
              transform: 'translate(-50%, -50%)',
              color: fd.color,
              opacity: fd.opacity,
              textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)'
            }}
          >
            {fd.isCrit ? `CRIT! ${fd.text}` : fd.text}
          </div>
        ))}
      </div>
    </div>
  );
};
