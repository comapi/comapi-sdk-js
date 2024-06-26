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
    ISessionManager,
    LogLevels
} from "./interfaces";

import { ConversationBuilder } from "./conversationBuilder";
import { MessageBuilder } from "./messageBuilder";
import { MessageStatusBuilder } from "./messageStatusBuilder";

import { ComapiConfig } from "./comapiConfig";

import { FoundationRestUrls } from "./urlConfig";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";
import { InterfaceContainer } from "./inversify.config";

import { ContentData } from "./contentData";
import { Mutex } from "./mutex";
import { Utils } from "./utils";


/*
 * Exports to be added to COMAPI namespace
 */
export { ComapiConfig, MessageStatusBuilder, ConversationBuilder, MessageBuilder, ContentData, Mutex, Utils }

export class Foundation implements IFoundation {

    /**
     * Singleton Foundation instance
     */
    private static _foundation: Foundation;

    /**
     * Mutex to prevent re-entrancy during initialisation
     */
    private static _mutex: Mutex = new Mutex();

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

        return Foundation._mutex.runExclusive(() => {

            if (doSingleton && Foundation._foundation) {
                return Promise.resolve(Foundation._foundation);
            }
    
            if (comapiConfig.foundationRestUrls === undefined) {
                comapiConfig.foundationRestUrls = new FoundationRestUrls();
            }
    
            let container: InterfaceContainer = comapiConfig.interfaceContainer ? comapiConfig.interfaceContainer : new InterfaceContainer();
    
            if (comapiConfig.interfaceContainer) {
                container = comapiConfig.interfaceContainer;
            } else {
                container = new InterfaceContainer();
                container.initialise(comapiConfig);
                container.bindComapiConfig(comapiConfig);
            }
    
            if (comapiConfig.logPersistence &&
                comapiConfig.logPersistence === LogPersistences.IndexedDB) {
                container.bindIndexedDBLogger();
            }
    
            let eventManager: IEventManager = container.getInterface<IEventManager>(INTERFACE_SYMBOLS.EventManager);
    
            let logger: ILogger = container.getInterface<ILogger>(INTERFACE_SYMBOLS.Logger);
    
            logger.logLevel = comapiConfig.logLevel in LogLevels ? comapiConfig.logLevel : 0;
    
            let networkManager: INetworkManager = container.getInterface<INetworkManager>(INTERFACE_SYMBOLS.NetworkManager);
    
            let services = container.getInterface<IServices>(INTERFACE_SYMBOLS.Services);
            let device = container.getInterface<IDevice>(INTERFACE_SYMBOLS.Device);
            let channels = container.getInterface<IChannels>(INTERFACE_SYMBOLS.Channels);
    
            let foundation = new Foundation(eventManager, logger, networkManager, services, device, channels);
    
            if (doSingleton) { Foundation._foundation = foundation; }
    
            // adopt a cached session if there is one
            let sessionManager = container.getInterface<ISessionManager>(INTERFACE_SYMBOLS.SessionManager);
    
            return sessionManager.initialise()
                .then(_ => {
                    if (comapiConfig.enableWebsocketForNonChatUsage) {
                        return networkManager.setWebsocketEnabled(true);
                    } else {
                        return Promise.resolve(false);
                    }
                })
                .then(_ => {
                    return Promise.resolve(foundation);
                });
        }, "initialise");
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

    /**
     * Track notification click and return deep link url to be opened.
     * @method Foundation#handleLink
     * @param message "FirebasePlugin push message returned from onMessageReceived"
     */
    public handlePush(message) {
        let _this = this;
        return new Promise((resolve, reject) => {
            _this._handleLink((result) => {
                resolve(result);
            },
            (error) => {
                reject(error);
            }, message);
        });
    }
    
    private _handleLink(successCallback, errorCallback, payload) {
        const ddDeepLink = payload.dd_deepLink || payload.data?.dd_deepLink || payload.additionalData?.dd_deepLink;
        let trackingUrl;
        let url;
        if (typeof ddDeepLink === "string") {
            try {
                let deepLinkData = JSON.parse(ddDeepLink);
                trackingUrl = deepLinkData?.trackingUrl;
                url = deepLinkData?.url;
            } catch (e) {
                errorCallback(e);
                return;
            }
        } else if (ddDeepLink) {
            trackingUrl = ddDeepLink.trackingUrl;
            url = ddDeepLink.url;
        }
        if (trackingUrl) {
            this._get(trackingUrl)
                .then(() => {
                    successCallback(url);
                })
                .catch((error) => {
                    errorCallback(error);
                });
        } else {
            successCallback(url);
        }
    }
    
    private _get(url: string) {
        return new Promise(function (resolve, reject) {
            const headers = {};
            /* tslint:disable:no-string-literal */
            headers["Content-Type"] = "application/json";
            headers["Cache-Control"] = "no-cache";
            headers["Pragma"] = "no-cache";
            headers["If-Modified-Since"] = "Mon, 26 Jul 1997 05:00:00 GMT";
            /* tslint:enable:no-string-literal */
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            for (let prop in headers) {
                if (headers.hasOwnProperty(prop)) {
                    xhr.setRequestHeader(prop, headers[prop]);
                }
            }
            xhr.onload = function () {
                const succeeded = xhr.status >= 200 && xhr.status < 300;
                if (succeeded) {
                    resolve(xhr.responseText);
                } else {
                    reject(xhr.responseText);
                }
            };
            xhr.onerror = function () {
                reject(xhr.status);
            };
            xhr.onabort = function (evt) {
                reject(xhr);
            };
            xhr.send(null);
        });
    }
}

