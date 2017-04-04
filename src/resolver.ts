

import {
    ISessionManager,
    IWebSocketManager,
    ISessionInfo
} from "./interfaces";


export class SessionAndSocketResolver {

    /**        
     * SessionAndSocketResolver class constructor.
     * @class SessionAndSocketResolver
     * @ignore
     * @classdesc Class that implements Session And Socket Resolution.
     * @parameter {ISessionManager} _sessionManager 
     * @parameter {IWebSocketManager} _webSocketManager 
     */
    constructor(private _sessionManager: ISessionManager, private _webSocketManager: IWebSocketManager) { }

    /**
     * Ensure we have an active session and the websocket has been started
     * Socket may have disconected and be reconnecting. We just want to know that it was started
     * @method SessionAndSocketResolver#ensureSessionAndSocket
     * @returns {Promise} - returns a Promise  
     */
    public ensureSessionAndSocket(): Promise<ISessionInfo> {
        return this.ensureSession()
            .then(sessionInfo => {
                return this.ensureSocket();
            })
            .then(connected => {
                return this.ensureSocket();
            })
            .then(connected => {
                return this._sessionManager.sessionInfo;
            });
    }

    /**
     * Create a session if we don't have one already ...
     * @method SessionAndSocketResolver#ensureSession
     * @returns {Promise} - returns a Promise  
     */
    private ensureSession(): Promise<ISessionInfo> {
        return this._sessionManager.sessionInfo ? Promise.resolve(this._sessionManager.sessionInfo) : this._sessionManager.startSession();
    }

    /**
     * Ensure the web socket has been started
     * @method SessionAndSocketResolver#ensureSocket
     * @returns {Promise} - returns a Promise  
     */
    private ensureSocket(): Promise<boolean> {
        return this._webSocketManager.hasSocket() ? Promise.resolve(true) : this._webSocketManager.connect();
    }

}

