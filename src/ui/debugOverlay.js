export default class DebugOverlay {
	constructor(engine, player, hitboxAdjustments) {
		this.engine = engine;
		this.player = player;
		this.hitboxAdjustments = hitboxAdjustments;
		this.selected = null; // 'left'|'right'|'top'|'bottom'
	}

	draw(ctx) {
		if (!this.engine.debug) return;
		// draw sprite rect
		ctx.strokeStyle = "rgba(0,0,255,0.9)";
		ctx.fillStyle = "rgba(0,0,255,0.12)";
		ctx.lineWidth = 1.5;
		ctx.strokeRect(
			this.player.x,
			this.player.y,
			this.player.width,
			this.player.height
		);
		ctx.fillRect(
			this.player.x,
			this.player.y,
			this.player.width,
			this.player.height
		);

		// draw hitbox
		const adj = this.hitboxAdjustments[this.player.action];
		const scale = this.player.frameData[this.player.action].scale;
		const hb = {
			x: this.player.x + adj.offsetX * scale,
			y: this.player.y + adj.offsetY * scale,
			width: adj.width * scale,
			height: adj.height * scale,
		};
		ctx.strokeStyle = "red";
		ctx.lineWidth = 2;
		ctx.strokeRect(hb.x, hb.y, hb.width, hb.height);
		ctx.fillStyle = "red";
		ctx.fillRect(hb.x + hb.width / 2 - 2, hb.y + hb.height / 2 - 2, 4, 4);

		// text
		ctx.fillStyle = "black";
		ctx.font = "12px monospace";
		ctx.fillText(
			`action:${this.player.action} pos:${Math.round(
				this.player.x
			)},${Math.round(this.player.y)} vx:${
				this.player.vx
			} vy:${this.player.vy.toFixed(2)}`,
			8,
			16
		);
		ctx.fillText(
			`hitbox:${Math.round(hb.x)},${Math.round(hb.y)} ${Math.round(
				hb.width
			)}x${Math.round(hb.height)}`,
			8,
			32
		);
		ctx.fillText(
			`selected:${this.selected || "-"}  left(offsetX):${
				adj.offsetX
			}  top(offsetY):${adj.offsetY}`,
			8,
			48
		);
		ctx.fillText(
			`right(width):${adj.width}  bottom(height):${adj.height}  [H/K/J/L select] [] adjust  R reset`,
			8,
			64
		);
	}
}
