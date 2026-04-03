import { Entity, World } from '../core/ECS';
import { HexGrid } from '../hex/HexGrid';
import { hexDistance, type Hex } from '../hex/HexCoord';
import { getReachable } from '../hex/HexPathfinder';
import { calculateHitChance, isInAttackRange } from './DamageSystem';
import type { PositionComponent, CombatComponent, HealthComponent, TeamComponent } from '../components';

interface AIAction {
  entityId: number;
  moveTarget: Hex | null;
  attackTarget: number | null;
  score: number;
}

export function planEnemyActions(world: World, grid: HexGrid): AIAction[] {
  const enemies = world.query('position', 'combat', 'team', 'health')
    .filter(e => e.get<TeamComponent>('team')!.team === 'enemy')
    .filter(e => e.get<HealthComponent>('health')!.current > 0);

  const players = world.query('position', 'combat', 'team', 'health')
    .filter(e => e.get<TeamComponent>('team')!.team === 'player')
    .filter(e => e.get<HealthComponent>('health')!.current > 0);

  if (players.length === 0) return [];

  return enemies.map(enemy => planSingleAction(enemy, players, world, grid));
}

function planSingleAction(
  enemy: Entity, players: Entity[], _world: World, grid: HexGrid
): AIAction {
  const pos = enemy.get<PositionComponent>('position')!;
  const combat = enemy.get<CombatComponent>('combat')!;
  const movement = enemy.get<{ type: string; range: number }>('movement')!;

  const reachable = getReachable(grid, pos, movement.range);

  let bestAction: AIAction = {
    entityId: enemy.id,
    moveTarget: null,
    attackTarget: null,
    score: -Infinity,
  };

  // Evaluate staying put and attacking
  for (const player of players) {
    if (isInAttackRange(enemy, player)) {
      const score = scoreAttack(enemy, player, grid, pos);
      if (score > bestAction.score) {
        bestAction = { entityId: enemy.id, moveTarget: null, attackTarget: player.id, score };
      }
    }
  }

  // Evaluate each reachable position
  for (const [key, _cost] of reachable) {
    const [mq, mr] = key.split(',').map(Number);
    if (mq === pos.q && mr === pos.r) continue;

    // Temporarily consider this position
    const tempPos: Hex = { q: mq, r: mr };

    for (const player of players) {
      const playerPos = player.get<PositionComponent>('position')!;
      const dist = hexDistance(tempPos, playerPos);

      if (dist <= combat.attackRange) {
        // Can attack from this position
        const moveScore = scoreMovePosition(tempPos, grid);
        const attackScore = scoreAttackFromPos(enemy, player, grid, tempPos);
        const score = moveScore + attackScore;

        if (score > bestAction.score) {
          bestAction = {
            entityId: enemy.id,
            moveTarget: tempPos,
            attackTarget: player.id,
            score,
          };
        }
      }
    }

    // Even if we can't attack, evaluate moving closer
    const closestPlayer = findClosestPlayer(tempPos, players);
    if (closestPlayer) {
      const dist = hexDistance(tempPos, closestPlayer.get<PositionComponent>('position')!);
      const approachScore = 10 - dist + scoreMovePosition(tempPos, grid);

      if (approachScore > bestAction.score) {
        bestAction = {
          entityId: enemy.id,
          moveTarget: tempPos,
          attackTarget: null,
          score: approachScore,
        };
      }
    }
  }

  // Add randomness to prevent predictable behavior
  bestAction.score += (Math.random() - 0.5) * 2;

  return bestAction;
}

function scoreAttack(attacker: Entity, target: Entity, grid: HexGrid, _from: Hex): number {
  const hitChance = calculateHitChance(attacker, target, grid);
  const combat = attacker.get<CombatComponent>('combat')!;
  const health = target.get<HealthComponent>('health')!;

  let score = (hitChance / 100) * combat.baseDamage;

  // Bonus for potentially killing
  if (health.current <= combat.baseDamage) {
    score += 15;
  }

  // Focus fire - prefer wounded targets
  const healthRatio = health.current / health.max;
  if (healthRatio < 0.5) score += 5;

  return score;
}

function scoreAttackFromPos(attacker: Entity, target: Entity, grid: HexGrid, from: Hex): number {
  // Simplified hit chance from position
  const combat = attacker.get<CombatComponent>('combat')!;
  const targetPos = target.get<PositionComponent>('position')!;
  const dist = hexDistance(from, targetPos);
  let chance = combat.accuracy;
  if (dist > 3) chance -= (dist - 3) * 5;

  const health = target.get<HealthComponent>('health')!;
  let score = (chance / 100) * combat.baseDamage;
  if (health.current <= combat.baseDamage) score += 15;
  return score;
}

function scoreMovePosition(pos: Hex, grid: HexGrid): number {
  let score = 0;
  const tile = grid.get(pos.q, pos.r);
  if (tile) {
    if (tile.coverValue >= 1) score += 4;
    else if (tile.coverValue >= 0.5) score += 2;
    if (tile.elevation > 0) score += 2;
  }
  return score;
}

function findClosestPlayer(pos: Hex, players: Entity[]): Entity | null {
  let closest: Entity | null = null;
  let minDist = Infinity;
  for (const p of players) {
    const pPos = p.get<PositionComponent>('position')!;
    const d = hexDistance(pos, pPos);
    if (d < minDist) {
      minDist = d;
      closest = p;
    }
  }
  return closest;
}
