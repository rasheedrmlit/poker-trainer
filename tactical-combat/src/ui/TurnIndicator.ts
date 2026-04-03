import Phaser from 'phaser';
import { GAME_WIDTH, COLORS } from '../config';
import { events } from '../core/EventBus';

export class TurnIndicator {
  private container: Phaser.GameObjects.Container;
  private phaseText: Phaser.GameObjects.Text;
  private turnText: Phaser.GameObjects.Text;
  private turnNumber = 1;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 8);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);

    // Top bar background
    const bg = scene.add.graphics();
    bg.fillStyle(COLORS.UI_BG, 0.85);
    bg.fillRoundedRect(10, 0, GAME_WIDTH - 20, 36, 6);
    this.container.add(bg);

    this.turnText = scene.add.text(25, 8, 'TURN 1', {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#778da9',
    });
    this.container.add(this.turnText);

    this.phaseText = scene.add.text(GAME_WIDTH - 25, 8, 'SELECT UNIT', {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#00b4d8',
    }).setOrigin(1, 0);
    this.container.add(this.phaseText);

    events.on('phaseChange', (phase: unknown) => this.updatePhase(phase as string));
    events.on('newTurn', (turn: unknown) => {
      this.turnNumber = turn as number;
      this.turnText.setText(`TURN ${this.turnNumber}`);
    });
  }

  private updatePhase(phase: string): void {
    const labels: Record<string, { text: string; color: string }> = {
      'PLAYER_SELECT': { text: 'SELECT UNIT', color: '#00b4d8' },
      'PLAYER_MOVE': { text: 'CHOOSE MOVE', color: '#06d6a0' },
      'PLAYER_ATTACK': { text: 'CHOOSE TARGET', color: '#ef476f' },
      'PLAYER_ABILITY': { text: 'USE ABILITY', color: '#ffd166' },
      'ANIMATING': { text: 'EXECUTING...', color: '#778da9' },
      'ENEMY_TURN': { text: 'ENEMY TURN', color: '#ef476f' },
      'GAME_OVER': { text: 'MISSION COMPLETE', color: '#ffd166' },
    };

    const info = labels[phase] ?? { text: phase, color: '#e0e1dd' };
    this.phaseText.setText(info.text);
    this.phaseText.setColor(info.color);

    // Flash on enemy turn
    if (phase === 'ENEMY_TURN') {
      this.showBanner('ENEMY TURN', '#ef476f');
    }
  }

  private showBanner(text: string, color: string): void {
    const banner = this.scene.add.text(GAME_WIDTH / 2, 200, text, {
      fontSize: '28px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    this.scene.tweens.add({
      targets: banner,
      alpha: 0,
      y: 180,
      duration: 1200,
      ease: 'Quad.easeIn',
      onComplete: () => banner.destroy(),
    });
  }

  showGameOver(result: 'victory' | 'defeat'): void {
    const isVictory = result === 'victory';
    const text = isVictory ? 'MISSION COMPLETE' : 'MISSION FAILED';
    const color = isVictory ? '#06d6a0' : '#ef476f';
    const subtext = isVictory ? 'All enemies eliminated' : 'All units lost';

    // Overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, 1400);
    overlay.setDepth(190);
    overlay.setScrollFactor(0);

    const mainText = this.scene.add.text(GAME_WIDTH / 2, 500, text, {
      fontSize: '36px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    const sub = this.scene.add.text(GAME_WIDTH / 2, 550, subtext, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#778da9',
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    const restartText = this.scene.add.text(GAME_WIDTH / 2, 630, '[ TAP TO RESTART ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#00b4d8',
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    this.scene.tweens.add({
      targets: restartText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const zone = this.scene.add.zone(GAME_WIDTH / 2, 630, 300, 60)
      .setInteractive()
      .setDepth(200)
      .setScrollFactor(0);

    zone.on('pointerdown', () => {
      this.scene.scene.restart();
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
