import { injectable, inject, optional } from "inversify";
import { ILogger, LogLevels, ILogEvent, IEventManager, ILocalStorageData } from "./interfaces";

import { IndexedDBLogger } from "./indexedDBLogger";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";
@injectable()
export class Logger implements ILogger {

    private _logLevel: LogLevels = LogLevels.Debug;

    // used as an id to identify each "session" - it will change on page reload and if 2 windows are open you can identify each log entry for diagnostics
    private _uid: string = ("0000" + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);

    private _maxLocalStorageLogSize: number = 1024;
    private _localStorageKey: string = "rollingLogfile";

    /**        
     * Logger class constructor.
     * @class Logger
     * @ignore
     * @classdesc Class that implements all the Logger functionality.
     * @param {IEventManager} [eventManager] - event manager interface - for publishing log events 
     * @param {ILocalStorageData} [localStorageData] - local storage interface  - for publishing log events 
     * @param {IndexedDB} [indexedDB] - indexedDB interface - assumed to be open and ready to go 
     */
    constructor( @inject(INTERFACE_SYMBOLS.EventManager) private _eventManager?: IEventManager,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorageData?: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.IndexedDBLogger) @optional() private _indexedDB?: IndexedDBLogger) { }

    /**
     * Getter to get the log level
     * @method Logger#logLevel
     * @returns {LogLevels} - returns the current log level
     */
    get logLevel(): LogLevels {
        return this._logLevel;
    }

    /**
     * Setter to set the log level 
     * @method Logger#logLevel
     * @param {LogLevels} theLogLevel - the log level
     */
    set logLevel(theLogLevel: LogLevels) {
        this._logLevel = theLogLevel;
    }


    /**
     * Write custon content to the diagnostic log of type info. 
     * @method Logger#log
     * @param  {String} message
     * @param  {Object} [data]
     * @returns {Promise} - returns promise
     */
    public log(message: string, data?: Object): Promise<boolean> {
        return this._log(LogLevels.Debug, message, data);
    }

    /**
     * Write custon content to the diagnostic log of type warning. 
     * @method Logger#warn
     * @param  {String} message
     * @param  {Object} [data]
     * @returns {Promise} - returns promise
     */
    public warn(message: string, data?: Object): Promise<boolean> {
        return this._log(LogLevels.Warn, message, data);
    }

    /**
     * Write custon content to the diagnostic log of type error. 
     * @method Logger#error
     * @param  {String} message
     * @param  {Object} [data]
     * @returns {Promise} - returns promise
     */
    public error(message: string, data?: Object): Promise<boolean> {
        return this._log(LogLevels.Error, message, data);
    }

    /**
     * Method to get the current logfile
     * @method Logger#getLog
     * @returns {Promise} - returns promise
     */
    public getLog(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this._indexedDB) {

                this._indexedDB.getData().then(function (data) {
                    resolve(JSON.stringify(data));
                }).catch(function (error) {
                    reject(error);
                });

            } else if (this._localStorageData) {
                resolve(this._localStorageData.getString(this._localStorageKey));
            } else {
                reject({ message: "No logfile to get" });
            }
        });
    }

    /**
     * Method to clear the current logfile.
     * @method Logger#clearLog
     * @returns {Promise} - returns promise
     */
    public clearLog(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._indexedDB) {
                this._indexedDB.clearData().then(function () {
                    resolve(true);
                })
                    .catch(function (error) {
                        reject(error);
                    });
            } else if (this._localStorageData) {
                this._localStorageData.remove(this._localStorageKey);
                resolve(true);
            } else {
                reject({ message: "No logfile to clear" });
            }
        });

    }

    /**
     * Private method to get a string representation of a log level
     * @param {LogLevels} level
     * @returns {String}
     */
    private _stringForLogLevel(level: LogLevels): string {
        switch (level) {
            case LogLevels.Debug:
                return "Debug";
            case LogLevels.Warn:
                return "Warning";
            case LogLevels.Error:
                return "Error";
            default:
                return "?";
        }
    }

    /**
     * Private method to log a message
     * @param  {LogLevels} level
     * @param  {string} message
     * @param  {Object} [data]
     * @returns Promise
     */
    private _log(level: LogLevels, message: string, data?: Object): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (level <= this._logLevel) {

                let formattedMessage = "[" + this._uid + "] : " + new Date().toJSON() + " ["
                    + this._stringForLogLevel(level) + "] : " + message + (data !== undefined ? (" : "
                        + JSON.stringify(data)) : "") + "\r\n";

                switch (level) {
                    case LogLevels.Error:
                        console.error(formattedMessage);
                        break;

                    case LogLevels.Warn:
                        console.warn(formattedMessage);
                        break;

                    case LogLevels.Debug:
                        console.log(formattedMessage);
                        break;

                    default:
                        break;
                }

                let now = new Date();

                let logEvent: ILogEvent = {
                    created: now.valueOf(),
                    data: data,
                    logLevel: level,
                    message: message,
                    timestamp: now.toISOString(),
                };

                if (this._indexedDB) {

                    this._indexedDB.addRecord(logEvent).then(function (index) {
                        resolve(true);
                    });

                } else if (this._localStorageData) {
                    // fall back to using local storage
                    let log = this._localStorageData.getString(this._localStorageKey);

                    if (log !== null) {
                        log += formattedMessage;
                    } else {
                        log = formattedMessage;
                    }

                    if (log.length > this._maxLocalStorageLogSize) {
                        log = log.substring(formattedMessage.length);
                    }

                    this._localStorageData.setString(this._localStorageKey, log);

                    resolve(true);

                } else {
                    resolve(true);
                }

                if (this._eventManager) {
                    this._eventManager.publishLocalEvent("LogMessage", logEvent);
                }
            }
        });
    }
}
