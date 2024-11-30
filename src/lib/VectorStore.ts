// Type definitions for database items and search results
interface VectorRecord {
  id: string;
  metadata: {
    [key: string]: unknown;
  };
  vector: number[];
  norm: number;
}

interface ScoredVectorRecord extends VectorRecord {
  score: number;
}

type SearchStrategy = "cosineSimilarity" | "euclideanDistance";

export class VectorDatabase {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null;

  constructor() {
    this.dbName = "vectorStore";
    this.storeName = "vectors";
    this.version = 1;
    this.db = null;
  }

  public async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open(
        this.dbName,
        this.version
      );

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = (event: Event) => {
        const target = event.target as IDBOpenDBRequest;
        this.db = target.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const target = event.target as IDBOpenDBRequest;
        const db = target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  public async addRecord(
    metadata: { [key: string]: unknown },
    vector: number[]
  ): Promise<VectorRecord> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const norm = this._calculateNorm(vector);
    const id = crypto.randomUUID();
    const newItem: VectorRecord = { id, metadata, vector, norm };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add(newItem);

      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteRecord(id: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clearDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async searchSimilar(
    vector: number[],
    strategy: SearchStrategy = "cosineSimilarity",
    topK: number = 5
  ): Promise<ScoredVectorRecord[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items: VectorRecord[] = request.result;
        const scoredItems: ScoredVectorRecord[] = items.map((item) => {
          const score =
            strategy === "cosineSimilarity"
              ? this._cosineSimilarity(vector, item.vector, item.norm)
              : this._euclideanDistance(vector, item.vector);
          return { ...item, score };
        });

        resolve(
          scoredItems
            .sort((a, b) =>
              strategy === "cosineSimilarity"
                ? b.score - a.score
                : a.score - b.score
            )
            .slice(0, topK)
        );
      };

      request.onerror = () => reject(request.error);
    });
  }

  private _calculateNorm(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val ** 2, 0));
  }

  private _cosineSimilarity(
    vectorA: number[],
    vectorB: number[],
    normB: number
  ): number {
    const dotProduct = vectorA.reduce(
      (sum, val, i) => sum + val * vectorB[i],
      0
    );
    const normA = this._calculateNorm(vectorA);
    return dotProduct / (normA * normB);
  }

  private _euclideanDistance(vectorA: number[], vectorB: number[]): number {
    return Math.sqrt(
      vectorA.reduce((sum, val, i) => sum + (val - vectorB[i]) ** 2, 0)
    );
  }
}
