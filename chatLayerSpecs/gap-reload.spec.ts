import {
    ComapiChatClient
} from "../chatLayer/src/comapiChatClient";

import {
    EventManager
} from "../src/eventManager";

import { ComapiChatConfig } from "../chatLayer/src/chatConfig"


import {
    IFoundation, IConversationDetails, IConversationDetails2, IConversationParticipant, ConversationScope, IConversationMessageEvent, IConversationMessage, ISendMessageResult, IMessageStatus,
    ISession, IServices, IAppMessaging, IProfile, IDevice, IChannels, IGetMessagesResponse, IComapiConfig
} from "../src/interfaces";

import { IComapiChatConfig, IConversationStore, IChatConversation, IChatMessage } from "../chatLayer/interfaces/chatLayer";

import {
    MemoryConversationStore
} from "../chatLayer/src/memoryStore";



/**
 * This test emulates an existing device that is out of sync
 * some conversations to be added, some to be removed, some to be updated
 */
describe("Chat Logic tests", () => {

    class MockAppMessaging implements IAppMessaging {
        createConversation(conversationDetails: IConversationDetails): Promise<IConversationDetails> {
            throw new Error("Method not implemented.");
        }
        updateConversation(conversationDetails: IConversationDetails, eTag?: string): Promise<IConversationDetails2> {
            throw new Error("Method not implemented.");
        }
        getConversation(conversationId: string): Promise<IConversationDetails2> {
            throw new Error("Method not implemented.");
        }
        deleteConversation(conversationId: string): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        addParticipantsToConversation(conversationId: string, participants: IConversationParticipant[]): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        deleteParticipantsFromConversation(conversationId: string, participants: string[]): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        getParticipantsInConversation(conversationId: string): Promise<IConversationParticipant[]> {
            return Promise.resolve([]);
        }
        getConversations(scope?: ConversationScope, profileId?: string): Promise<IConversationDetails2[]> {
            return Promise.resolve([
                {
                    id: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                    name: "Conversation 1",
                    roles: undefined,
                    isPublic: false,
                    _createdOn: new Date().toISOString(),
                    _updatedOn: new Date().toISOString(),
                    latestSentEventId: 0
                }
            ]);
        }
        getConversationEvents(conversationId: string, from: number, limit: number): Promise<IConversationMessageEvent[]> {
            throw new Error("Method not implemented.");
        }
        sendMessageToConversation(conversationId: string, message: IConversationMessage): Promise<ISendMessageResult> {
            throw new Error("Method not implemented.");
        }
        sendMessageStatusUpdates(conversationId: string, statuses: IMessageStatus[]): Promise<any> {
            throw new Error("Method not implemented.");
        }
        getMessages(conversationId: string, pageSize: number, continuationToken?: number): Promise<IGetMessagesResponse> {
            // This will be called when sdk syncs after deleting the local messages
            switch (conversationId) {
                case "D35A13DF-6876-4CC8-BA70-841B45A0003C":
                    return Promise.resolve({
                        continuationToken: -1,
                        earliestEventId: 200,
                        latestEventId: 200,
                        messages: [{
                            id: "2EDB545D-B4A1-44DF-A5D2-5F67379F3986",
                            sentEventId: 200,
                            metadata: {},
                            context: {
                                conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                            },
                            parts: [{
                                data: "hello",
                                type: "text/plain"
                            }],
                        }]
                    });

                default:
                    throw new Error("Method not implemented.");

            }
        }
        sendIsTyping(conversationId: string): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        sendIsTypingOff(conversationId: string): Promise<boolean> {
            throw new Error("Method not implemented.");
        }

    };

    class MockFoundation implements IFoundation {

        constructor() {
            this.session = {
                createdOn: new Date().toISOString(),
                deviceId: "2ED8EA5F-19B8-45AA-9CD1-32C517B1553B",
                expiresOn: new Date().toISOString(),
                id: "A78B9D3A-B9B4-4612-BE8A-4221A198DD62",
                isActive: true,
                platform: "Web",
                platformVersion: "1.2.3",
                profileId: "unitTestUser",
                sdkType: "SDK",
                sdkVersion: "1.2.3",
                sourceIp: "127.0.0.1",
            };
        }

        private _eventManager = new EventManager();

        services: IServices = {
            appMessaging: new MockAppMessaging(),
            profile: null
        };
        device: IDevice;
        channels: IChannels;
        session: ISession;
        startSession(): Promise<ISession> {
            return Promise.resolve(this.session);
        }
        endSession(): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        on(eventType: string, handler: Function): void {
            this._eventManager.subscribeToLocalEvent(eventType, handler);
        }

        off(eventType: string, handler?: Function): void {
            this._eventManager.unsubscribeFromLocalEvent(eventType, handler);
        }
        getLogs(): Promise<string> {
            throw new Error("Method not implemented.");
        }
        // use this to mock events ;-)
        trigger(eventType: string, data: any) {
            this._eventManager.publishLocalEvent(eventType, data);
        }
    };

    it("should reload a conversatioj if a large gap is detected", done => {

        let foundation = new MockFoundation();

        let store = new MemoryConversationStore();

        spyOn(store, "deleteConversationMessages").and.callThrough();

        let chatConfig = new ComapiChatConfig()
            .withStore(store)
            .withEventPageSize(10)
            .withMessagePageSize(10)
            .withLazyLoadThreshold(10)

        let chatClient = new ComapiChatClient();

        // populate store with some conversations and some messages ...           

        store.createConversation({
            id: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
            name: "Conversation 1",
            roles: undefined,
            isPublic: false,
            latestLocalEventId: 0,
            earliestLocalEventId: 0,
            continuationToken: -1,

        })
            .then(created => {
                return store.createMessage({
                    id: "4D319AE5-6434-4CF1-9F31-EFADC178745F",
                    conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                    senderId: "unitTester",
                    sentOn: new Date().toISOString(),
                    sentEventId: 0,
                    parts: [],
                });
            })
            .then(created => {
                return chatClient._initialise(foundation, chatConfig)
            })
            .then(result => {
                expect(result).toBeDefined();

                // trigger a conversation Message event that looks like a gap ...
                foundation.trigger("conversationMessageEvent", {
                    conversationEventId: 200,
                    conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                    // eventId: event.eventId,
                    name: "conversationMessage.sent",
                    payload: {
                        // alert: event.payload.alert,
                        // context: event.payload.context,
                        messageId: "E8ADFCB9-F873-4AA7-8BA7-B7966B7E4E9E",
                        // metadata: event.payload.metadata,
                        parts: [{ data: "hello" }],
                    }
                });

                setTimeout(() => {

                    expect(store.deleteConversationMessages).toHaveBeenCalledWith("D35A13DF-6876-4CC8-BA70-841B45A0003C");


                    // TODO: ensure conversation is reloaded
                    return store.getConversation("D35A13DF-6876-4CC8-BA70-841B45A0003C")
                        .then(conversation => {
                            expect(conversation.earliestLocalEventId).toBe(200);
                            expect(conversation.latestLocalEventId).toBe(200);
                            return store.getMessage("D35A13DF-6876-4CC8-BA70-841B45A0003C", "2EDB545D-B4A1-44DF-A5D2-5F67379F3986");
                        })
                        .then(message => {
                            expect(message).not.toBeNull();
                            done();
                        });

                }, 500);
            });

    });

});
