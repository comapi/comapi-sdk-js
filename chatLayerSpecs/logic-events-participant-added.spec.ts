import {
    ComapiChatClient
} from "../chatLayer/src/comapiChatClient";


import {
    IFoundation, IConversationDetails, IConversationDetails2, IConversationParticipant, ConversationScope, IConversationMessageEvent, IConversationMessage, ISendMessageResult, IMessageStatus,
    ISession, IServices, IAppMessaging, IProfile, IDevice, IChannels, IGetMessagesResponse, IComapiConfig
} from "../src/interfaces";

import { ComapiChatConfig } from "../chatLayer/src/chatConfig"


import {
    EventManager
} from "../src/eventManager";


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

            switch (conversationId) {
                case "B716C321-7025-47BA-9539-A34D69100884":
                    return Promise.resolve({
                        id: "B716C321-7025-47BA-9539-A34D69100884",
                        name: "Test Conv",
                        isPublic: false,
                    });
                default:
                    throw new Error("Method not implemented.");
            }
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
            throw new Error("Method not implemented.");
        }
        getConversations(scope?: ConversationScope, profileId?: string): Promise<IConversationDetails2[]> {
            return Promise.resolve([]);
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

            switch (conversationId) {
                case "B716C321-7025-47BA-9539-A34D69100884":
                    return Promise.resolve({
                        messages: []
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

    it("should create a conversation on receipt of a participant added event", done => {

        let foundation = new MockFoundation();

        let store = new MemoryConversationStore();

        let chatConfig = new ComapiChatConfig()
            .withStore(store)
            .withEventPageSize(10)
            .withMessagePageSize(10)
            .withLazyLoadThreshold(10)

        let chatClient = new ComapiChatClient();

        return chatClient._initialise(foundation, chatConfig)
            .then(result => {
                expect(result).toBeDefined();
                return chatClient.messaging.getConversations();
            })
            .then(result => {
                expect(result).toBeDefined();

                // trigger a participant added
                // chat layer should query for the conversation and load messages if there are any.
                // will have to set a timer to check..

                foundation.trigger("participantAdded", {
                    conversationId: "B716C321-7025-47BA-9539-A34D69100884",
                    createdBy: "unitTestUser",
                    profileId: "unitTestUser",
                });

                // write a event to 

                foundation.trigger("conversationMessageEvent", {
                    conversationEventId: 0,
                    conversationId: "B716C321-7025-47BA-9539-A34D69100884",
                    eventId: "7ABB7241-CB6C-4CE9-8850-0D3CE2955F93",
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

                    // can I get this conversation from the store ?
                    store.getConversation("B716C321-7025-47BA-9539-A34D69100884")
                        .then(conversation => {
                            expect(conversation).toBeDefined();
                            expect(conversation.id).toBe("B716C321-7025-47BA-9539-A34D69100884");
                            expect(conversation.continuationToken).not.toBeDefined();
                            expect(conversation.earliestLocalEventId).toBe(0);
                            expect(conversation.latestLocalEventId).toBe(0);
                            expect(conversation.lastMessageTimestamp).not.toBeDefined();
                            expect(conversation.latestRemoteEventId).not.toBeDefined();
                            expect(conversation.name).toBe("Test Conv");
                            return store.getMessage("B716C321-7025-47BA-9539-A34D69100884", "E8ADFCB9-F873-4AA7-8BA7-B7966B7E4E9E");
                        })
                        .then(message => {
                            expect(message.sentEventId).toBe(0);
                            expect(message.conversationId).toBe("B716C321-7025-47BA-9539-A34D69100884");
                            expect(message.id).toBe("E8ADFCB9-F873-4AA7-8BA7-B7966B7E4E9E");
                            expect(message.parts.length).toBe(1);
                            expect(message.parts[0].data).toBe("hello");
                            done();
                        });
                }, 500);

            });
    });

});
