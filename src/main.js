import Loader from "./core/loader.js";
import Keyboard from "./input/keyboard.js";
import Renderer from "./render/renderer.js";
import Engine from "./core/engine.js";
import Player from "./entities/player.js";
import DebugOverlay from "./ui/debugOverlay.js";
import { ASSET_PATH, DEFAULT_SCALE } from "./config/constants.js";

const canvas = document.getElementById("gameCanvas");

const frameData = {
	idle: { w: 20, h: 24, frames: 8, scale: DEFAULT_SCALE },
	walk: { w: 20, h: 24, frames: 4, scale: DEFAULT_SCALE },
	jump: { w: 20, h: 24, frames: 4, scale: DEFAULT_SCALE },
	crouch: { w: 20, h: 24, frames: 3, scale: DEFAULT_SCALE },
};

const hitboxAdjustments = {
	idle: { offsetX: 6, offsetY: 7, width: 8, height: 12 },
	walk: { offsetX: 6, offsetY: 7, width: 8, height: 12 },
	jump: { offsetX: 6, offsetY: 6, width: 8, height: 13 },
	crouch: { offsetX: 6, offsetY: 10, width: 8, height: 9 },
};

const tiles = [
	{ x: 0, y: canvas.height - 40, width: canvas.width, height: 40 },
	{ x: 0, y: 0, width: 20, height: canvas.height },
	{ x: canvas.width - 20, y: 0, width: 20, height: canvas.height },
	{ x: 200, y: 250, width: 100, height: 20 },
	{ x: 400, y: 150, width: 100, height: 20 },
];

// helper to adjust hitbox from UI
function adjustHitbox(act, side, delta) {
	const adj = hitboxAdjustments[act];
	if (!adj) return;
	if (side === "left") adj.offsetX = Math.max(0, adj.offsetX + delta);
	else if (side === "top") adj.offsetY = Math.max(0, adj.offsetY + delta);
	else if (side === "right") adj.width = Math.max(1, adj.width + delta);
	else if (side === "bottom") adj.height = Math.max(1, adj.height + delta);
}

async function bootstrap() {
	const assets = {
		idle: ASSET_PATH + "Junimo_Idle.png",
		walk: ASSET_PATH + "Junimo_Walk.png",
		jump: ASSET_PATH + "Junimo_Jump.png",
		crouch: ASSET_PATH + "Junimo_Crouch.png",
	};

	const images = await Loader.loadImages(assets);

	const keyboard = new Keyboard();
	keyboard.start();

	const renderer = new Renderer(canvas);
	const engine = new Engine(canvas);
	engine.setKeyboard(keyboard);
	engine.setRenderer(renderer);
	engine.tiles = tiles;
	engine.facing = "right";

	const player = new Player(
		50,
		50,
		images,
		frameData,
		hitboxAdjustments,
		tiles
	);
	engine.addEntity(player);

	const overlay = new DebugOverlay(engine, player, hitboxAdjustments);
	engine.overlay = overlay;

	// central debug flag
	engine.debug = false;

	// key handler for debug/editor controls
	window.addEventListener("keydown", (e) => {
		if (e.code === "KeyD") engine.debug = !engine.debug;
		if (!engine.debug) return;

		// select side H/L/K/J
		if (e.code === "KeyH") overlay.selected = "left";
		if (e.code === "KeyL") overlay.selected = "right";
		if (e.code === "KeyK") overlay.selected = "top";
		if (e.code === "KeyJ") overlay.selected = "bottom";

		if (
			(e.code === "BracketLeft" || e.code === "BracketRight") &&
			overlay.selected
		) {
			const delta = e.code === "BracketRight" ? 1 : -1;
			adjustHitbox(player.action, overlay.selected, delta);
		}

		if (e.code === "KeyR") {
			hitboxAdjustments[player.action] = Object.assign(
				{},
				hitboxAdjustments[player.action]
			);
		}
	});

	engine.start();
}

bootstrap();
