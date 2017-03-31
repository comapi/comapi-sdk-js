import {
    IAuthChallengeOptions,
    ISessionManager,
    ISessionInfo,
    ILogger,
    ILocalStorageData,
    IComapiConfig,
    IRestClient,
    ISessionStartRsponse,
} from "./interfaces";

import { Utils } from "./utils";

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
     */
    constructor(private _logger: ILogger,
        private _restClient: IRestClient,
        private _localStorageData: ILocalStorageData,
        private _comapiConfig: IComapiConfig) {

        this._deviceId = _localStorageData.getString("deviceId");

        if (!this._deviceId) {
            this._deviceId = Utils.uuid();
            _localStorageData.setString("deviceId", this._deviceId);
        }

        // Load in cached session on startup
        this._getSession();
    }


    /**
     * Getter to get the current sessionInfo
     * @method SessionManager#sessionInfo
     * @returns {ISessionInfo}   
     */
    get sessionInfo(): ISessionInfo {
        return this._sessionInfo;
    }

    /**
     * Getter to get the current sessionInfo expiry time
     * @method SessionManager#expiry
     * @returns {string}   
     */
    get expiry(): string {
        return this._sessionInfo.session.expiresOn;
    }

    /**
     * @method SessionManager#isActive
     */
    private get isActive(): boolean {

        let result = false;
        // check we have a token and also that the token hasn't expired ...
        if (this._sessionInfo) {

            var now = new Date();
            var expiry = new Date(this._sessionInfo.session.expiresOn);

            if (now < expiry) {
                result = true;
            } else {
                this._removeSession();
            }
        }

        return result;
    }

    /**
     * Function to get auth token
     * @method SessionManager#token
     * @returns {Promise} - returns the auth token via a promise 
     */
    public getValidToken(): Promise<string> {

        return this.isActive
            ? Promise.resolve(this._sessionInfo.token)
            : this.startSession()
                .then(sessionInfo => {
                    return Promise.resolve(sessionInfo.token);
                });
    }

    /**
     * Function to start a new session
     * @method SessionManager#startSession
     * @param {any} userDefined -  Additional client-specific information
     * @returns {Promise} - Returns a promise 
     */
    public startSession(): Promise<ISessionInfo> {
        var self = this;

        return new Promise((resolve, reject) => {

            if (this.isActive) {
                self._logger.log("startSession() found an existing session: ");
                resolve(this._getSession());
            } else {

                // call comapi service startAuth                
                this._startAuth().then(sessionStartResponse => {

                    var authChallengeOptions: IAuthChallengeOptions = {
                        nonce: sessionStartResponse.nonce
                    };

                    // call integrators auth challenge method
                    self._comapiConfig.authChallenge(authChallengeOptions, function (jwt: string) {

                        if (jwt) {
                            self._createAuthenticatedSession(jwt, sessionStartResponse.authenticationId, {})
                                .then(function (sessionInfo) {

                                    self._setSession(sessionInfo);
                                    // pass back to client
                                    resolve(sessionInfo);

                                }).catch(function (error) {
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
                        this._removeSession();
                        resolve(true);
                    }).catch((error) => {
                        this._removeSession();
                        reject(error);
                    });
            } else {
                reject({ message: "No active session is present, create one before ending one" });
            }
        });
    }


    /**
     * Internal function to create an authenticated session
     * @param (String) jwt - the jwt retrieved from the integrator
     * @param (String) authenticationId - the authenticationId given by comapi back end
     * @param (Object) deviceInfo - the deviceInfo
     * @returns {Promise} - Returns a promise  
     */
    private _createAuthenticatedSession(jwt: string, authenticationId: string, deviceInfo: Object): Promise<ISessionInfo> {

        let browserInfo = Utils.getBrowserInfo();

        let data = {
            authenticationId: authenticationId,
            authenticationToken: jwt,

            deviceId: this._deviceId,
            platform: /*browserInfo.name*/ "javascript",
            platformVersion: browserInfo.version,
            sdkType: /*"javascript"*/ "native",
            sdkVersion: "_SDK_VERSION_"
        };

        return this._restClient.post(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/sessions`, {}, data)
            .then(function (result) {
                return Promise.resolve(result.response);
            });
    }

    /**
     * Internal function to start an authenticated session
     * @returns {Promise} - Returns a promise
     */
    private _startAuth(): Promise<ISessionStartRsponse> {
        return this._restClient.get(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/sessions/start`)
            .then(result => {
                return Promise.resolve(result.response);
            });
    }

    /**
     * Internal function to end an authenticated session
     * @returns {Promise} - Returns a promise
     */
    private _endAuth(): Promise<boolean> {

        var headers = {
            "Content-Type": "application/json",
            "authorization": this.getAuthHeader(),
        };

        return this._restClient.delete(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/sessions/${this._sessionInfo.session.id}`, headers)
            .then(result => {
                return Promise.resolve(true);
            });
    }


    /**
     * Internal function to load in an existing session if available 
     * @returns {ISessionInfo} - returns session info if available 
     */
    private _getSession(): ISessionInfo {
        var sessionInfo: ISessionInfo = this._localStorageData.getObject("session") as ISessionInfo;
        if (sessionInfo) {
            this._sessionInfo = sessionInfo;
        }
        return sessionInfo;
    }

    /**
     * Internal function to load in an existing session if available 
     * @returns {boolean} - returns boolean reault 
     */
    private _setSession(sessionInfo: ISessionInfo) {

        var expiry = new Date(sessionInfo.session.expiresOn);

        var now = new Date();

        if (expiry < now) {
            this._logger.error("Was given an expired token ;-(");
        }

        this._sessionInfo = sessionInfo;
        this._localStorageData.setObject("session", sessionInfo);
    }

    /**
     * Internal function to remove an existing session 
     * @returns {boolean} - returns boolean reault 
     */
    private _removeSession() {
        this._localStorageData.remove("session");
        this._sessionInfo = undefined;
    }


    /**
     * 
     */
    private getAuthHeader() {
        return `Bearer ${this.sessionInfo.token}`;
    }
}
