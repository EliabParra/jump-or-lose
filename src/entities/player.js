import { GRAVITY, TICKS_PER_FRAME, DEFAULT_SCALE } from "../config/constants.js";

// Clase que representa al jugador: estado, física, colisiones, animación y debug.
export default class Player {
  constructor(x, y, sprites, frameData, hitboxAdjustments) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.speed = 2;
    this.jumpPower = -6; 
    this.accel = 0.2;
    this.friction = 0.2;
    this.fastFallMultiplier = 3;

    this.sprites = sprites;
    this.frameData = frameData;
    this.hitboxAdjustments = hitboxAdjustments;
    this.hitboxDefaults = JSON.parse(JSON.stringify(hitboxAdjustments));

    this.action = 'idle';
    this.frameIndex = 0;
    this.tickCount = 0;
    this.onGround = false;

    this.width = frameData.idle.w * frameData.idle.scale;
    this.height = frameData.idle.h * frameData.idle.scale;
    this.hitboxEdit = null;

    // Sprite actual
    this.currentSprite = this.sprites.idle;

    // Efecto de sonido de salto
    try {
      this.jumpSound = new Audio('assets/sound/jump_snd.mp3');
      this.jumpSound.volume = 0.5;
    } catch (e) {
      this.jumpSound = null;
      console.warn('No se pudo cargar jump sound:', e);
    }

    // Edge detection para evitar salto infinito y manejar agacharse correctamente
    this._prevKeys = {};

    // Bandera para salto variable
    this.isJumping = false;
  }

  // Comprueba solapamiento AABB entre dos rectángulos
  isColliding(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  // Calcula la hitbox (AABB) del jugador en coordenadas de canvas
  getHitbox(x = this.x, y = this.y, act = this.action) {
    const data = this.frameData[act];
    const adj = this.hitboxAdjustments[act] || this.hitboxAdjustments.idle;
    const scale = data.scale || DEFAULT_SCALE;
    return {
      x: x + adj.offsetX * scale,
      y: y + adj.offsetY * scale,
      width: adj.width * scale,
      height: adj.height * scale
    };
  }

  // Ajusta la hitbox relativa para una animación (lado: left/top/right/bottom)
  adjustHitbox(act, side, delta) {
    const adj = this.hitboxAdjustments[act] || this.hitboxAdjustments.idle;
    if (side === 'left') adj.offsetX = Math.max(0, adj.offsetX + delta);
    else if (side === 'top') adj.offsetY = Math.max(0, adj.offsetY + delta);
    else if (side === 'right') adj.width = Math.max(1, adj.width + delta);
    else if (side === 'bottom') adj.height = Math.max(1, adj.height + delta);
  }

  // Resetea la hitbox de una acción a los valores por defecto
  resetHitbox(act) { this.hitboxAdjustments[act] = Object.assign({}, this.hitboxDefaults[act]); }

  resolveCollisions(world) {
    // Calcula AABB previa usando la posición antes de integrar velocidades
    const prev = { x: this.x - this.vx, y: this.y - this.vy };
    const prevHB = this.getHitbox(prev.x, prev.y, this.action);
    this.onGround = false;
    const hb = this.getHitbox(this.x, this.y, this.action);

    // Usar tiles activos si están disponibles
    const tiles = typeof world.getActiveTiles === 'function' ? world.getActiveTiles() : world.getTiles();

    for (let tile of tiles) {
      if (!this.isColliding(hb, tile)) continue;

      if (prevHB.y + prevHB.height <= tile.y) {
        // Caer sobre el suelo
        const overlap = hb.y + hb.height - tile.y;
        this.y -= overlap;
        this.vy = 0;
        this.onGround = true;
        this.isJumping = false; // cortar salto variable al tocar suelo

        // Iniciar desvanecimiento del tile al pisarlo
        if (typeof world.onTileStepped === 'function') {
          world.onTileStepped(tile);
        }
      } else if (prevHB.y >= tile.y + tile.height) {
        // Golpearse con el techo
        const overlap = tile.y + tile.height - hb.y;
        this.y += overlap;
        this.vy = 0;
        this.isJumping = false; // cortar salto si golpea techo
      } else if (prevHB.x + prevHB.width <= tile.x) {
        // Golpe lateral (izquierda del tile)
        const overlap = hb.x + hb.width - tile.x;
        this.x -= overlap;
        this.vx = 0;
      } else if (prevHB.x >= tile.x + tile.width) {
        // Golpe lateral (derecha del tile)
        const overlap = tile.x + tile.width - hb.x;
        this.x += overlap;
        this.vx = 0;
      }

      Object.assign(hb, this.getHitbox(this.x, this.y, this.action));
    }
  }

  update(keys, world) {
    // Edge detection
    const justPressed = (code) => keys[code] && !this._prevKeys[code];
    // const justReleased = (code) => !keys[code] && this._prevKeys[code];

    // Entrada horizontal con inercia (aceleración y fricción)
    const targetVx = keys['ArrowLeft'] ? -this.speed : keys['ArrowRight'] ? this.speed : 0;
    if (targetVx !== 0) {
      if (this.vx < targetVx) this.vx = Math.min(this.vx + this.accel, targetVx);
      else if (this.vx > targetVx) this.vx = Math.max(this.vx - this.accel, targetVx);
    } else {
      if (this.vx > 0) this.vx = Math.max(0, this.vx - this.friction);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + this.friction);
      if (Math.abs(this.vx) < 0.01) this.vx = 0;
    }

    // Agacharse (mantiene acción crouch mientras ArrowDown está presionado)
    const isCrouching = !!keys['ArrowDown'];

    // Salto en borde de tecla, solo si está en el suelo y no agachado
    const wantsJump = justPressed('Space') || justPressed('ArrowUp');
    if (wantsJump && this.onGround && !isCrouching) {
      this.vy = this.jumpPower; // impulso inicial
      this.onGround = false;
      this.isJumping = true;    // activar salto variable

      // reproducir sonido de salto si está disponible y no está deshabilitado
      try {
        const disabled = localStorage.getItem('musicEnabled') === '0';
        if (!disabled && this.jumpSound) {
          this.jumpSound.currentTime = 0;
          this.jumpSound.play().catch(()=>{});
        }
      } catch(e) {}
    }

    // Salto variable: mientras mantenga presionado y aún esté subiendo
    if ((keys['Space'] || keys['ArrowUp']) && this.isJumping && this.vy < 0) {
      this.vy -= 0.1; // impulso extra (ajustable para sensibilidad)
    }

    // Cortar salto si suelta tecla o deja de subir
    if ((!keys['Space'] && !keys['ArrowUp']) || this.vy >= 0) {
      this.isJumping = false;
    }

    // Gravedad y caída rápida (fast-fall)
    let gravityThisFrame = GRAVITY;
    if (!this.onGround && keys['ArrowDown']) gravityThisFrame *= this.fastFallMultiplier;
    this.vy += gravityThisFrame;

    // Integración de posición
    this.x += this.vx;
    this.y += this.vy;

    // Colisiones
    this.resolveCollisions(world);

    // Decidir acción basada en estado
    if (!this.onGround) this.setAction('jump');
    else if (isCrouching) this.setAction('crouch');
    else if (this.vx !== 0) this.setAction('walk');
    else this.setAction('idle');

    // Tick de animación
    this.tickCount++;
    const data = this.frameData[this.action];
    if (this.tickCount > TICKS_PER_FRAME) {
      this.tickCount = 0;
      if (this.action === 'jump' || this.action === 'crouch') {
        if (this.frameIndex < data.frames - 1) this.frameIndex++;
      } else {
        this.frameIndex = (this.frameIndex + 1) % data.frames;
      }
    }

    // Guardar estado para edge detection
    this._prevKeys = { ...keys };
  }

  setAction(a) {
    if (this.action !== a) {
      this.action = a;
      this.frameIndex = 0;
      this.tickCount = 0;
      // Actualizar el sprite actual según la acción
      if (a === 'idle') this.currentSprite = this.sprites.idle;
      else if (a === 'walk') this.currentSprite = this.sprites.walk;
      else if (a === 'jump') this.currentSprite = this.sprites.jump;
      else if (a === 'crouch') this.currentSprite = this.sprites.crouch;
    }
  }

  draw(renderer, facing, debug, cameraY = 0) {
    // Dibujar sprite del jugador con offset de cámara
    renderer.drawSprite(
      this.currentSprite,
      this.frameIndex,
      this.frameData[this.action],
      this.x,
      this.y - cameraY,
      facing
    );

    // Dibujar hitbox en modo debug
    if (debug) {
      renderer.rect(
        this.x,
        this.y - cameraY,
        this.width,
        this.height,
        { stroke: "red" }
      );
    }
  }
}