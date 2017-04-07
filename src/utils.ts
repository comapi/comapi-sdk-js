import { IBrowserInfo } from "./interfaces";


/**
 * Method to perform the asnc operation
 * @param {any} data  the data to operate on
 * @returns {Promise<any>} returns a promise
 */
export type DoUntilOperationFunction = (data: any) => Promise<any>;
/**
 * Method to decide whether to continue or not
 * @param {any} data  the data to look at (will have been returned vi a promise from DoUntilOperationFunction)
 * @returns {boolean} returns true or false. return false to stop
 */
export type DoUntilTestFunction = (data: any) => boolean;

/**
 * Utility class
 */
export class Utils {

    /**
     * Function to clone an object
     * @method Utils#clone
     * @param {any} obj - the object to clone
     * @returns {any} - returns a clone of the object 
     */
    public static clone(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Method to generate a uuid (simulated)
     * @method Utils#uuid
     * @returns {string} - returns a uuid
     */
    public static uuid(): string {
        var d = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    /**
     * Internal method to get current browser info
     * @method Utils#getBrowserInfo
     * @param {string} [userAgent] - user agent string (optional - for unit tsting)
     * @returns {IBrowserInfo} - returns an IBrowserInfo interface
     */
    public static getBrowserInfo(userAgent?: string): IBrowserInfo {
        var ua = userAgent !== undefined ? userAgent : navigator.userAgent,
            tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return {
                name: "IE",
                version: tem[1] || ""
            };
        }
        if (M[1] === "Chrome") {
            tem = ua.match(/\bOPR\/(\d+)/);
            if (tem !== null) {
                return {
                    name: "Opera",
                    version: tem[1]
                };
            }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];

        tem = ua.match(/version\/(\d+)/i);
        if (tem !== null) {
            M.splice(1, 1, tem[1]);
        }
        return {
            name: M[0],
            version: M[1]
        };
    }

    /**
     * Method to call some async function on an array of data and you want them called sequentially
     * @param {any[]} arr 
     * @param {Function} iteratorFn 
     * @returns {Promise} - returns a Promise
     */
    public static eachSeries(arr: any[], iteratorFn: Function): Promise<any> {
        return arr.reduce(function (p, item) {
            return p.then(function () {
                return iteratorFn(item);
            });
        }, Promise.resolve());
    }

    // /**
    //  * @param url 
    //  * @param redirectCount 
    //  */
    // public static doUntil(count?: number): Promise<any> {
    //     count = count || 0;

    //     console.log(`doUntil(${count})`);

    //     if (count > 10) {
    //         throw new Error("doUntil called too many times.");
    //     }

    //     return new Promise(function (resolve) {
    //         resolve(count);
    //     })
    //         .then((count: number) => {
    //             return count < 5 ? Utils.doUntil(count + 1) : count;
    //         });
    // }

    /**
     * @param url 
     * @param redirectCount 
     */
    public static doUntil(operation: DoUntilOperationFunction, test: DoUntilTestFunction, data?: any): Promise<any> {
        return operation(data)
            .then((data: any) => {
                return test(data) ? Utils.doUntil(operation, test, data) : data;
            });
    }

    /**
     * @class Utils
     * @ignore
     * @classdesc Class that implements a Utils.
     */
    constructor() {
        throw new Error("Cannot new this class");
    }

};

