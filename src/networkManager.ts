import { injectable, inject } from "inversify";

import {
    ISessionManager,
    IWebSocketManager,
    ISessionInfo,
    ISession,
    INetworkManager
} from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class NetworkManager implements INetworkManager {

    /**        
     * NetworkManager class constructor.
     * @class NetworkManager
     * @ignore
     * @classdesc Class that implements Session And Socket Resolution.
     * @parameter {ISessionManager} _sessionManager 
     * @parameter {IWebSocketManager} _webSocketManager 
     */
    constructor( @inject(INTERFACE_SYMBOLS.SessionManager) private _sessionManager: ISessionManager,
        @inject(INTERFACE_SYMBOLS.WebSocketManager) private _webSocketManager: IWebSocketManager) { }


    /**
     * Method to start a new authenticated session AND connect up the websocket
     * @method Foundation#startSession
     * @returns {Promise} - Returns a promise 
     */
    public startSession(): Promise<ISessionInfo> {

        return this._sessionManager.startSession()
            .then((sessionInfo) => {
                return Promise.all([sessionInfo, this._webSocketManager.connect()]);
            })
            .then(([sessionInfo, connected]) => {
                if (!connected) {
                    console.error("Failed to connect web socket");
                }
                return sessionInfo;
            });
    }


    /**
     * Method to restart an expired authenticated session 
     * @method Foundation#restartSession
     * @returns {Promise} - Returns a promise 
     */
    public restartSession(): Promise<ISessionInfo> {

        return this._webSocketManager.disconnect()
            .then((succeeded) => {
                return this._sessionManager.startSession();
            })
            .then((sessionInfo) => {
                return Promise.all([sessionInfo, this._webSocketManager.connect()]);
            })
            .then(([sessionInfo, connected]) => {
                if (!connected) {
                    console.error("Failed to connect web socket");
                }

                return sessionInfo;
            });
    }

    /**
     * Method to get current session
     * @method Foundation#session
     * @returns {ISession} - Returns an ISession interface
     */
    public get session(): ISession {
        return this._sessionManager.sessionInfo ? this._sessionManager.sessionInfo.session : null;
    }

    /**
     * Method to end an existing authenticated session
     * @method Foundation#endSession
     * @returns {Promise} - Returns a promise
     */
    public endSession(): Promise<boolean> {
        return this._webSocketManager.disconnect()
            .then(() => {
                return this._sessionManager.endSession();
            });
    }

    public getValidToken(): Promise<string> {
        return this._sessionManager.getValidToken();
    }

    /**
     * Create a session if we don't have one already ...
     * @method NetworkManager#ensureSession
     * @returns {Promise} - returns a Promise  
     */
    public ensureSession(): Promise<ISessionInfo> {
        return this._sessionManager.startSession();
    }

}

