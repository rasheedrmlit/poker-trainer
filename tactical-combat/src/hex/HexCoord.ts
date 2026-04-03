import { HEX_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../config';

export interface Hex {
  q: number;
  r: number;
}

const SQRT3 = Math.sqrt(3);

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseHexKey(key: string): Hex {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = GRID_OFFSET_X + HEX_SIZE * (SQRT3 * q + (SQRT3 / 2) * r);
  const y = GRID_OFFSET_Y + HEX_SIZE * (1.5 * r);
  return { x, y };
}

export function pixelToHex(px: number, py: number): Hex {
  const x = px - GRID_OFFSET_X;
  const y = py - GRID_OFFSET_Y;
  const q = (SQRT3 / 3 * x - 1 / 3 * y) / HEX_SIZE;
  const r = (2 / 3 * y) / HEX_SIZE;
  return hexRound(q, r);
}

export function hexRound(q: number, r: number): Hex {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
}

export function hexDistance(a: Hex, b: Hex): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

const DIRECTIONS: Hex[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

export function hexNeighbors(q: number, r: number): Hex[] {
  return DIRECTIONS.map(d => ({ q: q + d.q, r: r + d.r }));
}

export function hexRing(center: Hex, radius: number): Hex[] {
  if (radius === 0) return [center];
  const results: Hex[] = [];
  let hex = { q: center.q + DIRECTIONS[4].q * radius, r: center.r + DIRECTIONS[4].r * radius };
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push(hex);
      hex = { q: hex.q + DIRECTIONS[i].q, r: hex.r + DIRECTIONS[i].r };
    }
  }
  return results;
}

export function hexLineDraw(a: Hex, b: Hex): Hex[] {
  const dist = hexDistance(a, b);
  if (dist === 0) return [a];
  const results: Hex[] = [];
  for (let i = 0; i <= dist; i++) {
    const t = i / dist;
    const q = a.q + (b.q - a.q) * t;
    const r = a.r + (b.r - a.r) * t;
    results.push(hexRound(q + 1e-6, r + 1e-6));
  }
  return results;
}

export function hexCorners(cx: number, cy: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: cx + HEX_SIZE * Math.cos(angle),
      y: cy + HEX_SIZE * Math.sin(angle),
    });
  }
  return corners;
}

export function hexesInRange(center: Hex, range: number): Hex[] {
  const results: Hex[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}
