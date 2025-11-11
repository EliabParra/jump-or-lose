import * as C from "../config/constants.js";

export default class Engine {
  constructor(renderer, world, player, keyboard, handlers = {}) {
    this.renderer = renderer;
    this.world = world;
    this.player = player;
    this.keyboard = keyboard;
    this.handlers = handlers;

    this.running = false;
    this.facing = "right";
    this.debug = false;
    this.score = 0;

    // Suelo inicial (para game over)
    this.sueloInicialY = this.world.initialChunk.length * C.TILE_SIZE;

    this._loop = this._loop.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this._loop);
  }

  stop() { this.running = false; }

  _loop() {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(this._loop);
  }

  update() {
    if (this.keyboard.isDown("ArrowRight")) this.facing = "right";
    else if (this.keyboard.isDown("ArrowLeft")) this.facing = "left";

    // Actualizar jugador con tiles activos
    this.player.update(this.keyboard.keys, this.world);

    // Actualizar mundo (chunks, fade de tiles)
    this.world.update(this.player);

    // Puntuación por altura
    const base = Math.max(0, Math.floor(-this.player.y / 10));
    let multiplier = 1;
    if (this.world.stage === "clouds") multiplier = 2;
    if (this.world.stage === "asteroids") multiplier = 3;
    this.score = Math.max(this.score, base * multiplier);

    // Game Over si cae por debajo del suelo inicial
    if (this.player.y > this.sueloInicialY) {
      if (this.handlers.gameOver) this.handlers.gameOver();
      this.stop();
    }
  }

  draw() {
    const r = this.renderer;
    r.clear();

    // Cámara centrada en el jugador
    const cameraY = this.player.y - this.renderer.canvas.height / 2;

    this.world.draw(r, cameraY);
    this.player.draw(r, this.facing, this.debug, cameraY);

    r.drawScore(this.score, this.world.stage);

    if (this.debug) this._drawDebugOverlay(r, cameraY);
  }

  _drawDebugOverlay(renderer, cameraY) {
    renderer.text(
      `pos:${Math.round(this.player.x)},${Math.round(this.player.y)} vy:${this.player.vy.toFixed(2)}`,
      8, 60,
      { color: "black" }
    );
  }

  gameOver() {
    console.log("Game Over");
  }
}