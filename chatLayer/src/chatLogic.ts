import { Foundation } from "../../src/foundation";
import { Utils } from "../../src/utils";
import { IConversationStore, IChatConversation } from "../interfaces/chatLayer";

import {
    IConversationDetails2,
    IConversationMessageEvent,
    IConversationDeletedEventData,
    IConversationUpdatedEventData,
    IParticipantAddedEventData,
    IParticipantRemovedEventData
} from "../../src/interfaces";

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

    //    private _messagePageSize: number = 100;

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
        let addArray: IChatConversation[] = [];

        // 1) get list of conversations from comapi
        return this._foundation.services.appMessaging.getConversations()
            .then(conversations => {
                remoteConversations = conversations;
                // 2) get list from IConversationStore
                return this._store.getConversations();
            })
            .then(conversations => {
                localConversations = conversations;
                let deleteArray: string[] = [];

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

                return Utils.eachSeries(deleteArray, (conversationId: string) => {
                    return this._store.deleteConversation(conversationId);
                });
            })
            .then(() => {
                // 3) Add new ones
                return Utils.eachSeries(addArray, (conversation: IChatConversation) => {
                    return this._store.createConversation(conversation);
                });
            })
            .then(() => {
                // Add the new conversations to the localConversations array ...
                for (let newConv of addArray) {
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
     * 
     */
    private updateConversation(conversation: IChatConversation, latestSentEventId?: number): Promise<boolean> {
        console.warn("updateConversation", conversation, latestSentEventId);

        // no messages yey
        if (!latestSentEventId) {
            return Promise.resolve(false);
        }



        // is this a new conversation (to us)? If so, load a page of messages
        // if ()


        // otherwise update by playing events onto the store 














        return Promise.reject<boolean>({ message: "not implemented" });
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
