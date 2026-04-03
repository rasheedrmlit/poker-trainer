import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    // Background
    this.cameras.main.setBackgroundColor(COLORS.BG);

    // Animated background hexagons
    this.createBackgroundHexes();

    // Title
    const title = this.add.text(cx, GAME_HEIGHT * 0.25, 'TACTICAL\nCOMBAT', {
      fontSize: '52px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#00b4d8',
      stroke: '#0d1b2a',
      strokeThickness: 6,
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: title.y - 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    this.add.text(cx, GAME_HEIGHT * 0.38, 'Turn-Based Strategy', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#778da9',
    }).setOrigin(0.5);

    // Play button
    const btnY = GAME_HEIGHT * 0.55;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x00b4d8, 0.15);
    btnBg.fillRoundedRect(cx - 120, btnY - 30, 240, 60, 12);
    btnBg.lineStyle(2, 0x00b4d8, 0.8);
    btnBg.strokeRoundedRect(cx - 120, btnY - 30, 240, 60, 12);

    const playText = this.add.text(cx, btnY, '[ START MISSION ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#00b4d8',
    }).setOrigin(0.5);

    // Make button interactive
    const hitZone = this.add.zone(cx, btnY, 240, 60).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x00b4d8, 0.3);
      btnBg.fillRoundedRect(cx - 120, btnY - 30, 240, 60, 12);
      btnBg.lineStyle(2, 0x00b4d8, 1);
      btnBg.strokeRoundedRect(cx - 120, btnY - 30, 240, 60, 12);
      playText.setColor('#ffffff');
    });

    hitZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x00b4d8, 0.15);
      btnBg.fillRoundedRect(cx - 120, btnY - 30, 240, 60, 12);
      btnBg.lineStyle(2, 0x00b4d8, 0.8);
      btnBg.strokeRoundedRect(cx - 120, btnY - 30, 240, 60, 12);
      playText.setColor('#00b4d8');
    });

    hitZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('CombatScene');
      });
    });

    // Instructions
    this.add.text(cx, GAME_HEIGHT * 0.72, 'TAP to select & command units\nDRAG to pan the map\nPINCH/SCROLL to zoom', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#415a77',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Version
    this.add.text(cx, GAME_HEIGHT * 0.92, 'v0.1.0 — Phase 1 Prototype', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#2a2a4a',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(500);
  }

  private createBackgroundHexes(): void {
    const gfx = this.add.graphics();
    gfx.setAlpha(0.08);

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 20 + Math.random() * 40;

      gfx.lineStyle(1, 0x00b4d8);
      gfx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 3) * j - Math.PI / 6;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (j === 0) gfx.moveTo(px, py);
        else gfx.lineTo(px, py);
      }
      gfx.closePath();
      gfx.strokePath();
    }
  }
}
