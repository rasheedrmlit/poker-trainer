import Phaser from 'phaser';
import { hexToPixel, hexCorners } from './HexCoord';
import { HexGrid, type TerrainType } from './HexGrid';
import { COLORS, HEX_SIZE } from '../config';

const TERRAIN_COLORS: Record<TerrainType, number> = {
  open: COLORS.HEX_FILL,
  forest: 0x2d6a4f,
  rock: 0x495057,
  water: 0x023e8a,
  elevation: 0x3a0ca3,
};

const TERRAIN_ICONS: Record<TerrainType, string> = {
  open: '',
  forest: '🌲',
  rock: '🪨',
  water: '🌊',
  elevation: '⛰️',
};

export class HexRenderer {
  private graphics: Phaser.GameObjects.Graphics;
  private overlayGraphics: Phaser.GameObjects.Graphics;
  private terrainTexts: Phaser.GameObjects.Text[] = [];

  constructor(private scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.overlayGraphics = scene.add.graphics();
    this.overlayGraphics.setDepth(1);
  }

  drawGrid(grid: HexGrid): void {
    this.graphics.clear();
    this.terrainTexts.forEach(t => t.destroy());
    this.terrainTexts = [];

    for (const tile of grid.allTiles()) {
      const { x, y } = hexToPixel(tile.q, tile.r);
      const fillColor = TERRAIN_COLORS[tile.terrain];
      const alpha = tile.terrain === 'water' ? 0.6 : 0.8;

      this.drawHex(this.graphics, x, y, fillColor, COLORS.HEX_STROKE, alpha);

      if (tile.elevation > 0) {
        this.drawHex(this.graphics, x, y - 4, TERRAIN_COLORS.elevation, 0x4a0ca3, 0.9);
      }

      const icon = TERRAIN_ICONS[tile.terrain];
      if (icon) {
        const text = this.scene.add.text(x, y, icon, {
          fontSize: '16px',
        }).setOrigin(0.5).setDepth(0.5);
        this.terrainTexts.push(text);
      }
    }
  }

  highlightHexes(hexes: { q: number; r: number }[], color: number, alpha = 0.3): void {
    for (const hex of hexes) {
      const { x, y } = hexToPixel(hex.q, hex.r);
      this.drawHex(this.overlayGraphics, x, y, color, color, alpha);
    }
  }

  clearOverlay(): void {
    this.overlayGraphics.clear();
  }

  highlightSingle(q: number, r: number, color: number, alpha = 0.5): void {
    const { x, y } = hexToPixel(q, r);
    this.drawHex(this.overlayGraphics, x, y, color, color, alpha);
  }

  private drawHex(
    gfx: Phaser.GameObjects.Graphics,
    cx: number, cy: number,
    fill: number, stroke: number, alpha: number
  ): void {
    const corners = hexCorners(cx, cy);
    gfx.fillStyle(fill, alpha);
    gfx.lineStyle(1.5, stroke, 0.8);
    gfx.beginPath();
    gfx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      gfx.lineTo(corners[i].x, corners[i].y);
    }
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();
  }

  drawPath(path: { q: number; r: number }[]): void {
    if (path.length < 2) return;
    this.overlayGraphics.lineStyle(3, COLORS.MOVE_RANGE, 0.8);
    this.overlayGraphics.beginPath();
    const start = hexToPixel(path[0].q, path[0].r);
    this.overlayGraphics.moveTo(start.x, start.y);
    for (let i = 1; i < path.length; i++) {
      const p = hexToPixel(path[i].q, path[i].r);
      this.overlayGraphics.lineTo(p.x, p.y);
    }
    this.overlayGraphics.strokePath();

    // Draw dots at each step
    for (let i = 1; i < path.length; i++) {
      const p = hexToPixel(path[i].q, path[i].r);
      this.overlayGraphics.fillStyle(COLORS.MOVE_RANGE, 0.9);
      this.overlayGraphics.fillCircle(p.x, p.y, 4);
    }
  }

  drawAttackIndicator(q: number, r: number, hitChance: number): void {
    const { x, y } = hexToPixel(q, r);
    this.drawHex(this.overlayGraphics, x, y, COLORS.ATTACK_RANGE, COLORS.ATTACK_RANGE, 0.3);

    // Hit chance text
    this.scene.add.text(x, y - HEX_SIZE * 0.7, `${hitChance}%`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ff6b6b',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setName('attackIndicator');
  }

  clearAttackIndicators(): void {
    this.scene.children.list
      .filter(c => c.name === 'attackIndicator')
      .forEach(c => c.destroy());
  }

  destroy(): void {
    this.graphics.destroy();
    this.overlayGraphics.destroy();
    this.terrainTexts.forEach(t => t.destroy());
  }
}
