import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class CameraController {
  private camera: Phaser.Cameras.Scene2D.Camera;
  private pinchDistance = 0;
  private minZoom = 0.5;
  private maxZoom = 2;

  constructor(private scene: Phaser.Scene) {
    this.camera = scene.cameras.main;
    this.camera.setBounds(-200, -200, GAME_WIDTH + 400, GAME_HEIGHT + 400);
    this.setupPinchZoom();
    this.setupScrollZoom();
    this.setupKeyboard();
  }

  handleDrag(dx: number, dy: number): void {
    this.camera.scrollX -= dx / this.camera.zoom;
    this.camera.scrollY -= dy / this.camera.zoom;
  }

  private setupPinchZoom(): void {
    this.scene.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
      const pointers = this.scene.input.manager.pointers.filter(p => p.isDown);
      if (pointers.length === 2) {
        const [p1, p2] = pointers;
        this.pinchDistance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
      }
    });

    this.scene.input.on('pointermove', () => {
      const pointers = this.scene.input.manager.pointers.filter(p => p.isDown);
      if (pointers.length === 2) {
        const [p1, p2] = pointers;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.pinchDistance > 0) {
          const scale = dist / this.pinchDistance;
          const newZoom = Phaser.Math.Clamp(this.camera.zoom * scale, this.minZoom, this.maxZoom);
          this.camera.setZoom(newZoom);
        }
        this.pinchDistance = dist;
      }
    });
  }

  private setupScrollZoom(): void {
    this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _dx: number, dy: number) => {
      const zoomDelta = dy > 0 ? -0.1 : 0.1;
      const newZoom = Phaser.Math.Clamp(this.camera.zoom + zoomDelta, this.minZoom, this.maxZoom);
      this.camera.setZoom(newZoom);
    });
  }

  private setupKeyboard(): void {
    const cursors = this.scene.input.keyboard?.createCursorKeys();
    if (!cursors) return;

    this.scene.events.on('update', () => {
      const speed = 5 / this.camera.zoom;
      if (cursors.left?.isDown) this.camera.scrollX -= speed;
      if (cursors.right?.isDown) this.camera.scrollX += speed;
      if (cursors.up?.isDown) this.camera.scrollY -= speed;
      if (cursors.down?.isDown) this.camera.scrollY += speed;
    });
  }

  centerOn(x: number, y: number): void {
    this.camera.centerOn(x, y);
  }
}
