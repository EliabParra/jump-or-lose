export default class CollisionComponent {
	constructor(entity, tiles, hitboxAdjustments, frameData) {
		this.entity = entity;
		this.tiles = tiles;
		this.hitboxAdjustments = hitboxAdjustments;
		this.frameData = frameData;
	}

	getHitbox(act = this.entity.action) {
		const e = this.entity;
		const data = this.frameData[act];
		const adj = this.hitboxAdjustments[act] || this.hitboxAdjustments.idle;
		const scale = data.scale;
		return {
			x: e.x + adj.offsetX * scale,
			y: e.y + adj.offsetY * scale,
			width: adj.width * scale,
			height: adj.height * scale,
		};
	}

	resolve() {
		const e = this.entity;
		const prev = {
			x: e.prevX !== undefined ? e.prevX : e.x,
			y: e.prevY !== undefined ? e.prevY : e.y,
		};
		const prevHB = this._getHitboxAt(prev.x, prev.y, e.action);
		e.onGround = false;
		let hb = this.getHitbox();

		for (let tile of this.tiles) {
			if (!this._isColliding(hb, tile)) continue;

			if (prevHB.y + prevHB.height <= tile.y) {
				const overlap = hb.y + hb.height - tile.y;
				e.y -= overlap;
				e.vy = 0;
				e.onGround = true;
			} else if (prevHB.y >= tile.y + tile.height) {
				const overlap = tile.y + tile.height - hb.y;
				e.y += overlap;
				e.vy = 0;
			} else if (prevHB.x + prevHB.width <= tile.x) {
				const overlap = hb.x + hb.width - tile.x;
				e.x -= overlap;
				e.vx = 0;
			} else if (prevHB.x >= tile.x + tile.width) {
				const overlap = tile.x + tile.width - hb.x;
				e.x += overlap;
				e.vx = 0;
			}

			hb = this.getHitbox();
		}
	}

	_getHitboxAt(x, y, act) {
		const data = this.frameData[act];
		const adj = this.hitboxAdjustments[act] || this.hitboxAdjustments.idle;
		const scale = data.scale;
		return {
			x: x + adj.offsetX * scale,
			y: y + adj.offsetY * scale,
			width: adj.width * scale,
			height: adj.height * scale,
		};
	}

	_isColliding(a, b) {
		return (
			a.x < b.x + b.width &&
			a.x + a.width > b.x &&
			a.y < b.y + b.height &&
			a.y + a.height > b.y
		);
	}
}
