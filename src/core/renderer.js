import { DEFAULT_SCALE } from "../config/constants.js";

// Clase para encapsular operaciones de dibujo en canvas.
// Provee métodos reutilizables: limpiar, dibujar fondo, sprites, rects y texto.
export default class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    if (this.ctx) this.ctx.imageSmoothingEnabled = false;
  }

  // Limpiar todo el canvas
  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Dibujar una imagen de fondo estirada al tamaño del canvas
  drawBackground(img) {
    if (!this.ctx || !img) return;
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
  }

  // Dibujar un frame de un sprite (soporta volteo horizontal)
  drawSprite(sprite, frameIndex, data, x, y, facing = 'right') {
    if (!this.ctx || !sprite) return;
    const w = data.w;
    const h = data.h;
    const scale = data.scale || DEFAULT_SCALE;
    this.ctx.save();
    if (facing === 'left') {
      // Voltear horizontalmente manteniendo la posición visual
      this.ctx.translate(x + w * scale, y);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(sprite, frameIndex * w, 0, w, h, 0, 0, w * scale, h * scale);
    } else {
      this.ctx.drawImage(sprite, frameIndex * w, 0, w, h, x, y, w * scale, h * scale);
    }
    this.ctx.restore();
  }

  // Dibujar rectángulos (relleno y/o contorno) con opciones
  rect(x, y, w, h, opts = {}) {
    if (!this.ctx) return;
    if (opts.fill) {
      this.ctx.fillStyle = opts.fill;
      this.ctx.fillRect(x, y, w, h);
    }
    if (opts.stroke) {
      this.ctx.strokeStyle = opts.stroke;
      this.ctx.lineWidth = opts.lineWidth || 1;
      this.ctx.strokeRect(x, y, w, h);
    }
  }

  // Texto simple en pantalla
  text(txt, x, y, opts = {}) {
    if (!this.ctx) return;
    this.ctx.fillStyle = opts.color || 'black';
    this.ctx.font = opts.font || '12px monospace';
    this.ctx.fillText(txt, x, y);
  }

  drawScore(score, stage) {
    if (this.hudElement) {
      try { this.hudElement.textContent = `Score: ${score}`; } catch (e) {}
      return;
    }

    if (!this.ctx) return;
    const fontSize = 12;
    const font = `${fontSize}px monospace`;
    const padding = 8;
    const x = 10, y = 10;
    const text = `Score: ${score}`;

    this.ctx.save();
    this.ctx.font = font;
    this.ctx.textBaseline = 'top';
    const textWidth = Math.ceil(this.ctx.measureText(text).width);
    const w = textWidth + padding * 2;
    const h = fontSize + padding * 2;

    this.ctx.fillStyle = 'rgba(255,209,102,0.95)';
    this.ctx.fillRect(x, y, w, h);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(180,120,0,0.9)';
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.fillStyle = '#111';
    this.ctx.fillText(text, x + padding, y + padding);
    this.ctx.restore();
  }
}