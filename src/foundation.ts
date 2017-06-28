import {
    IEventManager,
    ILogger,
    ISession,
    IComapiConfig,
    LogPersistences,
    IServices,
    IDevice,
    IChannels,
    IFoundation,
    INetworkManager,
} from "./interfaces";

import { IndexedDBLogger } from "./indexedDBLogger";
import { ConversationBuilder } from "./conversationBuilder";
import { MessageBuilder } from "./messageBuilder";
import { MessageStatusBuilder } from "./messageStatusBuilder";

import { ComapiConfig } from "./comapiConfig";

import { FoundationRestUrls } from "./urlConfig";

import { InterfaceManager } from "./interfaceManager";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";
import { container } from "./inversify.config";


/*
 * Exports to be added to COMAPI namespace
 */
export { ComapiConfig, MessageStatusBuilder, ConversationBuilder, MessageBuilder, InterfaceManager }

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
        return "1.0.2.121";
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
            comapiConfig.logPersistence === LogPersistences.IndexedDB &&
            !container.isBound(INTERFACE_SYMBOLS.ComapiConfig)) {
            container.bind<IndexedDBLogger>(INTERFACE_SYMBOLS.IndexedDBLogger).to(IndexedDBLogger);
        } else if (container.isBound(INTERFACE_SYMBOLS.IndexedDBLogger)) {
            container.unbind(INTERFACE_SYMBOLS.IndexedDBLogger);
        }

        let eventManager: IEventManager = container.get<IEventManager>(INTERFACE_SYMBOLS.EventManager);

        let logger: ILogger = container.get<ILogger>(INTERFACE_SYMBOLS.Logger);

        if (comapiConfig.logLevel) {
            logger.logLevel = comapiConfig.logLevel;
        }

        let networkManager: INetworkManager = container.get<INetworkManager>(INTERFACE_SYMBOLS.NetworkManager);

        let services = container.get<IServices>(INTERFACE_SYMBOLS.Services);
        let device = container.get<IDevice>(INTERFACE_SYMBOLS.Device);
        let channels = container.get<IChannels>(INTERFACE_SYMBOLS.Channels);

        let foundation = new Foundation(eventManager, logger, networkManager, services, device, channels);

        if (doSingleton) { Foundation._foundation = foundation; }

        return Promise.resolve(foundation);
    }


    /**
     * Foundation class constructor.
     * @class Foundation
     * @classdesc Class that implements Comapi foundation functionality.
     */
    constructor(private _eventManager: IEventManager,
        private _logger: ILogger,
        private _networkManager: INetworkManager,
        services: IServices,
        device: IDevice,
        channels: IChannels) {

        // initialising like this for sake of JSDoc ...
        this._services = services;
        this._device = device;
        this._channels = channels;
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

