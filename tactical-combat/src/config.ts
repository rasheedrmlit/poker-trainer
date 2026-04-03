export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const HEX_SIZE = 36;
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

export const GRID_COLS = 12;
export const GRID_ROWS = 10;

export const GRID_OFFSET_X = 80;
export const GRID_OFFSET_Y = 200;

export const COLORS = {
  BG: 0x1a1a2e,
  HEX_FILL: 0x16213e,
  HEX_STROKE: 0x0f3460,
  HEX_HOVER: 0x533483,
  MOVE_RANGE: 0x00b4d8,
  ATTACK_RANGE: 0xe63946,
  SELECTED: 0xf7d354,
  PLAYER: 0x06d6a0,
  ENEMY: 0xef476f,
  COVER_HALF: 0xffd166,
  COVER_FULL: 0x118ab2,
  HEAL: 0x2ec4b6,
  UI_BG: 0x0d1b2a,
  UI_BORDER: 0x1b263b,
  UI_TEXT: 0xe0e1dd,
  UI_ACCENT: 0x00b4d8,
  HEALTH_GREEN: 0x06d6a0,
  HEALTH_RED: 0xef476f,
  DAMAGE_TEXT: 0xff6b6b,
  CRIT_TEXT: 0xffd93d,
  HEAL_TEXT: 0x2ec4b6,
};

export const UNIT_CLASSES = {
  RANGER: {
    name: 'Ranger',
    maxHp: 8,
    moveRange: 4,
    attackRange: 5,
    baseDamage: 3,
    accuracy: 80,
    critChance: 15,
    ability: 'Overwatch',
    abilityDesc: 'Reaction shot on enemy movement',
    color: 0x06d6a0,
  },
  VANGUARD: {
    name: 'Vanguard',
    maxHp: 12,
    moveRange: 3,
    attackRange: 3,
    baseDamage: 4,
    accuracy: 70,
    critChance: 10,
    ability: 'Shield Wall',
    abilityDesc: '+50% cover bonus this turn',
    color: 0x118ab2,
  },
  SPECIALIST: {
    name: 'Specialist',
    maxHp: 6,
    moveRange: 4,
    attackRange: 4,
    baseDamage: 2,
    accuracy: 75,
    critChance: 10,
    ability: 'Heal',
    abilityDesc: 'Restore 4 HP to adjacent ally',
    color: 0x2ec4b6,
  },
  GRENADIER: {
    name: 'Grenadier',
    maxHp: 10,
    moveRange: 3,
    attackRange: 4,
    baseDamage: 3,
    accuracy: 70,
    critChance: 5,
    ability: 'Grenade',
    abilityDesc: 'AoE damage, destroys cover',
    color: 0xffd166,
  },
} as const;

export type UnitClassName = keyof typeof UNIT_CLASSES;

export const ENEMY_TYPES = {
  DRONE: { name: 'Drone', maxHp: 4, moveRange: 5, attackRange: 3, baseDamage: 2, accuracy: 65, critChance: 5, color: 0xff6b6b },
  SENTINEL: { name: 'Sentinel', maxHp: 7, moveRange: 3, attackRange: 6, baseDamage: 3, accuracy: 75, critChance: 10, color: 0xd62828 },
  ENFORCER: { name: 'Enforcer', maxHp: 10, moveRange: 4, attackRange: 2, baseDamage: 5, accuracy: 70, critChance: 15, color: 0x9d0208 },
  DISRUPTOR: { name: 'Disruptor', maxHp: 5, moveRange: 4, attackRange: 4, baseDamage: 2, accuracy: 70, critChance: 5, color: 0xe85d04 },
} as const;

export type EnemyTypeName = keyof typeof ENEMY_TYPES;

export const COMBAT = {
  DISTANCE_PENALTY_PER_HEX: 5,
  DISTANCE_PENALTY_START: 3,
  HALF_COVER_BONUS: 25,
  FULL_COVER_BONUS: 40,
  FLANK_BONUS: 15,
  ELEVATION_BONUS: 10,
  CRIT_MULTIPLIER: 1.5,
  MIN_HIT_CHANCE: 5,
  MAX_HIT_CHANCE: 95,
};
