import Phaser from 'phaser';
import { Entity, World } from '../core/ECS';
import { HexGrid } from '../hex/HexGrid';
import { hexToPixel } from '../hex/HexCoord';
import {
  createPosition, createHealth, createMovement, createCombat,
  createTeam, createSprite, createStatus,
  type SpriteComponent,
} from '../components';
import { UNIT_CLASSES, ENEMY_TYPES, COLORS, HEX_SIZE, type UnitClassName, type EnemyTypeName } from '../config';

export function createPlayerUnit(
  world: World, grid: HexGrid, scene: Phaser.Scene,
  className: UnitClassName, q: number, r: number
): Entity {
  const cfg = UNIT_CLASSES[className];
  const entity = world.create();
  entity.tag = 'unit';
  entity.add(createPosition(q, r));
  entity.add(createHealth(cfg.maxHp));
  entity.add(createMovement(cfg.moveRange));
  entity.add(createCombat(cfg.attackRange, cfg.baseDamage, cfg.accuracy, cfg.critChance));
  entity.add(createTeam('player'));
  entity.add(createSprite());
  entity.add(createStatus());
  entity.add({
    type: 'unitClass',
    className,
    displayName: cfg.name,
    ability: cfg.ability,
    abilityUsed: false,
  });

  grid.setOccupant(q, r, entity.id);
  createUnitVisual(scene, entity, cfg.color, cfg.name[0], q, r);
  return entity;
}

export function createEnemyUnit(
  world: World, grid: HexGrid, scene: Phaser.Scene,
  enemyType: EnemyTypeName, q: number, r: number
): Entity {
  const cfg = ENEMY_TYPES[enemyType];
  const entity = world.create();
  entity.tag = 'unit';
  entity.add(createPosition(q, r));
  entity.add(createHealth(cfg.maxHp));
  entity.add(createMovement(cfg.moveRange));
  entity.add(createCombat(cfg.attackRange, cfg.baseDamage, cfg.accuracy, cfg.critChance));
  entity.add(createTeam('enemy'));
  entity.add(createSprite());
  entity.add(createStatus());
  entity.add({
    type: 'unitClass',
    className: enemyType,
    displayName: cfg.name,
    ability: '',
    abilityUsed: false,
  });

  grid.setOccupant(q, r, entity.id);
  createUnitVisual(scene, entity, cfg.color, cfg.name[0], q, r);
  return entity;
}

function createUnitVisual(
  scene: Phaser.Scene, entity: Entity, color: number, letter: string,
  q: number, r: number
): void {
  const { x, y } = hexToPixel(q, r);
  const container = scene.add.container(x, y);
  container.setDepth(10);

  const team = entity.get<{ type: string; team: string }>('team')!.team;
  const outlineColor = team === 'player' ? COLORS.PLAYER : COLORS.ENEMY;

  // Unit body
  const body = scene.add.graphics();
  body.fillStyle(color, 1);
  body.fillCircle(0, 0, HEX_SIZE * 0.42);
  body.lineStyle(2.5, outlineColor, 1);
  body.strokeCircle(0, 0, HEX_SIZE * 0.42);
  container.add(body);

  // Class letter
  const text = scene.add.text(0, 0, letter, {
    fontSize: '18px',
    fontFamily: 'monospace',
    color: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 2,
  }).setOrigin(0.5);
  container.add(text);

  // Health bar background
  const hpBg = scene.add.graphics();
  hpBg.fillStyle(0x000000, 0.7);
  hpBg.fillRoundedRect(-14, -HEX_SIZE * 0.55, 28, 5, 2);
  container.add(hpBg);

  // Health bar fill
  const hpBar = scene.add.graphics();
  hpBar.fillStyle(COLORS.HEALTH_GREEN, 1);
  hpBar.fillRoundedRect(-13, -HEX_SIZE * 0.55 + 0.5, 26, 4, 1.5);
  container.add(hpBar);
  hpBar.setName('hpBar');

  const sprite = entity.get<SpriteComponent>('sprite')!;
  sprite.container = container;
}

export function updateUnitPosition(entity: Entity, q: number, r: number): void {
  const pos = entity.get<{ type: string; q: number; r: number }>('position')!;
  pos.q = q;
  pos.r = r;
}

export function updateHealthBar(entity: Entity): void {
  const health = entity.get<{ type: string; current: number; max: number }>('health')!;
  const sprite = entity.get<SpriteComponent>('sprite')!;
  if (!sprite.container) return;

  const hpBar = sprite.container.list.find(
    c => (c as Phaser.GameObjects.Graphics).name === 'hpBar'
  ) as Phaser.GameObjects.Graphics | undefined;

  if (hpBar) {
    hpBar.clear();
    const ratio = Math.max(0, health.current / health.max);
    const color = ratio > 0.5 ? COLORS.HEALTH_GREEN : ratio > 0.25 ? COLORS.COVER_HALF : COLORS.HEALTH_RED;
    hpBar.fillStyle(color, 1);
    hpBar.fillRoundedRect(-13, -HEX_SIZE * 0.55 + 0.5, 26 * ratio, 4, 1.5);
  }
}

export function destroyUnitVisual(entity: Entity): void {
  const sprite = entity.get<SpriteComponent>('sprite');
  if (sprite?.container) {
    sprite.container.destroy();
    sprite.container = null;
  }
}
