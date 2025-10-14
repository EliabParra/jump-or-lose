const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Cargar spritesheets
const sprites = {
  idle: new Image(),
  run: new Image(),
  jump: new Image(),
  crouch: new Image()
};

sprites.idle.src = "Junimo_idle.png";
sprites.run.src = "Junimo_run.png";
sprites.jump.src = "Junimo_jump.png";
sprites.crouch.src = "Junimo_crouch.png";

// Configuración de frames (ajusta según cada spritesheet)
const frameData = {
  idle: { w: 20, h: 24, frames: 8 },
  run: { w: 20, h: 24, frames: 4 },
  jump: { w: 20, h: 24, frames: 4 },
  crouch: { w: 20, h: 24, frames: 3}
};

let action = "idle";
let frameIndex = 0;
let tickCount = 0;
const ticksPerFrame = 8;
let x = 200, y = 200;

// Controles
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") action = "run";
  if (e.key === "ArrowUp") action = "jump";
  if (e.key === "ArrowDown") action = "crouch";
});

document.addEventListener("keyup", () => {
  action = "idle";
});

// Animación
function update() {
  tickCount++;
  if (tickCount > ticksPerFrame) {
    tickCount = 0;
    frameIndex = (frameIndex + 1) % frameData[action].frames;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sprite = sprites[action];
  const data = frameData[action];

  ctx.drawImage(
    sprite,
    frameIndex * data.w, 0, data.w, data.h, // recorte
    x, y, data.w, data.h                    // posición
  );
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Iniciar cuando carguen las imágenes
sprites.idle.onload = () => gameLoop();