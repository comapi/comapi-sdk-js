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
    IFoundation
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
import { Foundation } from "./foundation";

let container = new Container();

container.bind<IEventManager>("EventManager").to(EventManager).inSingletonScope();
container.bind<ILocalStorageData>("LocalStorageData").to(LocalStorageData);
container.bind<ILogger>("Logger").to(Logger);
container.bind<IRestClient>("RestClient").to(RestClient);
container.bind<ISessionManager>("SessionManager").to(SessionManager).inSingletonScope();
container.bind<IWebSocketManager>("WebSocketManager").to(WebSocketManager);
container.bind<INetworkManager>("NetworkManager").to(NetworkManager);
container.bind<IRestClient>("AuthenticatedRestClient").to(AuthenticatedRestClient);
container.bind<IDeviceManager>("DeviceManager").to(DeviceManager);
container.bind<IFacebookManager>("FacebookManager").to(FacebookManager);
container.bind<IConversationManager>("ConversationManager").to(ConversationManager);
container.bind<IProfileManager>("ProfileManager").to(ProfileManager);
container.bind<IMessageManager>("MessageManager").to(MessageManager);
container.bind<IFoundation>("Foundation").to(Foundation);




export { container };

