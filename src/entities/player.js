import AnimationComponent from "../components/animation.js";
import PhysicsComponent from "../components/physics.js";
import CollisionComponent from "../components/collision.js";
import { DEFAULT_SPEED, DEFAULT_JUMP, GRAVITY } from "../config/constants.js";

export default class Player {
	constructor(x, y, sprites, frameData, hitboxAdjustments, tiles) {
		this.x = x;
		this.y = y;
		this.prevX = x;
		this.prevY = y;
		this.vx = 0;
		this.vy = 0;
		this.speed = DEFAULT_SPEED;
		this.jumpPower = DEFAULT_JUMP;
		this.width = frameData.idle.w * frameData.idle.scale;
		this.height = frameData.idle.h * frameData.idle.scale;
		this.onGround = false;
		this.action = "idle";
		this.sprites = sprites;
		this.frameData = frameData;
		this.hitboxAdjustments = hitboxAdjustments;
		this.facing = "right";

		this.animation = new AnimationComponent(this, sprites, frameData);
		this.physics = new PhysicsComponent(this, GRAVITY);
		this.collision = new CollisionComponent(
			this,
			tiles,
			hitboxAdjustments,
			frameData
		);
	}

	update(input) {
		// handle jump input
		if (
			(input.isDown("Space") || input.isDown("ArrowUp")) &&
			this.onGround
		) {
			this.vy = this.jumpPower;
			this.onGround = false;
		}

		// update facing based on input
		if (input.isDown("ArrowLeft")) this.facing = "left";
		else if (input.isDown("ArrowRight")) this.facing = "right";

		// apply input to physics
		this.physics.applyInput(input);
		// integrate
		this.physics.integrate();
		// resolve collisions
		this.collision.resolve();

		// update animation state based on physics
		if (!this.onGround) this.setAction("jump");
		else if (input.isDown("ArrowDown")) this.setAction("crouch");
		else if (this.vx !== 0) this.setAction("walk");
		else this.setAction("idle");

		this.animation.update();
	}

	setAction(a) {
		if (this.action !== a) {
			this.action = a;
			this.animation.setAction(a);
		}
	}

	draw(renderer, facing) {
		this.animation.draw(renderer, this.x, this.y, facing);
		// renderer.rect(this.x, this.y, this.width, this.height, { stroke: 'rgba(0,0,255,0.9)', fill: 'rgba(0,0,255,0.12)' });
	}
}
