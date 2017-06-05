import {
    ComapiChatLogic
} from "../chatLayer/src/chatLogic";


import {
    IFoundation, IConversationDetails, IConversationDetails2, IConversationParticipant, ConversationScope, IConversationMessageEvent, IConversationMessage, ISendMessageResult, IMessageStatus,
    ISession, IServices, IAppMessaging, IProfile, IDevice, IChannels, IGetMessagesResponse, IComapiConfig
} from "../src/interfaces";


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

        private _eventManager = new EventManager();

        services: IServices = {
            appMessaging: new MockAppMessaging(),
            profile: null
        };
        device: IDevice;
        channels: IChannels;
        session: ISession;
        startSession(): Promise<ISession> {
            return Promise.resolve({
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
            });
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

        let chatLogic = new ComapiChatLogic(foundation);

        let store = new MemoryConversationStore();

        let chatConfig: IComapiChatConfig = {
            conversationStore: store,
            eventPageSize: 10,
            messagePageSize: 10,
            lazyLoadThreshold: 10
        };

        return chatLogic.initialise(chatConfig)
            .then(result => {
                expect(result).toBeDefined();
                return chatLogic.getConversations();
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
                    // conversationEventId: event.conversationEventId,
                    conversationId: "B716C321-7025-47BA-9539-A34D69100884",
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

                    // can I get this conversation from the store ?
                    store.getConversation("B716C321-7025-47BA-9539-A34D69100884")
                        .then(conversation => {
                            expect(conversation).toBeDefined();
                            expect(conversation.id).toBe("B716C321-7025-47BA-9539-A34D69100884");
                            return store.getMessage("B716C321-7025-47BA-9539-A34D69100884", "E8ADFCB9-F873-4AA7-8BA7-B7966B7E4E9E");
                        })
                        .then(message => {
                            expect(message.id).toBe("E8ADFCB9-F873-4AA7-8BA7-B7966B7E4E9E");

                            // trigger a participant removed and then query for the conversation - should be gone 
                            foundation.trigger("conversationDeleted", {
                                conversationId: "B716C321-7025-47BA-9539-A34D69100884",
                            });

                            setTimeout(() => {
                                store.getConversation("B716C321-7025-47BA-9539-A34D69100884")
                                    .then(conversation => {
                                        expect(conversation).toBeNull();
                                        done();
                                    });

                            }, 1000);

                        });
                }, 2000);

            });
    });

});