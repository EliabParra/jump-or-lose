import { TILE_SIZE } from "../config/constants.js";

export default class World {
  constructor(map, tilesets, backgrounds) {
    this.tilesets = tilesets || {};
    this.backgrounds = backgrounds || {};

    // Estado inicial
    this.stage = "grass";
    this.currentBackground = this.backgrounds.grass || null;

    // Tiles iniciales
    this.map = map;
    this.tiles = this.buildTilesFromMap(map);

    // Umbrales de transición de etapa
    this.stageThresholds = {
      clouds: -800,
      asteroids: -1600
    };

    // Patrones de chunks (ejemplo simple)
    this.chunkPatterns = {
      grass: [
        [ [1,0,1,0,1,0,1,0,1,0] ]
      ],
      clouds: [
        [ [2,0,0,2,0,0,2,0,0,2] ]
      ],
      asteroids: [
        [ [3,0,3,0,3,0,3,0,3,0] ]
      ]
    };

    this.nextChunkY = -TILE_SIZE * 4;
    this.chunkHeightRows = 1;
  }

  buildTilesFromMap(map) {
    const tiles = [];
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const v = map[row][col];
        if (v !== 0) {
          tiles.push({
            x: col * TILE_SIZE,
            y: row * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            type: v
          });
        }
      }
    }
    return tiles;
  }

  setStage(stageName) {
    if (this.stage === stageName) return;
    this.stage = stageName;

    if (stageName === "grass") {
      this.currentBackground = this.backgrounds.grass;
    } else if (stageName === "clouds") {
      this.currentBackground = this.backgrounds.clouds;
    } else if (stageName === "asteroids") {
      this.currentBackground = this.backgrounds.asteroids;
    }
  }

  update(playerY) {
    if (playerY <= this.stageThresholds.asteroids && this.stage !== "asteroids") {
      this.setStage("asteroids");
    } else if (playerY <= this.stageThresholds.clouds && this.stage === "grass") {
      this.setStage("clouds");
    }

    const triggerDistance = TILE_SIZE * 10;
    if (playerY < this.nextChunkY + triggerDistance) {
      this.generateChunk(this.stage, this.nextChunkY);
      this.nextChunkY -= this.chunkHeightRows * TILE_SIZE;
    }
  }

  generateChunk(stage, yOffset) {
    const patterns = this.chunkPatterns[stage];
    if (!patterns || patterns.length === 0) return;

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        const type = pattern[row][col];
        if (type !== 0) {
          this.tiles.push({
            x: col * TILE_SIZE,
            y: yOffset + row * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            type
          });
        }
      }
    }
  }

  // 🔹 Aquí elegimos la imagen según el tipo de tile
  draw(renderer, cameraY = 0) {
    if (this.currentBackground) renderer.drawBackground(this.currentBackground);

    const ctx = renderer.ctx;
    for (let t of this.tiles) {
      let img = null;
      if (t.type === 1) img = this.tilesets.grass;
      else if (t.type === 2) img = this.tilesets.clouds;
      else if (t.type === 3) img = this.tilesets.asteroids;

      if (img) {
        ctx.drawImage(img, t.x, t.y - cameraY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  getTiles() { return this.tiles; }
}