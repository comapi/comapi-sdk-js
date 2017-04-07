import { Foundation } from "../../src/foundation";
import { Utils, DoUntilOperationFunction, DoUntilTestFunction } from "../../src/utils";
import { IConversationStore, IChatConversation, IChatMessage } from "../interfaces/chatLayer";

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
                        senderId: message.context.senderId,
                        sentEventid: message.sentEventid,
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
                addArray.push(remoteConv);
            }
        }

        return {
            addArray: addArray,
            deleteArray: deleteArray,
        };
    }

    /**
     * 
     */
    private updateConversation(conversation: IChatConversation, latestSentEventId?: number): Promise<boolean> {
        console.warn("updateConversation", conversation, latestSentEventId);

        // no messages yet
        if (!latestSentEventId) {
            return Promise.resolve(false);
        }

        // is this a new conversation (to us)? If so, load a page of messages
        if (conversation.continuationToken === undefined) {
            return this.getMessages(conversation);
        } else {
            // get events and apply
            let self = this;
            let _events: IConversationMessageEvent[];

            let _getPageOfEventsFunc: DoUntilOperationFunction = function (conv: IChatConversation): Promise<any> {
                return self._foundation.services.appMessaging.getConversationEvents(conv.id, conv.latestEventId, self._eventPageSize)
                    .then(events => {
                        _events = events;
                        Utils.eachSeries(events, (event: IConversationMessageEvent) => {
                            return self.applyEvent(event);
                        }).then((event: IConversationMessageEvent) => {
                            conv.latestEventId = event.conversationEventId;
                            return conv;
                        });
                    });
            };

            let _compareFunc: DoUntilTestFunction = function (conv: IChatConversation): boolean {
                return _events.length === self._eventPageSize;
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
    private applyEvent(event: IConversationMessageEvent): Promise<boolean> {
        return Promise.reject<boolean>({ message: "not implemented" });
    }


    /**
     * Event handler to handle incoming Conversation Message events
     * @param {IConversationMessageEvent} event 
     */
    private onConversationMessageEvent(event: IConversationMessageEvent) {
        console.warn("onConversationMessageEvent");
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
