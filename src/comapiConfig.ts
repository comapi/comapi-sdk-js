import {
    IComapiConfig,
    IAuthChallenge,
    LogLevels,
    LogPersistences
} from "./interfaces";


export class ComapiConfig implements IComapiConfig {

    public apiSpaceId: string;
    public logRetentionHours: number = 24;
    public authChallenge: IAuthChallenge;
    public urlBase: string = "https://api.comapi.com";
    public webSocketBase: string = "wss://api.comapi.com";
    public logLevel: LogLevels = LogLevels.Error;
    public logPersistence: LogPersistences = LogPersistences.LocalStorage;

    /**
     * ComapiConfig class constructor.
     * @class ComapiConfig
     * @classdesc Class that implements IComapiConfig
     */
    constructor() { this.apiSpaceId = undefined; }

    /**
     * Function to set apiSpaceId
     * @method ComapiConfig#withApiSpace
     * @param {string} id - the api space id 
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withApiSpace(id: string): ComapiConfig {
        this.apiSpaceId = id;
        return this;
    }

    /**
     * Function to set Logfile Retention Time in hours (Defaouts to `24`)
     * @method ComapiConfig#withLogRetentionTime
     * @param {number} hours - the log retention time in hours
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withLogRetentionTime(hours: number): ComapiConfig {
        this.logRetentionHours = hours;
        return this;
    }

    /**
     * Function to set the authentication Challenge
     * @method ComapiConfig#withAuthChallenge
     * @param {IAuthChallenge} authChallenge - the authentication challenge
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withAuthChallenge(authChallenge: IAuthChallenge): ComapiConfig {
        this.authChallenge = authChallenge;
        return this;
    }

    /**
     * Function to set urlBase (Defaults to production)
     * @method ComapiConfig#withUrlBase
     * @param {string} urlBase - the url base
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withUrlBase(urlBase: string): ComapiConfig {
        this.urlBase = urlBase;
        return this;
    }

    /**
     * Function to set webSocketBase (Defaults to production)
     * @method ComapiConfig#withWebSocketBase
     * @param {string} webSocketBase - the web socket base
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withWebSocketBase(webSocketBase: string): ComapiConfig {
        this.webSocketBase = webSocketBase;
        return this;
    }

    /**
     * Function to set logLevel  (Defaults to errors only)
     * @method ComapiConfig#withLogLevel
     * @param {LogLevels} withLogLevel - the logLevel
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withLogLevel(logLevel: LogLevels): ComapiConfig {
        this.logLevel = logLevel;
        return this;
    }

    /**
     * Function to set logPersistence 
     * @method ComapiConfig#withLogPersistence
     * @param {LogPersistences} logPersistence - the logPersistence
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withLogPersistence(logPersistence: LogPersistences): ComapiConfig {
        this.logPersistence = logPersistence;
        return this;
    }

}


