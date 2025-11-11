import { TILE_SIZE } from "../config/constants.js";

export default class World {
  constructor(tilesets, backgrounds) {
    this.tilesets = tilesets || {};
    this.backgrounds = backgrounds || {};

    this.stage = "grass";
    this.currentBackground = this.backgrounds.grass || null;
    this.nextBackground = null;
    this.bgTransitionStart = null;
    this.bgTransitionDuration = 250; // ms

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

    // Patrones de ejemplo (los que ya tenías)
    this.chunkPatterns = {
      grass: [
        [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [1,1,1,0,0,0,0,0,1,1,1,1,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,1,1,1,0,0,0,0,0,0,0,1,1,1],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,1,1,1,0,0,0,0,1,1],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        [
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,1,1,1,0,0,0,0,0,0,0,0,1],
         [0,0,1,0,0,0,1,0,0,0,0,0,0,1,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
         [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
         [0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
         [0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        [
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,1,0,0,0,0,0,0,0,1,1],
         [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
         [0,1,0,0,0,0,0,0,0,0,1,0,0,0,0],
         [0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
         [0,0,1,0,0,0,0,0,0,1,0,1,0,0,1],
         [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
         [0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
      ],
      clouds: [
        [
         [0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,2,2,2,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,2,2,0,0,0],
         [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,2,2,2,0,0,0,2,2,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,2,2,0,0,0,0,0,0,0,0,2,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        [[0,0,0,0,0,0,2,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,2,0,0,0,0,0,0,0,2,0],
         [0,2,0,0,0,0,0,0,2,0,0,0,2,0,0],
         [2,0,0,0,0,0,0,0,0,2,0,0,0,0,0],
         [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,2,0,0,0,0,0,0,2,0]
         [0,0,0,0,0,0,0,0,0,0,0,0,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,2,0,0,0,0,2,0,0,0,0,2,0,0,0],
         [2,0,2,0,0,0,0,2,0,0,0,0,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        [
         [0,0,0,2,2,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [2,2,0,0,0,0,2,2,0,0,0,0,0,0,0], 
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [2,0,0,0,0,0,0,0,0,0,0,0,2,2,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,2,2,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,2,2,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,2,2,0,0,0,0,0,0,0,0,0,2,2]
         ]
      ],
      asteroids: [
        [
         [0,0,0,0,0,0,0,0,0,0,0,0,3,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,3,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,3,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,3,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,3,0],
         [0,0,0,0,0,0,0,3,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,3,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,3]
        ],
        [
         [0,0,0,0,0,0,0,3,0,0,0,0,0,0,0],
         [0,0,3,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
         [0,3,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,3,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,3,0],
         [0,0,3,0,0,0,0,0,3,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        [
         [0,0,0,0,0,0,0,0,0,0,0,0,3,0,0],
         [0,0,0,3,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,3,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,3,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,3,0,0,0,0,3,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,3,0,0,0,0,0],
         [0,0,0,0,0,0,0,0,0,0,0,0,3,0,0],
         [0,0,0,3,0,0,0,0,0,0,0,0,0,0,0]
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

    let newBg = null;
    if (stageName === "grass") newBg = this.backgrounds.grass;
    else if (stageName === "clouds") newBg = this.backgrounds.clouds;
    else if (stageName === "asteroids") newBg = this.backgrounds.asteroids;

    if (newBg && newBg !== this.currentBackground) {
      this.nextBackground = newBg;
      this.bgTransitionStart = Date.now();
    }
  }

  update(player) {
    this._frameCount++;

    // 🔹 Stage transitions con rangos claros
    if (player.y > this.stageThresholds.clouds) {
      // Por encima de -800 → grass
      this.setStage("grass");
    } else if (player.y <= this.stageThresholds.clouds && player.y > this.stageThresholds.asteroids) {
      // Entre -800 y -1600 → clouds
      this.setStage("clouds");
    } else if (player.y <= this.stageThresholds.asteroids) {
      // Por debajo de -1600 → asteroids
      this.setStage("asteroids");
    }

    // Chunk generation
    const triggerDistance = TILE_SIZE * 20;
    const maxGenerationsPerFrame = 2;
    let gens = 0;

    while (player.y < this.nextChunkY + triggerDistance && gens < maxGenerationsPerFrame) {
      if (this.tiles.length > this._maxTiles) break;
      this.generateChunk(this.stage, this.nextChunkY);
      this.nextChunkY -= this.chunkHeightRows * TILE_SIZE;
      gens++;
    }

    // Fade tiles
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

    // Eliminar tiles muy abajo (2 chunks por debajo del jugador)
    const bottomLimit = player.y + (this.chunkHeightRows * TILE_SIZE * 2);
    this.tiles = this.tiles.filter(t => t.y < bottomLimit);

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
    if (this._activeTilesCache) return this._activeTilesCache;
    this._activeTilesCache = this.tiles.filter(t => t.active);
    return this._activeTilesCache;
  }

  getTiles() {
    return this.tiles;
  }

  getGameOverLimit() {
    if (this.tiles.length === 0) return 0;
    const lowestTile = Math.max(...this.tiles.map(t => t.y));
    return lowestTile + TILE_SIZE;
  }

  draw(renderer, cameraY = 0) {
    const ctx = renderer.ctx;

    // 🔹 Transición de fondos
    if (this.bgTransitionStart) {
      const elapsed = Date.now() - this.bgTransitionStart;
      const t = Math.min(1, elapsed / this.bgTransitionDuration);

      if (this.currentBackground) {
        ctx.save();
        ctx.globalAlpha = 1 - t;
        renderer.drawBackground(this.currentBackground);
        ctx.restore();
      }

      if (this.nextBackground) {
        ctx.save();
        ctx.globalAlpha = t;
        renderer.drawBackground(this.nextBackground);
        ctx.restore();
      }

      if (t >= 1) {
        this.currentBackground = this.nextBackground;
        this.nextBackground = null;
        this.bgTransitionStart = null;
      }
    } else {
      if (this.currentBackground) renderer.drawBackground(this.currentBackground);
    }

    // Dibujar tiles
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