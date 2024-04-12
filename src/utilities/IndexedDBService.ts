type DBDefinition = {
  name: string;
  version: number;
  stores: StoreDefinition[];
};

type StoreDefinition = {
  name: string;
  options?: IDBObjectStoreParameters;
};

export class IndexedDBServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IndexedDBServiceError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IndexedDBService {
  #db: IDBDatabase | null = null;
  #name: string;
  #version: number;
  #stores: StoreDefinition[];
  #storeName = "";

  constructor({ name, version, stores }: DBDefinition) {
    this.#name = name;
    this.#version = version;
    this.#stores = stores;
  }

  async open(): Promise<void> {
    if (this.#db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.#name, this.#version);

      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;

        this.#stores.forEach(({ name, options }) => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, options);
          }
        });
      };

      request.onsuccess = (e: Event) => {
        this.#db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        const message = `Error opening database ${this.#name}`;
        reject(new IndexedDBServiceError(message));
      };

      request.onblocked = () => {
        const message = `Database ${
          this.#name
        } is blocked.Close other tabs or windows accessing this database.`;
        reject(new IndexedDBServiceError(message));
      };
    });
  }

  #getDatabase(): IDBDatabase {
    if (!this.#db) {
      const message = `Database ${
        this.#name
      } is not initialized.Please open the database before using it.`;
      throw new IndexedDBServiceError(message);
    }

    return this.#db;
  }

  #getConnection(mode: IDBTransactionMode): {
    transaction: IDBTransaction;
    store: IDBObjectStore;
  } {
    if (!this.#storeName) {
      const message = `Store is not set. Please use useStore() before using the store.`;
      throw new IndexedDBServiceError(message);
    }

    const db = this.#getDatabase();
    const transaction = db.transaction(this.#storeName, mode);
    const store = transaction.objectStore(this.#storeName);

    transaction.onerror = () => {
      const message = `Transaction error in store '${
        this.#storeName
      }': ${transaction.error?.message}`;
      throw new IndexedDBServiceError(message);
    };

    return { transaction, store };
  }

  useStore(name: string): IndexedDBService {
    const db = this.#getDatabase();

    if (!db.objectStoreNames.contains(name)) {
      const message = `Store ${name} does not exist in the database ${
        this.#name
      }.`;
      throw new IndexedDBServiceError(message);
    }

    this.#storeName = name;

    return this;
  }

  async put<T>(value: T, key?: IDBValidKey | undefined): Promise<IDBValidKey> {
    const { store } = this.#getConnection("readwrite");
    const request = store.put(value, key);

    return new Promise((resolve, reject) => {
      request.onsuccess = (e) => resolve((e.target as IDBRequest).result);
      request.onerror = () =>
        reject(new IndexedDBServiceError(`Error putting key ${key}`));
    });
  }

  async set<T>(key: string, value: T): Promise<IDBValidKey> {
    return this.put(value, key);
  }

  async get<T>(query: IDBValidKey | IDBKeyRange): Promise<T> {
    const { store } = this.#getConnection("readonly");
    const request = store.get(query);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new IndexedDBServiceError(`Error fetching key ${query}`));
    });
  }

  async getMap<T>(
    limit = 1000,
    direction: IDBCursorDirection = "next",
  ): Promise<Map<string, T>> {
    const { store } = this.#getConnection("readonly");
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
        reject(new IndexedDBServiceError(`Error fetching all entries`));
      };
    });
  }

  async delete(key: string): Promise<void> {
    const { store } = this.#getConnection("readwrite");
    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new IndexedDBServiceError(`Error deleting key ${key}`));
    });
  }

  close(): void {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
  }
}
