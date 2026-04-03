import Phaser from 'phaser';
import { hexToPixel } from '../hex/HexCoord';
import { COLORS } from '../config';

export class ParticleManager {
  constructor(private scene: Phaser.Scene) {}

  attackParticles(fromQ: number, fromR: number, toQ: number, toR: number): void {
    const from = hexToPixel(fromQ, fromR);
    const to = hexToPixel(toQ, toR);

    // Muzzle flash
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffff00, 0.8);
    flash.fillCircle(from.x, from.y, 8);
    flash.setDepth(20);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 150,
      onComplete: () => flash.destroy(),
    });

    // Projectile trail
    const trail = this.scene.add.graphics();
    trail.lineStyle(2, 0xffdd00, 0.8);
    trail.setDepth(20);

    const projectile = { x: from.x, y: from.y };
    this.scene.tweens.add({
      targets: projectile,
      x: to.x,
      y: to.y,
      duration: 120,
      onUpdate: () => {
        trail.clear();
        trail.lineStyle(2, 0xffdd00, 0.6);
        trail.beginPath();
        trail.moveTo(from.x, from.y);
        trail.lineTo(projectile.x, projectile.y);
        trail.strokePath();
      },
      onComplete: () => {
        trail.destroy();
        this.impactParticles(to.x, to.y);
      },
    });
  }

  impactParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 30 + Math.random() * 40;
      const dot = this.scene.add.graphics();
      dot.fillStyle(0xff6600, 1);
      dot.fillCircle(0, 0, 2 + Math.random() * 2);
      dot.setPosition(x, y);
      dot.setDepth(20);

      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 200 + Math.random() * 200,
        onComplete: () => dot.destroy(),
      });
    }
  }

  explosionParticles(q: number, r: number): void {
    const { x, y } = hexToPixel(q, r);

    // Flash
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xff6600, 0.9);
    flash.fillCircle(x, y, 40);
    flash.setDepth(25);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    // Ring
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, 0xffaa00, 0.8);
    ring.strokeCircle(x, y, 10);
    ring.setDepth(25);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });

    // Debris particles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      const size = 2 + Math.random() * 4;
      const dot = this.scene.add.graphics();
      const colors = [0xff4400, 0xff8800, 0xffcc00, 0x666666];
      dot.fillStyle(colors[Math.floor(Math.random() * colors.length)], 1);
      dot.fillCircle(0, 0, size);
      dot.setPosition(x, y);
      dot.setDepth(25);

      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 300 + Math.random() * 400,
        onComplete: () => dot.destroy(),
      });
    }

    // Screen shake
    this.scene.cameras.main.shake(250, 0.008);
  }

  healParticles(q: number, r: number): void {
    const { x, y } = hexToPixel(q, r);

    for (let i = 0; i < 10; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      const dot = this.scene.add.graphics();
      dot.fillStyle(COLORS.HEAL, 0.8);
      dot.fillCircle(0, 0, 3);
      dot.setPosition(x + offsetX, y + 15);
      dot.setDepth(20);

      this.scene.tweens.add({
        targets: dot,
        y: y - 20 - Math.random() * 15,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        delay: i * 50,
        onComplete: () => dot.destroy(),
      });
    }

    // Plus sign
    const plus = this.scene.add.text(x, y - 5, '+', {
      fontSize: '24px',
      color: '#2ec4b6',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
      targets: plus,
      y: y - 35,
      alpha: 0,
      duration: 800,
      onComplete: () => plus.destroy(),
    });
  }

  damagePopup(q: number, r: number, damage: number, crit: boolean): void {
    const { x, y } = hexToPixel(q, r);
    const text = crit ? `CRIT ${damage}!` : `${damage}`;
    const color = crit ? '#ffd93d' : '#ff6b6b';
    const size = crit ? '20px' : '16px';

    const popup = this.scene.add.text(x, y - 20, text, {
      fontSize: size,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    this.scene.tweens.add({
      targets: popup,
      y: y - 55,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  missPopup(q: number, r: number): void {
    const { x, y } = hexToPixel(q, r);
    const popup = this.scene.add.text(x, y - 20, 'MISS', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);

    this.scene.tweens.add({
      targets: popup,
      y: y - 45,
      alpha: 0,
      duration: 800,
      onComplete: () => popup.destroy(),
    });
  }
}
