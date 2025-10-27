const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

// ------------------ Config / constants ------------------
const ASSET_PATH = "../assets/sprites/"; // relative to src/
const GRAVITY = .7;
const TICKS_PER_FRAME = 4;
const DEFAULT_SCALE = 4;

// Variable de direccion del sprite
let facing = "right";

// Cargar spritesheets
const sprites = {
  idle: new Image(),
  walk: new Image(),
  jump: new Image(),
  crouch: new Image()
};

sprites.idle.src = ASSET_PATH + "Junimo_Idle.png";
sprites.walk.src = ASSET_PATH + "Junimo_Walk.png";
sprites.jump.src = ASSET_PATH + "Junimo_Jump.png";
sprites.crouch.src = ASSET_PATH + "Junimo_Crouch.png";

// Configuración de frames
const frameData = {
  idle:   { w: 20, h: 24, frames: 8, scale: DEFAULT_SCALE },
  walk:   { w: 20, h: 24, frames: 4, scale: DEFAULT_SCALE },
  jump:   { w: 20, h: 24, frames: 4, scale: DEFAULT_SCALE },
  crouch: { w: 20, h: 24, frames: 3, scale: DEFAULT_SCALE }
};

// Per-animation hitbox adjustments (in sprite pixels, unscaled)
// offsetX/Y = distance from sprite top-left to hitbox top-left
// width/height = hitbox size in sprite pixels
const hitboxAdjustments = {
  idle:   { offsetX: 6, offsetY: 7, width: 8, height: 12 },
  walk:   { offsetX: 6, offsetY: 7, width: 8, height: 12 },
  jump:   { offsetX: 6, offsetY: 6, width: 8, height: 13 },
  crouch: { offsetX: 6, offsetY: 10, width: 8, height: 9 }
};

// Keep a copy of defaults so we can reset
const hitboxDefaults = JSON.parse(JSON.stringify(hitboxAdjustments));

// Hitbox editor state (select which side to edit: 'left'|'right'|'top'|'bottom' or null)
let hitboxEdit = null;

// State for animation
let action = "idle";
let frameIndex = 0;
let tickCount = 0;

// Debug toggle
let debug = false;

// Player object
const player = {
  x: 50,
  y: 50,
  vx: 0,
  vy: 0,
  speed: 7,
  jumpPower: -15,
  width: frameData.idle.w * frameData.idle.scale,
  height: frameData.idle.h * frameData.idle.scale,
  onGround: false
};

// Keyboard state
const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "ArrowRight") facing = "right";
  if (e.code === "ArrowLeft") facing = "left";
  if (e.code === "KeyD") debug = !debug;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  // Hitbox editor controls (only when debug active)
  if (debug) {
    // Select side: H=left, L=right, K=top, J=bottom
    if (e.code === "KeyH") hitboxEdit = 'left';
    if (e.code === "KeyL") hitboxEdit = 'right';
    if (e.code === "KeyK") hitboxEdit = 'top';
    if (e.code === "KeyJ") hitboxEdit = 'bottom';

    // Adjust selected side: [ decreases, ] increases
    if ((e.code === 'BracketLeft' || e.code === 'BracketRight') && hitboxEdit) {
      const delta = e.code === 'BracketRight' ? 1 : -1;
      adjustHitbox(action, hitboxEdit, delta);
    }

    // Reset current animation hitbox to defaults
    if (e.code === 'KeyR') {
      hitboxAdjustments[action] = Object.assign({}, hitboxDefaults[action]);
    }
  }
});
document.addEventListener("keyup", (e) => { keys[e.code] = false; });

// Tiles
const CANVAS_W = canvas ? canvas.width : 640;
const CANVAS_H = canvas ? canvas.height : 360;
const tiles = [
  { x: 0, y: CANVAS_H - 40, width: CANVAS_W, height: 40 },
  { x: 0, y: 0, width: 20, height: CANVAS_H },
  { x: CANVAS_W - 20, y: 0, width: 20, height: CANVAS_H },
  { x: 200, y: 250, width: 100, height: 20 },
  { x: 400, y: 150, width: 100, height: 20 }
];

// Helpers
function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function getHitbox(p, act = action) {
  const data = frameData[act];
  const adj = hitboxAdjustments[act] || hitboxAdjustments.idle;
  const scale = data.scale;
  return {
    x: p.x + adj.offsetX * scale,
    y: p.y + adj.offsetY * scale,
    width: adj.width * scale,
    height: adj.height * scale
  };
}

// Adjust hitbox adjustments for an animation. side = 'left'|'right'|'top'|'bottom'
function adjustHitbox(act, side, delta) {
  const adj = hitboxAdjustments[act] || hitboxAdjustments.idle;
  if (side === 'left') {
    adj.offsetX = Math.max(0, adj.offsetX + delta);
  } else if (side === 'top') {
    adj.offsetY = Math.max(0, adj.offsetY + delta);
  } else if (side === 'right') {
    adj.width = Math.max(1, adj.width + delta);
  } else if (side === 'bottom') {
    adj.height = Math.max(1, adj.height + delta);
  }
}

// Collision resolution using previous position to determine axis of impact
function resolveCollisions(p) {
  const prev = { x: p.x - p.vx, y: p.y - p.vy };
  const prevHB = getHitbox({ x: prev.x, y: prev.y }, action);

  p.onGround = false;
  const hb = getHitbox(p, action);

  for (let tile of tiles) {
    if (!isColliding(hb, tile)) continue;

    // moved down into tile -> landing
    if (prevHB.y + prevHB.height <= tile.y) {
      const overlap = hb.y + hb.height - tile.y;
      p.y -= overlap;
      p.vy = 0;
      p.onGround = true;
    }
    // moved up into tile -> hit head
    else if (prevHB.y >= tile.y + tile.height) {
      const overlap = tile.y + tile.height - hb.y;
      p.y += overlap;
      p.vy = 0;
    }
    // moved right into tile -> hit wall on right
    else if (prevHB.x + prevHB.width <= tile.x) {
      const overlap = hb.x + hb.width - tile.x;
      p.x -= overlap;
      p.vx = 0;
    }
    // moved left into tile -> hit wall on left
    else if (prevHB.x >= tile.x + tile.width) {
      const overlap = tile.x + tile.width - hb.x;
      p.x += overlap;
      p.vx = 0;
    }

    // recompute hitbox after resolution for further tiles
    Object.assign(hb, getHitbox(p, action));
  }
}

// Animation helper
function setAction(newAction) {
  if (action !== newAction) {
    action = newAction;
    frameIndex = 0;
    tickCount = 0;
  }
}

// Physics + animation update
function update() {
  // Horizontal input
  if (keys["ArrowLeft"]) player.vx = -player.speed;
  else if (keys["ArrowRight"]) player.vx = player.speed;
  else player.vx = 0;

  // Jump
  if ((keys["Space"] || keys["ArrowUp"]) && player.onGround) {
    player.vy = player.jumpPower;
    player.onGround = false;
  }

  // Apply gravity
  player.vy += GRAVITY;

  // Apply movement
  player.x += player.vx;
  player.y += player.vy;

  // Resolve collisions
  resolveCollisions(player);

  // Animation tick
  tickCount++;
  const data = frameData[action];
  if (tickCount > TICKS_PER_FRAME) {
    tickCount = 0;
    if (action === "jump" || action === "crouch") {
      if (frameIndex < data.frames - 1) frameIndex++;
    } else {
      frameIndex = (frameIndex + 1) % data.frames;
    }
  }

  // Decide action
  if (!player.onGround) setAction("jump");
  else if (keys["ArrowDown"]) setAction("crouch");
  else if (player.vx !== 0) setAction("walk");
  else setAction("idle");
}

function draw() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // tiles
  ctx.fillStyle = "green";
  for (let t of tiles) ctx.fillRect(t.x, t.y, t.width, t.height);

  // draw sprite
  const sprite = sprites[action];
  const data = frameData[action];
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (facing === "left") {
    ctx.translate(player.x + data.w * data.scale, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, frameIndex * data.w, 0, data.w, data.h, 0, 0, data.w * data.scale, data.h * data.scale);
  } else {
    ctx.drawImage(sprite, frameIndex * data.w, 0, data.w, data.h, player.x, player.y, data.w * data.scale, data.h * data.scale);
  }
  ctx.restore();

  // debug overlay
  if (debug) {
    // sprite rect
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,255,0.9)";
    ctx.fillStyle = "rgba(0,0,255,0.12)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.restore();

    // hitbox
    const hb = getHitbox(player, action);
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
    ctx.fillStyle = "red";
    ctx.fillRect(hb.x + hb.width / 2 - 2, hb.y + hb.height / 2 - 2, 4, 4);
    ctx.restore();

    // tiles outlines
    ctx.save();
    for (let t of tiles) {
      ctx.fillStyle = "rgba(0,255,0,0.08)";
      ctx.fillRect(t.x, t.y, t.width, t.height);
      ctx.strokeStyle = "rgba(0,128,0,0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(t.x, t.y, t.width, t.height);
    }
    ctx.restore();

    // debug text
    ctx.save();
    ctx.fillStyle = "black";
    ctx.font = "12px monospace";
    const hbInfo = getHitbox(player, action);
    ctx.fillText(`action:${action} pos:${Math.round(player.x)},${Math.round(player.y)} vx:${player.vx} vy:${player.vy.toFixed(2)}`, 8, 16);
    ctx.fillText(`hitbox:${Math.round(hbInfo.x)},${Math.round(hbInfo.y)} ${Math.round(hbInfo.width)}x${Math.round(hbInfo.height)}`, 8, 32);
  // show selected hitbox side and current adjustment values
  const adj = hitboxAdjustments[action];
  ctx.fillText(`selected:${hitboxEdit || '-'}  left(offsetX):${adj.offsetX}  top(offsetY):${adj.offsetY}`, 8, 48);
  ctx.fillText(`right(width):${adj.width}  bottom(height):${adj.height}  [H/K/J/L select] [] adjust  R reset`, 8, 64);
    ctx.restore();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start when all sprites are loaded
function loadSprites() {
  const list = Object.values(sprites);
  return new Promise((resolve) => {
    let loaded = 0;
    list.forEach(img => {
      img.onload = () => {
        loaded++;
        if (loaded === list.length) resolve();
      };
      // in case images already cached
      if (img.complete) {
        loaded++;
      }
    });
    if (loaded === list.length) resolve();
  });
}

loadSprites().then(() => gameLoop());