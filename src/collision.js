// Spatial hash grid for efficient collision detection
import { CONFIG } from './config.js';

export class SpatialHash {
  constructor() {
    this.cellSize = CONFIG.collision.cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return `${cx},${cy}`;
  }

  _cellCoords(x, y) {
    return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)];
  }

  insert(entity) {
    const [cx1, cy1] = this._cellCoords(entity.x - entity.radius, entity.y - entity.radius);
    const [cx2, cy2] = this._cellCoords(entity.x + entity.radius, entity.y + entity.radius);
    for (let cx = cx1; cx <= cx2; cx++) {
      for (let cy = cy1; cy <= cy2; cy++) {
        const key = this._key(cx, cy);
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(entity);
      }
    }
  }

  // Query all entities that could overlap with given circle
  query(x, y, radius) {
    const [cx1, cy1] = this._cellCoords(x - radius, y - radius);
    const [cx2, cy2] = this._cellCoords(x + radius, y + radius);
    const found = new Set();
    for (let cx = cx1; cx <= cx2; cx++) {
      for (let cy = cy1; cy <= cy2; cy++) {
        const key = this._key(cx, cy);
        const cell = this.cells.get(key);
        if (cell) {
          for (const entity of cell) {
            found.add(entity);
          }
        }
      }
    }
    return found;
  }
}

// Circle-circle collision check
export function circlesOverlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = dx * dx + dy * dy;
  const minDist = a.radius + b.radius;
  return dist < minDist * minDist;
}

export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
