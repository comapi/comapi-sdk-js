import { Foundation } from "../../src/foundation";
import { Utils, DoUntilOperationFunction, DoUntilTestFunction } from "../../src/utils";
import { IConversationStore, IChatConversation, IChatMessage } from "../interfaces/chatLayer";

import { IMessageSentPayload, IMessageStatusUpdatePayload } from "../../src/interfaces";


import {
    IConversationDetails2,
    IConversationMessageEvent,
    IConversationDeletedEventData,
    IConversationUpdatedEventData,
    IParticipantAddedEventData,
    IParticipantRemovedEventData,
    IGetMessagesResponse
} from "../../src/interfaces";



interface IConversationSyncInfo {
    deleteArray: string[];
    addArray: IChatConversation[];
}


/**
 * High Level Tasks that this interface needs to perform
 * 
 * 1) Synchronise on startup
 *  - initial loadup of convrsations / last x messges 
 *  - update by getting events
 *  - know when to bin off and start again
 * 
 * 2) Handle realtime events
 *  - happy path just play onto store
 *  - gap detection and appropriate action 
 * 
 * 3) Only do one thing at once 
 *  - buffer incoming events if doing something
 *  - some kind of mutex (busy flag?)
 * 
 * 4) Page through conversationDeleted
 *  - backfill using continuation token
 */
export class ComapiChatLogic {

    private _store: IConversationStore;

    private _updating: boolean = false;

    private _eventPageSize: number = 10;

    private _messagePageSize: number = 10;

    /**
     * Assume this object is initialised ? 
     * @param {Foundation} _foundation 
     */
    constructor(private _foundation: Foundation) {
        this._foundation.on("conversationMessageEvent", this.onConversationMessageEvent.bind(this));
        this._foundation.on("conversationDeleted", this.onConversationDeleted.bind(this));
        this._foundation.on("conversationUpdated", this.onConversationUpdated.bind(this));
        this._foundation.on("participantAdded", this.onParticipantAdded.bind(this));
        this._foundation.on("participantRemoved", this.onParticipantRemoved.bind(this));
    }

    /**
     * 
     * @param store 
     */
    public registerConversationStore(store: IConversationStore) {
        this._store = store;
    }

    /**
     * 
     */
    public synchronize(): Promise<boolean> {

        if (this._updating) {
            return Promise.reject<boolean>({ message: "synchronize called when this._updating set to true" });
        }

        // 0) Set busy flag
        this._updating = true;

        let remoteConversations: IConversationDetails2[];
        let localConversations: IChatConversation[];

        let syncInfo: IConversationSyncInfo;

        // 1) get list of conversations from comapi
        return this._foundation.services.appMessaging.getConversations()
            .then(conversations => {
                remoteConversations = conversations;
                // 2) get list from IConversationStore
                return this._store.getConversations();
            })
            .then(conversations => {
                localConversations = conversations;

                syncInfo = this.getConversationSyncInfo(remoteConversations, localConversations);

                return Utils.eachSeries(syncInfo.deleteArray, (conversationId: string) => {
                    return this._store.deleteConversation(conversationId);
                });
            })
            .then(() => {
                // 3) Add new ones
                return Utils.eachSeries(syncInfo.addArray, (conversation: IChatConversation) => {
                    return this._store.createConversation(conversation);
                });
            })
            .then(() => {
                // Add the new conversations to the localConversations array ...
                for (let newConv of syncInfo.addArray) {
                    localConversations.push(newConv);
                }

                // 4) Sync conversation messages 
                return Utils.eachSeries(localConversations, (conversation: IChatConversation) => {
                    let latestSentEventId = remoteConversations.find(o => { return o.id === conversation.id; }).latestSentEventId;
                    return this.updateConversation(conversation, latestSentEventId);
                });
            })
            .then(() => {
                // 5) Reset busy flag
                this._updating = false;
                console.error("synchronize succeeded");
                return Promise.resolve(true);
            })
            .catch(error => {
                this._updating = false;
                console.error("synchronize failed", error);
                return Promise.reject(error);
            });
    }

    /**
     * Method to get a page of messages and adapt into IChatMessage entities
     * @param {IChatConversation} conversation 
     * @returns {Promise<boolean>}
     */
    private getMessages(conversation: IChatConversation): Promise<boolean> {

        let getMessagesReult: IGetMessagesResponse;

        return this._foundation.services.appMessaging.getMessages(conversation.id, this._messagePageSize, conversation.continuationToken)
            .then(result => {
                getMessagesReult = result;
                // update conversation object
                // add the messages (after adapting IConversationMessage => IChatMessage)

                let messages: IChatMessage[] = getMessagesReult.messages.map(message => {
                    return {
                        conversationId: message.context.conversationId,
                        id: message.id,
                        metadata: message.metadata,
                        parts: message.parts,
                        senderId: message.context.from.id,
                        // TODO: error in IConversationMessage interface
                        sentEventId: message.sentEventId,
                        sentOn: message.context.sentOn,
                        statusUpdates: message.statusUpdates
                    };
                });

                return Utils.eachSeries(messages, (message: IChatMessage) => {
                    return this._store.createMessage(message);
                });
            })
            .then(() => {
                conversation.earliestEventId = getMessagesReult.earliestEventId;
                conversation.latestEventId = getMessagesReult.latestEventId;
                conversation.continuationToken = getMessagesReult.continuationToken;

                return this._store.updateConversation(conversation);
            });
    }

    /**
     * Method to compare what is local and what is remote and determine what cnversations need adding and removing
     * @param {IConversationDetails2[]} remoteConversations 
     * @param {IChatConversation[]} localConversations 
     * @returns {IConversationSyncInfo}
     */
    private getConversationSyncInfo(remoteConversations: IConversationDetails2[], localConversations: IChatConversation[]): IConversationSyncInfo {
        let deleteArray: string[] = [];
        let addArray: IChatConversation[] = [];

        // make list of local conversations to delete
        for (let localConv of localConversations) {
            // if not in remote array, needs deleting
            if (!remoteConversations.find(o => { return o.id === localConv.id; })) {
                console.log(`Local conversation ${localConv.id} needs deleting`);
                deleteArray.push(localConv.id);
            }
        }

        // make list of local conversations to add
        for (let remoteConv of remoteConversations) {
            // if not in local array, needs adding
            if (!localConversations.find(o => { return o.id === remoteConv.id; })) {
                console.log(`Remote conversation ${remoteConv.id} needs adding`);
                addArray.push({
                    id: remoteConv.id,
                    name: remoteConv.name,
                    description: remoteConv.description,
                    roles: remoteConv.roles,
                    isPublic: remoteConv.isPublic,
                    latestEventId: remoteConv.latestSentEventId,
                });
            }
        }

        return {
            addArray: addArray,
            deleteArray: deleteArray,
        };
    }

    /**
     * Update a conversation by applying new events to the conversation store.
     * New events will be queried in pages and applied until we get all unseen events.
     * Any logical decison regarding whether this conversation is too out of date to be refreshed in this way are not dealt with here.
     * @param {IChatConversation} conversation
     * @param {number} latestSentEventId - this is te latest event on the server, we can tell if we are up to dat eby looking at this ...
     */
    private updateConversation(conversation: IChatConversation, latestSentEventId?: number): Promise<boolean> {
        console.warn("updateConversation", conversation, latestSentEventId);

        // no messages yet
        if (latestSentEventId === undefined) {
            return Promise.resolve(false);
        }

        // is this a new conversation (to us)? If so, load a page of messages
        if (conversation.continuationToken === undefined) {
            console.log(`Conversation ${conversation.id} seen for first time on this device, initialising with messages ...`);
            return this.getMessages(conversation);
        } else if (conversation.latestEventId >= latestSentEventId) {
            // NOTE: latestSentEventId means exactly that - we could have puled in some status updates which would put us ahead
            // if we get an event that proved there is a gap, we can fill it ...
            console.log(`Conversation ${conversation.id} already up to date ...`);
            return Promise.resolve(false);
        } else {
            // get events and apply
            let self = this;
            let _events: IConversationMessageEvent[];

            let _getPageOfEventsFunc: DoUntilOperationFunction = function (conv: IChatConversation): Promise<any> {
                console.log("--> DoUntilOperationFunction()", conv);

                return self._foundation.services.appMessaging.getConversationEvents(conv.id, conv.latestEventId, self._eventPageSize)
                    .then(events => {
                        _events = events;
                        console.log("getConversationEvents() retrned", events);
                        return Utils.eachSeries(events, (event: IConversationMessageEvent) => {
                            return self.applyEvent(event);
                            // result of the last opertaion flows int the then below...
                        }).then((result) => {

                            // want the eventId of the last one
                            conv.latestEventId = _events[_events.length - 1].conversationEventId;
                            console.log("<-- DoUntilOperationFunction()", conv);
                            return conv;
                        });
                    })
                    .catch(error => {
                        console.error("getConversationEvents ;-( threw this", error);
                        return conv;
                    });
            };

            let _compareFunc: DoUntilTestFunction = function (conv: IChatConversation): boolean {

                if (_events) {
                    return _events.length === self._eventPageSize;
                } else {
                    return false;
                }

            };

            return Utils.doUntil(_getPageOfEventsFunc, _compareFunc, conversation)
                .then((conv: IChatConversation) => {
                    return this._store.updateConversation(conv);
                });
        }
    }

    /**
     * Method to apply an event to the conversation store
     * @param {IConversationMessageEvent} event - the event to apply
     * @returns {Promise<boolean>} - returns a boolean resut inside a Promise
     */
    private _applyEvent(event: IConversationMessageEvent): Promise<boolean> {
        switch (event.name) {
            case "conversationMessage.sent":

                let messageSentPayload = <IMessageSentPayload>event.payload;

                let message: IChatMessage = {
                    conversationId: event.conversationId,
                    id: messageSentPayload.messageId,
                    metadata: messageSentPayload.metadata,
                    parts: messageSentPayload.parts,
                    senderId: messageSentPayload.context.from.id,
                    sentEventId: event.conversationEventId,
                    sentOn: messageSentPayload.context.sentOn,
                };

                console.log("--> createMessage()", message);
                return this._store.createMessage(message);

            case "conversationMessage.delivered":
            case "conversationMessage.read":
                let splitResult = event.name.split(".");
                let statusUpdate = <IMessageStatusUpdatePayload>event.payload;

                console.log("--> updateMessageStatus()", statusUpdate, splitResult[1]);
                return this._store.updateMessageStatus(statusUpdate.conversationId,
                    statusUpdate.messageId,
                    statusUpdate.profileId,
                    splitResult[1], // ["delivered"|"read"]
                    statusUpdate.timestamp);
            default:
                return Promise.reject<boolean>({ message: `Unknown option ${event.name}` });

        }
    }


    /**
     * Method to apply an event to the conversation store, also updating the IChatConversation
     * @param {IConversationMessageEvent} event - the event to apply
     * @returns {Promise<boolean>} - returns a boolean resut inside a Promise
     */
    private applyEvent(event: IConversationMessageEvent): Promise<boolean> {

        let _chatConversation: IChatConversation;

        console.log("ComapiChatLogic.applyEvent()", event);

        return this._store.getConversation(event.conversationId)
            .then(chatConversation => {
                console.log("getConversation() ==>", chatConversation);
                _chatConversation = chatConversation;
                return this._applyEvent(event);
            })
            .then(updated => {

                if (_chatConversation.earliestEventId === undefined) {
                    _chatConversation.earliestEventId = event.conversationEventId;
                }
                _chatConversation.latestEventId = event.conversationEventId;

                console.log("--> updateConversation()", _chatConversation);
                return this._store.updateConversation(_chatConversation);
            });
    }


    /**
     * Event handler to handle incoming Conversation Message events
     * @param {IConversationMessageEvent} event 
     */
    private onConversationMessageEvent(event: IConversationMessageEvent) {
        console.log("onConversationMessageEvent", event);
        this.applyEvent(event);
    }

    /**
     * Event handler to handle incoming Conversation Deleted events
     * @param {IConversationDeletedEventData} event 
     */
    private onConversationDeleted(event: IConversationDeletedEventData) {
        console.warn("onConversationDeleted");
    }

    /**
     * Event handler to handle incoming Conversation Updated events
     * @param {IConversationUpdatedEventData} event 
     */
    private onConversationUpdated(event: IConversationUpdatedEventData) {
        console.warn("onConversationUpdated");
    }

    /**
     * Event handler to handle incoming Participant Added events
     * @param {IParticipantAddedEventData} event 
     */
    private onParticipantAdded(event: IParticipantAddedEventData) {
        console.warn("onParticipantAdded");
    }

    /**
     * Event handler to handle incoming Participant Removed events
     * @param {IParticipantRemovedEventData} event 
     */
    private onParticipantRemoved(event: IParticipantRemovedEventData) {
        console.warn("onParticipantRemoved");
    }


}
