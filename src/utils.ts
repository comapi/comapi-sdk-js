import { IBrowserInfo, DoUntilOperationFunction, DoUntilTestFunction } from "./interfaces";


/*
 * Utility class
 */
export class Utils {

    /**
     * Static method to clone an object
     * @method Utils#clone
     * @param {any} obj - the object to clone
     * @returns {any} - returns a clone of the object 
     */
    public static clone(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Static method to generate a uuid (simulated)
     * @method Utils#uuid
     * @returns {string} - returns a uuid
     */
    public static uuid(): string {
        let d = new Date().getTime();
        let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    /**
     * Static method to get current browser info
     * @method Utils#getBrowserInfo
     * @param {string} [userAgent] - user agent string (optional - for unit tsting)
     * @returns {IBrowserInfo} - returns an IBrowserInfo interface
     */
    public static getBrowserInfo(userAgent?: string): IBrowserInfo {
        let ua = userAgent !== undefined ? userAgent : navigator.userAgent,
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
     * Static method to call some async function on an array of data and you want them called sequentially
     * @method Utils#eachSeries
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

    /**
     * Static method to encapsulate repeatdly calling an async method until a condition is met (tyoes defined at top)
     * @method Utils#doUntil
     * @param {DoUntilOperationFunction} operation - the operation to perform 
     * @param {DoUntilTestFunction} test - the condition that stops the repeats
     * @param {any} data - the data
     */
    public static doUntil(operation: DoUntilOperationFunction, test: DoUntilTestFunction, data?: any): Promise<any> {
        return operation(data)
            .then((rslt: any) => {
                return test(rslt) ? Utils.doUntil(operation, test, rslt) : rslt;
            });
    }


    /**
     * Static method to provide Mustache/handlebars style formatting ...
     * @method Utils#format
     * @param {string} content 
     * @param {Object} tags 
     */
    public static format(content: string, tags: Object) {

        return (<any>content).replace(/{{(.*?)}}/g, (tag, key) => {
            let replacement;

            if (typeof tags[key] === "string") {
                replacement = key !== "urlBase" ? encodeURIComponent(tags[key]) : tags[key];
            }

            return typeof replacement === "string" ? replacement : "";
        });
    }

    /**
     * Static method to het a header value from a headers collection in a case insensitive fashion
     * @method Utils#getHeaderValue
     * @param headers Helper function to deal with potential case issues accessing http headers collection
     * @param key 
     */
    public static getHeaderValue(headers: Object, key: string) {
        return headers[key] || headers[key.toLowerCase()];
    }

    /**
     * https://davidwalsh.name/javascript-debounce-function
     * Returns a function, that, as long as it continues to be invoked, will not
     * be triggered. The function will be called after it stops being called for
     * N milliseconds. If `immediate` is passed, trigger the function on the
     * leading edge, instead of the trailing.
     */
    public static debounce(func: Function, wait: number, immediate?: boolean): Function {
        let timeout;
        return function () {
            let context = this, args = arguments;
            let later = function () {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }

    /**
     * Utils class constructor.
     * @class Utils
     * @classdesc Class that implements a Utils.
     */
    constructor() {
        throw new Error("Cannot new this class");
    }


};

