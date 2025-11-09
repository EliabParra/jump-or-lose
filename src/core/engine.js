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

    this.player.update(this.keyboard.keys, this.world);
    this.world.update(this.player.y);

    const base = Math.max(0, Math.floor(-this.player.y / 10));
    let multiplier = 1;
    if (this.world.stage === "clouds") multiplier = 2;
    if (this.world.stage === "asteroids") multiplier = 3;
    this.score = Math.max(this.score, base * multiplier);

    if (this.score > 30) this.handlers.gameOver()
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
      `pos:${Math.round(this.player.x)},${Math.round(this.player.y)} vx:${this.player.vx.toFixed(2)} vy:${this.player.vy.toFixed(2)}`,
      8, 60,
      { color: "black" }
    );
  }

  gameOver() {

  }
}