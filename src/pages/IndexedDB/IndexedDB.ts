const DEFAULT_DB_NAME = "db";
const DEFAULT_STORE_NAME = "store";

export class IndexedDBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IndexedDBError";
  }
}

export class IndexedDB<T> {
  #dbName: string;
  #storeName: string;
  #options?: IDBObjectStoreParameters;
  #dbConnection: IDBDatabase | null = null;

  constructor(
    dbName: string = DEFAULT_DB_NAME,
    storeName: string = DEFAULT_STORE_NAME,
    options?: IDBObjectStoreParameters,
  ) {
    this.#dbName = dbName;
    this.#storeName = storeName;
    this.#options = options;
  }

  async init(): Promise<void> {
    if (this.#dbConnection) {
      return;
    }

    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open(this.#dbName);

      openRequest.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.#storeName)) {
          db.createObjectStore(this.#storeName, this.#options);
        }
      };

      openRequest.onsuccess = () => {
        this.#dbConnection = openRequest.result;
        resolve();
      };

      openRequest.onerror = () => {
        reject(new IndexedDBError(`Error opening database ${this.#dbName}`));
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

  async put(
    value: T,
    key?: IDBValidKey | undefined,
  ): Promise<IDBValidKey | undefined> {
    const db = this.#getDB();
    const transaction = db.transaction(this.#storeName, "readwrite");
    const store = transaction.objectStore(this.#storeName);
    const request = store.put(value, key);
    let savedKey: IDBValidKey | undefined;

    return new Promise((resolve, reject) => {
      request.onsuccess = (e) => (savedKey = (e.target as IDBRequest).result);
      transaction.oncomplete = () => resolve(savedKey);
      transaction.onerror = () =>
        reject(new IndexedDBError(`Error putting key ${key}`));
    });
  }

  async set(key: string, value: T): Promise<IDBValidKey | undefined> {
    return this.put(value, key);
  }

  async get(query: IDBValidKey | IDBKeyRange): Promise<T> {
    const db = this.#getDB();
    const transaction = db.transaction(this.#storeName, "readonly");
    const store = transaction.objectStore(this.#storeName);
    const request = store.get(query);
    let result: T;

    return new Promise((resolve, reject) => {
      request.onsuccess = () => (result = request.result);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () =>
        reject(new IndexedDBError(`Error fetching key ${query}`));
    });
  }

  async getMap(
    limit = 1000,
    direction: IDBCursorDirection = "next",
  ): Promise<Map<string, T>> {
    const db = this.#getDB();
    const transaction = db.transaction(this.#storeName, "readonly");
    const store = transaction.objectStore(this.#storeName);
    const cursor = store.openCursor(null, direction);
    const entries: Map<string, T> = new Map();
    let count = 0;

    return new Promise((resolve, reject) => {
      cursor.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;

        if (cursor && count < limit) {
          entries.set(cursor.key, cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(entries);
        }
      };

      cursor.onerror = () => {
        reject(new IndexedDBError(`Error fetching all entries`));
      };
    });
  }

  async delete(key: string): Promise<void> {
    const db = this.#getDB();
    const transaction = db.transaction(this.#storeName, "readwrite");
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
