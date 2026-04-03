import { Component } from '../core/ECS';
import { UnitClassName, EnemyTypeName } from '../config';

export interface PositionComponent extends Component {
  type: 'position';
  q: number;
  r: number;
}

export interface HealthComponent extends Component {
  type: 'health';
  current: number;
  max: number;
}

export interface MovementComponent extends Component {
  type: 'movement';
  range: number;
  moved: boolean;
}

export interface CombatComponent extends Component {
  type: 'combat';
  attackRange: number;
  baseDamage: number;
  accuracy: number;
  critChance: number;
  attacked: boolean;
}

export interface UnitClassComponent extends Component {
  type: 'unitClass';
  className: UnitClassName | EnemyTypeName;
  displayName: string;
  ability: string;
  abilityUsed: boolean;
}

export interface TeamComponent extends Component {
  type: 'team';
  team: 'player' | 'enemy';
}

export interface SpriteComponent extends Component {
  type: 'sprite';
  container: Phaser.GameObjects.Container | null;
}

export interface StatusComponent extends Component {
  type: 'status';
  overwatch: boolean;
  shieldWall: boolean;
  stunned: boolean;
}

export function createPosition(q: number, r: number): PositionComponent {
  return { type: 'position', q, r };
}

export function createHealth(max: number): HealthComponent {
  return { type: 'health', current: max, max };
}

export function createMovement(range: number): MovementComponent {
  return { type: 'movement', range, moved: false };
}

export function createCombat(
  attackRange: number, baseDamage: number, accuracy: number, critChance: number
): CombatComponent {
  return { type: 'combat', attackRange, baseDamage, accuracy, critChance, attacked: false };
}

export function createTeam(team: 'player' | 'enemy'): TeamComponent {
  return { type: 'team', team };
}

export function createSprite(): SpriteComponent {
  return { type: 'sprite', container: null };
}

export function createStatus(): StatusComponent {
  return { type: 'status', overwatch: false, shieldWall: false, stunned: false };
}
