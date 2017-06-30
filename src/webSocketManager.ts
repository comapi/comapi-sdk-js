import { injectable, inject } from "inversify";

import {
    IEventMapper,
    IWebSocketManager,
    ISessionManager,
    IEventManager,
    ILogger,
    ILocalStorageData,
    IComapiConfig
} from "./interfaces";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

// https://gist.github.com/strife25/9310539
@injectable()
export class WebSocketManager implements IWebSocketManager {

    // ready state code mapping ...
    private readystates: string[] = [
        "Connecting",   // 0 
        "Open",         // 1
        "Closing",      // 2
        "Closed"        // 3
    ];

    private webSocket: WebSocket;
    private manuallyClosed: boolean = false;
    // current state of socket connection
    private connected: boolean = false;
    // whether socket ever connected - set to true on first connect and used to determine whether to reconnect on close if not a manual close
    private didConnect: boolean = false;
    private attempts: number = 1;
    private echoIntervalId: number;
    // TODO: make configurable ...
    private echoIntervalTimeout: number = 1000 * 60 * 3; // 3 minutes


    /**          
     * WebSocketManager class constructor.
     * @class  WebSocketManager
     * @ignore
     * @classdesc Class that implements WebSocketManager
     * @param {ILogger} _logger 
     * @param {ILocalStorageData} _localStorageData 
     * @param {IComapiConfig} _comapiConfig 
     * @param {ISessionManager} _sessionManager 
     * @param {IEventManager} _eventManager 
     */
    constructor( @inject(INTERFACE_SYMBOLS.Logger) private _logger: ILogger,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorageData: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig,
        @inject(INTERFACE_SYMBOLS.SessionManager) private _sessionManager: ISessionManager,
        @inject(INTERFACE_SYMBOLS.EventManager) private _eventManager: IEventManager,
        @inject(INTERFACE_SYMBOLS.EventMapper) private _eventMapper: IEventMapper) {
    }

    /**
     * Function to connect websocket
     * @method WebSocketManager#connect
     * @returns {Promise} 
     */
    public connect(): Promise<boolean> {

        this._logger.log("WebSocketManager.connect();");

        return new Promise((resolve, reject) => {

            if (!this.webSocket) {

                this._logger.log("WebSocketManager.connect()");

                this._sessionManager.getValidToken()
                    .then((token) => {

                        this._logger.log("WebSocketManager.connect() - got auth token", token);

                        // reset this in case someone is opening / closing
                        this.manuallyClosed = false;

                        let url = `${this._comapiConfig.webSocketBase}/apispaces/${this._comapiConfig.apiSpaceId}/socket`;

                        let queryString = `?token=${token}`;

                        let fullUrl = url + queryString;

                        this._logger.log("connecting ...", fullUrl);

                        this.webSocket = new WebSocket(fullUrl);

                        this.echoIntervalId = setInterval(() => this.echo(), this.echoIntervalTimeout);

                        /**
                         * 
                         */
                        this.webSocket.onopen = () => {
                            this._logger.log("websocket onopen");
                            this.connected = true;
                            if (this.didConnect === false) {
                                this.didConnect = true;
                                this._logger.log("resolving connect() promise");
                                resolve(true);
                            }
                            // this._eventManager.publishLocalEvent("WebsocketOpened", { timestamp: new Date().toISOString() });
                        };

                        this.webSocket.onerror = (event) => {
                            this._logger.log(`websocket onerror - readystate: ${this.readystates[this.webSocket.readyState]}`, event);

                        };

                        this.webSocket.onmessage = (event) => {
                            let message: any;

                            try {
                                message = JSON.parse(event.data);
                            } catch (e) {
                                this._logger.error("socket onmessage: (not JSON)", event.data);
                            }

                            if (message) {
                                this._logger.log("websocket onmessage: ", message);
                                this.publishWebsocketEvent(message);
                            }
                        };

                        this.webSocket.onclose = (event) => {
                            this.connected = false;
                            this.webSocket = undefined;
                            this._logger.log("WebSocket Connection closed.");
                            // this._eventManager.publishLocalEvent("WebsocketClosed", { timestamp: new Date().toISOString() });
                            if (this.didConnect === false) {
                                reject({
                                    code: event.code,
                                    message: "Failed to connect webSocket",
                                });
                            }

                            // only retry if we didng manually close it and it actually connected in the first place
                            if (!this.manuallyClosed && this.didConnect) {

                                this._logger.log("socket not manually closed, reconnecting ...");

                                let time = this.generateInterval(this.attempts);

                                setTimeout(() => {
                                    // We've tried to reconnect so increment the attempts by 1
                                    this.attempts++;

                                    // Connection has closed so try to reconnect every 10 seconds.
                                    this._logger.log("reconnecting ...");
                                    this.connect();
                                }, time);
                            }
                        };

                    });

            } else {
                if (this.didConnect) {
                    resolve(true);
                } else {
                    reject({ message: "Failed to connect webSocket" });
                }
            }
        });

    }

    /**
     * Function to send some data from the client down the websocket
     * @method WebSocketManager#send
     * @param {any} data -  the data to send
     * @returns {Promise} 
     */
    public send(data: any): void {
        if (this.webSocket) {
            this.webSocket.send(JSON.stringify(data));
        }
    }

    /**
     * Function to determine te connection state of the websocket - rturns hether ther socket `did` connect rather than the current status as there is reconnection logic running.
     * @method WebSocketManager#isConnected
     * @returns {boolean} 
     */
    public isConnected(): boolean {
        return this.didConnect;
    }

    /**
     * Function to determine te whether there is an ative socket or not (connected or disconnected)
     * @method WebSocketManager#hasSocket
     * @returns {boolean} 
     */
    public hasSocket(): boolean {
        return this.webSocket ? true : false;
    }


    /**
     * Function to disconnect websocket
     * @method WebSocketManager#disconnect
     * @returns {Promise} 
     */
    public disconnect(): Promise<boolean> {

        this._logger.log("WebSocketManager.disconnect();");

        return new Promise((resolve, reject) => {

            if (this.webSocket) {

                // overwrite the onclose callback so we can use it ... 

                this.webSocket.onclose = () => {
                    this.connected = false;
                    this.didConnect = false;
                    this._logger.log("socket closed.");
                    // TODO: will this crater it ?
                    this.webSocket = undefined;
                    resolve(true);
                };

                clearInterval(this.echoIntervalId);
                this.manuallyClosed = true;
                this.webSocket.close();
            } else {
                resolve(false);
            }

        });


    }

    /**
     * Function to generate an interval for reconnecton purposes
     * @method WebSocketManager#generateInterval
     * @param {number} k
     * @returns {Promise} 
     */
    public generateInterval(k: number): number {
        let maxInterval = (Math.pow(2, k) - 1) * 1000;

        if (maxInterval > 30 * 1000) {
            maxInterval = 30 * 1000; // If the generated interval is more than 30 seconds, truncate it down to 30 seconds.
        }

        // generate the interval to a random number between 0 and the maxInterval determined from above
        let interval = Math.random() * maxInterval;
        this._logger.log(`generateInterval() => ${interval}`);
        return interval;
    }

    /**
     * 
     */
    private echo(): void {
        if (this.connected) {
            this.send({
                name: "echo",
                payload: {

                },
                publishedOn: new Date().toISOString(),
            });
        }
    }


    /**
     * 
     * @param name 
     */
    private mapEventName(name): string {

        // // TODO: make this configurable
        // let eventAliasInfo: IEventMapping = {
        //     conversation: ["conversation", "chat"],
        //     conversationMessage: ["conversationMessage", "chatMessage"],
        //     profile: ["profile"]
        // };

        if (this._comapiConfig.eventMapping) {
            if (name) {

                let split = name.split(".");

                // for conversation.delete, category is conversation, type is delete
                let category = split[0];
                let type = split[1];


                for (let eventCategory in this._comapiConfig.eventMapping) {

                    if (this._comapiConfig.eventMapping.hasOwnProperty(eventCategory)) {

                        // propertyName is what you want
                        // you can get the value like this: myObject[propertyName]

                        let aliases = this._comapiConfig.eventMapping[eventCategory];

                        // go through the
                        for (let val of aliases) {
                            if (val === category) {
                                return eventCategory + "." + type;
                            }
                        }
                    }
                }
            }
        }

        return name;
    }

    /**
     * Map internal event structure to a defined interface ...
     */
    private publishWebsocketEvent(event): void {

        let mappedName = this.mapEventName(event.name);

        switch (mappedName) {

            case "conversation.delete":
                {
                    this._eventManager.publishLocalEvent("conversationDeleted",
                        this._eventMapper.conversationDeleted(event));
                }
                break;

            case "conversation.undelete":
                {
                    this._eventManager.publishLocalEvent("conversationUndeleted",
                        this._eventMapper.conversationUndeleted(event));
                }
                break;

            case "conversation.update":
                {
                    this._eventManager.publishLocalEvent("conversationUpdated",
                        this._eventMapper.conversationUpdated(event));
                }
                break;


            case "conversation.participantAdded":
                {
                    this._eventManager.publishLocalEvent("participantAdded",
                        this._eventMapper.participantAdded(event));
                }
                break;


            case "conversation.participantRemoved":
                {
                    this._eventManager.publishLocalEvent("participantRemoved",
                        this._eventMapper.participantRemoved(event));
                }
                break;

            case "conversation.participantTyping":
                {
                    this._eventManager.publishLocalEvent("participantTyping",
                        this._eventMapper.participantTyping(event));
                }
                break;


            case "conversation.participantTypingOff":
                {
                    this._eventManager.publishLocalEvent("participantTypingOff",
                        this._eventMapper.participantTypingOff(event));
                }
                break;


            case "conversationMessage.sent":
                {
                    this._eventManager.publishLocalEvent("conversationMessageEvent",
                        this._eventMapper.conversationMessageSent(event));
                }
                break;

            case "conversationMessage.read":
                {
                    this._eventManager.publishLocalEvent("conversationMessageEvent",
                        this._eventMapper.conversationMessageRead(event));
                }
                break;

            case "conversationMessage.delivered":
                {
                    this._eventManager.publishLocalEvent("conversationMessageEvent",
                        this._eventMapper.conversationMessageDelivered(event));
                }
                break;

            case "profile.update":
                {
                    if (event.eTag) {
                        this._localStorageData.setString("MyProfileETag", event.eTag);
                    }

                    this._eventManager.publishLocalEvent("profileUpdated",
                        this._eventMapper.profileUpdated(event));
                }
                break;

            default:
                this._logger.warn("Unknown Event", event);
                this._eventManager.publishLocalEvent("webSocketEvent", event);
                break;
        }

    }

}
