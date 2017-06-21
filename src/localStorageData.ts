import { injectable } from "inversify";
import { ILocalStorageData } from "./interfaces";

@injectable()
export class LocalStorageData implements ILocalStorageData {


    private _prefix: string;

    /**
     * LocalStorageData class constructor.
     * @class LocalStorageData
     * @ignore
     * @classdesc Class that implements Local storage access.
     * @param  {string} [prefix]
     */
    constructor() {
        this._prefix = "comapi.";
    }

    /**
     * Setter to set the prefix 
     * @method LocalStorageData#prefix
     * @param {string} prefix - the prefix
     */
    set prefix(prefix: string) {
        this._prefix = prefix;
    }


    /** 
     * Get raw value as string from local storage.
     * @method LocalStorageData#getString
     * @param {String} key - the key
     * @returns (String) - the raw string value
     */
    public getString(key: string): string {
        return localStorage.getItem(this._prefix + key);
    }

    /**
     * Set raw value as string to local storage.
     * @method LocalStorageData#setString
     * @param {String} key - the key
     * @param {String} value - the value
     */
    public setString(key: string, value: string) {
        localStorage.setItem(this._prefix + key, value);
    }


    /**
     * Get value as object .
     * @method LocalStorageData#getObject
     * @param  {string} key
     * @returns {Object} - the value Object
     */
    public getObject(key: string): Object {

        let obj = null;
        let raw = this.getString(key);
        try {
            obj = JSON.parse(raw);
        } catch (e) {
            console.error("caught exception in LocalStorageData.get(" + key + "): " + e);
        }
        return obj;

    }

    /**
     * Set value as object.
     * @method LocalStorageData#setObject
     * @param  {string} key
     * @param  {Object} data
     * @returns {boolean} - returns boolean value representing success
     */
    public setObject(key: string, data: Object): boolean {
        let succeeded = true;
        try {
            let stringified = JSON.stringify(data);
            this.setString(key, stringified);
        } catch (e) {
            console.log("caught exception in LocalStorageData.set(" + key + "): " + e);
            succeeded = false;
        }
        return succeeded;
    }

    /**
     * Remove a value from local storage.
     * @method LocalStorageData#remove
     * @param  {string} key
     */
    public remove(key: string) {

        try {
            localStorage.removeItem(this._prefix + key);
        } catch (e) {
            console.error("caught exception in LocalStorageData.remove(" + key + "): " + e);
        }

    }
}
