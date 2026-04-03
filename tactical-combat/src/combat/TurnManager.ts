import { StateMachine } from '../core/StateMachine';
import { events } from '../core/EventBus';
import { Entity, World } from '../core/ECS';
import { HexGrid } from '../hex/HexGrid';
import { hexToPixel, hexDistance, hexesInRange } from '../hex/HexCoord';
import { HexRenderer } from '../hex/HexRenderer';
import { getReachable, findPath } from '../hex/HexPathfinder';
import { resolveAttack, calculateHitChance, isInAttackRange } from './DamageSystem';
import { planEnemyActions } from './AIController';
import { updateUnitPosition, updateHealthBar, destroyUnitVisual } from '../entities/UnitFactory';
import type {
  PositionComponent, MovementComponent, CombatComponent, HealthComponent,
  TeamComponent, SpriteComponent, StatusComponent, UnitClassComponent,
} from '../components';

export type TurnPhase =
  | 'PLAYER_SELECT'
  | 'PLAYER_MOVE'
  | 'PLAYER_ATTACK'
  | 'PLAYER_ABILITY'
  | 'ANIMATING'
  | 'ENEMY_TURN'
  | 'CHECK_WIN'
  | 'GAME_OVER';

export class TurnManager {
  private fsm = new StateMachine();
  selectedUnit: Entity | null = null;
  private reachableHexes = new Map<string, number>();
  turnNumber = 1;
  currentPhase: TurnPhase = 'PLAYER_SELECT';
  private actionMode: 'move' | 'attack' | 'ability' | null = null;

  constructor(
    private world: World,
    private grid: HexGrid,
    private renderer: HexRenderer,
    private scene: Phaser.Scene
  ) {
    this.setupStates();
    this.fsm.transition('PLAYER_SELECT');
  }

  private setupStates(): void {
    this.fsm.add('PLAYER_SELECT', {
      enter: () => {
        this.currentPhase = 'PLAYER_SELECT';
        this.selectedUnit = null;
        this.actionMode = null;
        this.renderer.clearOverlay();
        this.renderer.clearAttackIndicators();
        events.emit('phaseChange', 'PLAYER_SELECT');
        events.emit('unitDeselected');

        // Check if all player units have acted
        const playerUnits = this.getAliveUnits('player');
        const allDone = playerUnits.every(u => {
          const mov = u.get<MovementComponent>('movement')!;
          const com = u.get<CombatComponent>('combat')!;
          return mov.moved && com.attacked;
        });
        if (allDone) {
          this.fsm.transition('ENEMY_TURN');
        }
      },
    });

    this.fsm.add('PLAYER_MOVE', {
      enter: () => {
        this.currentPhase = 'PLAYER_MOVE';
        this.actionMode = 'move';
        events.emit('phaseChange', 'PLAYER_MOVE');
        if (this.selectedUnit) {
          const pos = this.selectedUnit.get<PositionComponent>('position')!;
          const mov = this.selectedUnit.get<MovementComponent>('movement')!;
          this.reachableHexes = getReachable(this.grid, pos, mov.range);
          this.renderer.clearOverlay();
          const hexes = Array.from(this.reachableHexes.keys()).map(k => {
            const [q, r] = k.split(',').map(Number);
            return { q, r };
          });
          this.renderer.highlightHexes(hexes, 0x00b4d8, 0.25);
        }
      },
      exit: () => {
        this.reachableHexes.clear();
      },
    });

    this.fsm.add('PLAYER_ATTACK', {
      enter: () => {
        this.currentPhase = 'PLAYER_ATTACK';
        this.actionMode = 'attack';
        events.emit('phaseChange', 'PLAYER_ATTACK');
        if (this.selectedUnit) {
          this.showAttackTargets();
        }
      },
    });

    this.fsm.add('PLAYER_ABILITY', {
      enter: () => {
        this.currentPhase = 'PLAYER_ABILITY';
        this.actionMode = 'ability';
        events.emit('phaseChange', 'PLAYER_ABILITY');
        if (this.selectedUnit) {
          this.showAbilityTargets();
        }
      },
    });

    this.fsm.add('ANIMATING', {
      enter: () => {
        this.currentPhase = 'ANIMATING';
        events.emit('phaseChange', 'ANIMATING');
      },
    });

    this.fsm.add('ENEMY_TURN', {
      enter: () => {
        this.currentPhase = 'ENEMY_TURN';
        this.selectedUnit = null;
        this.renderer.clearOverlay();
        this.renderer.clearAttackIndicators();
        events.emit('phaseChange', 'ENEMY_TURN');
        events.emit('unitDeselected');
        this.executeEnemyTurn();
      },
    });

    this.fsm.add('CHECK_WIN', {
      enter: () => {
        this.currentPhase = 'CHECK_WIN';
        const players = this.getAliveUnits('player');
        const enemies = this.getAliveUnits('enemy');

        if (enemies.length === 0) {
          events.emit('gameOver', 'victory');
          this.fsm.transition('GAME_OVER');
        } else if (players.length === 0) {
          events.emit('gameOver', 'defeat');
          this.fsm.transition('GAME_OVER');
        } else {
          this.fsm.transition('PLAYER_SELECT');
        }
      },
    });

    this.fsm.add('GAME_OVER', {
      enter: () => {
        this.currentPhase = 'GAME_OVER';
        events.emit('phaseChange', 'GAME_OVER');
      },
    });
  }

  handleHexClick(q: number, r: number): void {
    if (this.currentPhase === 'ANIMATING' || this.currentPhase === 'ENEMY_TURN' || this.currentPhase === 'GAME_OVER') return;

    const occupant = this.grid.getOccupant(q, r);

    if (this.currentPhase === 'PLAYER_SELECT') {
      if (occupant !== null) {
        const entity = this.world.get(occupant);
        if (entity && entity.get<TeamComponent>('team')?.team === 'player') {
          const health = entity.get<HealthComponent>('health')!;
          if (health.current > 0) {
            this.selectUnit(entity);
          }
        }
      }
      return;
    }

    if (this.currentPhase === 'PLAYER_MOVE' && this.selectedUnit) {
      this.handleMove(q, r);
      return;
    }

    if (this.currentPhase === 'PLAYER_ATTACK' && this.selectedUnit) {
      this.handleAttack(q, r);
      return;
    }

    if (this.currentPhase === 'PLAYER_ABILITY' && this.selectedUnit) {
      this.handleAbility(q, r);
      return;
    }
  }

  selectUnit(entity: Entity): void {
    this.selectedUnit = entity;
    const pos = entity.get<PositionComponent>('position')!;
    this.renderer.clearOverlay();
    this.renderer.clearAttackIndicators();
    this.renderer.highlightSingle(pos.q, pos.r, 0xf7d354, 0.4);

    events.emit('unitSelected', entity);

    // Auto-show move range if hasn't moved yet
    const mov = entity.get<MovementComponent>('movement')!;
    if (!mov.moved) {
      this.fsm.transition('PLAYER_MOVE');
    } else {
      events.emit('phaseChange', 'PLAYER_SELECT');
    }
  }

  setActionMode(mode: 'move' | 'attack' | 'ability' | 'wait'): void {
    if (!this.selectedUnit || this.currentPhase === 'ANIMATING' || this.currentPhase === 'ENEMY_TURN') return;

    if (mode === 'move') {
      const mov = this.selectedUnit.get<MovementComponent>('movement')!;
      if (!mov.moved) this.fsm.transition('PLAYER_MOVE');
    } else if (mode === 'attack') {
      const com = this.selectedUnit.get<CombatComponent>('combat')!;
      if (!com.attacked) this.fsm.transition('PLAYER_ATTACK');
    } else if (mode === 'ability') {
      const uc = this.selectedUnit.get<UnitClassComponent>('unitClass')!;
      if (!uc.abilityUsed && uc.ability) this.fsm.transition('PLAYER_ABILITY');
    } else if (mode === 'wait') {
      const mov = this.selectedUnit.get<MovementComponent>('movement')!;
      const com = this.selectedUnit.get<CombatComponent>('combat')!;
      mov.moved = true;
      com.attacked = true;
      this.fsm.transition('PLAYER_SELECT');
    }
  }

  private handleMove(q: number, r: number): void {
    const key = `${q},${r}`;
    if (!this.reachableHexes.has(key)) return;
    if (!this.grid.isWalkable(q, r)) return;

    const pos = this.selectedUnit!.get<PositionComponent>('position')!;
    const mov = this.selectedUnit!.get<MovementComponent>('movement')!;
    const path = findPath(this.grid, pos, { q, r });
    if (!path) return;

    this.fsm.transition('ANIMATING');

    // Update grid occupancy
    this.grid.setOccupant(pos.q, pos.r, null);
    this.grid.setOccupant(q, r, this.selectedUnit!.id);

    // Animate movement
    this.animateMovement(this.selectedUnit!, path, () => {
      updateUnitPosition(this.selectedUnit!, q, r);
      mov.moved = true;

      // Check for overwatch triggers
      this.checkOverwatchTriggers(this.selectedUnit!, path);

      // After move, go back to select or show attack options
      const com = this.selectedUnit!.get<CombatComponent>('combat')!;
      if (!com.attacked) {
        this.fsm.transition('PLAYER_ATTACK');
      } else {
        this.fsm.transition('PLAYER_SELECT');
      }
    });
  }

  private handleAttack(q: number, r: number): void {
    const occupant = this.grid.getOccupant(q, r);
    if (occupant === null) {
      this.fsm.transition('PLAYER_SELECT');
      return;
    }

    const target = this.world.get(occupant);
    if (!target || target.get<TeamComponent>('team')?.team !== 'enemy') return;
    if (!isInAttackRange(this.selectedUnit!, target)) return;

    this.fsm.transition('ANIMATING');
    const result = resolveAttack(this.selectedUnit!, target, this.grid);
    this.selectedUnit!.get<CombatComponent>('combat')!.attacked = true;

    this.animateAttack(this.selectedUnit!, target, result, () => {
      if (result.killed) {
        this.removeUnit(target);
      }
      updateHealthBar(target);
      this.fsm.transition('CHECK_WIN');
    });
  }

  private handleAbility(q: number, r: number): void {
    if (!this.selectedUnit) return;
    const uc = this.selectedUnit.get<UnitClassComponent>('unitClass')!;

    if (uc.ability === 'Overwatch') {
      // Overwatch doesn't need a target hex
      const status = this.selectedUnit.get<StatusComponent>('status')!;
      status.overwatch = true;
      uc.abilityUsed = true;
      this.selectedUnit.get<CombatComponent>('combat')!.attacked = true;
      events.emit('abilityUsed', { unit: this.selectedUnit, ability: 'Overwatch' });
      this.fsm.transition('PLAYER_SELECT');
      return;
    }

    if (uc.ability === 'Shield Wall') {
      const status = this.selectedUnit.get<StatusComponent>('status')!;
      status.shieldWall = true;
      uc.abilityUsed = true;
      events.emit('abilityUsed', { unit: this.selectedUnit, ability: 'Shield Wall' });
      this.fsm.transition('PLAYER_SELECT');
      return;
    }

    const occupant = this.grid.getOccupant(q, r);

    if (uc.ability === 'Heal' && occupant !== null) {
      const target = this.world.get(occupant);
      if (!target || target.get<TeamComponent>('team')?.team !== 'player') return;
      const tPos = target.get<PositionComponent>('position')!;
      const uPos = this.selectedUnit.get<PositionComponent>('position')!;
      if (hexDistance(uPos, tPos) > 2) return;

      const health = target.get<HealthComponent>('health')!;
      health.current = Math.min(health.max, health.current + 4);
      updateHealthBar(target);
      uc.abilityUsed = true;
      this.selectedUnit.get<CombatComponent>('combat')!.attacked = true;
      events.emit('heal', { target, amount: 4 });
      this.fsm.transition('PLAYER_SELECT');
      return;
    }

    if (uc.ability === 'Grenade') {
      const pos = this.selectedUnit.get<PositionComponent>('position')!;
      if (hexDistance(pos, { q, r }) > 4) return;

      this.fsm.transition('ANIMATING');
      uc.abilityUsed = true;
      this.selectedUnit.get<CombatComponent>('combat')!.attacked = true;

      // AoE damage in radius 1
      const targets = this.getUnitsInRadius({ q, r }, 1);
      for (const t of targets) {
        const health = t.get<HealthComponent>('health')!;
        const damage = 3 + Math.floor(Math.random() * 2);
        health.current = Math.max(0, health.current - damage);
        events.emit('damage', { target: t, damage, crit: false });
        updateHealthBar(t);
      }

      // Destroy cover in radius
            const affectedHexes = hexesInRange({ q, r }, 1);
      for (const h of affectedHexes) {
        const tile = this.grid.get(h.q, h.r);
        if (tile && (tile.terrain === 'forest' || tile.terrain === 'rock')) {
          tile.terrain = 'open';
          tile.coverValue = 0;
        }
      }

      events.emit('explosion', { q, r });

      this.scene.time.delayedCall(500, () => {
        for (const t of targets) {
          if (t.get<HealthComponent>('health')!.current <= 0) {
            this.removeUnit(t);
          }
        }
        events.emit('redrawGrid');
        this.fsm.transition('CHECK_WIN');
      });
    }
  }

  private showAttackTargets(): void {
    this.renderer.clearOverlay();
    this.renderer.clearAttackIndicators();

    const enemies = this.getAliveUnits('enemy');
    for (const enemy of enemies) {
      if (isInAttackRange(this.selectedUnit!, enemy)) {
        const pos = enemy.get<PositionComponent>('position')!;
        const hitChance = calculateHitChance(this.selectedUnit!, enemy, this.grid);
        this.renderer.drawAttackIndicator(pos.q, pos.r, hitChance);
      }
    }
  }

  private showAbilityTargets(): void {
    this.renderer.clearOverlay();
    this.renderer.clearAttackIndicators();

    if (!this.selectedUnit) return;
    const uc = this.selectedUnit.get<UnitClassComponent>('unitClass')!;
    const pos = this.selectedUnit.get<PositionComponent>('position')!;

    if (uc.ability === 'Heal') {
      const allies = this.getAliveUnits('player');
      for (const ally of allies) {
        const aPos = ally.get<PositionComponent>('position')!;
        if (hexDistance(pos, aPos) <= 2 && ally.id !== this.selectedUnit.id) {
          this.renderer.highlightSingle(aPos.q, aPos.r, 0x2ec4b6, 0.4);
        }
      }
    } else if (uc.ability === 'Grenade') {
            const range = hexesInRange(pos, 4);
      const validHexes = range.filter((h: { q: number; r: number }) => this.grid.has(h.q, h.r));
      this.renderer.highlightHexes(validHexes, 0xffd166, 0.2);
    } else if (uc.ability === 'Overwatch' || uc.ability === 'Shield Wall') {
      // These are self-targeting, trigger immediately
      this.handleAbility(pos.q, pos.r);
    }
  }

  private animateMovement(entity: Entity, path: { q: number; r: number }[], onComplete: () => void): void {
    const sprite = entity.get<SpriteComponent>('sprite')!;
    if (!sprite.container || path.length < 2) {
      onComplete();
      return;
    }

    const tweens: Phaser.Types.Tweens.TweenBuilderConfig[] = [];
    for (let i = 1; i < path.length; i++) {
      const { x, y } = hexToPixel(path[i].q, path[i].r);
      tweens.push({
        targets: sprite.container,
        x, y,
        duration: 150,
        ease: 'Sine.easeInOut',
      });
    }

    const timeline = this.scene.tweens.chain({
      tweens,
      onComplete: () => onComplete(),
    });
  }

  private animateAttack(
    attacker: Entity, target: Entity,
    result: { hit: boolean; damage: number; crit: boolean },
    onComplete: () => void
  ): void {
    const atkSprite = attacker.get<SpriteComponent>('sprite')!;
    const tgtSprite = target.get<SpriteComponent>('sprite')!;
    const tgtPos = target.get<PositionComponent>('position')!;
    const { x: tx, y: ty } = hexToPixel(tgtPos.q, tgtPos.r);

    if (!atkSprite.container || !tgtSprite.container) {
      onComplete();
      return;
    }

    const origX = atkSprite.container.x;
    const origY = atkSprite.container.y;

    // Lunge toward target
    const midX = origX + (tx - origX) * 0.3;
    const midY = origY + (ty - origY) * 0.3;

    this.scene.tweens.chain({
      tweens: [
        {
          targets: atkSprite.container,
          x: midX, y: midY,
          duration: 100,
          ease: 'Quad.easeOut',
        },
        {
          targets: atkSprite.container,
          x: origX, y: origY,
          duration: 150,
          ease: 'Quad.easeIn',
        },
      ],
    });

    this.scene.time.delayedCall(100, () => {
      if (result.hit) {
        // Shake target
        this.scene.tweens.add({
          targets: tgtSprite.container,
          x: tgtSprite.container!.x + 5,
          duration: 40,
          yoyo: true,
          repeat: 3,
        });

        // Flash target red
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xff0000, 0.3);
        flash.fillCircle(tx, ty, 20);
        flash.setDepth(15);
        this.scene.time.delayedCall(200, () => flash.destroy());

        events.emit('damage', { target, damage: result.damage, crit: result.crit });
      } else {
        events.emit('miss', { target });
      }
    });

    this.scene.time.delayedCall(400, onComplete);
  }

  private executeEnemyTurn(): void {
    const actions = planEnemyActions(this.world, this.grid);
    let delay = 500;

    if (actions.length === 0) {
      this.endEnemyTurn();
      return;
    }

    for (const action of actions) {
      this.scene.time.delayedCall(delay, () => {
        const entity = this.world.get(action.entityId);
        if (!entity || entity.get<HealthComponent>('health')!.current <= 0) return;

        if (action.moveTarget) {
          const pos = entity.get<PositionComponent>('position')!;
          const path = findPath(this.grid, pos, action.moveTarget);
          if (path) {
            this.grid.setOccupant(pos.q, pos.r, null);
            this.grid.setOccupant(action.moveTarget.q, action.moveTarget.r, entity.id);
            this.animateMovement(entity, path, () => {
              updateUnitPosition(entity, action.moveTarget!.q, action.moveTarget!.r);
            });
          }
        }

        if (action.attackTarget !== null) {
          const target = this.world.get(action.attackTarget);
          if (target && target.get<HealthComponent>('health')!.current > 0) {
            this.scene.time.delayedCall(action.moveTarget ? 300 : 0, () => {
              const result = resolveAttack(entity, target, this.grid);
              this.animateAttack(entity, target, result, () => {
                updateHealthBar(target);
                if (result.killed) {
                  this.removeUnit(target);
                }
              });
            });
          }
        }
      });
      delay += 800;
    }

    this.scene.time.delayedCall(delay + 200, () => {
      this.endEnemyTurn();
    });
  }

  private endEnemyTurn(): void {
    // Reset all unit actions for new turn
    this.turnNumber++;
    for (const unit of this.world.query('movement', 'combat', 'health')) {
      const health = unit.get<HealthComponent>('health')!;
      if (health.current <= 0) continue;

      const mov = unit.get<MovementComponent>('movement')!;
      const com = unit.get<CombatComponent>('combat')!;
      const status = unit.get<StatusComponent>('status');
      const uc = unit.get<UnitClassComponent>('unitClass');
      mov.moved = false;
      com.attacked = false;
      if (status) {
        status.shieldWall = false;
        // Overwatch persists until triggered or new turn
        status.overwatch = false;
      }
      if (uc) {
        uc.abilityUsed = false;
      }
    }

    events.emit('newTurn', this.turnNumber);
    this.fsm.transition('CHECK_WIN');
  }

  private checkOverwatchTriggers(movingUnit: Entity, _path: { q: number; r: number }[]): void {
    const team = movingUnit.get<TeamComponent>('team')!.team;
    const opposingTeam = team === 'player' ? 'enemy' : 'player';
    const watchers = this.getAliveUnits(opposingTeam).filter(u => {
      const status = u.get<StatusComponent>('status');
      return status?.overwatch;
    });

    for (const watcher of watchers) {
      if (isInAttackRange(watcher, movingUnit)) {
        const status = watcher.get<StatusComponent>('status')!;
        status.overwatch = false;
        const result = resolveAttack(watcher, movingUnit, this.grid);
        events.emit('overwatch', { attacker: watcher, target: movingUnit, result });
        updateHealthBar(movingUnit);
        if (result.killed) {
          this.removeUnit(movingUnit);
        }
      }
    }
  }

  private removeUnit(entity: Entity): void {
    const pos = entity.get<PositionComponent>('position')!;
    this.grid.setOccupant(pos.q, pos.r, null);
    destroyUnitVisual(entity);
    this.world.destroy(entity.id);
  }

  private getAliveUnits(team: 'player' | 'enemy'): Entity[] {
    return this.world.query('position', 'health', 'team')
      .filter(e => e.get<TeamComponent>('team')!.team === team)
      .filter(e => e.get<HealthComponent>('health')!.current > 0);
  }

  private getUnitsInRadius(center: { q: number; r: number }, radius: number): Entity[] {
    return this.world.query('position', 'health')
      .filter(e => {
        const pos = e.get<PositionComponent>('position')!;
        return hexDistance(center, pos) <= radius && e.get<HealthComponent>('health')!.current > 0;
      });
  }

  endTurn(): void {
    // End player turn early
    const playerUnits = this.getAliveUnits('player');
    for (const u of playerUnits) {
      u.get<MovementComponent>('movement')!.moved = true;
      u.get<CombatComponent>('combat')!.attacked = true;
    }
    this.fsm.transition('ENEMY_TURN');
  }
}
