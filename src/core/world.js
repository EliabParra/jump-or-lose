import { TILE_SIZE } from "../config/constants.js";

export default class World {
  constructor(tilesets, backgrounds) {
    this.tilesets = tilesets || {};
    this.backgrounds = backgrounds || {};

    this.stage = "grass";
    this.currentBackground = this.backgrounds.grass || null;

    // Chunk inicial fijo
    this.initialChunk = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,1,0,0,0,0,0,1,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    this.tiles = this.buildTilesFromMap(this.initialChunk);

    // Stage thresholds
    this.stageThresholds = { clouds: -800, asteroids: -1600 };

    // Patrones de ejemplo
    this.chunkPatterns = {
      grass: [
        [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [1,1,1,1,0,0,0,0,1,1,1,1,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,1,1,1,1,0,0,0,0,0,0,1,1,1],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,1,1,1,1,0,0,0,0,1,1],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        [
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
         [0,0,0,1,0,1,0,0,0,0,0,0,0,1,0],
         [0,0,1,0,0,0,1,0,0,0,0,0,1,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
         [0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
         [0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
         [
         [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
         [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
         [0,1,0,0,0,0,0,1,0,0,0,0,0,0,0],
         [0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
         [0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
         [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
         [0,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
      ],
      clouds: [
        [[0,0,0,0,2,0,0,0,0,2,0,0,0,0,2],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,2,0,0,0,0,2,0,0,0,0,2,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,2,0,0,0,0,2,0,0,0,0,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,2,0,0,0,0,2,0,0,0,0,2]
        ],
        [[0,2,0,0,0,0,2,0,0,0,0,2,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [2,0,0,0,2,0,0,0,2,0,0,0,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,2,0,0,0,0,2,0,0,0,0,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
         [2,0,0,0,2,0,0,0,2,0,0,0,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,2,0,0,0,0,2,0,0,0,0,2,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [2,0,0,0,2,0,0,0,2,0,0,0,2,0,0]
        ],
        [
          [0,0,0,2,0,0,0,0,2,0,0,0,0,2,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,2,0,0,0,0,2,0,0,0,0,2,0,0,0], 
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [2,0,0,0,2,0,0,0,2,0,0,0,2,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,2,0,0,0,0,2,0,0,0,0,2,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,2,0,0,0,0,2,0,0,0,0,2,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,2,0,0,0,0,2,0,0,0,0,2,0]
         ]
      ],
      asteroids: [
        [[3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,0,0,3,0,0,0,3,0,0,0,3,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,0,0,3,0,0,0,3,0,0,0,3,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0]
        ],
        [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,3,0,3,0,3,0,3,0,3,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,3,0,3,0,3,0,3,0,3,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        [[3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,0,0,3,0,0,0,3,0,0,0,3,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,0,0,3,0,0,0,3,0,0,0,3,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [3,0,3,0,3,0,3,0,3,0,0,0,0,0,0]
        ]
      ]
    };

    this.chunkHeightRows = this.initialChunk.length;
    this.nextChunkY = -this.chunkHeightRows * TILE_SIZE;

    // Caches/guards
    this._activeTilesCache = null;
    this._frameCount = 0;
    this._maxTiles = 5000;
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
            type: v,
            alpha: 1,
            active: true,
            fadeStart: null
          });
        }
      }
    }
    return tiles;
  }

  setStage(stageName) {
    if (this.stage === stageName) return;
    this.stage = stageName;
    if (stageName === "grass") this.currentBackground = this.backgrounds.grass;
    else if (stageName === "clouds") this.currentBackground = this.backgrounds.clouds;
    else if (stageName === "asteroids") this.currentBackground = this.backgrounds.asteroids;
  }

  update(player) {
    this._frameCount++;

    // Stage transitions
    if (player.y <= this.stageThresholds.asteroids && this.stage !== "asteroids") {
      this.setStage("asteroids");
    } else if (player.y <= this.stageThresholds.clouds && this.stage === "grass") {
      this.setStage("clouds");
    }

    // Chunk generation: cap generations per frame to avoid spikes
    const triggerDistance = TILE_SIZE * 20; // maintain 1–2 chunks above
    const maxGenerationsPerFrame = 2;
    let gens = 0;

    while (player.y < this.nextChunkY + triggerDistance && gens < maxGenerationsPerFrame) {
      if (this.tiles.length > this._maxTiles) break; // safety cap
      this.generateChunk(this.stage, this.nextChunkY);
      this.nextChunkY -= this.chunkHeightRows * TILE_SIZE;
      gens++;
    }

    // Fade tiles (do not remove, only deactivate)
    const now = Date.now();
    for (const tile of this.tiles) {
      if (tile.fadeStart) {
        const elapsed = (now - tile.fadeStart) / 1000;
        tile.alpha = Math.max(0, 1 - elapsed / 3);
        if (elapsed >= 3) {
          tile.active = false;
          tile.alpha = 0;
        }
      }
    }

    // Build active tiles cache once per frame (used by Player)
    this._activeTilesCache = null;
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
            type,
            alpha: 1,
            active: true,
            fadeStart: null
          });
        }
      }
    }
  }

  onTileStepped(tile) {
    if (!tile.fadeStart) tile.fadeStart = Date.now();
  }

  getActiveTiles() {
    // Cache for this frame to avoid repeated filter calls during collision
    if (this._activeTilesCache) return this._activeTilesCache;
    this._activeTilesCache = this.tiles.filter(t => t.active);
    return this._activeTilesCache;
  }

  getTiles() {
    return this.tiles;
  }

  draw(renderer, cameraY = 0) {
    if (this.currentBackground) renderer.drawBackground(this.currentBackground);

    const ctx = renderer.ctx;
    for (let t of this.tiles) {
      let img = null;
      if (t.type === 1) img = this.tilesets.grass;
      else if (t.type === 2) img = this.tilesets.clouds;
      else if (t.type === 3) img = this.tilesets.asteroids;

      if (!img) continue;

      ctx.save();
      ctx.globalAlpha = t.alpha !== undefined ? t.alpha : 1;
      ctx.drawImage(img, t.x, t.y - cameraY, TILE_SIZE, TILE_SIZE);
      ctx.restore();
    }
  }
}