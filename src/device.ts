import { injectable, inject } from "inversify";

import {
    IDeviceManager,
    Environment,
    IDevice,
    INetworkManager
} from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class Device implements IDevice {

    /**        
     * Device class constructor.
     * @class Device
     * @classdesc Class that implements Device related functionality.
     * @parameter {INetworkManager} _networkManager 
     * @parameter {IDeviceManager} deviceManager 
     */
    constructor( @inject(INTERFACE_SYMBOLS.NetworkManager) private _networkManager: INetworkManager,
        @inject(INTERFACE_SYMBOLS.DeviceManager) private _deviceManager: IDeviceManager) { }

    /**
     * Function to set FCM push details for the current session
     * @method Device#setFCMPushDetails
     * @param {string} packageName - the andriod package name of your cordova app
     * @param {string} registrationId - the push registration id
     * @returns {Promise} - Returns a promise
     */
    public setFCMPushDetails(packageName: string, registrationId: string): Promise<boolean> {
        return this._networkManager.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._deviceManager.setFCMPushDetails(sessionInfo.session.id, packageName, registrationId);
            });
    }

    /**
     * Function to set APNS push details for the current session
     * @method Device#setAPNSPushDetails
     * @param {string} bundleId - the iOS bundleId of your cordova app
     * @param {Environment} environment - the environment ["`development`"|"`production`"]
     * @param {string} token
     * @returns {Promise} - Returns a promise
     */
    public setAPNSPushDetails(bundleId: string, environment: Environment, token: string): Promise<boolean> {
        return this._networkManager.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._deviceManager.setAPNSPushDetails(sessionInfo.session.id, bundleId, environment, token);
            });
    }

    /**
     * Function to remove push details for the current session
     * @method Device#removePushDetails
     * @returns {Promise} - Returns a promise
     */
    public removePushDetails(): Promise<boolean> {
        return this._networkManager.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._deviceManager.removePushDetails(sessionInfo.session.id);
            });
    }

}
