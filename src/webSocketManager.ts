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


// https://github.com/vitalets/controlled-promise/blob/master/src/index.js
class MyPromise<T> {

    private _promise: Promise<T> = null;
    private _resolve = null;
    private _reject = null;
    private _isPending = false;
    private _value = null;

    /**
     *
     * @returns {Boolean}
     */
    get promise(): Promise<T> {
        return this._promise;
    }

    /**
     *
     * @returns {Boolean}
     */
    get value(): T {
        return this._value;
    }

    /**
     * 
     * @param fn 
     */
    public call(fn: Function): Promise<T> {

        if (!this._isPending) {

            this._isPending = true;
            this._promise = new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;

                fn();
            });
        }

        return this._promise;
    }

    /**
     * Returns true if promise is pending.
     *
     * @returns {Boolean}
     */
    get isPending() {
        return this._isPending;
    }

    /**
     * 
     * @param value 
     */
    public resolve(value: T) {
        this._isPending = false;
        this._value = value;
        this._resolve(value);
    }

    /**
     * 
     * @param value 
     */
    public reject(value: any) {
        this._isPending = false;
        this._reject(value);
    }
}




// https://gist.github.com/strife25/9310539
// https://github.com/vitalets/websocket-as-promised/blob/master/src/index.js
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

    private echoIntervalId: number;
    // TODO: make configurable ...
    private echoIntervalTimeout: number = 1000 * 60; // 1 minute


    private STATE = {
        CLOSED: 3,
        CLOSING: 2,
        CONNECTING: 0,
        OPEN: 1,
    };

    private _opening: MyPromise<boolean>;
    private _closing: MyPromise<boolean>;

    // can use _opening._value for equivalent functionality
    private manuallyClosed: boolean = false;
    // whether socket ever connected - set to true on first connect and used to determine whether to reconnect on close if not a manual close
    private didConnect: boolean = false;
    private reconnecting: boolean = false;
    private attempts: number = 0;



    /**
     * Is WebSocket connection in opening state.
     *
     * @returns {Boolean}
     */
    get isOpening() {
        return Boolean(this.webSocket && this.webSocket.readyState === this.STATE.CONNECTING);
    }

    /**
     * Is WebSocket connection opened.
     *
     * @returns {Boolean}
     */
    get isOpened() {
        return Boolean(this.webSocket && this.webSocket.readyState === this.STATE.OPEN);
    }

    /**
     * Is WebSocket connection in closing state.
     *
     * @returns {Boolean}
     */
    get isClosing() {
        return Boolean(this.webSocket && this.webSocket.readyState === this.STATE.CLOSING);
    }

    /**
     * Is WebSocket connection closed.
     *
     * @returns {Boolean}
     */
    get isClosed() {
        return Boolean(!this.webSocket || this.webSocket.readyState === this.STATE.CLOSED);
    }


    /**
     * Function to determine te connection state of the websocket - rturns hether ther socket `did` connect rather than the current status as there is reconnection logic running.
     * @method WebSocketManager#isConnected
     * @returns {boolean} 
     */
    public isConnected(): boolean {
        return this.isOpened;
    }


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
    constructor(@inject(INTERFACE_SYMBOLS.Logger) private _logger: ILogger,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorageData: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig,
        @inject(INTERFACE_SYMBOLS.SessionManager) private _sessionManager: ISessionManager,
        @inject(INTERFACE_SYMBOLS.EventManager) private _eventManager: IEventManager,
        @inject(INTERFACE_SYMBOLS.EventMapper) private _eventMapper: IEventMapper) {

        // start this here just once
        this.echoIntervalId = setInterval(() => this.echo(), this.echoIntervalTimeout);
    }

    /**
     * Function to connect websocket
     * @method WebSocketManager#connect
     */
    public connect(): Promise<boolean> {

        if (this.isClosing) {
            return Promise.reject(new Error(`Can't open WebSocket while closing.`));
        }

        // User calls connect and already connected
        if (this.isOpened) {
            return this._opening.promise;
        }

        // we have started to open, so return this and everyone can wait on it ....
        if (this._opening && this._opening.isPending) {
            return this._opening.promise;
        }

        this._opening = new MyPromise<boolean>();

        return this._opening.call(() => {

            this._logger.log("WebSocketManager.connect();");

            if (!this.webSocket) {

                this._logger.log("WebSocketManager.connect()");
                let _token: string;

                this._sessionManager.getValidToken()
                    .then((token) => {
                        _token = token;

                        this._logger.log("WebSocketManager.connect() - got auth token", token);

                        // reset this in case someone is opening / closing
                        this.manuallyClosed = false;

                        let url = `${this._comapiConfig.webSocketBase}/apispaces/${this._comapiConfig.apiSpaceId}/socket`;

                        let queryString = `?token=${token}`;

                        let fullUrl = url + queryString;

                        this._logger.log("connecting ...", fullUrl);

                        this.webSocket = new WebSocket(fullUrl);

                        this.webSocket.onopen = this._handleOpen.bind(this);
                        this.webSocket.onerror = this._handleError.bind(this);
                        this.webSocket.onclose = this._handleClose.bind(this);
                        this.webSocket.onmessage = this._handleMessage.bind(this);

                    })
                    .catch(error => {
                        this._opening.reject({
                            code: error.code,
                            message: _token ? "Websocket Error" : "Failed to get Valid Token",
                        });
                    });
            }
        });
    }

    /**
     * Function to disconnect websocket
     * @method WebSocketManager#disconnect
     * @returns {Promise} 
     */
    public disconnect(): Promise<boolean> {

        if (this.isClosed) {
            return Promise.resolve(true);
        }

        this._logger.log("WebSocketManager.disconnect();");

        this._closing = new MyPromise<boolean>();

        return this._closing.call(() => {
            this.manuallyClosed = true;
            this.webSocket.close();
        });
    }

    /**
     * Function to send some data from the client down the websocket
     * @method WebSocketManager#send
     * @param {any} data -  the data to send
     * @returns {Promise} 
     */
    public send(data: any): void {
        if (this.isOpened) {
            this.webSocket.send(JSON.stringify(data));
        }
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
     * @param event 
     */
    private _handleOpen(event: Event) {
        this.didConnect = true;
        this._eventManager.publishLocalEvent("WebsocketOpened", { timestamp: new Date().toISOString() });

        if (this._opening) {
            this._opening.resolve(true);
        }

    }

    /**
     * 
     * @param event 
     */
    private _handleMessage(event: MessageEvent) {
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
    }

    /**
     * 
     * @param event 
     */
    private _handleError(event: Event) {
        this._logger.log(`websocket onerror - readystate: ${this.readystates[this.webSocket.readyState]}`, event);
    }

    /**
     * 
     * @param event 
     */
    private _handleClose(event: CloseEvent) {
        this.webSocket = undefined;
        this._logger.log("WebSocket Connection closed.");
        this._eventManager.publishLocalEvent("WebsocketClosed", { timestamp: new Date().toISOString() });

        // This is the failed to connect flow ...
        if (this._opening.isPending) {
            this._opening.resolve(false);
        }

        // This is the manually closed flow
        if (this._closing && this._closing.isPending) {
            this._closing.resolve(true);
            this.didConnect = false;
        }

        // only retry if we didn't manually close it and it actually connected in the first place
        if (!this.manuallyClosed && !this.reconnecting) {
            this._logger.log("socket not manually closed, reconnecting ...");
            this.reconnecting = true;
            this.reconnect();
        }
    }

    /**
     * 
     */
    private echo(): void {
        this.send({
            name: "echo",
            payload: {},
            publishedOn: new Date().toISOString(),
        });
    }

    /**
     * 
     */
    private reconnect(): void {
        let time = this.generateInterval(this.attempts);

        setTimeout(() => {
            this.attempts++;
            this._logger.log(`reconnecting (${this.attempts}) ...`);
            this.connect()
                .then(connected => {
                    if (connected) {
                        this._logger.log("socket reconnected");
                        this.attempts = 0;
                        this.reconnecting = false;
                    } else {
                        this._logger.log("socket recycle failed");
                        this.reconnect();
                    }
                })
                .catch((e) => {
                    this._logger.log("socket recycle failed", e);
                    this.reconnect();
                });
        }, time);
    }

    /**
     * 
     * @param name 
     */
    private mapEventName(name): string {

        // TODO: make this configurable
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
