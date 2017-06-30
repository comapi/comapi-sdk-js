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
    IAppMessaging,
    IProfile,
    IServices,
    IDevice,
    IChannels,
    IMessagePager,
    IEventMapper
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

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";


let container = new Container();


function initInterfaces() {
    "use strict";

    container.unbindAll();

    container.bind<IEventManager>(INTERFACE_SYMBOLS.EventManager).to(EventManager).inSingletonScope();
    container.bind<ILocalStorageData>(INTERFACE_SYMBOLS.LocalStorageData).to(LocalStorageData);
    container.bind<ILogger>(INTERFACE_SYMBOLS.Logger).to(Logger);
    container.bind<IRestClient>(INTERFACE_SYMBOLS.RestClient).to(RestClient);
    container.bind<ISessionManager>(INTERFACE_SYMBOLS.SessionManager).to(SessionManager).inSingletonScope();
    container.bind<IEventMapper>(INTERFACE_SYMBOLS.EventMapper).to(EventMapper);
    container.bind<IWebSocketManager>(INTERFACE_SYMBOLS.WebSocketManager).to(WebSocketManager);
    container.bind<INetworkManager>(INTERFACE_SYMBOLS.NetworkManager).to(NetworkManager);
    container.bind<IRestClient>(INTERFACE_SYMBOLS.AuthenticatedRestClient).to(AuthenticatedRestClient);
    container.bind<IDeviceManager>(INTERFACE_SYMBOLS.DeviceManager).to(DeviceManager);
    container.bind<IFacebookManager>(INTERFACE_SYMBOLS.FacebookManager).to(FacebookManager);
    container.bind<IConversationManager>(INTERFACE_SYMBOLS.ConversationManager).to(ConversationManager);
    container.bind<IProfileManager>(INTERFACE_SYMBOLS.ProfileManager).to(ProfileManager);
    container.bind<IMessagePager>(INTERFACE_SYMBOLS.MessagePager).to(MessagePager);

    let dbSupported: boolean = "indexedDB" in window;

    if (dbSupported) {
        container.bind<IOrphanedEventManager>(INTERFACE_SYMBOLS.OrphanedEventManager).to(IndexedDBOrphanedEventManager);
    } else {
        container.bind<IOrphanedEventManager>(INTERFACE_SYMBOLS.OrphanedEventManager).to(LocalStorageOrphanedEventManager);
    }

    container.bind<IMessageManager>(INTERFACE_SYMBOLS.MessageManager).to(MessageManager);
    container.bind<IAppMessaging>(INTERFACE_SYMBOLS.AppMessaging).to(AppMessaging);
    container.bind<IProfile>(INTERFACE_SYMBOLS.Profile).to(Profile);
    container.bind<IServices>(INTERFACE_SYMBOLS.Services).to(Services);
    container.bind<IDevice>(INTERFACE_SYMBOLS.Device).to(Device);
    container.bind<IChannels>(INTERFACE_SYMBOLS.Channels).to(Channels);

}

initInterfaces();

function bindIndexedDBLogger() {
    "use strict";
    if (container.isBound(INTERFACE_SYMBOLS.IndexedDBLogger)) {
        container.rebind<IndexedDBLogger>(INTERFACE_SYMBOLS.IndexedDBLogger).to(IndexedDBLogger);
    } else {
        container.bind<IndexedDBLogger>(INTERFACE_SYMBOLS.IndexedDBLogger).to(IndexedDBLogger);
    }
}

function unbindIndexedDBLogger() {
    "use strict";
    if (container.isBound(INTERFACE_SYMBOLS.IndexedDBLogger)) {
        container.unbind(INTERFACE_SYMBOLS.IndexedDBLogger);
    }
}

function bindComapiConfig(comapiConfig: IComapiConfig) {
    "use strict";

    if (container.isBound(INTERFACE_SYMBOLS.ComapiConfig)) {
        container.unbind(INTERFACE_SYMBOLS.ComapiConfig);
    }

    container.bind<IComapiConfig>(INTERFACE_SYMBOLS.ComapiConfig).toDynamicValue((context) => {
        return comapiConfig;
    });

}



export { container, initInterfaces, bindIndexedDBLogger, unbindIndexedDBLogger, bindComapiConfig };

