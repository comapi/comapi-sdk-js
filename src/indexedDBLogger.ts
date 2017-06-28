import { injectable, inject, optional } from "inversify";
import { IComapiConfig, ILogEvent } from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";
import { Mutex } from "./mutex";


/*
 * http://blog.vanamco.com/indexeddb-fundamentals-plus-a-indexeddb-example-tutorial/
 * http://code.tutsplus.com/tutorials/working-with-indexeddb--net-34673
 */
@injectable()
export class IndexedDBLogger {

    private idbSupported: boolean = "indexedDB" in window;
    private _database: any;

    private _name: string;
    private _version: number = 1;
    private _store: string = "Logs";

    private _mutex: Mutex = new Mutex();


    /**
     * IndexedDBLogger class constructor.
     * @class IndexedDBLogger
     * @ignore
     * @classdesc Class that implements an IndexedDBLogger.
     * @param {string} name - database name (for overriding in unit tests)
     */
    constructor( @inject(INTERFACE_SYMBOLS.ComapiConfig) @optional() private _comapiConfig?: IComapiConfig) {
        this._name = "Comapi";
    }

    /**
     * Setter to set the name 
     * @method IndexedDBLogger#name
     * @param {string} name - the name
     */
    set name(name: string) {
        this._name = name;
    }

    /**
     * Removes all records older than specified date
     * @method IndexedDBLogger#purge
     * @param {Date} date threshold (messages older than this will be deleted)
     * @returns {Promise} - returns a promise
     */
    public purge(when: Date): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            return this.ensureInitialised()
                .then(initialised => {
                    return new Promise((resolve, reject) => {
                        let transaction = this._database.transaction([this._store], "readwrite");
                        let objectStore = transaction.objectStore(this._store);
                        let index = objectStore.index("created");
                        // we want all keys less than this date
                        let keyRangeValue = IDBKeyRange.upperBound(when.valueOf());
                        index.openCursor(keyRangeValue).onsuccess = function (event) {
                            let cursor = event.target.result;
                            if (cursor) {
                                objectStore["delete"](cursor.primaryKey);
                                cursor["continue"]();
                            }
                            else {
                                // should be all deleted 
                                resolve(true);
                            }
                        };
                    });
                });
        });
    }

    /**
     * Method to delete a database
     * @method IndexedDBLogger#deleteDatabase
     * @returns {Promise} - returns a promise
     */
    public deleteDatabase(): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            return this.ensureInitialised()
                .then(initialised => {
                    return new Promise((resolve, reject) => {
                        let req = indexedDB.deleteDatabase(this._name);
                        let self = this;

                        req.onsuccess = function () {
                            console.log("Deleted database " + self._name + " successfully");
                            resolve(true);
                        };

                        req.onerror = function (e: any) {
                            reject({ message: "Couldn't delete database " + self._name + " : " + e.target.error.name });
                        };

                        req.onblocked = function () {
                            console.warn("Couldn't delete database " + self._name + " due to the operation being blocked");
                        };
                    });
                });
        });
    }

    /**
     * Method to clear the data in an object store
     * @method IndexedDBLogger#clearData
     * @returns {Promise} - returns a promise        
     */
    public clearData(): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            return this.ensureInitialised()
                .then(initialised => {
                    return new Promise((resolve, reject) => {

                        // open a read/write db transaction, ready for clearing the data
                        let transaction = this._database.transaction([this._store], "readwrite");

                        transaction.onerror = function (event) {
                            console.error("Transaction not opened due to error: " + transaction.error);
                        };

                        // create an object store on the transaction
                        let objectStore = transaction.objectStore(this._store);

                        // clear all the data out of the object store
                        let objectStoreRequest = objectStore.clear();

                        objectStoreRequest.onsuccess = function (event) {
                            resolve(true);
                        };

                        objectStoreRequest.onerror = function (e: any) {
                            reject({ message: "Failed to clear object store: " + e.target.error.name });
                        };

                    });
                });
        });
    }

    /** 
     * Method to get all or the first n objects in an object store
     * @method IndexedDBLogger#getData
     * @param {number} [count] - number of records to query - retrieves all if not specified
     * @param {boolean} [getIndexes] - whether to add the key into the returned record - doesn'tadd by default
     * @returns {Promise} - returns a promise        
     */
    public getData(count?: number, getIndexes?: boolean): Promise<Object[]> {
        return this._mutex.runExclusive(() => {
            return this.ensureInitialised()
                .then(initialised => {
                    return new Promise((resolve, reject) => {
                        let transaction = this._database.transaction([this._store], "readonly");

                        let objectStore = transaction.objectStore(this._store);

                        let cursorRequest = objectStore.openCursor();

                        let numRetrieved = 0;
                        let data = [];

                        cursorRequest.onsuccess = function (event) {
                            let cursor = event.target.result;

                            numRetrieved++;

                            if (cursor) {

                                let record = cursor.value;

                                if (getIndexes === true) {
                                    record.key = cursor.key;
                                }

                                data.push(cursor.value);

                                if (numRetrieved && numRetrieved >= count) {
                                    resolve(data);
                                } else {
                                    cursor.continue();
                                }
                            }
                            else {
                                resolve(data);
                            }
                        };

                        cursorRequest.onerror = function (e: any) {
                            reject({ message: "Failed to openCursor: " + e.target.error.name });
                        };

                    });
                });
        });
    }

    /**
     * Method to get the count of objects in the object store
     * @method IndexedDBLogger#getCount
     * @returns {Promise} - returns a promise        
     */
    public getCount(): Promise<number> {
        return this._mutex.runExclusive(() => {
            return this.ensureInitialised()
                .then(initialised => {
                    return new Promise((resolve, reject) => {

                        let transaction = this._database.transaction([this._store], "readonly");
                        let objectStore = transaction.objectStore(this._store);
                        let count = objectStore.count();

                        count.onerror = function (e: any) {
                            reject({ message: "Failed to get count: " + e.target.error.name });
                        };

                        count.onsuccess = function () {
                            resolve(count.result);
                        };

                    });
                });
        });

    }

    /**
     * Method to close a database connection 
     * @method IndexedDBLogger#closeDatabase
     */
    public closeDatabase() {
        if (this._database) {
            this._database.close();
        }
    }

    /**
     * Method to add a record to a previously opened indexed database
     * @method IndexedDBLogger#addRecord
     * @param {Object} entity - The entity
     * @returns {Promise} - returns a promise
     */
    public addRecord(entity: ILogEvent): Promise<number> {
        return this._mutex.runExclusive(() => {
            return this.ensureInitialised()
                .then(initialised => {
                    return new Promise((resolve, reject) => {

                        let transaction = this._database.transaction([this._store], "readwrite");
                        let store = transaction.objectStore(this._store);

                        // Perform the add
                        let request = store.add(entity);

                        request.onerror = function (e) {
                            console.error("Error", e.target.error.name);
                            reject({ message: "add failed: " + e.target.error.name });
                        };

                        request.onsuccess = function (e) {
                            // http://stackoverflow.com/questions/12502830/how-to-return-auto-increment-id-from-objectstore-put-in-an-indexeddb
                            // returns auto incremented id ...
                            resolve(e.target.result);
                        };

                    });
                });
        });

    }

    /**
     * 
     */
    private ensureInitialised() {
        return this._database ?
            Promise.resolve(true) :
            this.initialise()
                .then((result) => {

                    if (this._comapiConfig) {
                        let retentionHours = this._comapiConfig.logRetentionHours === undefined ? 24 : this._comapiConfig.logRetentionHours;

                        let purgeDate = new Date((new Date()).valueOf() - 1000 * 60 * 60 * retentionHours);

                        return this.purge(purgeDate);
                    } else {
                        return result;
                    }
                });
    }

    /**
     * Method to open a connection to the database
     * @method IndexedDBLogger#initialise
     * @returns {Promise} - returns a promise
     */
    private initialise(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.idbSupported) {

                let self = this;

                let openRequest = indexedDB.open(this._name, this._version);

                openRequest.onupgradeneeded = function (e: any) {
                    console.log("Upgrading database...");
                    let thisDB = e.target.result;

                    if (!thisDB.objectStoreNames.contains(self._store)) {
                        let os = thisDB.createObjectStore(self._store, { autoIncrement: true });
                        os.createIndex("created", "created", { unique: false });
                    }
                };

                openRequest.onsuccess = function (e: any) {
                    self._database = e.target.result;
                    resolve(true);
                };

                openRequest.onerror = function (e: any) {
                    reject({ message: "IndexedDBLogger.open failed : " + e.target.error.name });
                };

            } else {
                reject({ message: "IndexedDBLogger not supported on this platform" });
            }
        });
    }
}
