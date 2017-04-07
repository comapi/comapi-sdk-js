import { Foundation } from "../../src/foundation";
import { Utils } from "../../src/utils";
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
    addArray: IChatConversation[]
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

    //    private _eventPageSize: number = 100;

    private _messagePageSize: number = 100;

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
                        id: message.id,
                        conversationId: message.context.conversationId,
                        senderId: message.context.senderId,
                        sentOn: message.context.sentOn,
                        sentEventid: message.sentEventid,
                        metadata: message.metadata,
                        parts: message.parts,
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
                conversation.continuationToken = getMessagesReult.continuationToken

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
            deleteArray: deleteArray,
            addArray: addArray
        };
    }

    /**
     * 
     */
    private updateConversation(conversation: IChatConversation, latestSentEventId?: number): Promise<boolean> {
        console.warn("updateConversation", conversation, latestSentEventId);

        // no messages yey
        if (!latestSentEventId) {
            return Promise.resolve(false);
        }

        // is this a new conversation (to us)? If so, load a page of messages
        if (conversation.continuationToken === undefined) {
            return this.getMessages(conversation);
        } else {
            // 
        }

        // otherwise update by playing events onto the store 

        return Promise.reject<boolean>({ message: "not implemented" });
    }

    private updateConversationWithEvents() {

    }


    private playEvent() {

    }

    /**
     * 
     * @param event 
     */
    private onConversationMessageEvent(event: IConversationMessageEvent) {
        console.warn("onConversationMessageEvent");
    }

    /**
     * 
     * @param event 
     */
    private onConversationDeleted(event: IConversationDeletedEventData) {
        console.warn("onConversationDeleted");
    }

    /**
     * 
     * @param event 
     */
    private onConversationUpdated(event: IConversationUpdatedEventData) {
        console.warn("onConversationUpdated");
    }

    /**
     * 
     * @param event 
     */
    private onParticipantAdded(event: IParticipantAddedEventData) {
        console.warn("onParticipantAdded");
    }

    /**
     * 
     * @param event 
     */
    private onParticipantRemoved(event: IParticipantRemovedEventData) {
        console.warn("onParticipantRemoved");
    }


}
