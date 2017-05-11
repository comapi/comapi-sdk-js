import {
    IEventManager,
    ILogger,
    IRestClient,
    ILocalStorageData,
    ISessionManager,
    ISession,
    IDeviceManager,
    IFacebookManager,
    IConversationManager,
    IProfileManager,
    IMessageManager,
    IComapiConfig,
    IWebSocketManager,
    LogPersistences,
    IServices,
    IDevice,
    IChannels,
    IFoundation
} from "./interfaces";

import { EventManager } from "./eventManager";
import { Logger } from "./logger";
import { RestClient } from "./restClient";
import { AuthenticatedRestClient } from "./authenticatedRestClient";
import { IndexedDBLogger } from "./indexedDBLogger";
import { LocalStorageData } from "./localStorageData";
import { SessionManager } from "./sessionManager";
import { DeviceManager } from "./deviceManager";
import { FacebookManager } from "./facebookManager";
import { ProfileManager } from "./profileManager";
import { MessageManager } from "./messageManager";
import { MessagePager } from "./messagePager";
import { ConversationManager } from "./conversationManager";
import { WebSocketManager } from "./webSocketManager";
import { ConversationBuilder } from "./conversationBuilder";
import { MessageBuilder } from "./messageBuilder";
import { MessageStatusBuilder } from "./messageStatusBuilder";
import { ComapiConfig } from "./comapiConfig";

import { AppMessaging } from "./appMessaging";
import { Profile } from "./profile";
import { Services } from "./services";
import { Device } from "./device";
import { Channels } from "./channels";
import { NetworkManager } from "./networkManager";

/*
 * Exports to be added to COMAPI namespace
 */
export { ComapiConfig, MessageStatusBuilder, ConversationBuilder, MessageBuilder }

export class Foundation implements IFoundation {

    /**
     * Singleton Foundation instance
     */
    private static _foundation: Foundation;

    /**
     * @name Foundation#_services
     * @private
     * @type {Services}
     */
    private _services: IServices;

    /**
     * @name Foundation#_device
     * @private
     * @type {Device}     
     */
    private _device: IDevice;

    /**
     * @name Foundation#_channels
     * @private
     * @type {Channels}     
     */
    private _channels: IChannels;

    /**
     * Factory method to create a singleton instance of Foundation
     * @method Foundation#initialise
     * @param {IComapiConfig} comapiConfig - the app config (use `ComapiConfig` to create)
     * @returns {Promise} - returns promise
     */
    public static initialiseShared(comapiConfig: IComapiConfig): Promise<Foundation> {
        return Foundation._initialise(comapiConfig, true);
    }

    /**
     * Factory method to create an instance of Foundation
     * @method Foundation#initialise
     * @param {IComapiConfig} comapiConfig - the app config (use `ComapiConfig` to create)
     * @returns {Promise} - returns promise
     */
    public static initialise(comapiConfig: IComapiConfig): Promise<Foundation> {
        return Foundation._initialise(comapiConfig, false);
    }

    /**
     * Property to get the SDK version
     * @method Foundation#version
     */
    public static get version(): string {
        return "_SDK_VERSION_";
    }

    /**
     * Private initialisation method
     * @param comapiConfig 
     * @param indexedDBLogger 
     */
    private static _initialise(comapiConfig: IComapiConfig, doSingleton: boolean): Promise<Foundation> {

        if (doSingleton && Foundation._foundation) {
            return Promise.resolve(Foundation._foundation);
        }

        if (comapiConfig.logPersistence &&
            comapiConfig.logPersistence === LogPersistences.IndexedDB) {

            let indexedDBLogger: IndexedDBLogger = new IndexedDBLogger();

            return indexedDBLogger.openDatabase()
                .then(function () {

                    var retentionHours = comapiConfig.logRetentionHours === undefined ? 24 : comapiConfig.logRetentionHours;

                    var purgeDate = new Date((new Date()).valueOf() - 1000 * 60 * 60 * retentionHours);

                    return indexedDBLogger.purge(purgeDate);
                })
                .then(function () {
                    let foundation: Foundation = foundationFactory(comapiConfig, indexedDBLogger);
                    if (doSingleton) { Foundation._foundation = foundation; }
                    return Promise.resolve(foundation);
                });
        } else {
            let foundation: Foundation = foundationFactory(comapiConfig);
            if (doSingleton) { Foundation._foundation = foundation; }
            return Promise.resolve(foundation);
        }

        function foundationFactory(config: IComapiConfig, indexedDBLogger?: IndexedDBLogger) {
            let eventManager: IEventManager = new EventManager();

            let localStorageData: ILocalStorageData = new LocalStorageData();

            let logger: ILogger = new Logger(eventManager, config.logPersistence === LogPersistences.LocalStorage ? localStorageData : undefined, indexedDBLogger);

            if (config.logLevel) {
                logger.logLevel = config.logLevel;
            }

            let restClient: IRestClient = new RestClient(logger);

            let sessionManager: ISessionManager = new SessionManager(logger, restClient, localStorageData, config);

            let webSocketManager: IWebSocketManager = new WebSocketManager(logger, localStorageData, config, sessionManager, eventManager);

            let networkManager = new NetworkManager(sessionManager, webSocketManager);

            let authenticatedRestClient: IRestClient = new AuthenticatedRestClient(logger, networkManager);

            let deviceManager: IDeviceManager = new DeviceManager(logger, authenticatedRestClient, localStorageData, config);

            let facebookManager: IFacebookManager = new FacebookManager(authenticatedRestClient, config);

            let conversationManager: IConversationManager = new ConversationManager(logger, authenticatedRestClient, localStorageData, config, sessionManager);

            let profileManager: IProfileManager = new ProfileManager(logger, authenticatedRestClient, localStorageData, config, sessionManager);

            let messageManager: IMessageManager = new MessageManager(logger, authenticatedRestClient, localStorageData, config, sessionManager, conversationManager);


            let foundation = new Foundation(eventManager,
                logger,
                localStorageData,
                networkManager,
                deviceManager,
                facebookManager,
                conversationManager,
                profileManager,
                messageManager,
                config);

            return foundation;
        }
    }

    /**
     * Foundation class constructor.
     * @class Foundation
     * @classdesc Class that implements Comapi foundation functionality.
     */
    constructor(private _eventManager: IEventManager,
        private _logger: ILogger,
        /*private*/ _localStorageData: ILocalStorageData,
        private _networkManager: NetworkManager,
        /*private*/ _deviceManager: IDeviceManager,
        /*private*/ _facebookManager: IFacebookManager,
        /*private*/ _conversationManager: IConversationManager,
        /*private*/ _profileManager: IProfileManager,
        /*private*/ _messageManager: IMessageManager,
        /*private*/ _comapiConfig: IComapiConfig) {

        let messagePager = new MessagePager(_logger, _localStorageData, _messageManager);

        let appMessaging = new AppMessaging(this._networkManager, _conversationManager, _messageManager, messagePager);

        let profile = new Profile(this._networkManager, _localStorageData, _profileManager);

        this._services = new Services(appMessaging, profile);

        this._device = new Device(this._networkManager, _deviceManager);

        this._channels = new Channels(this._networkManager, _facebookManager);

    }

    /**
     * Method to start a new authenticated session
     * @method Foundation#startSession
     * @returns {Promise} - Returns a promise 
     */
    public startSession(): Promise<ISession> {
        return this._networkManager.startSession()
            .then(sessionInfo => {
                return sessionInfo.session;
            });
    }

    /**
     * Method to end an existing authenticated session
     * @method Foundation#endSession
     * @returns {Promise} - Returns a promise
     */
    public endSession(): Promise<boolean> {
        return this._networkManager.endSession();
    }

    /**
     * Method to get Services interface
     * @method Foundation#services
     * @returns {Services} - Returns Services
     */
    public get services(): IServices {
        return this._services;
    }

    /**
     * Method to get Device interface
     * @method Foundation#device
     * @returns {Device} - Returns Device
     */
    public get device(): IDevice {
        return this._device;
    }

    /**
     * Method to get Channels interface
     * @method Foundation#channels
     * @returns {Channels} - Returns Channels
     */
    public get channels(): IChannels {
        return this._channels;
    }

    /**
     * Method to get current session
     * @method Foundation#session
     * @returns {ISession} - Returns an ISession interface
     */
    public get session(): ISession {
        return this._networkManager.session;
    }

    /**
     * Subscribes the caller to a comapi event.
     * @method Foundation#on
     * @param {string} eventType - The type of event to subscribe to
     * @param {Function} handler - The callback
     */
    public on(eventType: string, handler: Function): void {
        this._eventManager.subscribeToLocalEvent(eventType, handler);
    }

    /**
     * Unsubscribes the caller to a comapi event.
     * @method Foundation#off
     * @param {string} eventType - The type of event to subscribe to
     * @param {Function} [handler] - The callback (optional - if not specified, all associated callbacks will be unregistered)
     */
    public off(eventType: string, handler?: Function): void {
        this._eventManager.unsubscribeFromLocalEvent(eventType, handler);
    }

    /**
     * Method to retrieve the current debug log as a string
     * @method Foundation#getLogs
     * @returns {Promise} - Returns a promise
     */
    public getLogs(): Promise<string> {
        return this._logger.getLog();
    }

}

