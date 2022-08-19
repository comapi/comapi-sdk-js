import {
    IComapiConfig,
    IAuthChallenge,
    LogLevels,
    LogPersistences,
    OrphanedEventPersistences,
    IFoundationRestUrls,
    IEventMapping,
    IPushConfig
} from "./interfaces";

import { InterfaceContainer } from "./inversify.config";

import { FoundationRestUrls } from "./urlConfig";


export class ComapiConfig implements IComapiConfig {

    public apiSpaceId: string;
    public logRetentionHours: number = 24;
    public authChallenge: IAuthChallenge;
    public urlBase: string = "https://api.comapi.com";
    public webSocketBase: string = "wss://api.comapi.com";
    public logLevel: LogLevels = LogLevels.Error;
    public logPersistence: LogPersistences = LogPersistences.LocalStorage;
    public isTypingTimeout: number = 10;
    public isTypingOffTimeout: number = 10;
    public foundationRestUrls: IFoundationRestUrls = new FoundationRestUrls();
    public eventMapping: IEventMapping;
    public localStoragePrefix: string;
    public orphanedEventPersistence: OrphanedEventPersistences = OrphanedEventPersistences.IndexedDbIfSupported;
    public enableWebsocketForNonChatUsage: boolean;
    public pushConfig?: IPushConfig;
    public interfaceContainer?: InterfaceContainer; 

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
    public withApiSpace(id: string) {
        this.apiSpaceId = id;
        return this;
    }

    /**
     * Function to set Logfile Retention Time in hours (Defaouts to `24`)
     * @method ComapiConfig#withLogRetentionTime
     * @param {number} hours - the log retention time in hours
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withLogRetentionTime(hours: number) {
        this.logRetentionHours = hours;
        return this;
    }

    /**
     * Function to set the authentication Challenge
     * @method ComapiConfig#withAuthChallenge
     * @param {IAuthChallenge} authChallenge - the authentication challenge
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withAuthChallenge(authChallenge: IAuthChallenge) {
        this.authChallenge = authChallenge;
        return this;
    }

    /**
     * Function to set urlBase (Defaults to production)
     * @method ComapiConfig#withUrlBase
     * @param {string} urlBase - the url base
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withUrlBase(urlBase: string) {
        this.urlBase = urlBase;
        return this;
    }

    /**
     * Function to set webSocketBase (Defaults to production)
     * @method ComapiConfig#withWebSocketBase
     * @param {string} webSocketBase - the web socket base
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withWebSocketBase(webSocketBase: string) {
        this.webSocketBase = webSocketBase;
        return this;
    }

    /**
     * Function to set logLevel  (Defaults to errors only)
     * @method ComapiConfig#withLogLevel
     * @param {LogLevels} withLogLevel - the logLevel
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withLogLevel(logLevel: LogLevels) {
        this.logLevel = logLevel;
        return this;
    }

    /**
     * Function to set logPersistence 
     * @method ComapiConfig#withLogPersistence
     * @param {LogPersistences} logPersistence - the logPersistence
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withLogPersistence(logPersistence: LogPersistences) {
        this.logPersistence = logPersistence;
        return this;
    }

    /**
     * Function to override foundationRestUrls 
     * @method ComapiConfig#withFoundationRestUrls
     * @param {IFoundationRestUrls} foundationRestUrls - the foundationRestUrls
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withFoundationRestUrls(foundationRestUrls: IFoundationRestUrls) {
        this.foundationRestUrls = foundationRestUrls;
        return this;
    }

    /**
     * Function to override eventMapping 
     * @method ComapiConfig#withEventMapping
     * @param {IEventMapping} eventMapping - the eventMapping
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withEventMapping(eventMapping: IEventMapping) {
        this.eventMapping = eventMapping;
        return this;
    }

    /**
     * Function to override localStoragePrefix 
     * @method ComapiConfig#withLocalStoragePrefix
     * @param {string} localStoragePrefix - the localStoragePrefix
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withLocalStoragePrefix(localStoragePrefix: string) {
        this.localStoragePrefix = localStoragePrefix;
        return this;
    }

    /**
     * Function to override orphanedEventPersistence 
     * @method ComapiConfig#withOrphanedEventPersistence
     * @param {string} orphanedEventPersistence - the orphanedEventPersistence
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
    public withOrphanedEventPersistence(orphanedEventPersistence: OrphanedEventPersistences) {
        this.orphanedEventPersistence = orphanedEventPersistence;
        return this;
    }

    /**
     * Function to override enableWebsocketForNonChatUsage 
     * @method ComapiConfig#withEnabledNonChatSocket
     * @param {string} enabled - enabled
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
     public withEnabledNonChatSocket(enabled: boolean){
        this.enableWebsocketForNonChatUsage = enabled;
        return this;
    }

    /**
     * Function to specify push configuration
     * @method ComapiConfig#withPushConfiguration
     * @param {IPushConfig} config - config
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
     public withPushConfiguration(config: IPushConfig){
        this.pushConfig = config;
        return this;
    }

    /**
     * Function to specify push InterfaceContainer
     * @method ComapiConfig#withInterfaceContainer
     * @param {InterfaceContainer} interfaceContainer - InterfaceContainer
     * @returns {ComapiConfig} - Returns reference to itself so methods can be chained
     */
     public withInterfaceContainer(interfaceContainer: InterfaceContainer){
        this.interfaceContainer = interfaceContainer;
        return this;
    }


}


