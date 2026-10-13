export type CharacterClassId = 'paladin' | 'mage' | 'ranger';

export interface CharacterClass {
  id: CharacterClassId;
  name: string;
  role: string;
  description: string;
  portrait: string;
  baseHp: number;
  baseMp: number;
  baseAtk: number;
  baseDef: number;
  baseCrit: number;
  baseSpeed: number;
  color: string;
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ItemType = 'weapon' | 'armor' | 'helmet' | 'boots' | 'ring' | 'potion' | 'material';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  iconName: string;
  stats?: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    crit?: number;
  };
  healHp?: number;
  healMp?: number;
  value: number;
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  helmet: Item | null;
  boots: Item | null;
  ring: Item | null;
}

export interface Skill {
  id: string;
  key: '1' | '2' | '3' | '4' | 'R';
  name: string;
  description: string;
  cooldown: number; // in seconds
  currentCooldown: number;
  manaCost: number;
  damageMultiplier: number;
  range: number;
  radius: number; // AOE radius
  type: 'melee' | 'projectile' | 'aoe' | 'heal' | 'buff';
  color: string;
  icon: string;
}

export type EnemyType =
  // Forest & Plains (Lv. 1 - 7)
  | 'slime'
  | 'blue_slime'
  | 'red_slime'
  | 'king_slime'
  | 'forest_wolf'
  | 'dire_wolf'
  | 'shadow_panther'
  | 'treant'
  | 'mushroom_spore'
  | 'wild_boar'
  // Ancient Ruins & Crypts (Lv. 8 - 14)
  | 'skeleton_warrior'
  | 'skeleton_archer'
  | 'skeleton_knight'
  | 'ghost_wraith'
  | 'mummy'
  | 'gargoyle'
  | 'lich'
  // Crystal Abyss & Caverns (Lv. 12 - 18)
  | 'crystal_golem'
  | 'amethyst_golem'
  | 'crystal_spider'
  | 'crystal_bat'
  | 'diamond_colossus'
  | 'cave_scorpion'
  // Volcanic Caldera & Ashlands (Lv. 16 - 22)
  | 'fire_elemental'
  | 'lava_hound'
  | 'volcano_golem'
  | 'fire_drake'
  | 'boss_dragon'
  // Celestial & Void Rift (Lv. 18 - 25)
  | 'void_watcher'
  | 'astral_chimera';

export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  expReward: number;
  goldReward: number;
  x: number;
  y: number;
  z: number;
  spawnX: number;
  spawnZ: number;
  aggroRadius: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  isDead: boolean;
  respawnTime: number;
  currentTargetId: string | null;
  scale: number;
  isBoss?: boolean;
}

export interface OtherPlayer {
  id: string;
  name: string;
  classId: CharacterClassId;
  level: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  guild: string;
  title: string;
  state: 'idle' | 'walk' | 'attack' | 'cast';
  targetEnemyId: string | null;
  color: string;
  rotation?: number;
  isMoving?: boolean;
  isDashing?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  giverName: string;
  targetMonsterType: EnemyType;
  currentCount: number;
  requiredCount: number;
  expReward: number;
  goldReward: number;
  itemReward?: Item;
  status: 'available' | 'active' | 'completed' | 'turned_in';
}

export interface DamageNumber {
  id: string;
  text: string;
  isCrit: boolean;
  isHeal: boolean;
  color: string;
  x: number;
  y: number;
  z: number;
  opacity: number;
  vy: number;
}

export type ChatChannel = 'world' | 'guild' | 'party' | 'system' | 'combat';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  channel: ChatChannel;
  timestamp: string;
  badge?: string;
}

export interface WorldDrop {
  id: string;
  item: Item;
  x: number;
  y: number;
  z: number;
  life: number;
}

export interface PlayerStats {
  str: number;
  agi: number;
  int: number;
  vit: number;
  unspentPoints: number;
}

export interface WarpPoint {
  id: string;
  name: string;
  zone: string;
  x: number;
  y: number;
  z: number;
  color: string;
  description: string;
  unlocked: boolean;
}

export interface DuelOpponent {
  id: string;
  name: string;
  title: string;
  classId: CharacterClassId;
  level: number;
  maxHp: number;
  atk: number;
  def: number;
  description: string;
  rewardGold: number;
  rewardExp: number;
  rewardTitle: string;
}

export interface DuelState {
  isActive: boolean;
  opponent: DuelOpponent | null;
  opponentHp: number;
  playerHp: number;
  winner: 'player' | 'opponent' | null;
  log: string[];
}

export interface TutorialStep {
  id: number;
  title: string;
  objective: string;
  hint: string;
  keyGuide: string;
}

export interface MultiplayerPacket {
  type: 'join' | 'sync' | 'leave' | 'chat' | 'attack' | 'duel_request';
  id: string;
  name: string;
  classId: CharacterClassId;
  level: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  hp: number;
  maxHp: number;
  state: 'idle' | 'walk' | 'attack' | 'cast';
  timestamp: number;
  chatText?: string;
  chatChannel?: ChatChannel;
  skillId?: string;
}

