import Phaser from 'phaser';
import { World } from '../core/ECS';
import { events } from '../core/EventBus';
import { HexGrid } from '../hex/HexGrid';
import { HexRenderer } from '../hex/HexRenderer';
import { pixelToHex } from '../hex/HexCoord';
import { TurnManager } from '../combat/TurnManager';
import { InputManager } from '../input/InputManager';
import { CameraController } from '../input/CameraController';
import { ParticleManager } from '../effects/ParticleManager';
import { ActionBar } from '../ui/ActionBar';
import { UnitInfoPanel } from '../ui/UnitInfoPanel';
import { TurnIndicator } from '../ui/TurnIndicator';
import { createPlayerUnit, createEnemyUnit } from '../entities/UnitFactory';
import { GRID_COLS, GRID_ROWS, COLORS, GAME_HEIGHT } from '../config';
import type { PositionComponent } from '../components';

export class CombatScene extends Phaser.Scene {
  private world!: World;
  private grid!: HexGrid;
  private hexRenderer!: HexRenderer;
  private turnManager!: TurnManager;
  private inputManager!: InputManager;
  private cameraController!: CameraController;
  private particles!: ParticleManager;
  private actionBar!: ActionBar;
  private unitInfo!: UnitInfoPanel;
  private turnIndicator!: TurnIndicator;

  constructor() {
    super({ key: 'CombatScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.BG);
    this.cameras.main.fadeIn(500);

    // Core systems
    this.world = new World();
    this.grid = new HexGrid(GRID_COLS, GRID_ROWS);
    this.grid.generateTerrain(Date.now());

    // Rendering
    this.hexRenderer = new HexRenderer(this);
    this.hexRenderer.drawGrid(this.grid);

    // Spawn units
    this.spawnUnits();

    // Turn management
    this.turnManager = new TurnManager(this.world, this.grid, this.hexRenderer, this);

    // Input
    this.inputManager = new InputManager(this);
    this.cameraController = new CameraController(this);

    this.inputManager.setTapHandler((worldX, worldY) => {
      const hex = pixelToHex(worldX, worldY);
      if (this.grid.has(hex.q, hex.r)) {
        this.turnManager.handleHexClick(hex.q, hex.r);
      }
    });

    this.inputManager.setDragHandler((dx, dy) => {
      this.cameraController.handleDrag(dx, dy);
    });

    // Effects
    this.particles = new ParticleManager(this);

    // UI (fixed position relative to screen)
    this.turnIndicator = new TurnIndicator(this);
    this.unitInfo = new UnitInfoPanel(this, 50);
    this.actionBar = new ActionBar(this, GAME_HEIGHT - 85);

    this.actionBar.setActionHandler((action) => {
      if (action === 'endTurn') {
        this.turnManager.endTurn();
      } else {
        this.turnManager.setActionMode(action as 'move' | 'attack' | 'ability' | 'wait');
      }
    });

    // Event listeners for effects
    this.setupEventListeners();
  }

  private spawnUnits(): void {
    // Clear spawn positions of terrain
    const playerSpawns = [
      { q: 1, r: 7 }, { q: 2, r: 8 }, { q: 3, r: 7 }, { q: 4, r: 8 },
    ];
    const enemySpawns = [
      { q: 7, r: 1 }, { q: 8, r: 2 }, { q: 9, r: 1 }, { q: 10, r: 2 },
    ];

    // Clear spawn positions
    for (const s of [...playerSpawns, ...enemySpawns]) {
      this.grid.set(s.q, s.r, { terrain: 'open', coverValue: 0, elevation: 0 });
    }

    // Redraw grid after clearing spawns
    this.hexRenderer.drawGrid(this.grid);

    // Player units
    createPlayerUnit(this.world, this.grid, this, 'RANGER', playerSpawns[0].q, playerSpawns[0].r);
    createPlayerUnit(this.world, this.grid, this, 'VANGUARD', playerSpawns[1].q, playerSpawns[1].r);
    createPlayerUnit(this.world, this.grid, this, 'SPECIALIST', playerSpawns[2].q, playerSpawns[2].r);
    createPlayerUnit(this.world, this.grid, this, 'GRENADIER', playerSpawns[3].q, playerSpawns[3].r);

    // Enemy units
    createEnemyUnit(this.world, this.grid, this, 'DRONE', enemySpawns[0].q, enemySpawns[0].r);
    createEnemyUnit(this.world, this.grid, this, 'SENTINEL', enemySpawns[1].q, enemySpawns[1].r);
    createEnemyUnit(this.world, this.grid, this, 'ENFORCER', enemySpawns[2].q, enemySpawns[2].r);
    createEnemyUnit(this.world, this.grid, this, 'DISRUPTOR', enemySpawns[3].q, enemySpawns[3].r);
  }

  private setupEventListeners(): void {
    events.on('damage', (data: unknown) => {
      const { target, damage, crit } = data as { target: { get: Function }; damage: number; crit: boolean };
      const pos = target.get('position') as PositionComponent;
      if (pos) {
        this.particles.damagePopup(pos.q, pos.r, damage, crit);
        this.cameras.main.shake(100, 0.003);
      }
    });

    events.on('miss', (data: unknown) => {
      const { target } = data as { target: { get: Function } };
      const pos = target.get('position') as PositionComponent;
      if (pos) {
        this.particles.missPopup(pos.q, pos.r);
      }
    });

    events.on('heal', (data: unknown) => {
      const { target } = data as { target: { get: Function }; amount: number };
      const pos = target.get('position') as PositionComponent;
      if (pos) {
        this.particles.healParticles(pos.q, pos.r);
      }
    });

    events.on('explosion', (data: unknown) => {
      const { q, r } = data as { q: number; r: number };
      this.particles.explosionParticles(q, r);
    });

    events.on('redrawGrid', () => {
      this.hexRenderer.drawGrid(this.grid);
    });

    events.on('gameOver', (result: unknown) => {
      this.turnIndicator.showGameOver(result as 'victory' | 'defeat');
    });

    events.on('abilityUsed', (data: unknown) => {
      const { ability } = data as { unit: unknown; ability: string };
      const banner = this.add.text(this.cameras.main.width / 2, 250, ability.toUpperCase(), {
        fontSize: '22px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#000',
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(150).setScrollFactor(0);

      this.tweens.add({
        targets: banner,
        alpha: 0,
        y: 230,
        duration: 1000,
        onComplete: () => banner.destroy(),
      });
    });
  }
}
