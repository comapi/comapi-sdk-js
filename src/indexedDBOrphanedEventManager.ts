import { injectable } from "inversify";

import {
    IOrphanedEventManager,
    IConversationMessageEvent,
} from "./interfaces";


interface IOrphanedEventInfo {
    conversationId: string;
    continuationToken: number;
}


/**
 * 
 */
interface IOrphanedEventContainer {
    continuationToken: number;
    orphanedEvents: IConversationMessageEvent[];
};



@injectable()
export class IndexedDBOrphanedEventManager implements IOrphanedEventManager {

    private _initialised: Promise<boolean>;

    private idbSupported: boolean = "indexedDB" in window;
    private _database: any;

    private _name: string = "Comapi.OrphanedEvents";
    private _version: number = 1;
    private _continuationTokenStore: string = "ContinuationTokens";
    private _orphanedEventStore: string = "OrphanedEvents";


    /**
     * 
     */
    public clearAll(): Promise<boolean> {

        return this.ensureInitialised()
            .then(initialised => {
                return this.clearObjectStore(this._continuationTokenStore);
            })
            .then(cleared => {
                return this.clearObjectStore(this._orphanedEventStore);
            });
    }

    /**
     * 
     */
    public clear(conversationId: string): Promise<boolean> {

        return this.ensureInitialised()
            .then(initialised => {
                return this.deleteTokenInfo(conversationId);
            })
            .then(deleted => {
                return this.deleteEvents(conversationId);
            });
    }

    /**
     * 
     */
    public getContinuationToken(conversationId: string): Promise<number> {
        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction = this._database.transaction([this._continuationTokenStore], "readonly");

                    let objectStore = transaction.objectStore(this._continuationTokenStore);

                    // we want all the messages from this conversation ...
                    // using a keyrange to encapsulate just the specified conversationId and all the dates
                    let keyRange = IDBKeyRange.only(conversationId);

                    let cursorRequest = objectStore.openCursor(keyRange);

                    cursorRequest.onsuccess = function (event) {
                        let cursor: IDBCursorWithValue = (<IDBRequest>event.target).result;

                        // only one record ...
                        if (cursor) {
                            let info: IOrphanedEventInfo = cursor.value;
                            resolve(info.continuationToken);
                        }
                        else {
                            resolve(null);
                        }
                    };

                    cursorRequest.onerror = function (e: any) {
                        reject({ message: "Failed to openCursor: " + e.target.error.name });
                    };
                });
            });

    }

    /**
     * 
     */
    public setContinuationToken(conversationId: string, continuationToken: number): Promise<boolean> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction = this._database.transaction([this._continuationTokenStore], "readwrite");
                    let store = transaction.objectStore(this._continuationTokenStore);

                    let request = store.put({
                        continuationToken: continuationToken,
                        conversationId: conversationId
                    });

                    request.onerror = function (event) {
                        reject({ message: "add failed: " + (<IDBRequest>event.target).error.name });
                    };

                    request.onsuccess = function (event) {
                        // http://stackoverflow.com/questions/12502830/how-to-return-auto-increment-id-from-objectstore-put-in-an-indexeddb
                        // returns auto incremented id ...
                        // resolve((<IDBRequest>event.target).result);
                        resolve(true);
                    };
                });
            });
    }

    /**
     * 
     */
    public addOrphanedEvent(event: IConversationMessageEvent): Promise<boolean> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction: IDBTransaction = this._database.transaction([this._orphanedEventStore], "readwrite");
                    let store: IDBObjectStore = transaction.objectStore(this._orphanedEventStore);

                    let request = store.put(event);

                    request.onerror = function (e: any) {
                        console.error("Error", e.target.error.name);
                        reject({ message: "add failed: " + e.target.error.name });
                    };

                    request.onsuccess = function (e) {
                        // http://stackoverflow.com/questions/12502830/how-to-return-auto-increment-id-from-objectstore-put-in-an-indexeddb
                        // returns auto incremented id ...
                        // resolve((<IDBRequest>event.target).result);
                        resolve(true);
                    };
                });
            });
    }

    /**
     * 
     */
    public removeOrphanedEvent(event: IConversationMessageEvent): Promise<boolean> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction = this._database.transaction([this._orphanedEventStore], "readwrite");
                    let store = transaction.objectStore(this._orphanedEventStore);

                    let request = store.delete(event.eventId);

                    request.onerror = function (e) {
                        reject({ message: `delete failed: ${(<IDBRequest>e.target).error.name}` });
                    };

                    request.onsuccess = (e) => {
                        console.log("store.delete", (<IDBRequest>e.target).result);
                        resolve(true);
                    };
                });
            });
    }

    /**
     * 
     */
    public getOrphanedEvents(conversationId: string): Promise<IConversationMessageEvent[]> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction: IDBTransaction = this._database.transaction([this._orphanedEventStore], "readonly");

                    let objectStore: IDBObjectStore = transaction.objectStore(this._orphanedEventStore);

                    let index = objectStore.index("conversationId");

                    let keyRange = IDBKeyRange.only(conversationId);

                    let events: IConversationMessageEvent[] = [];
                    let cursorRequest: IDBRequest = index.openCursor(keyRange, "prev");

                    cursorRequest.onsuccess = (event) => {
                        let cursor: IDBCursorWithValue = (<IDBRequest>event.target).result;

                        if (cursor) {
                            events.unshift(cursor.value);
                            cursor.continue();
                        }
                        else {
                            resolve(events.sort((e1: IConversationMessageEvent, e2: IConversationMessageEvent) => {
                                return e1.conversationEventId - e2.conversationEventId;
                            }));
                        }
                    };

                    cursorRequest.onerror = function (event) {
                        reject({ message: "Failed to openCursor: " + (<IDBRequest>event.target).error.name });
                    };
                });
            });
    }

    private ensureInitialised() {
        if (!this._initialised) {
            // this is a promise instance to ensure it's only called once
            this._initialised = this.initialise();
        }
        return this._initialised;
    }

    /**
     * 
     */
    private initialise(): Promise<Boolean> {

        return new Promise((resolve, reject) => {
            if (this.idbSupported) {

                let self = this;

                let openRequest = indexedDB.open(this._name, this._version);

                openRequest.onupgradeneeded = (event) => {
                    let thisDB = (<IDBRequest>event.target).result;

                    /**
                     * will be an array of IOrphanedEventContainer objects
                     */
                    if (!thisDB.objectStoreNames.contains(self._continuationTokenStore)) {
                        thisDB.createObjectStore(self._continuationTokenStore, { keyPath: "conversationId" });
                    }

                    /**
                     * Will be an array of IConversationMessageEvent objects
                     */
                    if (!thisDB.objectStoreNames.contains(self._orphanedEventStore)) {
                        let os = thisDB.createObjectStore(self._orphanedEventStore, { keyPath: "eventId" });
                        os.createIndex("conversationId", "conversationId", { unique: false });
                    }
                };

                openRequest.onsuccess = (event) => {
                    this._database = (<IDBRequest>event.target).result;
                    resolve(true);
                };

                openRequest.onerror = (event) => {
                    reject({ message: "IndexedDBOrphanedEventManager.initialise failed : " + (<IDBRequest>event.target).error.name });
                };

            } else {
                reject({ message: "IndexedDBOrphanedEventManager not supported on this platform" });
            }
        });
    }

    /**
     * Method to clear the data in an object store
     * @method ConversationStore#clearObjectStore
     * @param {string} objectStore : the object store to clear
     * @returns {Promise} - returns a promise        
     */
    private clearObjectStore(objectStoreName: string): Promise<boolean> {

        // can't reference objectStore in the promise without this ...
        let _objectStoreName: string = objectStoreName;

        return new Promise((resolve, reject) => {

            // open a read/write db transaction, ready for clearing the data
            let transaction = this._database.transaction([_objectStoreName], "readwrite");

            transaction.onerror = function (event) {
                console.error("Transaction not opened due to error: " + transaction.error);
            };

            let objectStore = transaction.objectStore(_objectStoreName);
            let objectStoreRequest = objectStore.clear();

            objectStoreRequest.onsuccess = function (event) {
                resolve(true);
            };

            objectStoreRequest.onerror = function (event) {
                reject({ message: "Failed to clear object store: " + (<IDBRequest>event.target).error.name });
            };
        });
    }

    /**
     * 
     */
    private deleteTokenInfo(conversationId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            let transaction = this._database.transaction([this._continuationTokenStore], "readwrite");
            let store = transaction.objectStore(this._continuationTokenStore);

            let request = store.delete(conversationId);

            request.onerror = function (event) {
                reject({ message: `delete failed: ${(<IDBRequest>event.target).error.name}` });
            };

            request.onsuccess = (event) => {
                console.log("store.delete", (<IDBRequest>event.target).result);
                resolve(true);
            };
        });
    }

    /**
     * 
     */
    private deleteEvents(conversationId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            let transaction = this._database.transaction([this._orphanedEventStore], "readwrite");

            let objectStore = transaction.objectStore(this._orphanedEventStore);

            let index = objectStore.index("conversationId");

            let keyRange = IDBKeyRange.only(conversationId);

            // we want all the messages from this conversation ...
            // using a keyrange to encapsulate just the specified conversationId and all the dates

            let cursorRequest = index.openCursor(keyRange, "next");

            cursorRequest.onsuccess = (event) => {
                let cursor: IDBCursor = (<IDBRequest>event.target).result;

                if (cursor) {
                    objectStore.delete(cursor.primaryKey);
                    cursor.continue();
                }
                else {
                    resolve(true);
                }
            };

            cursorRequest.onerror = function (e: any) {
                reject({ message: "Failed to openCursor: " + e.target.error.name });
            };

        });
    }
}
