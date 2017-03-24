import {
    IDeviceManager,
    ILogger,
    Environment,
    ILocalStorageData,
    IComapiConfig,
    IRestClient,
} from "./interfaces";

// import { Utils } from "./utils";

export class DeviceManager implements IDeviceManager {

    // private _deviceId: string;

    /**        
     * DeviceManager class constructor.
     * @class DeviceManager
     * @ignore
     * @classdesc Class that implements all the DeviceManager functionality.
     * @parameter {ILogger} logger 
     * @parameter {IRestClient} restClient 
     * @parameter {ILocalStorageData} localStorageData 
     * @parameter {IComapiConfig} ComapiConfig 
     */
    constructor(private _logger: ILogger,
        private _restClient: IRestClient,
        private _localStorageData: ILocalStorageData,
        private _comapiConfig: IComapiConfig) {

        // this._deviceId = _localStorageData.getString("deviceId");

        // if (!this._deviceId) {
        //     this._deviceId = Utils.uuid();
        //     _localStorageData.setString("deviceId", this._deviceId);
        // }
    }

    /**
     * Function to set FCM push details for the current session
     * @method DeviceManager#setFCMPushDetails
     * @param {string} sessionId
     * @param {string} packageName
     * @param {string} registrationId
     * @returns {Promise} - Returns a promise
     */
    public setFCMPushDetails(sessionId: string, packageName: string, registrationId: string): Promise<boolean> {

        let data = {
            "fcm": {
                "package": packageName,
                "registrationId": registrationId
            }
        };

        return this._restClient.put(this.getPushUrl(sessionId), {}, data)
            .then(result => {
                return Promise.resolve(true);
            });
    }


    /**
     * Function to set APNS push details for the current session
     * @method DeviceManager#setAPNSPushDetails
     * @param {string} sessionId
     * @param {string} bundleId
     * @param {Environment} environment
     * @param {string} token
     * @returns {Promise} - Returns a promise
     */
    public setAPNSPushDetails(sessionId: string, bundleId: string, environment: Environment, token: string): Promise<boolean> {

        let data = {
            "apns": {
                "bundleId": bundleId,
                "environment": Environment[environment],
                "token": token
            }
        };

        return this._restClient.put(this.getPushUrl(sessionId), {}, data)
            .then(result => {
                return Promise.resolve(true);
            });
    }

    /**
     * Function to remove push details for the current session
     * @method DeviceManager#removePushDetails
     * @param {string} sessionId
     * @returns {Promise} - Returns a promise
     */
    public removePushDetails(sessionId: string): Promise<boolean> {

        return this._restClient.delete(this.getPushUrl(sessionId), {})
            .then(result => {
                return Promise.resolve(true);
            });
    }

    /**
     * Getter to get the current push Url
     * @method DeviceManager#pushUrl
     * @returns {string}   
     */
    private getPushUrl(sessionId): string {
        return `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/sessions/${sessionId}/push`;
    }

}
