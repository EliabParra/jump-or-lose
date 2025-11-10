import IndexedDbManager from './indexedDB/IndexedDBManager.js';
import Menu from './UI/menu.js';
import Keyboard from './core/keyboard.js';
import Renderer from './core/renderer.js';
import World from './core/world.js';
import Player from './entities/player.js';
import Engine from './core/engine.js';
import * as C from './config/constants.js';

const canvas = document.createElement("canvas")
canvas.id = "gameCanvas"

// ------------------ Mapa inicial ------------------
const map = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// ------------------ Sprites del jugador ------------------
const sprites = {
  idle: new Image(),
  walk: new Image(),
  jump: new Image(),
  crouch: new Image()
};
sprites.idle.src   = C.ASSET_PATH + "Junimo_Idle.png";
sprites.walk.src   = C.ASSET_PATH + "Junimo_Walk.png";
sprites.jump.src   = C.ASSET_PATH + "Junimo_Jump.png";
sprites.crouch.src = C.ASSET_PATH + "Junimo_Crouch.png";

// ------------------ Tilesets (separados por tipo) ------------------
const tileSets = {
  grass: new Image(),
  clouds: new Image(),
  asteroids: new Image()
};
tileSets.grass.src     = C.ASSET_PATH + "Tiles_Grass.png";
tileSets.clouds.src    = C.ASSET_PATH + "Tiles_Clouds.png";
tileSets.asteroids.src = C.ASSET_PATH + "Tiles_Asteroids.png";

// ------------------ Fondos ------------------
const backgrounds = {
  grass: new Image(),
  clouds: new Image(),
  asteroids: new Image()
};
backgrounds.grass.src     = C.ASSET_PATH + "bg_Grass.png";
backgrounds.clouds.src    = C.ASSET_PATH + "bg_Clouds.png";
backgrounds.asteroids.src = C.ASSET_PATH + "bg_Asteroids.png";

// ------------------ Animaciones ------------------
const frameData = {
  idle:   { w: 20, h: 24, frames: 8, scale: C.DEFAULT_SCALE },
  walk:   { w: 20, h: 24, frames: 4, scale: C.DEFAULT_SCALE },
  jump:   { w: 20, h: 24, frames: 4, scale: C.DEFAULT_SCALE },
  crouch: { w: 20, h: 24, frames: 3, scale: C.DEFAULT_SCALE }
};

// ------------------ Hitboxes ------------------
const hitboxAdjustments = {
  idle:   { offsetX: 4, offsetY: 4, width: 12, height: 16 },
  walk:   { offsetX: 4, offsetY: 4, width: 12, height: 16 },
  jump:   { offsetX: 4, offsetY: 4, width: 12, height: 16 },
  crouch: { offsetX: 4, offsetY: 8, width: 12, height: 12 }
};

// ------------------ Game Class ------------------
class Game {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.keyboard = null;
    this.renderer = null;
    this.world = null;
    this.player = null;
    this.engine = null;
    this.menu = null;
    this.db = new IndexedDbManager('players', 'players')
    this.db.openDatabase()

    this._boundDebugHandler = this._onDebugKey.bind(this);
  }

  loadAllAssets() {
    const images = [
      // jugador
      sprites.idle, sprites.walk, sprites.jump, sprites.crouch,
      // tilesets
      tileSets.grass, tileSets.clouds, tileSets.asteroids,
      // fondos
      backgrounds.grass, backgrounds.clouds, backgrounds.asteroids
    ];
    return new Promise((resolve) => {
      let loaded = 0;
      const total = images.length;
      const check = () => { if (loaded === total) resolve(); };
      images.forEach(img => {
        if (img.complete) { loaded++; check(); }
        else {
          img.onload = () => { loaded++; check(); };
          img.onerror = () => { console.error("Error cargando:", img.src); loaded++; check(); };
        }
      });
    });
  }

  loadMenu() {
    this.menu = new Menu({ startGame: this.start.bind(this), stopGame: this.stop.bind(this) })
    // Asignar la instancia de DB antes de agregar el componente al DOM para evitar condiciones de carrera
    this.menu.db = this.db
    this.menu.addToBody()
  }

  async start(playerName) {
    this.playerName = playerName;
    document.body.appendChild(this.canvas)
    await this.loadAllAssets();
    this._initComponents();
    this.engine.start();
    window.addEventListener('keydown', this._boundDebugHandler);
  }

  stop() {
    window.removeEventListener('keydown', this._boundDebugHandler);
    if (this.engine) this.engine.running = false;
    if (this.keyboard) this.keyboard.dispose();
    this.canvas.remove();
  }

  _initComponents() {
    this.keyboard = new Keyboard();
    this.renderer = new Renderer(this.canvas);
    // Pasamos TODOS los tilesets y backgrounds al World
    this.world = new World(map, tileSets, backgrounds);
    this.player = new Player(150, 20, sprites, frameData, hitboxAdjustments);
    // aqui se pasa el objeto handlers que se crea en el main
    this.engine = new Engine(this.renderer, this.world, this.player, this.keyboard, { gameOver: this.gameOver.bind(this) });
  }

  async gameOver() {
    try {
      const player = await this.db.getItemByName(this.playerName);
      player.score = this.engine.score;
      player.bestScore = player.score > player.bestScore ? player.score : player.bestScore;
      await this.db.updateItem(player);
      this.stop()
      await this.menu.gameOver()
    } catch (error) {
      console.error(`Error en el método gameOver: ${error}`)
    }
  }

  _onDebugKey(e) {
    if (e.code === 'KeyD') this.engine.debug = !this.engine.debug;
    if (this.engine.debug) {
      if (e.code === 'KeyH') this.player.hitboxEdit = 'left';
      if (e.code === 'KeyL') this.player.hitboxEdit = 'right';
      if (e.code === 'KeyK') this.player.hitboxEdit = 'top';
      if (e.code === 'KeyJ') this.player.hitboxEdit = 'bottom';
      if ((e.code === 'BracketLeft' || e.code === 'BracketRight') && this.player.hitboxEdit) {
        const delta = e.code === 'BracketRight' ? 1 : -1;
        this.player.adjustHitbox(this.player.action, this.player.hitboxEdit, delta);
      }
      if (e.code === 'KeyR') this.player.resetHitbox(this.player.action);
    }
  }
}

const game = new Game(canvas);
game.loadMenu()