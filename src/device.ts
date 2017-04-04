import {
    IDeviceManager,
    Environment,
} from "./interfaces";

import { SessionAndSocketResolver } from "./resolver";

export class Device {

    /**        
     * Device class constructor.
     * @class Device
     * @classdesc Class that implements Device related functionality.
     * @parameter {SessionAndSocketResolver} resolver 
     * @parameter {IDeviceManager} deviceManager 
     */
    constructor(private _sessionAndSocketResolver: SessionAndSocketResolver, private _deviceManager: IDeviceManager) { }

    /**
     * Function to set FCM push details for the current session
     * @method Device#setFCMPushDetails
     * @param {string} packageName - the andriod package name of your cordova app
     * @param {string} registrationId - the push registration id
     * @returns {Promise} - Returns a promise
     */
    public setFCMPushDetails(packageName: string, registrationId: string): Promise<boolean> {
        return this._sessionAndSocketResolver.ensureSessionAndSocket()
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
        return this._sessionAndSocketResolver.ensureSessionAndSocket()
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
        return this._sessionAndSocketResolver.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._deviceManager.removePushDetails(sessionInfo.session.id);
            });
    }

}
