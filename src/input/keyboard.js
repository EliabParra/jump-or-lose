export default class Keyboard {
	constructor() {
		this.keys = {};
		this._down = this._down.bind(this);
		this._up = this._up.bind(this);
	}

	start() {
		window.addEventListener("keydown", this._down);
		window.addEventListener("keyup", this._up);
	}

	stop() {
		window.removeEventListener("keydown", this._down);
		window.removeEventListener("keyup", this._up);
	}

	_down(e) {
		this.keys[e.code] = true;
		// prevent scroll when arrows/space
		if (
			[
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"Space",
			].includes(e.code)
		)
			e.preventDefault();
	}

	_up(e) {
		this.keys[e.code] = false;
	}

	isDown(code) {
		return !!this.keys[code];
	}
}
