import {
    IConversationMessage
} from "../../src/interfaces";

import {
    IChatConversation,
    IConversationStore,
} from "../interfaces/chatLayer";


/**
 * 
 */
export class IndexedDBConversationStore implements IConversationStore {

    private _database: IDBDatabase;

    private _DbNme: string = "ConversationStore";
    private _ConversationsStore: string = "IChatConversation";
    private _MessagesStore: string = "IConversationMessage";
    private _DbVersion: number = 1;
    private _maxInt: number = 2147483647;

    /**
     * IE doesn't support compound indexed so we will manually work around this based on this flag
     */
    private _isIE = navigator.userAgent.indexOf("Trident/") !== -1 || navigator.userAgent.indexOf("Edge") !== -1;

    /**
     * Create the database and stores
     */
    public initialise(): Promise<boolean> {

        return new Promise((resolve, reject) => {

            if ("indexedDB" in window) {

                let openRequest = indexedDB.open(this._DbNme, this._DbVersion);

                openRequest.onupgradeneeded = (event) => {
                    console.log("Upgrading database...");
                    let thisDB = (<IDBRequest>event.target).result;

                    /**
                     * Create Messages Store
                     * Indexed by conversationId and sentEventid
                     */
                    if (!thisDB.objectStoreNames.contains(this._MessagesStore)) {
                        let os = thisDB.createObjectStore(this._MessagesStore, { keyPath: "id" });

                        // IE doesn't support compound indexes so caoncatenate the two fields ...
                        if (this._isIE) {
                            os.createIndex("conversationId_sentEventid", "conversationId_sentEventid", { unique: true });
                        } else {
                            os.createIndex("conversation", ["context.conversationId", "sentEventid"], { unique: true });
                        }

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
     * @param conversationId 
     */
    public getConversation(conversationId: string): Promise<IChatConversation> {
        return new Promise((resolve, reject) => {
            if (this._database) {

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

            } else {
                reject({ message: "Database not open" });
            }
        });
    }

    /**
     * 
     * @param conversation 
     */
    public createConversation(conversation: IChatConversation): Promise<boolean> {
        return this.upsertConversation(conversation, false);
    }

    /**
     * 
     * @param conversation 
     */
    public updateConversation(conversation: IChatConversation): Promise<boolean> {
        return this.getConversation(conversation.id)
            .then(c => {
                if (c) {
                    return this.upsertConversation(conversation, true);
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
    public getMessage(conversationId: string, messageId: string): Promise<IConversationMessage> {
        return new Promise((resolve, reject) => {
            if (this._database) {
                let transaction: IDBTransaction = this._database.transaction([this._MessagesStore], "readonly");

                let objectStore: IDBObjectStore = transaction.objectStore(this._MessagesStore);

                let cursorRequest: IDBRequest = objectStore.get(messageId);

                cursorRequest.onsuccess = (event: any) => {
                    let message: IConversationMessage = event.target.result;
                    if (message) {
                        resolve(message);
                    } else {
                        resolve(null);
                    }
                };

                cursorRequest.onerror = function (event) {
                    reject({ message: `Failed to openCursor: ${(<IDBRequest>event.target).error.name}` });
                };

            } else {
                reject({ message: "Database not open" });
            }
        });
    }

    /**
     * 
     * @param conversationId 
     * @param messageId 
     * @param statusUdates 
     */
    public updateStatuses(conversationId: string, messageId: string, statusUdates: any): Promise<boolean> {

        return this.getMessage(conversationId, messageId)
            .then(message => {
                message.statusUpdates = statusUdates;
                return this.upsertMessage(message, true);
            });
    }

    /**
     * 
     * @param message 
     */
    public createMessage(message: IConversationMessage): Promise<boolean> {
        return this.upsertMessage(message, false);
    }

    /**
     * Method for app to use
     */
    public getConversations(): Promise<IChatConversation[]> {
        return new Promise((resolve, reject) => {
            if (this._database) {

                let transaction = this._database.transaction([this._ConversationsStore], "readonly");
                let objectStore = transaction.objectStore(this._ConversationsStore);

                let conversations = [];
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

            } else {
                reject({ message: "Database not open" });
            }
        });
    }

    /**
     * Method for app to use
     */
    public getMessages(conversationId: string): Promise<IConversationMessage[]> {

        return new Promise((resolve, reject) => {
            if (this._database) {

                let transaction: IDBTransaction = this._database.transaction([this._MessagesStore], "readonly");

                let objectStore: IDBObjectStore = transaction.objectStore(this._MessagesStore);

                let index = objectStore.index(this._isIE ? "conversationId_sentEventid" : "conversation");

                let keyRange = this.getKeyRange(conversationId);

                let messages: IConversationMessage[] = [];
                let cursorRequest: IDBRequest = index.openCursor(keyRange, "prev");

                cursorRequest.onsuccess = (event) => {
                    let cursor: IDBCursorWithValue = (<IDBRequest>event.target).result;

                    if (cursor) {
                        messages.unshift(cursor.value);
                        cursor.continue();
                    }
                    else {
                        resolve(messages);
                    }
                };

                cursorRequest.onerror = function (event) {
                    reject({ message: "Failed to openCursor: " + (<IDBRequest>event.target).error.name });
                };

            } else {
                reject({ message: "Database not open" });
            }
        });
    }

    /**
     * 
     */
    public emptyDatabase(): Promise<boolean> {

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
     * @param message 
     * @param doPut 
     */
    private upsertMessage(message: IConversationMessage, doPut: boolean): Promise<boolean> {

        return new Promise((resolve, reject) => {
            if (this._database) {

                let transaction: IDBTransaction = this._database.transaction([this._MessagesStore], "readwrite");
                let store: IDBObjectStore = transaction.objectStore(this._MessagesStore);

                if (this._isIE) {
                    // add a "conversationId_sentEventid" property as we are using this for an index
                    /* tslint:disable:no-string-literal */
                    message["conversationId_sentEventid"] = `${message.context.conversationId}_${message.sentEventid}`;
                    /* tslint:enable:no-string-literal */
                }

                // Perform the add / put ...
                let request = doPut === true ? store.put(message) : store.add(message);

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

            } else {
                reject({ message: "Database not open" });
            }
        });

    }

    /**
     * we want all the messages from this conversation ...
     * using a keyrange to encapsulate just the specified conversationId and all the events we want
     */
    private getKeyRange(conversationId: string) {

        if (this._isIE) {
            return IDBKeyRange.bound(`${conversationId}_0}`, `${conversationId}_${this._maxInt}`);
        } else {
            return IDBKeyRange.bound([conversationId, 0], [conversationId, this._maxInt]);
        }
    }

    /**
     * @param {string} conversationId - the conversationId
     */
    private deleteConversationMessages(conversationId: string): Promise<boolean> {

        return new Promise((resolve, reject) => {
            if (this._database) {

                let transaction = this._database.transaction([this._MessagesStore], "readwrite");

                let objectStore = transaction.objectStore(this._MessagesStore);

                let index = objectStore.index(this._isIE ? "conversationId_sentEventid" : "conversation");

                let keyRange = this.getKeyRange(conversationId);

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

            } else {
                reject({ message: "Database not open" });
            }
        });

    }

    /**
     * 
     * @param conversation 
     * @param doPut 
     */
    private upsertConversation(conversation: IChatConversation, doPut: boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._database) {

                let transaction = this._database.transaction([this._ConversationsStore], "readwrite");
                let store = transaction.objectStore(this._ConversationsStore);

                let request = doPut === true ? store.put(conversation) : store.add(conversation);

                request.onerror = function (event) {
                    reject({ message: "add failed: " + (<IDBRequest>event.target).error.name });
                };

                request.onsuccess = function (event) {
                    // http://stackoverflow.com/questions/12502830/how-to-return-auto-increment-id-from-objectstore-put-in-an-indexeddb
                    // returns auto incremented id ...
                    // resolve((<IDBRequest>event.target).result);
                    resolve(true);
                };

            } else {
                reject({ message: "Database not open" });
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
            if (this._database) {

                // open a read/write db transaction, ready for clearing the data
                var transaction = this._database.transaction([_objectStoreName], "readwrite");

                transaction.onerror = function (event) {
                    console.error("Transaction not opened due to error: " + transaction.error);
                };

                var objectStore = transaction.objectStore(_objectStoreName);
                var objectStoreRequest = objectStore.clear();

                objectStoreRequest.onsuccess = function (event) {
                    resolve(true);
                };

                objectStoreRequest.onerror = function (event) {
                    reject({ message: "Failed to clear object store: " + (<IDBRequest>event.target).error.name });
                };

            } else {
                reject({ message: "Database not open" });
            }
        });
    }

    /**
     * 
     * @param conversationId 
     */
    private _deleteConversation(conversationId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._database) {

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

            } else {
                reject({ message: "Database not open" });
            }
        });
    }
}
