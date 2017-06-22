import { injectable, inject } from "inversify";

import {
    IEventManager,
    ILogger,
    ILocalStorageData,
    ISession,
    IDeviceManager,
    IFacebookManager,
    IConversationManager,
    IProfileManager,
    IMessageManager,
    IComapiConfig,
    LogPersistences,
    IServices,
    IDevice,
    IChannels,
    IFoundation,
    IOrphanedEventManager,
    INetworkManager
} from "./interfaces";

import { IndexedDBLogger } from "./indexedDBLogger";
import { MessagePager } from "./messagePager";
import { ConversationBuilder } from "./conversationBuilder";
import { MessageBuilder } from "./messageBuilder";
import { MessageStatusBuilder } from "./messageStatusBuilder";
import { IndexedDBOrphanedEventManager } from "./indexedDBOrphanedEventManager";
import { LocalStorageOrphanedEventManager } from "./localStorageOrphanedEventManager";

import { ComapiConfig } from "./comapiConfig";

import { AppMessaging } from "./appMessaging";
import { Profile } from "./profile";
import { Services } from "./services";
import { Device } from "./device";
import { Channels } from "./channels";
import { FoundationRestUrls } from "./urlConfig";

import { InterfaceManager } from "./interfaceManager";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";
import { container } from "./inversify.config";


/*
 * Exports to be added to COMAPI namespace
 */
export { ComapiConfig, MessageStatusBuilder, ConversationBuilder, MessageBuilder, InterfaceManager, INTERFACE_SYMBOLS }

@injectable()
export class Foundation implements IFoundation {

    /**
     * Singleton Foundation instance
     */
    private static _foundation: IFoundation;

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

        if (container.isBound(INTERFACE_SYMBOLS.ComapiConfig)) {
            container.unbind(INTERFACE_SYMBOLS.ComapiConfig);
        }

        container.bind<IComapiConfig>(INTERFACE_SYMBOLS.ComapiConfig).toDynamicValue((context) => {
            return comapiConfig;
        });

        if (doSingleton && Foundation._foundation) {
            return Promise.resolve(Foundation._foundation);
        }

        if (comapiConfig.foundationRestUrls === undefined) {
            comapiConfig.foundationRestUrls = new FoundationRestUrls();
        }

        if (comapiConfig.logPersistence &&
            comapiConfig.logPersistence === LogPersistences.IndexedDB) {

            let indexedDBLogger: IndexedDBLogger = new IndexedDBLogger();

            return indexedDBLogger.openDatabase()
                .then(function () {

                    let retentionHours = comapiConfig.logRetentionHours === undefined ? 24 : comapiConfig.logRetentionHours;

                    let purgeDate = new Date((new Date()).valueOf() - 1000 * 60 * 60 * retentionHours);

                    return indexedDBLogger.purge(purgeDate);
                })
                .then(function () {
                    let foundation: Foundation = foundationFactory(comapiConfig, indexedDBLogger);
                    // let foundation: IFoundation = container.get<IFoundation>("Foundation");
                    if (doSingleton) { Foundation._foundation = foundation; }
                    return Promise.resolve(foundation);
                });
        } else {
            let foundation: Foundation = foundationFactory(comapiConfig);
            // let foundation: IFoundation = container.get<IFoundation>("Foundation");
            if (doSingleton) { Foundation._foundation = foundation; }
            return Promise.resolve(foundation);
        }

        function foundationFactory(config: IComapiConfig, indexedDBLogger?: IndexedDBLogger) {

            let eventManager: IEventManager = container.get<IEventManager>(INTERFACE_SYMBOLS.EventManager);

            let localStorageData: ILocalStorageData = container.get<ILocalStorageData>(INTERFACE_SYMBOLS.LocalStorageData);

            let logger: ILogger = container.get<ILogger>(INTERFACE_SYMBOLS.Logger);

            if (config.logLevel) {
                logger.logLevel = config.logLevel;
            }

            let networkManager: INetworkManager = container.get<INetworkManager>(INTERFACE_SYMBOLS.NetworkManager);
            let deviceManager: IDeviceManager = container.get<IDeviceManager>(INTERFACE_SYMBOLS.DeviceManager);
            let facebookManager: IFacebookManager = container.get<IFacebookManager>(INTERFACE_SYMBOLS.FacebookManager);
            let conversationManager: IConversationManager = container.get<IConversationManager>(INTERFACE_SYMBOLS.ConversationManager);
            let profileManager: IProfileManager = container.get<IProfileManager>(INTERFACE_SYMBOLS.ProfileManager);
            let messageManager: IMessageManager = container.get<IMessageManager>(INTERFACE_SYMBOLS.MessageManager);

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
    constructor( @inject(INTERFACE_SYMBOLS.EventManager) private _eventManager: IEventManager,
        @inject(INTERFACE_SYMBOLS.Logger) private _logger: ILogger,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) /*private*/ _localStorageData: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.NetworkManager) private _networkManager: INetworkManager,
        @inject(INTERFACE_SYMBOLS.DeviceManager) /*private*/ _deviceManager: IDeviceManager,
        @inject(INTERFACE_SYMBOLS.FacebookManager) /*private*/ _facebookManager: IFacebookManager,
        @inject(INTERFACE_SYMBOLS.ConversationManager) /*private*/ _conversationManager: IConversationManager,
        @inject(INTERFACE_SYMBOLS.ProfileManager) /*private*/ _profileManager: IProfileManager,
        @inject(INTERFACE_SYMBOLS.MessageManager) /*private*/ _messageManager: IMessageManager,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) /*private*/ _comapiConfig: IComapiConfig) {

        let dbSupported: boolean = "indexedDB" in window;
        let orphanedEventManager: IOrphanedEventManager;

        if (dbSupported) {
            orphanedEventManager = new IndexedDBOrphanedEventManager();
        } else {
            orphanedEventManager = new LocalStorageOrphanedEventManager(_localStorageData);
        }

        let messagePager = new MessagePager(_logger, _localStorageData, _messageManager, orphanedEventManager);

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
     * Method to get the logger
     * @method Foundation#logger
     * @returns {ILogger} - Returns an ILogger interface
     */
    public get logger(): ILogger {
        return this._logger;
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

