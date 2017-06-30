import { container, bindIndexedDBLogger, unbindIndexedDBLogger, bindComapiConfig } from "./inversify.config";

import {
    IComapiConfig,
    IEventManager,
    ILocalStorageData,
    ILogger,
    IRestClient,
    ISessionManager,
    IEventMapper,
    IWebSocketManager,
    INetworkManager,
    IDeviceManager,
    IFacebookManager,
    IConversationManager,
    IProfileManager,
    IMessageManager,
    IMessagePager,
    IAppMessaging,
    IProfile,
    IDevice,
    IChannels
} from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

export class InterfaceManager {

    private static interfaces = {};

    public static bindIndexedDBLogger() {
        bindIndexedDBLogger();
    }

    public static unbindIndexedDBLogger() {
        unbindIndexedDBLogger();
    }

    public static bindComapiConfig(omapiConfig: IComapiConfig) {
        bindComapiConfig(omapiConfig);
    }

    private static getInterface(serviceIdentifier: string): any {
        return container.get(serviceIdentifier);
    }

    private static setInterface(serviceIdentifier: string, instance: any) {

        // unbind existing interface
        if (container.isBound(serviceIdentifier)) {
            container.unbind(serviceIdentifier);
        }

        // cache this one
        InterfaceManager.interfaces[serviceIdentifier.toString()] = instance;

        // bind this new one
        container.bind(serviceIdentifier).toDynamicValue((context) => {
            return InterfaceManager.interfaces[serviceIdentifier.toString()];
        });
    }

    /**
     * 
     */
    public static set IEventManager(eventManager: IEventManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.EventManager, eventManager);
    }

    /**
     * 
     */
    public static get IEventManager(): IEventManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.EventManager);
    }

    /**
     * 
     */
    public static set ILocalStorageData(localStorageData: ILocalStorageData) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.LocalStorageData, localStorageData);
    }

    /**
     * 
     */
    public static get ILocalStorageData(): ILocalStorageData {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.LocalStorageData);
    }

    /**
     * 
     */
    public static set ILogger(logger: ILogger) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.Logger, logger);
    }

    /**
     * 
     */
    public static get ILogger(): ILogger {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.Logger);
    }

    /**
     * 
     */
    public static set IRestClient(restClient: IRestClient) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.RestClient, restClient);
    }

    /**
     * 
     */
    public static get IRestClient(): IRestClient {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.RestClient);
    }

    /**
     * 
     */
    public static set ISessionManager(sessionManager: ISessionManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.SessionManager, sessionManager);
    }

    /**
     * 
     */
    public static get ISessionManager(): ISessionManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.SessionManager);
    }

    /**
     * 
     */
    public static set IEventMapper(eventMapper: IEventMapper) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.EventMapper, eventMapper);
    }

    /**
     * 
     */
    public static get IEventMapper(): IEventMapper {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.EventMapper);
    }

    /**
     * 
     */
    public static set IWebSocketManager(webSocketManager: IWebSocketManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.WebSocketManager, webSocketManager);
    }

    /**
     * 
     */
    public static get IWebSocketManager(): IWebSocketManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.WebSocketManager);
    }

    /**
     * 
     */
    public static set INetworkManager(networkManager: INetworkManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.NetworkManager, networkManager);
    }

    /**
     * 
     */
    public static get INetworkManager(): INetworkManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.NetworkManager);
    }

    /**
     * 
     */
    public static set AuthenticatedRestClient(authenticatedRestClient: IRestClient) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.AuthenticatedRestClient, authenticatedRestClient);
    }

    /**
     * 
     */
    public static get AuthenticatedRestClient(): IRestClient {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.AuthenticatedRestClient);
    }


    /**
     * 
     */
    public static set IDeviceManager(deviceManager: IDeviceManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.DeviceManager, deviceManager);
    }

    /**
     * 
     */
    public static get IDeviceManager(): IDeviceManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.DeviceManager);
    }

    /**
     * 
     */
    public static set IFacebookManager(facebookManager: IFacebookManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.FacebookManager, facebookManager);
    }

    /**
     * 
     */
    public static get IFacebookManager(): IFacebookManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.FacebookManager);
    }

    /**
     * 
     */
    public static set IConversationManager(facebookManager: IConversationManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.ConversationManager, facebookManager);
    }

    /**
     * 
     */
    public static get IConversationManager(): IConversationManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.ConversationManager);
    }

    /**
     * 
     */
    public static set IProfileManager(profileManager: IProfileManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.ProfileManager, profileManager);
    }

    /**
     * 
     */
    public static get IProfileManager(): IProfileManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.ProfileManager);
    }

    /**
     * 
     */
    public static set IMessageManager(messageManager: IMessageManager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.MessageManager, messageManager);
    }

    /**
     * 
     */
    public static get IMessageManager(): IMessageManager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.MessageManager);
    }

    /**
     * 
     */
    public static set IMessagePager(messagePager: IMessagePager) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.MessagePager, messagePager);
    }

    /**
     * 
     */
    public static get IMessagePager(): IMessagePager {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.MessagePager);
    }

    /**
     * 
     */
    public static set IAppMessaging(appMessaging: IAppMessaging) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.AppMessaging, appMessaging);
    }

    /**
     * 
     */
    public static get IAppMessaging(): IAppMessaging {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.AppMessaging);
    }

    /**
     * 
     */
    public static set IProfile(profile: IProfile) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.Profile, profile);
    }

    /**
     * 
     */
    public static get IProfile(): IProfile {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.Profile);
    }

    /**
     * 
     */
    public static set IDevice(device: IDevice) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.Device, device);
    }

    /**
     * 
     */
    public static get IDevice(): IDevice {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.Device);
    }

    /**
     * 
     */
    public static set IChannels(channels: IChannels) {
        InterfaceManager.setInterface(INTERFACE_SYMBOLS.Channels, channels);
    }

    /**
     * 
     */
    public static get IChannels(): IChannels {
        return InterfaceManager.getInterface(INTERFACE_SYMBOLS.Channels);
    }
}
