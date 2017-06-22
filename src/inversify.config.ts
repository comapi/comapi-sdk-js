import "reflect-metadata";

import { Container } from "inversify";

import {
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

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";


let container = new Container();

container.bind<IEventManager>(INTERFACE_SYMBOLS.EventManager).to(EventManager).inSingletonScope();
container.bind<ILocalStorageData>(INTERFACE_SYMBOLS.LocalStorageData).to(LocalStorageData);
container.bind<ILogger>(INTERFACE_SYMBOLS.Logger).to(Logger);
container.bind<IRestClient>(INTERFACE_SYMBOLS.RestClient).to(RestClient);
container.bind<ISessionManager>(INTERFACE_SYMBOLS.SessionManager).to(SessionManager).inSingletonScope();
container.bind<IWebSocketManager>(INTERFACE_SYMBOLS.WebSocketManager).to(WebSocketManager);
container.bind<INetworkManager>(INTERFACE_SYMBOLS.NetworkManager).to(NetworkManager);
container.bind<IRestClient>(INTERFACE_SYMBOLS.AuthenticatedRestClient).to(AuthenticatedRestClient);
container.bind<IDeviceManager>(INTERFACE_SYMBOLS.DeviceManager).to(DeviceManager);
container.bind<IFacebookManager>(INTERFACE_SYMBOLS.FacebookManager).to(FacebookManager);
container.bind<IConversationManager>(INTERFACE_SYMBOLS.ConversationManager).to(ConversationManager);
container.bind<IProfileManager>(INTERFACE_SYMBOLS.ProfileManager).to(ProfileManager);
container.bind<IMessageManager>(INTERFACE_SYMBOLS.MessageManager).to(MessageManager);




export { container };

