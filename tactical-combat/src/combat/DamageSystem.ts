import { Entity } from '../core/ECS';
import { HexGrid } from '../hex/HexGrid';
import { hexDistance, hexNeighbors, type Hex } from '../hex/HexCoord';
import { COMBAT } from '../config';
import type {
  PositionComponent, CombatComponent, HealthComponent, StatusComponent
} from '../components';

export interface AttackResult {
  hit: boolean;
  damage: number;
  crit: boolean;
  hitChance: number;
  killed: boolean;
}

export function calculateHitChance(
  attacker: Entity, target: Entity, grid: HexGrid
): number {
  const atkCombat = attacker.get<CombatComponent>('combat')!;
  const atkPos = attacker.get<PositionComponent>('position')!;
  const tgtPos = target.get<PositionComponent>('position')!;
  const tgtStatus = target.get<StatusComponent>('status');

  let chance = atkCombat.accuracy;

  // Distance penalty
  const dist = hexDistance(atkPos, tgtPos);
  if (dist > COMBAT.DISTANCE_PENALTY_START) {
    chance -= (dist - COMBAT.DISTANCE_PENALTY_START) * COMBAT.DISTANCE_PENALTY_PER_HEX;
  }

  // Cover
  const cover = getCoverValue(tgtPos, atkPos, grid);
  if (tgtStatus?.shieldWall) {
    chance -= cover >= 1 ? COMBAT.FULL_COVER_BONUS * 1.5 : COMBAT.HALF_COVER_BONUS * 1.5;
  } else if (cover >= 1) {
    chance -= COMBAT.FULL_COVER_BONUS;
  } else if (cover >= 0.5) {
    chance -= COMBAT.HALF_COVER_BONUS;
  }

  // Flanking (attacking from a side without cover)
  if (isFlanking(atkPos, tgtPos, grid)) {
    chance += COMBAT.FLANK_BONUS;
  }

  // Elevation
  const atkTile = grid.get(atkPos.q, atkPos.r);
  const tgtTile = grid.get(tgtPos.q, tgtPos.r);
  if (atkTile && tgtTile && atkTile.elevation > tgtTile.elevation) {
    chance += COMBAT.ELEVATION_BONUS;
  }

  return Math.max(COMBAT.MIN_HIT_CHANCE, Math.min(COMBAT.MAX_HIT_CHANCE, Math.round(chance)));
}

export function resolveAttack(
  attacker: Entity, target: Entity, grid: HexGrid
): AttackResult {
  const hitChance = calculateHitChance(attacker, target, grid);
  const roll = Math.random() * 100;
  const hit = roll <= hitChance;

  if (!hit) {
    return { hit: false, damage: 0, crit: false, hitChance, killed: false };
  }

  const combat = attacker.get<CombatComponent>('combat')!;
  const critRoll = Math.random() * 100;
  const crit = critRoll <= combat.critChance;
  let damage = combat.baseDamage + Math.floor(Math.random() * 2);
  if (crit) {
    damage = Math.round(damage * COMBAT.CRIT_MULTIPLIER);
  }

  const health = target.get<HealthComponent>('health')!;
  health.current = Math.max(0, health.current - damage);

  return {
    hit: true,
    damage,
    crit,
    hitChance,
    killed: health.current <= 0,
  };
}

function getCoverValue(target: Hex, attacker: Hex, grid: HexGrid): number {
  // Check neighbors of target that are between target and attacker
  const neighbors = hexNeighbors(target.q, target.r);
  let maxCover = 0;

  for (const n of neighbors) {
    const tile = grid.get(n.q, n.r);
    if (!tile) continue;
    if (tile.coverValue <= 0) continue;

    // Is this cover hex roughly between target and attacker?
    const dToAttacker = hexDistance(n, attacker);
    const dTargetToAttacker = hexDistance(target, attacker);
    if (dToAttacker < dTargetToAttacker) {
      maxCover = Math.max(maxCover, tile.coverValue);
    }
  }

  return maxCover;
}

function isFlanking(attacker: Hex, target: Hex, grid: HexGrid): boolean {
  // Flanking = no cover between attacker direction and target
  const cover = getCoverValue(target, attacker, grid);
  if (cover > 0) return false;

  // Also check if there's cover on the opposite side (indicating a flank)
  const oppQ = target.q + (target.q - attacker.q);
  const oppR = target.r + (target.r - attacker.r);
  const oppTile = grid.get(oppQ, oppR);
  return oppTile !== undefined && oppTile.coverValue > 0;
}

export function isInAttackRange(attacker: Entity, target: Entity): boolean {
  const atkPos = attacker.get<PositionComponent>('position')!;
  const tgtPos = target.get<PositionComponent>('position')!;
  const combat = attacker.get<CombatComponent>('combat')!;
  return hexDistance(atkPos, tgtPos) <= combat.attackRange;
}
