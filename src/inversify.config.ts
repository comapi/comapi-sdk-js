import "reflect-metadata";

import { Container } from "inversify";

import {
    IComapiConfig,
    IEventManager,
    ILocalStorageData,
    ILogger,
    IRestClient,
    ISessionManager,
    IWebSocketManager,
    INetworkManager,
    IDeviceManager,
    IFacebookManager,
    IConversationManager,
    IProfileManager,
    IMessageManager,
    IOrphanedEventManager,
    OrphanedEventPersistences,
    IProfile,
    IServices,
    IDevice,
    IChannels,
    IMessagePager,
    IEventMapper,
    IAppMessagingInternal,
} from "./interfaces";

import { EventManager } from "./eventManager";
import { LocalStorageData } from "./localStorageData";
import { Logger } from "./logger";
import { RestClient } from "./restClient";
import { AuthenticatedRestClient } from "./authenticatedRestClient";
import { SessionManager } from "./sessionManager";
import { WebSocketManager } from "./webSocketManager";
import { NetworkManager } from "./networkManager";
import { DeviceManager } from "./deviceManager";
import { FacebookManager } from "./facebookManager";
import { ConversationManager } from "./conversationManager";
import { ProfileManager } from "./profileManager";
import { MessageManager } from "./messageManager";
import { IndexedDBOrphanedEventManager } from "./indexedDBOrphanedEventManager";
import { LocalStorageOrphanedEventManager } from "./localStorageOrphanedEventManager";
import { MessagePager } from "./messagePager";
import { AppMessaging } from "./appMessaging";
import { Profile } from "./profile";
import { Services } from "./services";
import { Device } from "./device";
import { Channels } from "./channels";
import { IndexedDBLogger } from "./indexedDBLogger";
import { EventMapper } from "./eventMapper";
import { ContentManager } from "./contentManager";



import { INTERFACE_SYMBOLS } from "./interfaceSymbols";


export class InterfaceContainer {

    private _container: Container;

    private _overriddenInterfaces: any = {};

    constructor() {
        this._container = new Container();
    }

    /**
     * 
     */
    public initialise(comapiConfig?: IComapiConfig): void {

        this._container.bind<IEventManager>(INTERFACE_SYMBOLS.EventManager).to(EventManager).inSingletonScope();
        this._container.bind<ILocalStorageData>(INTERFACE_SYMBOLS.LocalStorageData).to(LocalStorageData).inSingletonScope();
        this._container.bind<ILogger>(INTERFACE_SYMBOLS.Logger).to(Logger).inSingletonScope();
        this._container.bind<IRestClient>(INTERFACE_SYMBOLS.RestClient).to(RestClient).inSingletonScope();
        this._container.bind<ISessionManager>(INTERFACE_SYMBOLS.SessionManager).to(SessionManager).inSingletonScope();
        this._container.bind<IEventMapper>(INTERFACE_SYMBOLS.EventMapper).to(EventMapper).inSingletonScope();
        this._container.bind<IWebSocketManager>(INTERFACE_SYMBOLS.WebSocketManager).to(WebSocketManager).inSingletonScope();
        this._container.bind<INetworkManager>(INTERFACE_SYMBOLS.NetworkManager).to(NetworkManager).inSingletonScope();
        this._container.bind<IRestClient>(INTERFACE_SYMBOLS.AuthenticatedRestClient).to(AuthenticatedRestClient).inSingletonScope();
        this._container.bind<IDeviceManager>(INTERFACE_SYMBOLS.DeviceManager).to(DeviceManager).inSingletonScope();
        this._container.bind<IFacebookManager>(INTERFACE_SYMBOLS.FacebookManager).to(FacebookManager).inSingletonScope();
        this._container.bind<IConversationManager>(INTERFACE_SYMBOLS.ConversationManager).to(ConversationManager).inSingletonScope();
        this._container.bind<IProfileManager>(INTERFACE_SYMBOLS.ProfileManager).to(ProfileManager).inSingletonScope();
        this._container.bind<IMessagePager>(INTERFACE_SYMBOLS.MessagePager).to(MessagePager).inSingletonScope();

        let dbSupported: boolean = "indexedDB" in window;

        if (comapiConfig && comapiConfig.orphanedEventPersistence) {

            if (comapiConfig.orphanedEventPersistence === OrphanedEventPersistences.LocalStorage) {
                this._container.bind<IOrphanedEventManager>(INTERFACE_SYMBOLS.OrphanedEventManager).to(LocalStorageOrphanedEventManager).inSingletonScope();
            } else if (comapiConfig.orphanedEventPersistence === OrphanedEventPersistences.IndexedDbIfSupported) {
                if (dbSupported) {
                    this._container.bind<IOrphanedEventManager>(INTERFACE_SYMBOLS.OrphanedEventManager).to(IndexedDBOrphanedEventManager).inSingletonScope();
                } else {
                    this._container.bind<IOrphanedEventManager>(INTERFACE_SYMBOLS.OrphanedEventManager).to(LocalStorageOrphanedEventManager).inSingletonScope();
                }
            }
        } else {
            if (dbSupported) {
                this._container.bind<IOrphanedEventManager>(INTERFACE_SYMBOLS.OrphanedEventManager).to(IndexedDBOrphanedEventManager).inSingletonScope();
            } else {
                this._container.bind<IOrphanedEventManager>(INTERFACE_SYMBOLS.OrphanedEventManager).to(LocalStorageOrphanedEventManager).inSingletonScope();
            }
        }

        this._container.bind<IMessageManager>(INTERFACE_SYMBOLS.MessageManager).to(MessageManager).inSingletonScope();
        this._container.bind<IAppMessagingInternal>(INTERFACE_SYMBOLS.AppMessaging).to(AppMessaging).inSingletonScope();
        this._container.bind<IProfile>(INTERFACE_SYMBOLS.Profile).to(Profile).inSingletonScope();
        this._container.bind<IServices>(INTERFACE_SYMBOLS.Services).to(Services).inSingletonScope();
        this._container.bind<IDevice>(INTERFACE_SYMBOLS.Device).to(Device).inSingletonScope();
        this._container.bind<IChannels>(INTERFACE_SYMBOLS.Channels).to(Channels).inSingletonScope();
        this._container.bind<ContentManager>(INTERFACE_SYMBOLS.ContentManager).to(ContentManager).inSingletonScope();
    }

    /**
     * 
     */
    public uninitialise(): void {
        this._container.unbindAll();
    }

    /**
     * 
     */
    public bindIndexedDBLogger() {
        if (this._container.isBound(INTERFACE_SYMBOLS.IndexedDBLogger)) {
            this._container.rebind<IndexedDBLogger>(INTERFACE_SYMBOLS.IndexedDBLogger).to(IndexedDBLogger).inSingletonScope();
        } else {
            this._container.bind<IndexedDBLogger>(INTERFACE_SYMBOLS.IndexedDBLogger).to(IndexedDBLogger).inSingletonScope();
        }
    }


    /**
     * 
     */
    public unbindIndexedDBLogger() {
        if (this._container.isBound(INTERFACE_SYMBOLS.IndexedDBLogger)) {
            this._container.unbind(INTERFACE_SYMBOLS.IndexedDBLogger);
        }
    }

    /**
     * 
     */
    public bindComapiConfig(comapiConfig: IComapiConfig) {

        let _comapiConfig: IComapiConfig = comapiConfig;

        if (this._container.isBound(INTERFACE_SYMBOLS.ComapiConfig)) {
            // console.log("unbinding old ComapiConfig: ", JSON.stringify(_comapiConfig));
            this._container.unbind(INTERFACE_SYMBOLS.ComapiConfig);
        } else {
            // console.log("first bind of ComapiConfig: ", JSON.stringify(_comapiConfig));
        }

        this._container.bind<IComapiConfig>(INTERFACE_SYMBOLS.ComapiConfig).toDynamicValue((context) => {
            // console.log("serving up ComapiConfig: ", JSON.stringify(_comapiConfig));
            return _comapiConfig;
        });
    }


    /**
     *
     * @param serviceIdentifier 
     */
    public getInterface<T>(serviceIdentifier: string): T {
        return this._container.get<T>(serviceIdentifier);
    }

    /**
     * 
     * @param serviceIdentifier 
     */
    public setInterface(serviceIdentifier: string, instance: any) {

        // unbind existing interface
        if (this._container.isBound(serviceIdentifier)) {
            this._container.unbind(serviceIdentifier);
        }

        // cache this one
        this._overriddenInterfaces[serviceIdentifier.toString()] = instance;

        // bind this new one
        this._container.bind(serviceIdentifier).toDynamicValue((context) => {
            return this._overriddenInterfaces[serviceIdentifier.toString()];
        });
    }

}


