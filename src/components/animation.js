import { TICKS_PER_FRAME } from "../config/constants.js";

export default class AnimationComponent {
	constructor(entity, sprites, frameData) {
		this.entity = entity;
		this.sprites = sprites; // map of action->Image
		this.frameData = frameData;
		this.action = "idle";
		this.frameIndex = 0;
		this.tickCount = 0;
		this.ticksPerFrame = frameData.ticksPerFrame || TICKS_PER_FRAME;
	}

	setAction(a) {
		if (this.action !== a) {
			this.action = a;
			this.frameIndex = 0;
			this.tickCount = 0;
		}
	}

	update() {
		this.tickCount++;
		const data = this.frameData[this.action];
		if (this.tickCount > this.ticksPerFrame) {
			this.tickCount = 0;
			if (this.action === "jump" || this.action === "crouch") {
				if (this.frameIndex < data.frames - 1) this.frameIndex++;
			} else {
				this.frameIndex = (this.frameIndex + 1) % data.frames;
			}
		}
	}

	draw(renderer, x, y, facing) {
		const sprite = this.sprites[this.action];
		const data = this.frameData[this.action];
		if (!sprite) return;
		const dw = data.w * data.scale;
		const dh = data.h * data.scale;
		if (facing === "left") {
			const ctx = renderer.ctx;
			ctx.save();
			ctx.translate(x + dw, y);
			ctx.scale(-1, 1);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(
				sprite,
				this.frameIndex * data.w,
				0,
				data.w,
				data.h,
				0,
				0,
				dw,
				dh
			);
			ctx.restore();
		} else {
			renderer.drawSprite(
				sprite,
				this.frameIndex * data.w,
				0,
				data.w,
				data.h,
				x,
				y,
				dw,
				dh
			);
		}
	}
}
