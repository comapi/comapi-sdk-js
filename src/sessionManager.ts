import { injectable, inject } from "inversify";

import {
    IAuthChallengeOptions,
    ISessionManager,
    ISessionInfo,
    ILogger,
    ILocalStorageData,
    IComapiConfig,
    IRestClient,
    ISessionStartResponse,
    IPushConfig,
    Environment
} from "./interfaces";

import { Utils } from "./utils";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

declare let window: any;

@injectable()
export class SessionManager implements ISessionManager {

    private _deviceId: string;

    /**
     * Current session 
     */
    private _sessionInfo: ISessionInfo;

    /**        
     * SessionManager class constructor.
     * @class SessionManager
     * @ignore
     * @classdesc Class that implements all the SessionManager functionality.
     * @parameter {ILogger} logger 
     * @parameter {IRestClient} restClient  
     * @parameter {ILocalStorageData} localStorageData 
     * @parameter {IComapiConfig} comapiConfig 
     */
    constructor(@inject(INTERFACE_SYMBOLS.Logger) private _logger: ILogger,
        @inject(INTERFACE_SYMBOLS.RestClient) private _restClient: IRestClient,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorageData: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig) {
    }

    /**
     * Retrieve a cached session if there is one
     */
    public initialise(): Promise<boolean> {

        return this._localStorageData.getObject("session")
            .then((sessionInfo: ISessionInfo) => {
                if (sessionInfo) {

                    if (this.isSessionValid(sessionInfo)) {
                        this._sessionInfo = sessionInfo;
                        return true;
                    } else {
                        return this._localStorageData.remove("session")
                            .then(() => {
                                return false;
                            });
                    }

                } else {
                    return false;
                }
            });
    }

    /**
     * Getter to get the current sessionInfo
     * @method SessionManager#sessionInfo
     * @returns {ISessionInfo}   
     */
    public get sessionInfo(): ISessionInfo {
        return this._sessionInfo;
    }

    /**
     * Function to get auth token
     * @method SessionManager#token
     * @returns {Promise} - returns the auth token via a promise 
     */
    public getValidToken(): Promise<string> {

        return this.startSession()
            .then(sessionInfo => {
                return Promise.resolve(sessionInfo.token);
            });
    }

    /**
     * Function to start a new session or return an existing session
     * @method SessionManager#startSession
     * @param {any} userDefined -  Additional client-specific information
     * @returns {Promise} - Returns a promise 
     */
    public startSession(): Promise<ISessionInfo> {
        let self = this;

        return new Promise((resolve, reject) => {

            if (this._sessionInfo && this.isSessionValid(this._sessionInfo)) {
                resolve(this._sessionInfo);
            } else {
                // call comapi service startAuth                
                this._startAuth().then(sessionStartResponse => {

                    let authChallengeOptions: IAuthChallengeOptions = {
                        nonce: sessionStartResponse.nonce
                    };

                    // call integrators auth challenge method
                    self._comapiConfig.authChallenge(authChallengeOptions, function (jwt: string) {

                        if (jwt) {
                            self._createAuthenticatedSession(jwt, sessionStartResponse.authenticationId, {})
                                .then((sessionInfo) => {
                                    return Promise.all([sessionInfo, self._setSession(sessionInfo)]);
                                })
                                .then(([sessionInfo, result]) => {
                                    if (!result) {
                                        console.error("_setSession() failed");
                                    }
                                    // pass back to client
                                    resolve(sessionInfo);
                                })
                                .catch(function (error) {
                                    reject(error);
                                });
                        } else {
                            // client failed to fulfil the auth challenge for some reason ...
                            reject({ message: "Failed to get a JWT from authChallenge", statusCode: 401 });
                        }

                    });

                }).catch(error => reject(error));
            }
        });
    }

    /**
     * Function to end the current session
     * @method SessionManager#endSession
     * @returns {Promise} - Returns a promise
     */
    public endSession(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._sessionInfo) {
                this._endAuth()
                    .then((result) => {
                        this.removeSession();
                        resolve(true);
                    }).catch((error) => {
                        this.removeSession();
                        resolve(false);
                    });
            } else {
                reject({ message: "No active session is present, create one before ending one" });
            }
        });
    }

    /**
     * Retrieves details about a session
     * @method SessionManager#requestSession
     * @returns {Promise} - Returns a promise
     */
    public requestSession(): Promise<any> {
        let headers = {
            "Content-Type": "application/json",
            "authorization": this.getAuthHeader(),
        };

        let url = Utils.format(this._comapiConfig.foundationRestUrls.session, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            sessionId: this.sessionInfo.session.id,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.get(url, headers);
    }

    /**
     * Internal function to remove an existing cached session 
     * @returns {Promise} - returns boolean result
     */
    public removeSession(): Promise<boolean> {
        return this._localStorageData.remove("session")
            .then(result => {
                this._sessionInfo = undefined;
                return result;
            });
    }

    private _buildPushPayload(config: IPushConfig): any{
        if(config && config.apns){
            return {
                "apns": {
                    "bundleId": config.apns.bundleId,
                    // need to stringify the numeric enum value 
                    "environment": Environment[config.apns.environment],
                    "token": config.apns.token
                }
            };
        }else{
            return config;
        }
    }

    /**
     * Internal function to create an authenticated session
     * @param (String) jwt - the jwt retrieved from the integrator
     * @param (String) authenticationId - the authenticationId given by comapi back end
     * @param (Object) deviceInfo - the deviceInfo
     * @returns {Promise} - Returns a promise  
     */
    private _createAuthenticatedSession(jwt: string, authenticationId: string, deviceInfo: Object): Promise<ISessionInfo> {

        let url = Utils.format(this._comapiConfig.foundationRestUrls.sessions, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this.getDeviceId()
            .then(() => {
                let platformVersion = "Unknown";

                if(typeof navigator !== "undefined"){
                    platformVersion = (navigator.product !== "undefined" ? navigator.product : "Unknown") + (navigator.userAgent !== "undefined" ? " : " + navigator.userAgent : "");
                }

                let data = {
                    authenticationId: authenticationId,
                    authenticationToken: jwt,

                    deviceId: this._deviceId,
                    platform: /*browserInfo.name*/ "javascript",
                    platformVersion: platformVersion,
                    push: this._buildPushPayload(this._comapiConfig.pushConfig),
                    sdkType: /*"javascript"*/ "native",
                    sdkVersion: "_SDK_VERSION_",
                };

                if(window && window.cordova && window.cordova.plugins && window.cordova.plugins.dotdigitalPlugin){
                    const pluginVersion = window.cordova.plugins.dotdigitalPlugin.version();
                    data.sdkVersion += ` - ${pluginVersion}`;
                }

                return this._restClient.post(url, {}, data);
            })
            .then(function (result) {
                return Promise.resolve(<ISessionInfo>result.response);
            });
    }

    /**
     * Internal function to start an authenticated session
     * @returns {Promise} - Returns a promise
     */
    private _startAuth(): Promise<ISessionStartResponse> {

        let url = Utils.format(this._comapiConfig.foundationRestUrls.sessionStart, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.get(url)
            .then(result => {
                return Promise.resolve(<ISessionStartResponse>result.response);
            });
    }

    /**
     * Internal function to end an authenticated session
     * @returns {Promise} - Returns a promise
     */
    private _endAuth(): Promise<boolean> {

        let headers = {
            "Content-Type": "application/json",
            "authorization": this.getAuthHeader(),
        };

        let url = Utils.format(this._comapiConfig.foundationRestUrls.session, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            sessionId: this.sessionInfo.session.id,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.delete(url, headers)
            .then(result => {
                return Promise.resolve(true);
            });
    }


    /**
     * Internal function to load in an existing session if available 
     * @returns {boolean} - returns boolean reault 
     */
    private _setSession(sessionInfo: ISessionInfo): Promise<boolean> {

        if (this.hasExpired(sessionInfo.session.expiresOn)) {
            this._logger.error("Was given an expired token ;-(");
        }

        this._sessionInfo = sessionInfo;
        return this._localStorageData.setObject("session", sessionInfo);
    }

    /**
     * 
     */
    private getAuthHeader() {
        return `Bearer ${this.sessionInfo.token}`;
    }


    /**
     * Create one if not available ...
     */
    private getDeviceId(): Promise<string> {

        if (this._deviceId) {
            return Promise.resolve(this._deviceId);
        } else {
            return this._localStorageData.getString("deviceId")
                .then(value => {
                    if (value === null) {
                        this._deviceId = Utils.uuid();
                        return this._localStorageData.setString("deviceId", this._deviceId)
                            .then(result => {
                                return Promise.resolve(this._deviceId);
                            });

                    } else {
                        this._deviceId = value;
                        return Promise.resolve(this._deviceId);
                    }
                });
        }
    }

    /**
     * Check an iso date is not in the past ...
     * @param expiresOn 
     */
    private hasExpired(expiresOn: string): boolean {
        let now = new Date();
        let expiry = new Date(expiresOn);

        return now > expiry;
    }

    /**
     * Checks validity of session based on expiry and matching apiSpace
     * @param sessionInfo 
     */
    private isSessionValid(sessionInfo: ISessionInfo): boolean {

        let valid = false;

        if (!this.hasExpired(sessionInfo.session.expiresOn)) {

            // check that the token matches 
            if (sessionInfo.token) {
                let bits = sessionInfo.token.split(".");
                if (bits.length === 3) {
                    let payload = JSON.parse(atob(bits[1]));
                    if (payload.apiSpaceId === this._comapiConfig.apiSpaceId) {
                        valid = true;
                    }
                }
            }
        }

        return valid;
    }

}
