import { MessageStatusBuilder, MessageBuilder } from "../../src/foundation";
import { Utils, DoUntilOperationFunction, DoUntilTestFunction } from "../../src/utils";
import { IChatLogic, IComapiChatConfig, IConversationStore, IChatConversation, IChatMessage, IChatInfo } from "../interfaces/chatLayer";

import { IFoundation, IMessageSentPayload, IMessageStatusUpdatePayload, IConversationParticipant } from "../../src/interfaces";

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
    // conversations that have been remotely deleted an need local clean up 
    deleteArray: string[];
    // convesations that we dont have locally and need to acc
    addArray: IChatConversation[];
    // conversations that we already have that have changed in some way - name changed, etc ...
    updateArray: IChatConversation[];
}


interface IComapiEvent {
    type: string;
    event: any;
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
 * 4) Page through conversation
 *  - backfill using continuation token
 */
export class ComapiChatLogic implements IChatLogic {

    private _hasInitialised: boolean = false;

    private _hasSynced: boolean = false;

    private _store: IConversationStore;

    private _updating: boolean = false;

    private _eventPageSize: number = 10;

    private _messagePageSize: number = 10;

    private _lazyLoadThreshold: number = 1;


    // if a gap is detected greater than this, we will scrap what we have and just load in the last _messagePageSize messages
    // private _maxEventGap: number = 100;

    private _listen: boolean = true;

    private _profileId: string;


    // store of cached events that have arrived when we were busy ...
    // these wil get processed at the end of an async task that uses the _updating flag
    private _cachedEvents: IComapiEvent[] = [];

    /**
     * 
     */
    constructor(private _foundation: IFoundation) { }

    /**
     * Initialise Chat Layer
     * 1) Initialise foudation interface
     * 2) Wre up event handlers
     * 3) Synchronise
     * @param config 
     */
    public initialise(config: IComapiChatConfig): Promise<boolean> {

        console.log(`initialise(${config})`);

        if (config.eventPageSize !== undefined) {
            this._eventPageSize = config.eventPageSize;
        }
        if (config.messagePageSize !== undefined) {
            this._messagePageSize = config.messagePageSize;
        }
        if (config.lazyLoadThreshold !== undefined) {
            this._lazyLoadThreshold = config.lazyLoadThreshold;
        }

        this._foundation.on("conversationMessageEvent", event => { this.onComapiEvent({ type: "conversationMessageEvent", event }); });
        this._foundation.on("conversationDeleted", event => { this.onComapiEvent({ type: "conversationDeleted", event }); });
        this._foundation.on("conversationUpdated", event => { this.onComapiEvent({ type: "conversationUpdated", event }); });
        this._foundation.on("participantAdded", event => { this.onComapiEvent({ type: "participantAdded", event }); });
        this._foundation.on("participantRemoved", event => { this.onComapiEvent({ type: "participantRemoved", event }); });

        this._hasInitialised = true;
        this._store = config.conversationStore;

        console.log("Calling Synchronise ...");

        return this.synchronize()
            .then(synced => {
                this._hasSynced = true;
                console.log("Synchronised!");
                return synced;
            });
    }


    public get initialised(): boolean {
        return this._hasInitialised;
    }

    public get synced(): boolean {
        return this._hasSynced;
    }



    /**
     * 
     */
    public startSession() {
        return this._foundation ? this._foundation.startSession() : Promise.reject({ message: "No Foundation interface" });
    }

    /**
     * End the current session and reset the store
     */
    public endSession() {
        return this._foundation ? this._foundation.endSession()
            .then(() => {
                return this._store.reset();
            }).then(reset => {
                this._hasSynced = false;
            }) : Promise.reject({ message: "No Foundation interface" });
    }

    public getMyProfile(): Promise<any> {
        return this._foundation.services.profile.getMyProfile();
    }

    /**
     * Synchronise Chat layer
     */
    public synchronize(): Promise<boolean> {

        if (!this._foundation) {
            return Promise.reject<boolean>({ message: "No Foundation interface" });
        }

        if (this._updating) {
            return Promise.reject<boolean>({ message: "synchronize called when this._updating set to true" });
        }

        // 0) Set busy flag
        this._updating = true;

        let remoteConversations: IConversationDetails2[];
        let localConversations: IChatConversation[];

        let syncInfo: IConversationSyncInfo;


        // Will explicitly start a session prior to calling getConversations so I can get the session info ...
        // I am interested in the profileId of the user  ...

        return this._foundation.startSession()
            .then(session => {
                this._profileId = session.profileId;
                return this._foundation.services.appMessaging.getConversations();
            })
            // 1) get list of conversations from comapi
            // return this._foundation.services.appMessaging.getConversations()
            .then(conversations => {
                remoteConversations = conversations;

                // 2) get list from IConversationStore
                return this._store.getConversations();
            })
            .then(conversations => {
                // take a copy of this as we don't want it getting modified when we add/remove using the store ;-)

                localConversations = conversations.slice();

                syncInfo = this.getConversationSyncInfo(remoteConversations, localConversations);

                return Utils.eachSeries(syncInfo.deleteArray, (conversationId: string) => {

                    return this._store.deleteConversation(conversationId)
                        .then(deleted => {
                            // Remove the conversation from from localConversations
                            for (let i = localConversations.length - 1; i >= 0; i--) {
                                if (localConversations[i].id === conversationId) {
                                    localConversations.splice(i, 1);
                                }
                            }

                            return deleted;
                        });
                });
            })
            .then((result) => {
                // 3) Add new ones
                return Utils.eachSeries(syncInfo.addArray, (conversation: IChatConversation) => {
                    return this._store.createConversation(conversation);
                });
            })
            .then((result) => {
                // 4) Update existing ones that have changed
                return Utils.eachSeries(syncInfo.updateArray, (conversation: IChatConversation) => {
                    return this._store.updateConversation(conversation);
                });
            })
            .then((result) => {
                // Add the new conversations to the localConversations array ...
                // TODO: the orig. call to _store.getConversations() returned  reference (in my memoryStore sample)
                // the dDB version wont do that ....
                // a) mem version returns a copy 
                for (let newConv of syncInfo.addArray) {
                    localConversations.push(newConv);
                }

                // localConversations.sort(function (c1, c2) {
                //     let a = new Date(c1.updated);
                //     let b = new Date(c2.updated);
                //     return a > b ? -1 : a < b ? 1 : 0;
                // });

                // sort localConversations by some date
                // just load the first _lazyLoadThreshold 

                localConversations.sort((a: IChatConversation, b: IChatConversation) => {
                    let left = Number(new Date(a.lastMessageTimestamp));
                    let right = Number(new Date(b.lastMessageTimestamp));
                    return (/*sortOrder === "asc"*/true) ? right - left : left - right;
                });

                // remoteConversations.sort((a: IConversationDetails2, b: IConversationDetails2) => {
                //     let left = Number(new Date(a._updatedOn));
                //     let right = Number(new Date(b._updatedOn));
                //     return (/*sortOrder === "asc"*/true) ? right - left : left - right;
                // });

                // if (localConversations.length !== remoteConversations.length) {
                //     console.error("Mismatched lengths");
                // }

                // we will just pick the first _lazyLoadThreshold from the ordered array to synchronise
                let syncSet = localConversations.slice(0, this._lazyLoadThreshold);

                // Now go through the top n conversations ...




                // 4) Sync conversation messages 
                return Utils.eachSeries(syncSet, (conversation: IChatConversation) => {
                    return this.synchronizeConversation(conversation);
                });

                // TODO: if we dont sync, we will need to at least record the server latest eventId

                // return true;
            })
            .then((result) => {
                // 5) Reset busy flag
                this._updating = false;
                console.log("synchronize succeeded");
                return this.applyCachedEvents();
            })
            .catch(error => {
                this._updating = false;
                console.error("synchronize failed", error);
                return Promise.reject(error);
            });
    }


    /**
     * load another page in ...
     * TODO: - verify the earliestEventId, latestEventId, continuationToken are filled in properly
     *       - verify the messages are ordered correctly (for mem store)
     *       - ensure a deleted conversation, cleans up orphaned events ...
     *       - refactor orphaned events store 
     *          - use indexedDB if available
     */
    public getPreviousMessages(conversationId: string): Promise<boolean> {

        if (!this._foundation) {
            return Promise.reject<boolean>({ message: "No Foundation itterface" });
        }

        if (!this._updating) {
            this._updating = true;
            return this._store.getConversation(conversationId)
                .then(conversation => {
                    return this.getMessages(conversation);
                })
                .then(result => {
                    this._updating = false;
                    return this.applyCachedEvents();
                })
                .catch(error => {
                    console.error(`backfillConversation(${conversationId}) failed`, error);
                    this._updating = false;
                    return false;
                });

        } else {
            return Promise.reject<boolean>({ message: "busy" });
        }
    }

    /**
     * Power a master view
     */
    public getConversations(): Promise<IChatConversation[]> {
        return this._store.getConversations();
    }

    /**
     * Power a detail view
     */
    public getConversationInfo(conversationId: string): Promise<IChatInfo> {

        let _conversation: IChatConversation;
        let _messages: IChatMessage[];
        let _participants: IConversationParticipant[];

        return this._store.getConversation(conversationId)
            .then(conversation => {
                _conversation = conversation;

                // do we need to intitalise ?
                if (_conversation.latestLocalEventId === undefined ||
                    // or do we need to sync ?
                    _conversation.latestLocalEventId < _conversation.latestRemoteEventId) {
                    return this.synchronizeConversation(conversation);
                } else {
                    return Promise.resolve(true);
                }
            })
            .then(() => {
                return this._store.getMessages(conversationId);
            })
            .then(messages => {
                _messages = messages;
                return this._foundation.services.appMessaging.getParticipantsInConversation(conversationId);
            })
            .then(participants => {
                _participants = participants;

                return {
                    conversation: _conversation,
                    messages: _messages,
                    participants: _participants
                };
            });
    }

    // // Shouldn't need this ...
    // public getConversation(id: string): Promise<IChatConversation> {
    //     return Promise.reject("Not implemented");
    // }

    // returns massageId as string ...
    public sendMessage(conversationId: string, text: string): Promise<boolean> {
        if (!this._foundation) {
            return Promise.reject<boolean>({ message: "No Foundation interface" });
        }


        let message = new MessageBuilder().withText(text);
        return this._foundation.services.appMessaging.sendMessageToConversation(conversationId, message)
            .then(rslt => {

                let m: IChatMessage = {
                    conversationId: conversationId,
                    id: rslt.id,
                    metadata: message.metadata,
                    parts: message.parts,
                    senderId: this._profileId,
                    sentEventId: rslt.eventId,
                    sentOn: new Date().toISOString(),
                    statusUpdates: {}
                };
                return this._store.createMessage(m);
            });
    }

    public createConversation(converstion: IChatConversation): Promise<boolean> {
        if (!this._foundation) {
            return Promise.reject<boolean>({ message: "No Foundation interface" });
        }

        return this._foundation.services.appMessaging.createConversation(converstion)
            .then(rslt => {
                return this._store.createConversation(this.mapConversation(rslt));
            });
    }

    public updateConversation(conversation: IChatConversation): Promise<boolean> {
        if (!this._foundation) {
            return Promise.reject<boolean>({ message: "No Foundation interface" });
        }
        // conversation updated event will trigger the store to update ...
        return this._foundation.services.appMessaging.updateConversation(conversation)
            .then(updated => {
                return true;
            });
    }

    public deleteConversation(conversationId: string): Promise<boolean> {
        if (!this._foundation) {
            return Promise.reject<boolean>({ message: "No Foundation interface" });
        }

        return this._foundation.services.appMessaging.deleteConversation(conversationId)
            .then(() => {
                return this._store.deleteConversation(conversationId);
            });
    }

    public getParticipantsInConversation(conversationId: string): Promise<IConversationParticipant[]> {
        return this._foundation.services.appMessaging.getParticipantsInConversation(conversationId);
    }

    public addParticipantsToConversation(conversationId: string, participants: IConversationParticipant[]): Promise<boolean> {
        return this._foundation.services.appMessaging.addParticipantsToConversation(conversationId, participants);
    }

    public deleteParticipantsFromConversation(conversationId: string, participants: string[]): Promise<boolean> {
        return this._foundation.services.appMessaging.deleteParticipantsFromConversation(conversationId, participants);
    }

    /**
     * Method to get a page of messages and adapt into IChatMessage entities
     * @param {IChatConversation} conversation 
     * @returns {Promise<boolean>}
     */
    private getMessages(conversation: IChatConversation): Promise<boolean> {

        let getMessagesReult: IGetMessagesResponse;

        let messages: IChatMessage[];

        return this._foundation.services.appMessaging.getMessages(conversation.id, this._messagePageSize, conversation.continuationToken)
            .then(result => {
                getMessagesReult = result;
                // update conversation object
                // add the messages (after adapting IConversationMessage => IChatMessage)

                messages = getMessagesReult.messages.map(message => {
                    return {
                        conversationId: message.context && message.context.conversationId || undefined,
                        id: message.id,
                        metadata: message.metadata,
                        parts: message.parts,
                        senderId: message.context && message.context.from && message.context.from.id || undefined,
                        // TODO: error in IConversationMessage interface
                        sentEventId: message.sentEventId,
                        sentOn: message.context && message.context.sentOn || undefined,
                        statusUpdates: message.statusUpdates
                    };
                });

                // we dont care about the order ... that is not our problem
                return Utils.eachSeries(messages, (message: IChatMessage) => {
                    return this._store.createMessage(message);
                });
            })
            .then(() => {
                conversation.earliestLocalEventId = getMessagesReult.earliestEventId;

                // getMessagesReult.latestEventId refers to the latest id in that block.
                // DONT overwrite this once it has been set !!!
                if (conversation.latestLocalEventId === undefined) {
                    conversation.latestLocalEventId = getMessagesReult.latestEventId;
                }

                conversation.continuationToken = getMessagesReult.continuationToken;

                console.log("getMessages()", conversation, messages);

                return this._store.updateConversation(conversation);
            });
    }

    /**
     * Map a IConversationDetails2 object into an IChatConversation
     * @param conversation 
     */
    private mapConversation(conversation: IConversationDetails2): IChatConversation {
        return {
            description: conversation.description,
            // DONT copy this as this is the latest on the server            
            // latestEventId: conversation.latestSentEventId,
            // TODO: standardise on _etag - requires breaking change ...
            eTag: conversation._etag,
            id: conversation.id,
            isPublic: conversation.isPublic,
            // TODO: this will be a different property!!!
            lastMessageTimestamp: conversation._updatedOn,
            latestRemoteEventId: conversation.latestSentEventId,
            name: conversation.name,
            roles: conversation.roles,
        };
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
        let updateArray: IChatConversation[] = [];

        // make list of local conversations to delete
        for (let localConv of localConversations) {
            // if not in remote array, needs deleting
            let found = remoteConversations.find(o => { return o.id === localConv.id; });
            if (!found) {
                console.log(`Local conversation ${localConv.id} needs deleting`);
                deleteArray.push(localConv.id);
            } else {

                // etag may or may not be there
                let needsUpdating: boolean = false;

                if (localConv.latestRemoteEventId !== found.latestSentEventId) {
                    console.log(`${found.id}: latestRemoteEventId and latestSentEventId differ, needs updating `);
                    needsUpdating = true;
                } else if (found._etag && localConv.eTag && found._etag !== localConv.eTag) {
                    console.log(`${found.id}: etagS differ, needs updating `);
                    needsUpdating = true;
                }

                // either the eTag is different or the latestRemoteEventId is different
                if (needsUpdating) {

                    localConv.name = found.name;
                    localConv.description = found.description;
                    localConv.roles = found.roles;
                    localConv.isPublic = found.isPublic;
                    localConv.eTag = found._etag;
                    localConv.latestRemoteEventId = found.latestSentEventId;

                    updateArray.push(localConv);
                }
            }
        }

        // make list of local conversations to add
        for (let remoteConv of remoteConversations) {
            // if not in local array, needs adding
            if (!localConversations.find(o => { return o.id === remoteConv.id; })) {
                console.log(`Remote conversation ${remoteConv.id} needs adding`);
                addArray.push(this.mapConversation(remoteConv));
            }
        }

        return {
            addArray: addArray,
            deleteArray: deleteArray,
            updateArray: updateArray
        };
    }

    /**
     * Update a conversation by applying new events to the conversation store.
     * New events will be queried in pages and applied until we get all unseen events.
     * Any logical decison regarding whether this conversation is too out of date to be refreshed in this way are not dealt with here.
     * @param {IChatConversation} conversation
     */
    private synchronizeConversation(conversation: IChatConversation): Promise<boolean> {
        console.log("updateConversation", conversation);

        // no messages yet
        if (conversation.latestRemoteEventId === undefined) {
            console.log(`Conversation ${conversation.id} is empty ...`);
            return Promise.resolve(false);
        }

        // is this a new conversation (to us)? If so, load a page of messages
        if (conversation.continuationToken === undefined) {
            console.log(`Conversation ${conversation.id} seen for first time on this device, initialising with messages ...`);
            return this.getMessages(conversation);
        } else if (conversation.latestLocalEventId >= conversation.latestRemoteEventId) {
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

                return self._foundation.services.appMessaging.getConversationEvents(conv.id, conv.latestLocalEventId, self._eventPageSize)
                    .then(events => {
                        _events = events;
                        console.log("getConversationEvents() retrned", events);
                        return Utils.eachSeries(events, (event: IConversationMessageEvent) => {
                            return self.applyConversationMessageEvent(event);
                            // result of the last opertaion flows int the then below...
                        }).then((result) => {

                            // want the eventId of the last one
                            conv.latestLocalEventId = _events[_events.length - 1].conversationEventId;
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
    private _applyConversationMessageEvent(event: IConversationMessageEvent): Promise<boolean> {
        switch (event.name) {
            case "conversationMessage.sent":

                let messageSentPayload = <IMessageSentPayload>event.payload;

                let message: IChatMessage = {
                    conversationId: event.conversationId,
                    id: messageSentPayload.messageId,
                    metadata: messageSentPayload.metadata,
                    parts: messageSentPayload.parts,
                    senderId: messageSentPayload.context && messageSentPayload.context.from && messageSentPayload.context.from.id || undefined,
                    sentEventId: event.conversationEventId,
                    sentOn: messageSentPayload.context && messageSentPayload.context.sentOn || undefined,
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
    private applyConversationMessageEvent(event: IConversationMessageEvent): Promise<boolean> {

        let _chatConversation: IChatConversation;

        console.log("--> ComapiChatLogic.applyEvent()", event);

        return this._store.getConversation(event.conversationId)
            .then(chatConversation => {
                console.log("getConversation() ==>", chatConversation);

                // is there a conversation ?
                // if not, can run the onParticipantAdded logic ....
                if (chatConversation === null) {
                    return this.initialiseConversation(event.conversationId);
                } else {
                    return chatConversation;
                }
            })
            .then((chatConversation) => {
                _chatConversation = chatConversation;

                // is there a gap ?
                if (event.conversationEventId > _chatConversation.latestLocalEventId + 1) {
                    console.warn(`Gap detected in conversation: latestEventId: ${_chatConversation.latestLocalEventId}, conversationEventId: ${event.conversationEventId}`);
                }

                return this._applyConversationMessageEvent(event);
            })
            .then(updated => {

                if (_chatConversation.earliestLocalEventId === undefined) {
                    _chatConversation.earliestLocalEventId = event.conversationEventId;
                }

                if (event.conversationEventId > _chatConversation.latestLocalEventId) {
                    _chatConversation.latestLocalEventId = event.conversationEventId;
                }

                console.log("--> updateConversation()", _chatConversation);
                return this._store.updateConversation(_chatConversation);
            })
            .then(result => {
                console.log("<-- applyEvent");
                return Promise.resolve(true);
            })
            .catch(error => {
                console.error("<-- applyEvent caught this", error);
            });
    }

    /**
     * Actually process the event ...
     */
    private _onComapiEvent(info: IComapiEvent): Promise<boolean> {
        switch (info.type) {
            case "conversationMessageEvent":
                return this.onConversationMessageEvent(info.event);
            case "conversationDeleted":
                return this.onConversationDeleted(info.event);
            case "conversationUpdated":
                return this.onConversationUpdated(info.event);
            case "participantAdded":
                return this.onParticipantAdded(info.event);
            case "participantRemoved":
                return this.onParticipantRemoved(info.event);
            default:
                return Promise.resolve(false);
        }
    }

    /**
     * Call this method to apply any events that were received while we were busy doing something
     */
    private applyCachedEvents(): Promise<boolean> {
        console.log(`applyCachedEvents ${this._cachedEvents.length}`);

        if (this._updating) {
            return Promise.reject<boolean>({ message: "applyCachedEvents() called while updating" });
        }

        if (this._cachedEvents.length > 0) {

            // copy the events to a local array and empty cache (could get topped up while we are processing )
            let _events: IComapiEvent[] = this._cachedEvents.slice();
            this._cachedEvents = [];

            this._updating = true;
            return Utils.eachSeries(_events, (event: IComapiEvent) => {
                return this._onComapiEvent(event);
            })
                .then(result => {
                    this._updating = false;
                    _events = [];
                    // recurse (some more may have been cached) ...
                    return this.applyCachedEvents();
                })
                .catch(error => {
                    this._updating = false;
                    return Promise.resolve(false);
                });
        } else {
            return Promise.resolve(false);
        }
    }

    /**
     * handle the event if we are idle (and listening), otherwise cache it ...
     */
    private onComapiEvent(info: IComapiEvent) {

        if (this._listen) {
            if (!this._updating) {
                this._updating = true;
                this._onComapiEvent(info)
                    .then(updated => {
                        this._updating = false;
                        this.applyCachedEvents();
                    })
                    .catch(error => {
                        this._updating = false;
                        console.error("failed to process event", error);
                    });
            } else {
                console.warn("Received event while updating, caching ...", info);
                this._cachedEvents.unshift(info);
            }
        } else {
            console.warn("Received event while not listening, discarding ...", info);
        }
    }


    /**
     * Event handler to handle incoming Conversation Message events
     * @param {IConversationMessageEvent} event 
     */
    private onConversationMessageEvent(event: IConversationMessageEvent): Promise<boolean> {
        console.log("onConversationMessageEvent", event);

        return this.applyConversationMessageEvent(event)
            .then(updated => {

                let payload: IMessageSentPayload = (<IMessageSentPayload>event.payload);
                // if it was a message sent, send a delivered (unless I sent it!) ...
                if (event.name === "conversationMessage.sent" && payload.context && payload.context.from && payload.context.from.id !== this._profileId) {
                    let status = new MessageStatusBuilder().deliveredStatusUpdate(event.payload.messageId);
                    this._foundation.services.appMessaging.sendMessageStatusUpdates(event.conversationId, [status]);
                }
                return updated;
            });
    }

    /**
     * Event handler to handle incoming Conversation Deleted events
     * @param {IConversationDeletedEventData} event 
     */
    private onConversationDeleted(event: IConversationDeletedEventData): Promise<boolean> {
        console.log("onConversationDeleted");
        return this._store.deleteConversation(event.conversationId);
    }

    /**
     * Event handler to handle incoming Conversation Updated events
     * @param {IConversationUpdatedEventData} event 
     */
    private onConversationUpdated(event: IConversationUpdatedEventData): Promise<boolean> {
        console.log("onConversationUpdated");

        return this._store.getConversation(event.conversationId)
            .then(conversation => {

                conversation.name = event.name;
                conversation.description = event.description;
                conversation.roles = event.roles;
                conversation.isPublic = event.isPublic;
                conversation.eTag = event.eTag;
                // TODO: not sure this is correct ...
                conversation.lastMessageTimestamp = event.timestamp;

                return this._store.updateConversation(conversation);
            });
    }

    /**
     * Get a conversation and load in last page of messages
     * @param conversationId 
     */
    private initialiseConversation(conversationId: string): Promise<IChatConversation> {
        let _conversation: IChatConversation;

        // check whether we already have this ...
        // if this user creates the conversation, we need to ignore the participantAdded behaviour
        return this._store.getConversation(conversationId)
            .then(conversation => {
                return conversation === null ? this._foundation.services.appMessaging.getConversation(conversationId)
                    .then(remoteConversation => {
                        _conversation = this.mapConversation(remoteConversation);
                        return this._store.createConversation(_conversation);
                    })
                    .then(result => {
                        return this.getMessages(_conversation);
                    })
                    .then(result => {
                        return _conversation;
                    }) : conversation;
            });

    }

    /**
     * Event handler to handle incoming Participant Added events
     * @param {IParticipantAddedEventData} event 
     */
    private onParticipantAdded(event: IParticipantAddedEventData): Promise<boolean> {
        console.log("onParticipantAdded");

        // if this is me, need to add the conversation ...
        if (event.profileId === this._profileId) {

            // HACK: Race condition !!!
            // due to a secondary store being in use, the conversation may not exist when trying
            // to query it off the back of a  onParticipantAdded event ...

            return new Promise((resolve, reject) => {
                setTimeout(function () { resolve(); }, 1000);
            })
                .then(() => {
                    return this.initialiseConversation(event.conversationId);
                })
                .then(() => {
                    return true;
                });

        } else {
            return Promise.resolve(false);
        }

    }

    /**
     * Event handler to handle incoming Participant Removed events
     * @param {IParticipantRemovedEventData} event 
     */
    private onParticipantRemoved(event: IParticipantRemovedEventData): Promise<boolean> {
        console.log("onParticipantRemoved");

        // if this is me, need to add the conversation ...
        if (event.profileId === this._profileId) {
            return this._store.deleteConversation(event.conversationId);
        } else {
            return Promise.resolve(false);
        }

    }

}
