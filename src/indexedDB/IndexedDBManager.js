export default class IndexedDbManager {
	constructor(databaseName, storeName) {
		this.databaseName = databaseName;
		this.storeName = storeName;
		this.db = null;
	}

	async openDatabase() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.databaseName);

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
                // crear tabla de juagdores si no existe
                if (!db.objectStoreNames.contains('players')) {
                    console.log('Creando almacén de jugadores');
                    const playersStore = db.createObjectStore('players', { keyPath: 'id', autoIncrement: true });
                    playersStore.createIndex('name', 'name', { unique: true });
                    playersStore.createIndex('currentScore', 'currentScore');
                    playersStore.createIndex('bestScore', 'bestScore');
                }
			};

			request.onsuccess = (event) => {
				this.db = event.target.result;
				resolve(this.db);
			};

			request.onerror = (event) => {
				reject(
					new Error(`Error opening IndexedDB: ${event.target.error}`)
				);
			};
		});
	}

	closeDatabase() {
		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	async addItem(item) {
		const db = await this.openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);
			const request = store.add(item);

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = (event) => {
				reject(
					new Error(
						`Error adding item to IndexedDB: ${event.target.error}`
					)
				);
			};
		});
	}

	async updateItem(item) {
		const db = await this.openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);
			const request = store.put(item);

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = (event) => {
				reject(
					new Error(
						`Error updating item in IndexedDB: ${event.target.error}`
					)
				);
			};
		});
	}

	async getItem(id) {
		const db = await this.openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readonly");
			const store = transaction.objectStore(this.storeName);
			const request = store.get(id);

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = (event) => {
				reject(
					new Error(
						`Error getting item from IndexedDB: ${event.target.error}`
					)
				);
			};
		});
	}

	async getItemByName(name) {
		// Abrir la BD y buscar por el índice 'name' si existe
		const db = await this.openDatabase();
		return new Promise((resolve, reject) => {
			try {
				const transaction = db.transaction([this.storeName], "readonly");
				const store = transaction.objectStore(this.storeName);
				// usamos el índice 'name' creado en onupgradeneeded
				let request;
				if (store.indexNames && store.indexNames.contains('name')) {
					const index = store.index('name');
					request = index.get(name);
				} else {
					// si no existe índice, intentamos get por clave primaria (probablemente falle)
					request = store.get(name);
				}

				request.onsuccess = () => {
					resolve(request.result);
				};

				request.onerror = (event) => {
					reject(
						new Error(
							`Error getting item from IndexedDB: ${event.target.error}`
						)
					);
				};
			} catch (err) {
				reject(err);
			}
		});
	}

	async deleteItem(id) {
		const db = await this.openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);
			const request = store.delete(id);

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = (event) => {
				reject(
					new Error(
						`Error deleting item from IndexedDB: ${event.target.error}`
					)
				);
			};
		});
	}

	async getAllItems() {
		const db = await this.openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readonly");
			const store = transaction.objectStore(this.storeName);
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = (event) => {
				reject(
					new Error(
						`Error getting items from IndexedDB: ${event.target.error}`
					)
				);
			};
		});
	}

	async clearItems() {
		const db = await this.openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([this.storeName], "readwrite");
			const store = transaction.objectStore(this.storeName);
			const request = store.clear();

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = (event) => {
				reject(
					new Error(
						`Error clearing items in IndexedDB: ${event.target.error}`
					)
				);
			};
		});
	}
}