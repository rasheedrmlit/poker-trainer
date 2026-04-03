import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import { events } from '../core/EventBus';
import type { Entity } from '../core/ECS';
import type { MovementComponent, CombatComponent, UnitClassComponent } from '../components';

interface ActionButton {
  bg: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
  key: string;
}

export class ActionBar {
  private container: Phaser.GameObjects.Container;
  private buttons: ActionButton[] = [];
  private onAction: ((action: string) => void) | null = null;
  private visible = false;

  constructor(private scene: Phaser.Scene, y: number) {
    this.container = scene.add.container(0, y);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    // Background bar
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.UI_BG, 0.9);
    bg.fillRoundedRect(10, 0, GAME_WIDTH - 20, 70, 8);
    bg.lineStyle(1, COLORS.UI_BORDER, 0.5);
    bg.strokeRoundedRect(10, 0, GAME_WIDTH - 20, 70, 8);
    this.container.add(bg);

    this.createButtons();

    events.on('unitSelected', (entity: unknown) => this.onUnitSelected(entity as Entity));
    events.on('unitDeselected', () => this.hide());
    events.on('phaseChange', (phase: unknown) => {
      if (phase === 'ENEMY_TURN' || phase === 'GAME_OVER') this.hide();
    });
  }

  private createButtons(): void {
    const actions = [
      { key: 'move', label: 'MOVE', icon: '↗' },
      { key: 'attack', label: 'ATTACK', icon: '⚔' },
      { key: 'ability', label: 'ABILITY', icon: '★' },
      { key: 'wait', label: 'WAIT', icon: '⏳' },
      { key: 'endTurn', label: 'END', icon: '→' },
    ];

    const btnWidth = (GAME_WIDTH - 50) / actions.length;
    const startX = 20;

    actions.forEach((action, i) => {
      const x = startX + i * btnWidth;
      const bg = this.scene.add.graphics();
      bg.fillStyle(COLORS.UI_ACCENT, 0.2);
      bg.fillRoundedRect(x, 8, btnWidth - 8, 54, 6);

      const text = this.scene.add.text(x + (btnWidth - 8) / 2, 25, action.icon, {
        fontSize: '20px',
        color: '#e0e1dd',
      }).setOrigin(0.5);

      const label = this.scene.add.text(x + (btnWidth - 8) / 2, 47, action.label, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#778da9',
      }).setOrigin(0.5);

      const zone = this.scene.add.zone(x + (btnWidth - 8) / 2, 35, btnWidth - 8, 54)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);

      zone.on('pointerdown', () => {
        this.onAction?.(action.key);
      });

      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.UI_ACCENT, 0.4);
        bg.fillRoundedRect(x, 8, btnWidth - 8, 54, 6);
      });

      zone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.UI_ACCENT, 0.2);
        bg.fillRoundedRect(x, 8, btnWidth - 8, 54, 6);
      });

      this.container.add([bg, text, label, zone]);
      this.buttons.push({ bg, text, label, zone, key: action.key });
    });
  }

  private onUnitSelected(entity: Entity): void {
    const mov = entity.get<MovementComponent>('movement');
    const com = entity.get<CombatComponent>('combat');
    const uc = entity.get<UnitClassComponent>('unitClass');

    // Update button states
    for (const btn of this.buttons) {
      let enabled = true;
      if (btn.key === 'move' && mov?.moved) enabled = false;
      if (btn.key === 'attack' && com?.attacked) enabled = false;
      if (btn.key === 'ability' && (!uc?.ability || uc.abilityUsed)) enabled = false;

      btn.text.setAlpha(enabled ? 1 : 0.3);
      btn.label.setAlpha(enabled ? 1 : 0.3);

      if (btn.key === 'ability' && uc?.ability) {
        btn.label.setText(uc.ability.toUpperCase().slice(0, 6));
      }
    }

    this.show();
  }

  setActionHandler(handler: (action: string) => void): void {
    this.onAction = handler;
  }

  show(): void {
    if (!this.visible) {
      this.visible = true;
      this.container.setVisible(true);
      this.container.setAlpha(0);
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 150,
      });
    }
  }

  hide(): void {
    if (this.visible) {
      this.visible = false;
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 100,
        onComplete: () => this.container.setVisible(false),
      });
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
