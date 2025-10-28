export default class Renderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
	}

	drawTiles(tiles) {
		const ctx = this.ctx;
		ctx.fillStyle = "green";
		for (const t of tiles) ctx.fillRect(t.x, t.y, t.width, t.height);
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	drawSprite(image, sx, sy, sw, sh, dx, dy, dw, dh) {
		this.ctx.imageSmoothingEnabled = false;
		this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
	}

	rect(x, y, w, h, opts = {}) {
		const ctx = this.ctx;
		if (opts.fill) {
			ctx.fillStyle = opts.fill;
			ctx.fillRect(x, y, w, h);
		}
		if (opts.stroke) {
			ctx.strokeStyle = opts.stroke;
			ctx.lineWidth = opts.lineWidth || 1;
			ctx.strokeRect(x, y, w, h);
		}
	}

	text(text, x, y, opts = {}) {
		const ctx = this.ctx;
		ctx.fillStyle = opts.fill || "white";
		ctx.font = opts.font || "12px monospace";
		ctx.fillText(text, x, y);
	}
}
