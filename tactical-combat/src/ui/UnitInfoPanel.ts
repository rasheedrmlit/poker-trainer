import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import { events } from '../core/EventBus';
import type { Entity } from '../core/ECS';
import type {
  HealthComponent, UnitClassComponent, MovementComponent, CombatComponent, TeamComponent
} from '../components';

export class UnitInfoPanel {
  private container: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private classText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Graphics;
  private hpBarFill: Phaser.GameObjects.Graphics;
  private statsText: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, y: number) {
    this.container = scene.add.container(0, y);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.UI_BG, 0.92);
    bg.fillRoundedRect(10, 0, GAME_WIDTH - 20, 85, 8);
    bg.lineStyle(1, COLORS.UI_BORDER, 0.5);
    bg.strokeRoundedRect(10, 0, GAME_WIDTH - 20, 85, 8);
    this.container.add(bg);

    this.nameText = scene.add.text(25, 8, '', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#e0e1dd',
    });
    this.container.add(this.nameText);

    this.classText = scene.add.text(25, 28, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#778da9',
    });
    this.container.add(this.classText);

    this.hpBarBg = scene.add.graphics();
    this.container.add(this.hpBarBg);

    this.hpBarFill = scene.add.graphics();
    this.container.add(this.hpBarFill);

    this.hpText = scene.add.text(GAME_WIDTH - 35, 12, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e0e1dd',
    }).setOrigin(1, 0);
    this.container.add(this.hpText);

    this.statsText = scene.add.text(25, 60, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#778da9',
    });
    this.container.add(this.statsText);

    events.on('unitSelected', (entity: unknown) => this.show(entity as Entity));
    events.on('unitDeselected', () => this.hide());
    events.on('phaseChange', (phase: unknown) => {
      if (phase === 'ENEMY_TURN' || phase === 'GAME_OVER') this.hide();
    });
  }

  show(entity: Entity): void {
    const health = entity.get<HealthComponent>('health')!;
    const uc = entity.get<UnitClassComponent>('unitClass')!;
    const mov = entity.get<MovementComponent>('movement')!;
    const com = entity.get<CombatComponent>('combat')!;
    const team = entity.get<TeamComponent>('team')!;

    const teamColor = team.team === 'player' ? '#06d6a0' : '#ef476f';
    this.nameText.setText(uc.displayName);
    this.nameText.setColor(teamColor);

    const abilityStr = uc.ability ? ` | Ability: ${uc.ability}` : '';
    this.classText.setText(`${team.team.toUpperCase()}${abilityStr}`);

    this.hpText.setText(`${health.current}/${health.max} HP`);

    // HP bar
    const barX = 25;
    const barY = 45;
    const barWidth = GAME_WIDTH - 60;
    const ratio = health.current / health.max;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x333333, 1);
    this.hpBarBg.fillRoundedRect(barX, barY, barWidth, 8, 3);

    this.hpBarFill.clear();
    const barColor = ratio > 0.5 ? COLORS.HEALTH_GREEN : ratio > 0.25 ? 0xffd166 : COLORS.HEALTH_RED;
    this.hpBarFill.fillStyle(barColor, 1);
    this.hpBarFill.fillRoundedRect(barX, barY, barWidth * ratio, 8, 3);

    this.statsText.setText(
      `MOV: ${mov.range}  ATK: ${com.baseDamage}  RNG: ${com.attackRange}  ACC: ${com.accuracy}%`
    );

    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 150 });
  }

  hide(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 100,
      onComplete: () => this.container.setVisible(false),
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
