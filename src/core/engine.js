export default class Engine {
	constructor(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.entities = [];
		this.running = false;
		this.lastTime = 0;
		this.keyboard = null;
		this.renderer = null;
	}

	setKeyboard(kb) {
		this.keyboard = kb;
	}
	setRenderer(r) {
		this.renderer = r;
	}

	addEntity(e) {
		this.entities.push(e);
	}

	start() {
		this.running = true;
		this.lastTime = performance.now();
		requestAnimationFrame(this._loop.bind(this));
	}

	_loop(now) {
		const dt = (now - this.lastTime) / 16.67; // approx frames
		this.lastTime = now;

		// update
		for (const e of this.entities) {
			if (typeof e.update === "function") e.update(this.keyboard);
		}

		// render
		this.renderer.clear();
		// scene draw: tiles first if renderer exposes method
		if (this.renderer && this.renderer.drawTiles && this.tiles)
			this.renderer.drawTiles(this.tiles);
		for (const e of this.entities) {
			if (typeof e.draw === "function")
				e.draw(this.renderer, e.facing || "right");
		}

		// debug overlay
		if (this.overlay && typeof this.overlay.draw === "function") {
			this.overlay.draw(this.renderer.ctx);
		}

		if (this.running) requestAnimationFrame(this._loop.bind(this));
	}
}
