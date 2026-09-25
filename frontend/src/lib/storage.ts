import type { Trip, TravelerPersona, ConversationMessage } from "../types/conversation";

const DB_NAME = "TravelConciergeDB";
const DB_VERSION = 1;

export class TravelStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error("Failed to open IndexedDB"));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains("personas")) {
          db.createObjectStore("personas", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("trips")) {
          db.createObjectStore("trips", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("conversations")) {
          db.createObjectStore("conversations", { keyPath: "id" });
        }
      };
    });
  }

  async savePersona(persona: TravelerPersona): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["personas"], "readwrite");
      const store = transaction.objectStore("personas");
      const request = store.put(persona);

      request.onerror = () => reject(new Error("Failed to save persona"));
      request.onsuccess = () => resolve();
    });
  }

  async getPersona(id: string): Promise<TravelerPersona | undefined> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["personas"], "readonly");
      const store = transaction.objectStore("personas");
      const request = store.get(id);

      request.onerror = () => reject(new Error("Failed to get persona"));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveTrip(trip: Trip): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["trips"], "readwrite");
      const store = transaction.objectStore("trips");
      const request = store.put(trip);

      request.onerror = () => reject(new Error("Failed to save trip"));
      request.onsuccess = () => resolve();
    });
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["trips"], "readonly");
      const store = transaction.objectStore("trips");
      const request = store.get(id);

      request.onerror = () => reject(new Error("Failed to get trip"));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllTrips(): Promise<Trip[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["trips"], "readonly");
      const store = transaction.objectStore("trips");
      const request = store.getAll();

      request.onerror = () => reject(new Error("Failed to get trips"));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveConversation(tripId: string, messages: ConversationMessage[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["conversations"], "readwrite");
      const store = transaction.objectStore("conversations");
      const request = store.put({ id: tripId, messages, lastUpdated: new Date() });

      request.onerror = () => reject(new Error("Failed to save conversation"));
      request.onsuccess = () => resolve();
    });
  }

  async getConversation(tripId: string): Promise<ConversationMessage[] | undefined> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["conversations"], "readonly");
      const store = transaction.objectStore("conversations");
      const request = store.get(tripId);

      request.onerror = () => reject(new Error("Failed to get conversation"));
      request.onsuccess = () => resolve(request.result?.messages);
    });
  }

  async deleteTrip(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["trips", "conversations"], "readwrite");
      const tripsStore = transaction.objectStore("trips");
      const convoStore = transaction.objectStore("conversations");

      tripsStore.delete(id);
      convoStore.delete(id);

      transaction.onerror = () => reject(new Error("Failed to delete trip"));
      transaction.oncomplete = () => resolve();
    });
  }
}

export const storage = new TravelStorage();
