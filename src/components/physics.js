import { GRAVITY } from "../config/constants.js";

export default class PhysicsComponent {
	constructor(entity, gravity = GRAVITY) {
		this.entity = entity;
		this.gravity = gravity;
	}

	applyInput(input) {
		const e = this.entity;
		if (input.isDown("ArrowLeft")) e.vx = -e.speed;
		else if (input.isDown("ArrowRight")) e.vx = e.speed;
		else e.vx = 0;
		// jump handled by entity when input pressed and onGround
	}

	integrate() {
		const e = this.entity;
		// remember previous for collision resolution
		e.prevX = e.x;
		e.prevY = e.y;
		// gravity
		e.vy += this.gravity;
		// integrate
		e.x += e.vx;
		e.y += e.vy;
	}
}
