import { MessageStatusBuilder, MessageBuilder } from "../../src/foundation";
import { Utils, DoUntilOperationFunction, DoUntilTestFunction } from "../../src/utils";
import { IComapiChatConfig, IChatConversation, IChatMessage, IChatInfo } from "../interfaces/chatLayer";

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

import { Mutex } from "./mutex";

interface IConversationSyncInfo {
    // conversations that have been remotely deleted an need local clean up 
    deleteArray: string[];
    // conversations that we dont have locally and need to acc
    addArray: IChatConversation[];
    // conversations that we already have that have changed in some way - name changed, etc ...
    updateArray: IChatConversation[];
}

export class MessagingService {

    private _mutex: Mutex = new Mutex();

    constructor(private _foundation: IFoundation, private _config: IComapiChatConfig) { }

    /**
     * Initialise Chat Layer
     * 1) Initialise foundation interface
     * 2) Wre up event handlers
     * 3) Synchronise
     * @param config 
     */
    public initialise(config: IComapiChatConfig): Promise<boolean> {

        console.log(`initialise(${config})`);

        this._foundation.on("conversationMessageEvent", event => { this.onConversationMessageEvent(event); });
        this._foundation.on("conversationDeleted", event => { this.onConversationDeleted(event); });
        this._foundation.on("conversationUpdated", event => { this.onConversationUpdated(event); });
        this._foundation.on("participantAdded", event => { this.onParticipantAdded(event); });
        this._foundation.on("participantRemoved", event => { this.onParticipantRemoved(event); });

        return this.synchronize();
    }

    /**
     * Synchronise Chat layer
     */
    public synchronize(): Promise<boolean> {

        return this._mutex.runExclusive(() => {

            let remoteConversations: IConversationDetails2[];
            let localConversations: IChatConversation[];

            let syncInfo: IConversationSyncInfo;

            // Will explicitly start a session prior to calling getConversations so I can get the session info ...
            // I am interested in the profileId of the user  ...

            return this._foundation.startSession()
                .then(session => {
                    return this._foundation.services.appMessaging.getConversations();
                })
                // 1) get list of conversations from comapi
                // return this._foundation.services.appMessaging.getConversations()
                .then(conversations => {
                    remoteConversations = conversations;

                    // 2) get list from IConversationStore
                    return this._config.conversationStore.getConversations();
                })
                .then(conversations => {
                    // take a copy of this as we don't want it getting modified when we add/remove using the store ;-)

                    localConversations = conversations.slice();

                    syncInfo = this.getConversationSyncInfo(remoteConversations, localConversations);

                    return Utils.eachSeries(syncInfo.deleteArray, (conversationId: string) => {

                        return this._config.conversationStore.deleteConversation(conversationId)
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
                        return this._config.conversationStore.createConversation(conversation);
                    });
                })
                .then((result) => {
                    // 4) Update existing ones that have changed
                    return Utils.eachSeries(syncInfo.updateArray, (conversation: IChatConversation) => {
                        return this._config.conversationStore.updateConversation(conversation);
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

                    localConversations.sort((a: IChatConversation, b: IChatConversation) => {
                        let left = Number(new Date(a.lastMessageTimestamp));
                        let right = Number(new Date(b.lastMessageTimestamp));
                        return (/*sortOrder === "asc"*/true) ? right - left : left - right;
                    });

                    // we will just pick the first _lazyLoadThreshold from the ordered array to synchronise
                    let syncSet = localConversations.slice(0, this._config.lazyLoadThreshold);

                    // 4) Sync conversation messages 
                    return Utils.eachSeries(syncSet, (conversation: IChatConversation) => {
                        return this.synchronizeConversation(conversation);
                    });
                })
                .then(() => {
                    return true;
                });
        });
    }

    /**
     * load another page in ...
     */
    public getPreviousMessages(conversationId: string): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            return this._config.conversationStore.getConversation(conversationId)
                .then(conversation => {
                    return this.getMessages(conversation);
                });
        });
    }

    /**
     * Power a master view
     */
    public getConversations(): Promise<IChatConversation[]> {
        return this._mutex.runExclusive(() => {
            return this._config.conversationStore.getConversations();
        });
    }

    /**
     * Power a detail view
     */
    public getConversationInfo(conversationId: string): Promise<IChatInfo> {

        return this._mutex.runExclusive(() => {

            let _conversation: IChatConversation;
            let _messages: IChatMessage[];
            let _participants: IConversationParticipant[];

            return this._config.conversationStore.getConversation(conversationId)
                .then(conversation => {
                    _conversation = conversation;

                    // do we need to initialise ?
                    if (_conversation.latestLocalEventId === undefined ||
                        // or do we need to sync ?
                        _conversation.latestLocalEventId < _conversation.latestRemoteEventId) {
                        return this.synchronizeConversation(conversation);
                    } else {
                        return Promise.resolve(true);
                    }
                })
                .then(() => {
                    return this._config.conversationStore.getMessages(conversationId);
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
        });
    }

    // returns massageId as string ...
    public sendMessage(conversationId: string, text: string): Promise<boolean> {

        return this._mutex.runExclusive(() => {

            let message = new MessageBuilder().withText(text);
            return this._foundation.services.appMessaging.sendMessageToConversation(conversationId, message)
                .then(result => {

                    let m: IChatMessage = {
                        conversationId: conversationId,
                        id: result.id,
                        metadata: message.metadata,
                        parts: message.parts,
                        senderId: this._foundation.session && this._foundation.session.profileId || undefined,
                        sentEventId: result.eventId,
                        sentOn: new Date().toISOString(),
                        statusUpdates: {}
                    };
                    return this._config.conversationStore.createMessage(m);
                });
        });
    }

    /**
     * 
     * @param conversationId 
     * @param messageIds 
     */
    public markMessagesAsRead(conversationId: string, messageIds: string[]): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            let statuses = new MessageStatusBuilder().readStatusUpdates(messageIds);
            return this._foundation.services.appMessaging.sendMessageStatusUpdates(conversationId, [statuses]);
        });
    }

    /**
     * Go through all the messages we have in the store and mark them as read if necessary
     * @param conversationId 
     */
    public markAllMessagesAsRead(conversationId: string): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            let unreadIds: string[] = [];
            return this._config.conversationStore.getMessages(conversationId)
                .then(messages => {

                    for (let message of messages) {
                        if (!this.isMessageRead(message)) {
                            unreadIds.push(message.id);
                        }
                    }

                    return unreadIds.length > 0 ? this.markMessagesAsRead(conversationId, unreadIds) : Promise.resolve(false);
                });
        });
    }

    /**
     * 
     * @param message 
     * @param profileId 
     */
    public isMessageRead(message: IChatMessage, profileId?: string): boolean {
        let currentUser = this._foundation.session && this._foundation.session.profileId || undefined;
        // look at status updates ...
        let _profileId = profileId ? profileId : currentUser;

        if (message.senderId !== currentUser) {
            return message.statusUpdates && message.statusUpdates[_profileId] && message.statusUpdates[_profileId].status === "read";
        } else {
            return true;
        }
    }

    public createConversation(conversation: IChatConversation): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            return this._foundation.services.appMessaging.createConversation(conversation)
                .then(result => {
                    return this._config.conversationStore.createConversation(this.mapConversation(result));
                });
        });
    }

    public updateConversation(conversation: IChatConversation): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            // conversation updated event will trigger the store to update ...
            return this._foundation.services.appMessaging.updateConversation(conversation)
                .then(updated => {
                    return true;
                });
        });
    }

    public deleteConversation(conversationId: string): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            return this._foundation.services.appMessaging.deleteConversation(conversationId)
                .then(() => {
                    return this._config.conversationStore.deleteConversation(conversationId);
                })
                .then(() => {
                    return this._config.conversationStore.deleteConversationMessages(conversationId);
                });
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

        let getMessagesResult: IGetMessagesResponse;

        let messages: IChatMessage[];

        return this._foundation.services.appMessaging.getMessages(conversation.id, this._config.messagePageSize, conversation.continuationToken)
            .then(result => {
                getMessagesResult = result;
                // update conversation object
                // add the messages (after adapting IConversationMessage => IChatMessage)

                messages = getMessagesResult.messages.map(message => {
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
                    return this._config.conversationStore.createMessage(message);
                });
            })
            .then(() => {
                conversation.earliestLocalEventId = getMessagesResult.earliestEventId;

                // getMessagesResult.latestEventId refers to the latest id in that block.
                // DONT overwrite this once it has been set !!!
                if (conversation.latestLocalEventId === undefined) {
                    conversation.latestLocalEventId = getMessagesResult.latestEventId;
                }

                conversation.continuationToken = getMessagesResult.continuationToken;
                return this._config.conversationStore.updateConversation(conversation);
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
     * Method to compare what is local and what is remote and determine what conversations need adding and removing
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
     * Keep getting pages of events and applying them onto the store until we hit the end ...
     * @param conversation 
     */
    private updateConversationWithEvents(conversation: IChatConversation) {
        let self = this;
        let _events: IConversationMessageEvent[];

        let _getPageOfEventsFunc: DoUntilOperationFunction = function (conv: IChatConversation): Promise<any> {

            return self._foundation.services.appMessaging.getConversationEvents(conv.id, conv.latestLocalEventId + 1, self._config.eventPageSize)
                .then(events => {
                    _events = events;
                    return Utils.eachSeries(events, (event: IConversationMessageEvent) => {
                        return self.applyConversationMessageEvent(event);
                        // result of the last operation flows int the then below...
                    }).then((result) => {
                        // want the eventId of the last one
                        conv.latestLocalEventId = _events[_events.length - 1].conversationEventId;
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
                return _events.length === self._config.eventPageSize;
            } else {
                return false;
            }
        };

        return Utils.doUntil(_getPageOfEventsFunc, _compareFunc, conversation)
            .then((conv: IChatConversation) => {
                return this._config.conversationStore.updateConversation(conv);
            });
    }

    /**
     * Update a conversation by applying new events to the conversation store.
     * New events will be queried in pages and applied until we get all unseen events.
     * Any logical decision regarding whether this conversation is too out of date to be refreshed in this way are not dealt with here.
     * @param {IChatConversation} conversation
     */
    private synchronizeConversation(conversation: IChatConversation): Promise<boolean> {

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
            let gap = conversation.latestRemoteEventId - (conversation.latestLocalEventId + 1);

            // get events and apply
            if (gap < this._config.maxEventGap) {
                console.log(`Updating Conversation ${conversation.id} with events ...`);
                return this.updateConversationWithEvents(conversation);
            } else {
                // ReloadConversation
                console.log(`Conversation ${conversation.id} too out of date, reloading last page of messages ...`);
                return this._config.conversationStore.deleteConversationMessages(conversation.id)
                    .then(result => {

                        conversation.continuationToken = -1;
                        conversation.earliestLocalEventId = undefined;
                        conversation.latestLocalEventId = undefined;

                        return this._config.conversationStore.updateConversation(conversation);
                    })
                    .then(result => {
                        return this.getMessages(conversation);
                    });
            }
        }
    }

    /**
     * Method to apply an event to the conversation store
     * @param {IConversationMessageEvent} event - the event to apply
     * @returns {Promise<boolean>} - returns a boolean result inside a Promise
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

                return this._config.conversationStore.createMessage(message);

            case "conversationMessage.delivered":
            case "conversationMessage.read":
                let splitResult = event.name.split(".");
                let statusUpdate = <IMessageStatusUpdatePayload>event.payload;

                return this._config.conversationStore.updateMessageStatus(statusUpdate.conversationId,
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
     * @returns {Promise<boolean>} - returns a boolean result inside a Promise
     */
    private applyConversationMessageEvent(event: IConversationMessageEvent): Promise<boolean> {

        let _chatConversation: IChatConversation;

        return this._config.conversationStore.getConversation(event.conversationId)
            .then(chatConversation => {

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

                if (_chatConversation.latestLocalEventId === undefined) {
                    _chatConversation.latestLocalEventId = event.conversationEventId;
                }

                if (event.conversationEventId > _chatConversation.latestLocalEventId) {
                    _chatConversation.latestLocalEventId = event.conversationEventId;
                }

                return this._config.conversationStore.updateConversation(_chatConversation);
            });
    }

    /**
     * handle the event if we are idle (and listening), otherwise cache it ...
     */
    private onConversationMessageEvent(event: IConversationMessageEvent) {
        return this._mutex.runExclusive(() => {
            // check for a gap ...
            return this._config.conversationStore.getConversation(event.conversationId)
                .then(conversation => {
                    if (conversation !== null) {
                        let gap = event.conversationEventId - (conversation.latestLocalEventId + 1);
                        if (gap > 0) {
                            // gap needs filling 
                            if (gap < this._config.maxEventGap) {
                                // FillGap
                                return this.updateConversationWithEvents(conversation);
                            } else {
                                // ReloadConversation
                                return this._config.conversationStore.deleteConversationMessages(event.conversationId)
                                    .then(result => {

                                        conversation.continuationToken = -1;
                                        conversation.earliestLocalEventId = undefined;
                                        conversation.latestLocalEventId = undefined;
                                        conversation.latestRemoteEventId = event.conversationEventId;

                                        return this._config.conversationStore.updateConversation(conversation);
                                    })
                                    .then(result => {
                                        return this.getMessages(conversation);
                                    });
                            }
                        } else {
                            // ApplyEvent
                            return this._onConversationMessageEvent(event);
                        }
                    } else {
                        // ApplyEvent
                        return this._onConversationMessageEvent(event);
                    }
                });
        });
    }

    /**
     * Event handler to handle incoming Conversation Message events
     * @param {IConversationMessageEvent} event 
     */
    private _onConversationMessageEvent(event: IConversationMessageEvent): Promise<boolean> {
        console.log("onConversationMessageEvent", event);
        return this.applyConversationMessageEvent(event)
            .then(updated => {

                let payload: IMessageSentPayload = (<IMessageSentPayload>event.payload);
                let currentUser = this._foundation.session && this._foundation.session.profileId || undefined;

                // if it was a message sent, send a delivered (unless I sent it!) ...
                if (event.name === "conversationMessage.sent" && payload.context && payload.context.from && payload.context.from.id !== currentUser) {
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
        return this._mutex.runExclusive(() => {
            console.log("onConversationDeleted");
            return this._config.conversationStore.deleteConversation(event.conversationId);
        });
    }

    /**
     * Event handler to handle incoming Conversation Updated events
     * @param {IConversationUpdatedEventData} event 
     */
    private onConversationUpdated(event: IConversationUpdatedEventData): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            console.log("onConversationUpdated");

            return this._config.conversationStore.getConversation(event.conversationId)
                .then(conversation => {

                    conversation.name = event.name;
                    conversation.description = event.description;
                    conversation.roles = event.roles;
                    conversation.isPublic = event.isPublic;
                    conversation.eTag = event.eTag;
                    // TODO: not sure this is correct ...
                    conversation.lastMessageTimestamp = event.timestamp;

                    return this._config.conversationStore.updateConversation(conversation);
                });
        });
    }

    /**
     * Get a conversation from rest api and load in last page of messages
     * due to a secondary store being in use, the conversation may not exist when trying
     * to query it off the back of a onParticipantAdded event - hence the retry logic ...
     * @param conversationId 
     */
    private initialiseConversation(conversationId: string, depth: number = 0): Promise<IChatConversation> {
        let _conversation: IChatConversation;

        return this._foundation.services.appMessaging.getConversation(conversationId)
            .then(remoteConversation => {
                _conversation = this.mapConversation(remoteConversation);
                return this._config.conversationStore.createConversation(_conversation);
            })
            .then(result => {
                return this.getMessages(_conversation);
            })
            .then(result => {
                return _conversation;
            })
            .catch(error => {
                // TODO: Consider moving this functionality into foundation ...
                if (error.statusCode === 404 && depth < this._config.getConversationMaxRetry) {
                    // sleep and recurse configurable 

                    return new Promise((resolve, reject) => {
                        setTimeout(function () { resolve(); }, this._config.getConversationSleepTimeout);
                    })
                        .then(() => {
                            return this.initialiseConversation(conversationId, ++depth);
                        });

                } else {
                    throw error;
                }
            });
    }

    /**
     * Event handler to handle incoming Participant Added events
     * @param {IParticipantAddedEventData} event 
     */
    private onParticipantAdded(event: IParticipantAddedEventData): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            console.log("onParticipantAdded");

            let currentUser = this._foundation.session && this._foundation.session.profileId || undefined;

            // if this is me, need to add the conversation ...
            if (event.profileId === currentUser) {

                // If this client created the conversation, we will have already stored it off the back of the rest call.
                // check it isn't in the store already and if not initialise it
                return this._config.conversationStore.getConversation(event.conversationId)
                    .then(conversation => {
                        return conversation === null ?
                            this.initialiseConversation(event.conversationId)
                            : conversation;
                    })
                    .then(conversation => {
                        return conversation !== null;
                    });

            } else {
                return Promise.resolve(false);
            }
        });
    }

    /**
     * Event handler to handle incoming Participant Removed events
     * @param {IParticipantRemovedEventData} event 
     */
    private onParticipantRemoved(event: IParticipantRemovedEventData): Promise<boolean> {
        return this._mutex.runExclusive(() => {
            console.log("onParticipantRemoved");

            let currentUser = this._foundation.session && this._foundation.session.profileId || undefined;

            // if this is me, need to add the conversation ...
            if (event.profileId === currentUser) {
                return this._config.conversationStore.deleteConversation(event.conversationId);
            } else {
                return Promise.resolve(false);
            }
        });

    }
}
