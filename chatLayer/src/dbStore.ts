

import {
    IChatConversation,
    IChatMessage,
    IConversationStore,
} from "../interfaces/chatLayer";


/**
 * 
 */
export class IndexedDBConversationStore implements IConversationStore {

    private _database: IDBDatabase;

    private _DbNme: string = "IConversationStore4";
    private _ConversationsStore: string = "IChatConversation";
    private _MessagesStore: string = "IChatMessage";
    private _DbVersion: number = 1;

    /**
     * 
     * @param conversationId 
     */
    public getConversation(conversationId: string): Promise<IChatConversation> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise<IChatConversation>((resolve, reject) => {

                    let transaction = this._database.transaction([this._ConversationsStore], "readonly");

                    let objectStore = transaction.objectStore(this._ConversationsStore);

                    // we want all the messages from this conversation ...
                    // using a keyrange to encapsulate just the specified conversationId and all the dates
                    let keyRange = IDBKeyRange.only(conversationId);

                    let cursorRequest = objectStore.openCursor(keyRange);

                    cursorRequest.onsuccess = function (event) {
                        let cursor: IDBCursorWithValue = (<IDBRequest>event.target).result;

                        // only one record ...
                        if (cursor) {
                            resolve(cursor.value);
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
     * @param conversation 
     */
    public createConversation(conversation: IChatConversation): Promise<boolean> {
        return this.putConversation(conversation);
    }

    /**
     * 
     * @param conversation 
     */
    public updateConversation(conversation: IChatConversation): Promise<boolean> {
        return this.getConversation(conversation.id)
            .then(c => {
                if (c) {
                    return this.putConversation(conversation);
                } else {
                    return Promise.reject<boolean>({ message: `Conversation ${conversation.id} not found` });
                }
            });
    }


    /**
     * 
     * @param conversationId 
     */
    public deleteConversation(conversationId: string): Promise<boolean> {

        // check conv exists first as we cnt tell whether we actually deleted anything ...
        return this.getConversation(conversationId)
            .then(c => {
                if (c !== null) {
                    return this._deleteConversation(conversationId);
                } else {
                    return Promise.reject<boolean>({ message: `Conversation ${conversationId} not found` });
                }
            });
    }


    /**
     * 
     * @param conversationId 
     * @param messageId 
     */
    public getMessage(conversationId: string, messageId: string): Promise<IChatMessage> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise<IChatMessage>((resolve, reject) => {
                    let transaction: IDBTransaction = this._database.transaction([this._MessagesStore], "readonly");

                    let objectStore: IDBObjectStore = transaction.objectStore(this._MessagesStore);

                    let cursorRequest: IDBRequest = objectStore.get(messageId);

                    cursorRequest.onsuccess = (event: any) => {
                        let message: IChatMessage = event.target.result;
                        if (message) {
                            resolve(message);
                        } else {
                            resolve(null);
                        }
                    };

                    cursorRequest.onerror = function (event) {
                        reject({ message: `Failed to openCursor: ${(<IDBRequest>event.target).error.name}` });
                    };
                });
            });
    }

    /**
     * 
     * @param conversationId 
     * @param messageId 
     * @param statusUdates 
     */
    public updateMessageStatus(conversationId: string, messageId: string, profileId: string, status: string, timestamp: string): Promise<boolean> {

        return this.getMessage(conversationId, messageId)
            .then(message => {

                // if we get delivered and read out of order, dont overwrite "read" with delivered 
                if (message.statusUpdates &&
                    message.statusUpdates[profileId] &&
                    message.statusUpdates[profileId].status === "read") {
                    Promise.resolve(false);

                } else {

                    if (!message.statusUpdates) {
                        message.statusUpdates = {};
                    }

                    message.statusUpdates[profileId] = {
                        status,
                        on: timestamp
                    };
                    return this.putMessage(message);
                }
            });
    }

    /**
     * 
     * @param message 
     */
    public createMessage(message: IChatMessage): Promise<boolean> {

        return this.getConversation(message.conversationId)
            .then(c => {
                if (c !== null) {
                    return this.putMessage(message);
                } else {
                    return Promise.reject<boolean>({ message: `Conversation ${message.conversationId} not found` });
                }
            });
    }

    /**
     * Method for app to use
     */
    public getConversations(): Promise<IChatConversation[]> {
        return this.ensureInitialised()
            .then(initialised => {
                return new Promise<IChatConversation[]>((resolve, reject) => {

                    let transaction = this._database.transaction([this._ConversationsStore], "readonly");
                    let objectStore = transaction.objectStore(this._ConversationsStore);

                    let conversations: IChatConversation[] = [];
                    let cursorRequest = objectStore.openCursor();

                    cursorRequest.onsuccess = function (event) {
                        let cursor: IDBCursorWithValue = (<IDBRequest>event.target).result;

                        if (cursor) {
                            conversations.push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve(conversations);
                        }
                    };

                    cursorRequest.onerror = function (event) {
                        reject({ message: "Failed to openCursor: " + (<IDBRequest>event.target).error.name });
                    };

                });
            });

    }

    /**
     * Method for app to use
     */
    public getMessages(conversationId: string): Promise<IChatMessage[]> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise<IChatMessage[]>((resolve, reject) => {

                    let transaction: IDBTransaction = this._database.transaction([this._MessagesStore], "readonly");

                    let objectStore: IDBObjectStore = transaction.objectStore(this._MessagesStore);

                    let index = objectStore.index("conversation");

                    let keyRange = IDBKeyRange.only(`${conversationId}`);

                    let messages: IChatMessage[] = [];
                    let cursorRequest: IDBRequest = index.openCursor(keyRange, "prev");

                    cursorRequest.onsuccess = (event) => {
                        let cursor: IDBCursorWithValue = (<IDBRequest>event.target).result;

                        if (cursor) {
                            messages.unshift(cursor.value);
                            cursor.continue();
                        }
                        else {
                            resolve(messages.sort((m1: IChatMessage, m2: IChatMessage) => {
                                return m1.sentEventId - m2.sentEventId;
                            }));
                        }
                    };

                    cursorRequest.onerror = function (event) {
                        reject({ message: "Failed to openCursor: " + (<IDBRequest>event.target).error.name });
                    };
                });
            });
    }

    /**
     * 
     */
    public reset(): Promise<boolean> {

        return this.clearObjectStore(this._ConversationsStore)
            .then(cleared => {
                return this.clearObjectStore(this._MessagesStore);
            })
            .then(cleared => {
                return Promise.resolve(true);
            });
    }

    /**
     * 
     */
    private ensureInitialised() {
        return this._database ? Promise.resolve(true) : this.initialise();
    }

    /**
     * Create the database and stores
     */
    private initialise(): Promise<boolean> {

        return new Promise((resolve, reject) => {

            if ("indexedDB" in window) {

                let openRequest = indexedDB.open(this._DbNme, this._DbVersion);

                openRequest.onupgradeneeded = (event) => {
                    console.log("Upgrading database...");
                    let thisDB = (<IDBRequest>event.target).result;

                    /**
                     * Create Messages Store
                     * Indexed by conversationId and sentEventId
                     */
                    if (!thisDB.objectStoreNames.contains(this._MessagesStore)) {
                        let os = thisDB.createObjectStore(this._MessagesStore, { keyPath: "id" });
                        os.createIndex("conversation", "conversationId", { unique: false });
                    }

                    /**
                     * Create Conversations Store
                     * Indexed by conversationId
                     */
                    if (!thisDB.objectStoreNames.contains(this._ConversationsStore)) {
                        thisDB.createObjectStore(this._ConversationsStore, { keyPath: "id" });
                    }

                };

                openRequest.onsuccess = (event) => {
                    this._database = (<IDBRequest>event.target).result;
                    console.log(`database opened ;-)`);
                    resolve(true);
                };

                openRequest.onerror = (event) => {
                    reject({ message: "IndexedDBLogger.open failed : " + (<IDBRequest>event.target).error.name });
                };

            } else {
                reject({ message: "IndexedDB not supported on this platform - use https://github.com/axemclion/IndexedDBShim or https://github.com/Microsoft/cordova-plugin-indexedDB" });
            }
        });

    }

    /**
     * 
     * @param message 
     */
    private putMessage(message: IChatMessage): Promise<boolean> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction: IDBTransaction = this._database.transaction([this._MessagesStore], "readwrite");
                    let store: IDBObjectStore = transaction.objectStore(this._MessagesStore);

                    let request = store.put(message);

                    request.onerror = function (e: any) {
                        console.error("Error", e.target.error.name);
                        reject({ message: "add failed: " + e.target.error.name });
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
     * @param {string} conversationId - the conversationId
     */
    private deleteConversationMessages(conversationId: string): Promise<boolean> {

        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction = this._database.transaction([this._MessagesStore], "readwrite");

                    let objectStore = transaction.objectStore(this._MessagesStore);

                    let index = objectStore.index("conversation");

                    let keyRange = IDBKeyRange.only(`${conversationId}`);

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
            });
    }

    /**
     * 
     * @param conversation 
     */
    private putConversation(conversation: IChatConversation): Promise<boolean> {
        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction = this._database.transaction([this._ConversationsStore], "readwrite");
                    let store = transaction.objectStore(this._ConversationsStore);

                    let request = store.put(conversation);

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
     * Method to clear the data in an object store
     * @method ConversationStore#clearObjectStore
     * @param {string} objectStore : the object store to clear
     * @returns {Promise} - returns a promise        
     */
    private clearObjectStore(objectStoreName: string): Promise<boolean> {

        // can't reference objectStore in the promise without this ...
        let _objectStoreName: string = objectStoreName;

        return this.ensureInitialised()
            .then(initialised => {
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
            });
    }

    /**
     * 
     * @param conversationId 
     */
    private _deleteConversation(conversationId: string): Promise<boolean> {
        return this.ensureInitialised()
            .then(initialised => {
                return new Promise((resolve, reject) => {

                    let transaction = this._database.transaction([this._ConversationsStore], "readwrite");
                    let store = transaction.objectStore(this._ConversationsStore);

                    let request = store.delete(conversationId);

                    request.onerror = function (event) {
                        reject({ message: `delete failed: ${(<IDBRequest>event.target).error.name}` });
                    };

                    request.onsuccess = (event) => {

                        console.log("store.delete", (<IDBRequest>event.target).result);

                        this.deleteConversationMessages(conversationId)
                            .then(succeeded => {
                                resolve(succeeded);
                            });
                    };
                });
            });
    }
}
