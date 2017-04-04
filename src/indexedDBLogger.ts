import { ILogEvent } from "./interfaces";

/*
 * http://blog.vanamco.com/indexeddb-fundamentals-plus-a-indexeddb-example-tutorial/
 * http://code.tutsplus.com/tutorials/working-with-indexeddb--net-34673
 */

export class IndexedDBLogger {

    private idbSupported: boolean = "indexedDB" in window;
    private _database: any;

    private _name: string = "Comapi";
    private _version: number = 1;
    private _store: string = "Logs";

    /**
     * IndexedDBLogger class constructor.
     * @class IndexedDBLogger
     * @ignore
     * @classdesc Class that implements an IndexedDBLogger.
     * @param {string} name - database name (for overriding in unit tests)
     */
    constructor(name?: string) {
        if (name) {
            this._name = name;
        }
    }

    /**
     * Method to open a connection to the database
     * @method IndexedDBLogger#openDatabase
     * @returns {Promise} - returns a promise
     */
    public openDatabase(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.idbSupported) {

                var self = this;

                var openRequest = indexedDB.open(this._name, this._version);

                openRequest.onupgradeneeded = function (e: any) {
                    console.log("Upgrading database...");
                    var thisDB = e.target.result;

                    if (!thisDB.objectStoreNames.contains(self._store)) {
                        var os = thisDB.createObjectStore(self._store, { autoIncrement: true });
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

    /**
     * Removes all records older than specified date
     * @method IndexedDBLogger#purge
     * @param {Date} date threshold (messages older than this will be deleted)
     * @returns {Promise} - returns a promise
     */
    public purge(when: Date): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._database) {
                var transaction = this._database.transaction([this._store], "readwrite");
                var objectStore = transaction.objectStore(this._store);
                var index = objectStore.index("created");
                // we want all keys less than this date
                var keyRangeValue = IDBKeyRange.upperBound(when.valueOf());
                index.openCursor(keyRangeValue).onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        objectStore["delete"](cursor.primaryKey);
                        cursor["continue"]();
                    }
                    else {
                        // should be all deleted 
                        resolve(true);
                    }
                };
            }
            else {
                reject({ message: "Database not open" });
            }
        });
    }

    /**
     * Method to delete a database
     * @method IndexedDBLogger#deleteDatabase
     * @returns {Promise} - returns a promise
     */
    public deleteDatabase(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            var req = indexedDB.deleteDatabase(this._name);
            var self = this;

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
    }

    /**
     * Method to clear the data in an object store
     * @method IndexedDBLogger#clearData
     * @returns {Promise} - returns a promise        
     */
    public clearData(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._database) {

                // open a read/write db transaction, ready for clearing the data
                var transaction = this._database.transaction([this._store], "readwrite");

                transaction.onerror = function (event) {
                    console.error("Transaction not opened due to error: " + transaction.error);
                };

                // create an object store on the transaction
                var objectStore = transaction.objectStore(this._store);

                // clear all the data out of the object store
                var objectStoreRequest = objectStore.clear();

                objectStoreRequest.onsuccess = function (event) {
                    resolve(true);
                };

                objectStoreRequest.onerror = function (e: any) {
                    reject({ message: "Failed to clear object store: " + e.target.error.name });
                };

            } else {
                reject({ message: "Database not open" });
            }
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
        return new Promise((resolve, reject) => {
            if (this._database) {

                var transaction = this._database.transaction([this._store], "readonly");

                var objectStore = transaction.objectStore(this._store);

                var cursorRequest = objectStore.openCursor();

                var numRetrieved = 0;
                var data = [];

                cursorRequest.onsuccess = function (event) {
                    var cursor = event.target.result;

                    numRetrieved++;

                    if (cursor) {

                        var record = cursor.value;

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

            } else {
                reject({ message: "Database not open" });
            }
        });
    }

    /**
     * Method to get the count of objects in the object store
     * @method IndexedDBLogger#getCount
     * @returns {Promise} - returns a promise        
     */
    public getCount(): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this._database) {

                var transaction = this._database.transaction([this._store], "readonly");
                var objectStore = transaction.objectStore(this._store);
                var count = objectStore.count();

                count.onerror = function (e: any) {
                    reject({ message: "Failed to get count: " + e.target.error.name });
                };

                count.onsuccess = function () {
                    resolve(count.result);
                };

            } else {
                reject({ message: "Database not open" });
            }
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
        return new Promise((resolve, reject) => {
            if (this._database) {

                var transaction = this._database.transaction([this._store], "readwrite");
                var store = transaction.objectStore(this._store);

                // Perform the add
                var request = store.add(entity);

                request.onerror = function (e) {
                    console.error("Error", e.target.error.name);
                    reject({ message: "add failed: " + e.target.error.name });
                };

                request.onsuccess = function (e) {
                    // http://stackoverflow.com/questions/12502830/how-to-return-auto-increment-id-from-objectstore-put-in-an-indexeddb
                    // returns auto incremented id ...
                    resolve(e.target.result);
                };

            } else {
                reject({ message: "Database not open" });
            }
        });
    }

}
