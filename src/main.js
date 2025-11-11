import IndexedDbManager from './indexedDB/IndexedDBManager.js';
import Menu from './UI/menu.js';
import Keyboard from './core/keyboard.js';
import Renderer from './core/renderer.js';
import World from './core/world.js';
import Player from './entities/player.js';
import Engine from './core/engine.js';
import * as C from './config/constants.js';

const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";

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

// ------------------ Música de Fondo ------------------
const backgroundMusic = new Audio('./assets/sound/TV_GAME.ogg');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.2;

let isMusicPlaying = true;
let musicIcon = null; 

function toggleMusic() {
  isMusicPlaying = !isMusicPlaying;
  try {
    if (isMusicPlaying) {
      backgroundMusic.play();
    } else {
      backgroundMusic.pause();
    }
    localStorage.setItem('musicEnabled', isMusicPlaying ? '1' : '0');

    if (musicIcon) {
      musicIcon.src = isMusicPlaying ? 'assets/sprites/snd_on.png' : 'assets/sprites/snd_off.png';
    }
  } catch (e) {
    console.error('Error toggling music', e);
  }
}

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

    this.playerName = null;

    // DB
    this.db = new IndexedDbManager('players', 'players');
    this.db.openDatabase();

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
    this.menu = new Menu({ startGame: this.start.bind(this), stopGame: this.stop.bind(this) });
    this.menu.db = this.db;
    this.menu.addToBody();
  }

  async start(playerName) {
    this.playerName = playerName;
    document.body.appendChild(this.canvas);
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

    // World con mapa inicial fijo interno
    this.world = new World(tileSets, backgrounds);

    // Posicionar jugador sobre el suelo del chunk inicial:
    // initialChunk tiene 6 filas; el suelo está en la fila 5 => y = 5*TILE_SIZE
    const sueloY = 5 * C.TILE_SIZE;
    const playerHeight = frameData.idle.h; // 24 px en tu config
    this.player = new Player(150, sueloY - playerHeight, sprites, frameData, hitboxAdjustments);

    // Engine con handler de Game Over
    this.engine = new Engine(
      this.renderer,
      this.world,
      this.player,
      this.keyboard,
      { gameOver: this.gameOver.bind(this) }
    );
  }

  async gameOver() {
    try {
      const player = await this.db.getItemByName(this.playerName);
      player.score = this.engine.score;
      player.bestScore = player.score > player.bestScore ? player.score : player.bestScore;
      await this.db.updateItem(player);
      this.stop();
      await this.menu.gameOver();
    } catch (error) {
      console.error(`Error en el método gameOver: ${error}`);
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
game.loadMenu();

// ------------------ Botón de Audio ------------------
;(function createMusicToggleButton(){
  const saved = localStorage.getItem('musicEnabled');
  if (saved === '0') isMusicPlaying = false;

  try {
    if (isMusicPlaying) backgroundMusic.play().catch(()=>{});
    else backgroundMusic.pause();
  } catch(e) {}

  const btn = document.createElement('button');
  btn.id = 'musicToggle';
  btn.className = 'music-toggle-btn';
  btn.setAttribute('aria-label', 'Alternar sonido');
  btn.title = 'Alternar sonido';

  musicIcon = document.createElement('img');
  musicIcon.id = 'musicIcon';
  musicIcon.alt = 'toggle-sound';
  musicIcon.width = 40;
  musicIcon.height = 40;
  musicIcon.src = isMusicPlaying ? 'assets/sprites/snd_on.png' : 'assets/sprites/snd_off.png';

  btn.appendChild(musicIcon);
  document.body.appendChild(btn);

  btn.addEventListener('click', (e) => {
    toggleMusic();
  });
})();