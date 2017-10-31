import { injectable, inject } from "inversify";
import { ILocalStorageData, IComapiConfig } from "./interfaces";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

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
    constructor( @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig) {
        if (_comapiConfig && _comapiConfig.localStoragePrefix) {
            this._prefix = _comapiConfig.localStoragePrefix;
        } else {
            this._prefix = "comapi.";
        }
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
    public getString(key: string): Promise<string> {
        return Promise.resolve(localStorage.getItem(this._prefix + key));
    }

    /**
     * Set raw value as string to local storage.
     * @method LocalStorageData#setString
     * @param {String} key - the key
     * @param {String} value - the value
     */
    public setString(key: string, value: string): Promise<boolean> {
        localStorage.setItem(this._prefix + key, value);
        return Promise.resolve(true);
    }


    /**
     * Get value as object .
     * @method LocalStorageData#getObject
     * @param  {string} key
     * @returns {Object} - the value Object
     */
    public getObject(key: string): Promise<Object> {

        return this.getString(key)
            .then(function (raw) {
                let obj = null;

                try {
                    obj = JSON.parse(raw);
                } catch (e) {
                    console.error("caught exception in LocalStorageData.get(" + key + "): " + e);
                }
                return Promise.resolve(obj);
            });
    }

    /**
     * Set value as object.
     * @method LocalStorageData#setObject
     * @param  {string} key
     * @param  {Object} data
     * @returns {boolean} - returns boolean value representing success
     */
    public setObject(key: string, data: Object): Promise<boolean> {
        let succeeded = true;
        try {
            let stringified = JSON.stringify(data);
            this.setString(key, stringified);
        } catch (e) {
            console.log("caught exception in LocalStorageData.set(" + key + "): " + e);
            succeeded = false;
        }
        return Promise.resolve(succeeded);
    }

    /**
     * Remove a value from local storage.
     * @method LocalStorageData#remove
     * @param  {string} key
     */
    public remove(key: string): Promise<boolean> {

        try {
            localStorage.removeItem(this._prefix + key);
        } catch (e) {
            console.error("caught exception in LocalStorageData.remove(" + key + "): " + e);
        }
        return Promise.resolve(true);
    }
}
