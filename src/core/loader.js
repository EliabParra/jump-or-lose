export default class Loader {
	static loadImages(map) {
		const entries = Object.entries(map);
		const result = {};
		return new Promise((resolve) => {
			let loaded = 0;
			if (entries.length === 0) resolve(result);
			entries.forEach(([key, src]) => {
				const img = new Image();
				img.src = src;
				img.onload = () => {
					result[key] = img;
					loaded++;
					if (loaded === entries.length) resolve(result);
				};
				// in case cached
				if (img.complete) {
					result[key] = img;
					loaded++;
					if (loaded === entries.length) resolve(result);
				}
			});
		});
	}
}
