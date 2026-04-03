import Phaser from 'phaser';

export class InputManager {
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private dragThreshold = 10;
  private onTap: ((worldX: number, worldY: number) => void) | null = null;
  private onDrag: ((dx: number, dy: number) => void) | null = null;

  constructor(private scene: Phaser.Scene) {
    this.setup();
  }

  private setup(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;

      if (!this.isDragging && (Math.abs(dx) > this.dragThreshold || Math.abs(dy) > this.dragThreshold)) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        const moveDx = pointer.x - this.lastPointerX;
        const moveDy = pointer.y - this.lastPointerY;
        this.onDrag?.(moveDx, moveDy);
      }

      this.lastPointerX = pointer.x;
      this.lastPointerY = pointer.y;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) {
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.onTap?.(worldPoint.x, worldPoint.y);
      }
      this.isDragging = false;
    });
  }

  setTapHandler(handler: (worldX: number, worldY: number) => void): void {
    this.onTap = handler;
  }

  setDragHandler(handler: (dx: number, dy: number) => void): void {
    this.onDrag = handler;
  }
}
