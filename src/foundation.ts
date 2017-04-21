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
import { SessionAndSocketResolver } from "./resolver";

/*
 * Exports to be added to COMAPI namespace
 */
export { ComapiConfig, MessageStatusBuilder, ConversationBuilder, MessageBuilder }

export class Foundation implements IFoundation {

    /**
     * Singleton Foundation instance
     */
    private static _foundtion: Foundation;

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
    public static initialise(comapiConfig: IComapiConfig): Promise<Foundation> {

        if (Foundation._foundtion) {
            return Promise.resolve(Foundation._foundtion);
        }

        function _initialise(indexedDBLogger?: IndexedDBLogger): Foundation {
            let eventManager: IEventManager = new EventManager();

            let localStorageData: ILocalStorageData = new LocalStorageData();

            let logger: ILogger = new Logger(eventManager, comapiConfig.logPersistence === LogPersistences.LocalStorage ? localStorageData : undefined, indexedDBLogger);

            if (comapiConfig.logLevel) {
                logger.logLevel = comapiConfig.logLevel;
            }

            let restClient: IRestClient = new RestClient(logger);

            let sessionManager: ISessionManager = new SessionManager(logger, restClient, localStorageData, comapiConfig);

            let authenticatedRestClient: IRestClient = new AuthenticatedRestClient(logger, sessionManager);

            let deviceManager: IDeviceManager = new DeviceManager(logger, authenticatedRestClient, localStorageData, comapiConfig);

            let facebookManager: IFacebookManager = new FacebookManager(authenticatedRestClient, comapiConfig);

            let conversationManager: IConversationManager = new ConversationManager(logger, authenticatedRestClient, localStorageData, comapiConfig, sessionManager);

            let profileManager: IProfileManager = new ProfileManager(logger, authenticatedRestClient, localStorageData, comapiConfig, sessionManager);

            let messageManager: IMessageManager = new MessageManager(logger, authenticatedRestClient, localStorageData, comapiConfig, sessionManager, conversationManager);

            let webSocketManager: IWebSocketManager = new WebSocketManager(logger, localStorageData, comapiConfig, sessionManager, eventManager);

            let foundation = new Foundation(eventManager,
                logger,
                localStorageData,
                sessionManager,
                deviceManager,
                facebookManager,
                conversationManager,
                profileManager,
                messageManager,
                webSocketManager,
                comapiConfig);

            return foundation;
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
                    Foundation._foundtion = _initialise(indexedDBLogger);
                    return Promise.resolve(Foundation._foundtion);
                });
        } else {
            Foundation._foundtion = _initialise();
            return Promise.resolve(Foundation._foundtion);
        }
    }

    /**
     * Property to get the SDK version
     * @method Foundation#version
     */
    public static get version(): string {
        return "_SDK_VERSION_";
    }


    /**
     * Foundation class constructor.
     * @class Foundation
     * @classdesc Class that implements Comapi foundation functionality.
     */
    constructor(private _eventManager: IEventManager,
        private _logger: ILogger,
        /*private*/ _localStorageData: ILocalStorageData,
        private _sessionManager: ISessionManager,
        /*private*/ _deviceManager: IDeviceManager,
        /*private*/ _facebookManager: IFacebookManager,
        /*private*/ _conversationManager: IConversationManager,
        /*private*/ _profileManager: IProfileManager,
        /*private*/ _messageManager: IMessageManager,
        private _webSocketManager: IWebSocketManager,
        private _comapiConfig: IComapiConfig) {

        let resolver = new SessionAndSocketResolver(_sessionManager, _webSocketManager);

        let messagePager = new MessagePager(_logger, _localStorageData, _messageManager);

        let appMessaging = new AppMessaging(resolver, _conversationManager, _messageManager, messagePager);

        let profile = new Profile(resolver, _localStorageData, _profileManager);

        this._services = new Services(appMessaging, profile);

        this._device = new Device(resolver, _deviceManager);

        this._channels = new Channels(resolver, _facebookManager);

    }

    /**
     * Method to start a new authenticated session
     * @method Foundation#startSession
     * @returns {Promise} - Returns a promise 
     */
    public startSession(): Promise<ISession> {
        return this._sessionManager.startSession()
            .then((sessionInfo) => {
                return this._webSocketManager.connect();
            })
            .then((connected) => {
                return this._sessionManager.sessionInfo.session;
            });
    }

    /**
     * Method to end an existing authenticated session
     * @method Foundation#endSession
     * @returns {Promise} - Returns a promise
     */
    public endSession(): Promise<boolean> {
        return this._webSocketManager.disconnect()
            .then(() => {
                return this._sessionManager.endSession();
            });
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
        return this._sessionManager.sessionInfo ? this._sessionManager.sessionInfo.session : null;
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

