
import {
    ILogger,
    ILocalStorageData,
    IConversationMessage,
    IMessageManager,
    IMessageStatus,
    IGetMessagesResponse,
    IOrphanedEventManager,
    IConversationMessageEvent,
    IConversationMessagesResult
} from "./interfaces";

import { LocalStorageOrphanedEventManager } from "./orphanedEventStore";

import { Utils } from "./utils";

export class MessagePager {

    private _orphanedEventManager: IOrphanedEventManager;

    /**        
     * MessagePager class constructor.
     * @class MessagePager
     * @ignore
     * @classdesc Class that implements Conversation Message Pagination.
     * @parameter {ILogger} _logger 
     * @parameter {ILocalStorageData} _localStorage 
     * @parameter {IMessageManager} _messageManager 
     */
    constructor(private _logger: ILogger, private _localStorage: ILocalStorageData, private _messageManager: IMessageManager) {

        // TODO: DI this in 
        this._orphanedEventManager = new LocalStorageOrphanedEventManager(_localStorage);
    }


    /**
     * Get a page of messages, internally deal with orphaned events etc ...
     * @method MessagePager#getMessages
     * @param {string} id - the conversationId
     * @param {number} pageSize - the page size
     * @param {number} [continuationToken] - the continuation token (optional - if not specified then retrieve from the end) 
     * @returns {Promise<any>} - TODO: incorporate continuationToken into respose 
     */
    public getMessages(conversationId: string, pageSize: number, continuationToken?: number): Promise<IGetMessagesResponse> {

        if (continuationToken <= 0) {
            return Promise.reject<IGetMessagesResponse>({ message: `All messages from conversation ${conversationId} have been loaded` });
        }

        let _continuationToken: number = null;
        let _conversationMessagesResult: IConversationMessagesResult;

        // 1) get info & Validate
        return this._orphanedEventManager.getContinuationToken(conversationId)
            .then((token) => {
                _continuationToken = token;

                if (continuationToken !== undefined) {
                    // check the continuationToken is correct
                    if (_continuationToken !== continuationToken) {
                        // get rid of our cached events as they are now useless
                        // return this._orphanedEventManager.clear(conversationId)
                        // .then(() => {
                        return Promise.reject<boolean>({ message: `Invalid continuation token: ${continuationToken} for ${conversationId}, you nust start from the end` });
                        // });
                    } else {
                        return Promise.resolve(true);
                    }

                } else {
                    // reset the store as they want to go from the beginning 
                    return this._orphanedEventManager.clear(conversationId);
                }
            })
            .then(() => {
                return this._messageManager.getConversationMessages(conversationId, pageSize, continuationToken);
            })
            .then(result => {
                _conversationMessagesResult = result;

                if (result.messages === undefined) {
                    this._logger.log("No messages in this channel yet");
                    return Promise.resolve<IGetMessagesResponse>({ messages: [] });
                } else {

                    // merge any events we got from the call to getConversationMessages with whats in the store
                    return this.getOrphanedEvents(conversationId, _conversationMessagesResult.orphanedEvents)
                        .then(orphanedEvents => {
                            return this.applyOrphanedEvents(_conversationMessagesResult.messages, orphanedEvents);
                        })
                        .then(() => {
                            // update continuation token for this conv 
                            _continuationToken = _conversationMessagesResult.earliestEventId - 1;
                            return this._orphanedEventManager.setContinuationToken(conversationId, _continuationToken);
                        })
                        .then(() => {
                            return Promise.resolve<IGetMessagesResponse>({
                                continuationToken: _continuationToken,
                                earliestEventId: _conversationMessagesResult.earliestEventId,
                                latestEventId: _conversationMessagesResult.latestEventId,
                                messages: _conversationMessagesResult.messages,
                            });
                        });
                }
            });
    }

    /**
     * Method to append a new batch of orphaned events to the store and then return them all ..
     * @param {string} conversationId
     * @param {any[]} orphanedEvents
     * @returns {Promise<IConversationMessageEvent[]>}
     */
    public getOrphanedEvents(conversationId: string, orphanedEvents: any[]): Promise<IConversationMessageEvent[]> {

        let mapped: IConversationMessageEvent[] = orphanedEvents.map(e => { return this.mapOrphanedEvent(e); });

        // add them into the store 
        return Utils.eachSeries(mapped, (event: IConversationMessageEvent) => {
            return this._orphanedEventManager.addOrphanedEvent(event);
        })
            .then(done => {
                // get the store 
                return this._orphanedEventManager.getOrphanedEvents(conversationId);
            });
    }

    /**
     * Function to iterate through a bunch of messages and mark as delivered as appropriate - NOTE: this is automatically called by  AppMessaging.getMessages() 
     * @method MessagePager#markMessagesAsDelivered
     * @param {string} id - the conversationId
     * @param {Object[]} messages - the messages to check
     * @param {string} uerId - the userId
     * @returns {Promise}
     */
    public markMessagesAsDelivered(id: string, messages: IConversationMessage[], userId: string): Promise<string> {

        let messageIds = [];

        for (let message of messages) {

            // only look at messages that I haven't sent ...
            if (message.context && message.context.from && message.context.from.id !== userId) {

                let alreadyDelivered = false;

                if (message.statusUpdates && message.statusUpdates[userId]) {
                    // status will be delivered then read i.e. if read, it was delivered
                    if (message.statusUpdates[userId].status === "delivered" ||
                        message.statusUpdates[userId].status === "read") {
                        alreadyDelivered = true;
                    }
                }

                if (!alreadyDelivered) {
                    messageIds.unshift(message.id);
                }
            }
        }

        if (messageIds.length > 0) {

            let statusUpdate: IMessageStatus = {
                messageIds: messageIds,
                status: "delivered",
                timestamp: new Date().toISOString()
            };

            return this._messageManager.sendMessageStatusUpdates(id, [statusUpdate]);
        } else {
            // TODO: status update response id currently "OK" ROFL ...
            return Promise.resolve("OK");
        }
    }

    /**
     * Method to reset any cached info abut a conversation
     */
    public resetConversation(conversationId: string): Promise<boolean> {
        return this._orphanedEventManager.clear(conversationId);
    }

    /**
     * Orphaned events must be applied in ascending order, so if we want to loop backwards through these they need to be sorted
     * by id descending
     */
    private applyOrphanedEvents(messages: IConversationMessage[], orphanedEvents: IConversationMessageEvent[]): Promise<boolean> {
        return Utils.eachSeries(orphanedEvents, (event: IConversationMessageEvent) => {
            if (this.playEvent(event, messages)) {
                this._logger.log(`succesfuly played event ${event.conversationEventId}`);
                return this._orphanedEventManager.removeOrphanedEvent(event);
            } else {
                this._logger.warn(`failed to play event ${event.conversationEventId}`, event);
                return Promise.resolve(false);
            }
        });
    }

    /**
     * 
     */
    private playEvent(event: any, messages: IConversationMessage[]): boolean {
        let played: boolean = false;

        // find message in array
        let found: IConversationMessage[] = messages.filter(message => message.id === event.payload.messageId);

        let message: IConversationMessage;

        if (found.length === 1) {
            message = found[0];
            played = true;
        } else if (found.length >= 1) {
            this._logger.error(`Found more than 1 message with same messageId: ${event.payload.messageId}`);
        } else {
            this._logger.log(`Message ${event.payload.messageId} not found ...`);
        }

        switch (event.name) {
            case "conversationMessage.read":
                {
                    if (message) {
                        // apply status update - read overwrites delivered
                        message.statusUpdates[event.payload.profileId] = {
                            "status": "read",
                            "on": event.payload.timestamp
                        };
                    }
                }
                break;

            case "conversationMessage.delivered":
                {
                    if (message) {
                        // apply status update - read overwrites delivered

                        let updateForProfileId = message.statusUpdates[event.payload.profileId];
                        if (updateForProfileId && updateForProfileId.status === "read") {
                            this._logger.log("Message already marked as read, not marking as delivered");
                        } else {
                            message.statusUpdates[event.payload.profileId] = {
                                "status": "delivered",
                                "on": event.payload.timestamp
                            };
                        }

                    }
                }
                break;

            default:
                this._logger.error(`Unknown eventName ${event.name} for messageId: ${event.payload.messageId}`);
                break;

        }
        return played;
    }

    /*
        An event from the websocket / event api ...
        ============================================
        {
            "eventId": "4ea0489c-5bab-42e2-883c-5545f8444b80",
            "name": "conversationMessage.delivered",
            "conversationId": "7489e390-62b4-4812-a866-ea9499f7e28e",
            "conversationEventId": 3,
            "payload": {
                "messageId": "4a0fbb0f-7693-47a8-9628-18bef4c69f10",
                "conversationId": "7489e390-62b4-4812-a866-ea9499f7e28e",
                "isPublicConversation": false,
                "profileId": "alex",
                "timestamp": "2016-11-08T12:25:24.774Z"
            }
        }


        An orphaned event ...
        ======================
        {
            "id": 54,
            "data": {
                "name": "delivered",
                "payload": {
                    "messageId": "3008c899-c18d-410a-884e-c10a51632d3b",
                    "conversationId": "bc24d5b0-b03c-4594-872b-510c4af81dfe",
                    "isPublicConversation": false,
                    "profileId": "alex",
                    "timestamp": "2016-11-08T12:48:53.088Z"
                },
                "eventId": "8605dbd1-6a10-4405-8966-1eb7dfaefea4",
                "profileId": "alex"
            }
        }
     */
    private mapOrphanedEvent(event: any): IConversationMessageEvent {

        let mapped: any = {};

        mapped.conversationEventId = event.id;
        mapped.name = "conversationMessage." + event.data.name;
        mapped.eventId = event.data.eventId;
        mapped.conversationId = event.data.payload.conversationId;
        mapped.payload = event.data.payload;

        return mapped;
    }
}
