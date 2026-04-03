import { hexKey, type Hex } from './HexCoord';

export type TerrainType = 'open' | 'forest' | 'rock' | 'water' | 'elevation';

export interface TileData {
  q: number;
  r: number;
  terrain: TerrainType;
  elevation: number;
  occupant: number | null;
  coverValue: number; // 0 = none, 0.5 = half, 1 = full
}

export class HexGrid {
  private tiles = new Map<string, TileData>();

  constructor(cols: number, rows: number) {
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        const key = hexKey(q, r);
        this.tiles.set(key, {
          q, r,
          terrain: 'open',
          elevation: 0,
          occupant: null,
          coverValue: 0,
        });
      }
    }
  }

  get(q: number, r: number): TileData | undefined {
    return this.tiles.get(hexKey(q, r));
  }

  set(q: number, r: number, data: Partial<TileData>): void {
    const tile = this.get(q, r);
    if (tile) Object.assign(tile, data);
  }

  has(q: number, r: number): boolean {
    return this.tiles.has(hexKey(q, r));
  }

  isWalkable(q: number, r: number): boolean {
    const tile = this.get(q, r);
    return !!tile && tile.terrain !== 'water' && tile.occupant === null;
  }

  isPassable(q: number, r: number): boolean {
    const tile = this.get(q, r);
    return !!tile && tile.terrain !== 'water';
  }

  setOccupant(q: number, r: number, entityId: number | null): void {
    const tile = this.get(q, r);
    if (tile) tile.occupant = entityId;
  }

  getOccupant(q: number, r: number): number | null {
    return this.get(q, r)?.occupant ?? null;
  }

  allTiles(): TileData[] {
    return Array.from(this.tiles.values());
  }

  getCoverBetween(from: Hex, to: Hex): number {
    const tile = this.get(to.q, to.r);
    if (!tile) return 0;
    return tile.coverValue;
  }

  generateTerrain(seed?: number): void {
    const rng = seed !== undefined ? seededRandom(seed) : Math.random;
    for (const tile of this.tiles.values()) {
      const roll = rng();
      if (roll < 0.12) {
        tile.terrain = 'forest';
        tile.coverValue = 0.5;
      } else if (roll < 0.18) {
        tile.terrain = 'rock';
        tile.coverValue = 1;
      } else if (roll < 0.22) {
        tile.terrain = 'water';
        tile.coverValue = 0;
      } else if (roll < 0.28) {
        tile.terrain = 'elevation';
        tile.elevation = 1;
        tile.coverValue = 0;
      } else {
        tile.terrain = 'open';
        tile.coverValue = 0;
        tile.elevation = 0;
      }
    }
  }
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}
