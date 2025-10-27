const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Variable de direccion del sprite
let facing = "right";

// Cargar spritesheets
const sprites = {
  idle: new Image(),
  walk: new Image(),
  jump: new Image(),
  crouch: new Image()
};

sprites.idle.src = "../assets/sprites/Junimo_Idle.png";
sprites.walk.src = "../assets/sprites/Junimo_Walk.png";
sprites.jump.src = "../assets/sprites/Junimo_Jump.png";
sprites.crouch.src = "../assets/sprites/Junimo_Crouch.png";

// Configuración de frames (ajusta según cada spritesheet)
const frameData = {
  idle:   { w: 20, h: 24, frames: 8, scale: 7 },
  walk:   { w: 20, h: 24, frames: 4, scale: 7 },
  jump:   { w: 20, h: 24, frames: 4, speed: 8, scale: 7 },
  crouch: { w: 20, h: 24, frames: 3, speed: 8, scale: 7 }
};

let action = "idle";
let frameIndex = 0;
let tickCount = 0;
const ticksPerFrame = 8;
let x = 200, y = 200;

// función para cambiar de animación de forma segura
function setAction(newAction) {
  if (action !== newAction) {
    action = newAction;
    frameIndex = 0;   // reinicia al primer frame
    tickCount = 0;    // reinicia el contador de ticks
  }
}

// Controles

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") setAction("walk"), facing = "right";
  if (e.key === "ArrowLeft") setAction("walk"), facing = "left";
  if (e.key === "ArrowUp") setAction("jump");
  if (e.key === "ArrowDown") setAction("crouch");
});

document.addEventListener("keyup", () => {
  setAction("idle");
});

// Animación
function update() {
  tickCount++;
  const data = frameData[action];

  if (tickCount > ticksPerFrame) {
    tickCount = 0;

    if (action === "jump" || action === "crouch") {
      // Avanza hasta el último frame y se queda ahí
      if (frameIndex < data.frames - 1) {
        frameIndex++;
      }
      // Si ya está en el último frame, no hace nada más
    } else {
      // Animaciones que sí ciclan (idle, walk, etc.)
      frameIndex = (frameIndex + 1) % data.frames;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sprite = sprites[action];
  const data = frameData[action];
  ctx.imageSmoothingEnabled = false;

  ctx.save();

    if (facing === "left") {
    // mover el origen y escalar en -1 para voltear
    ctx.translate(x + data.w * data.scale, y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      sprite,
      frameIndex * data.w, 0, data.w, data.h,
      0, 0, data.w * data.scale, data.h * data.scale
    );
  } else {
    // normal (mirando a la derecha)
    ctx.drawImage(
      sprite,
      frameIndex * data.w, 0, data.w, data.h,
      x, y, data.w * data.scale, data.h * data.scale
    );
  }
  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Iniciar cuando carguen las imágenes
sprites.idle.onload = () => gameLoop();