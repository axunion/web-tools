const DB_NAME = 'db';
const STORE_NAME = 'store';
const VERSION = 1;

class IndexedDBError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IndexedDBError';
    }
}

export class IndexedDB<T> {
    #dbName: string;
    #storeName: string;
    #dbConnection: IDBDatabase | null = null;

    constructor(dbName: string = DB_NAME, storeName: string = STORE_NAME) {
        this.#dbName = dbName;
        this.#storeName = storeName;
    }

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open(this.#dbName, VERSION);

            openRequest.onupgradeneeded = (e: IDBVersionChangeEvent) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.#storeName)) {
                    db.createObjectStore(this.#storeName);
                }
            };

            openRequest.onsuccess = () => {
                this.#dbConnection = openRequest.result;
                resolve();
            };

            openRequest.onerror = () => {
                reject(
                    new IndexedDBError(
                        `Error opening database ${this.#dbName}`,
                    ),
                );
            };

            openRequest.onblocked = () => {
                const message =
                    `Database ${this.#dbName} is blocked.` +
                    `Close other tabs or windows accessing this database.`;
                reject(new IndexedDBError(message));
            };
        });
    }

    #getDB(): IDBDatabase {
        if (!this.#dbConnection) {
            const message =
                `Database ${this.#dbName} is not initialized.` +
                `Please ensure you've called init() before any operations.`;
            throw new IndexedDBError(message);
        }

        return this.#dbConnection;
    }

    async set(key: string, value: T): Promise<void> {
        const db = this.#getDB();
        const transaction = db.transaction(this.#storeName, 'readwrite');
        const store = transaction.objectStore(this.#storeName);
        store.put(value, key);

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(new IndexedDBError(`Error setting key ${key}`));
        });
    }

    async get(key: string): Promise<T> {
        const db = this.#getDB();
        const transaction = db.transaction(this.#storeName, 'readonly');
        const store = transaction.objectStore(this.#storeName);
        const request = store.get(key);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () =>
                reject(new IndexedDBError(`Error fetching key ${key}`));
        });
    }

    async delete(key: string): Promise<void> {
        const db = this.#getDB();
        const transaction = db.transaction(this.#storeName, 'readwrite');
        const store = transaction.objectStore(this.#storeName);
        store.delete(key);

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(new IndexedDBError(`Error deleting key ${key}`));
        });
    }

    close(): void {
        if (this.#dbConnection) {
            this.#dbConnection.close();
            this.#dbConnection = null;
        }
    }
}
