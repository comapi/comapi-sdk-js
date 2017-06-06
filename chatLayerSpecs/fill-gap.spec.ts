import {
    ComapiChatLogic
} from "../chatLayer/src/chatLogic";

import {
    EventManager
} from "../src/eventManager";

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

            switch (conversationId) {

                case "D35A13DF-6876-4CC8-BA70-841B45A0003C":
                    return Promise.resolve([
                        {
                            conversationEventId: 1,
                            conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                            eventId: "F4184777-CCFE-4433-B95E-3D876012F05F",
                            name: "conversationMessage.sent",
                            payload: {
                                alert: undefined,
                                context: {},
                                messageId: "EF567174-CFFD-4FCD-A1DF-48F2A00369DC",
                                metadata: undefined,
                                parts: [{ data: "hello" }],
                            }

                        },
                        {
                            conversationEventId: 2,
                            conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                            eventId: "31F850A7-9951-4B18-BD42-D45092E365FF",
                            name: "conversationMessage.sent",
                            payload: {
                                alert: undefined,
                                context: {},
                                messageId: "E8ADFCB9-F873-4AA7-8BA7-B7966B7E4E9E",
                                metadata: undefined,
                                parts: [{ data: "hello" }],
                            }

                        },
                    ]);

                default:
                    throw new Error("Method not implemented.");

            }
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

        constructor(private _eventManager: EventManager, private _appMessaging: IAppMessaging) { }

        services: IServices = {
            appMessaging: this._appMessaging,
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

    it("should initialise", done => {

        let _eventManager = new EventManager();
        let _appMessaging = new MockAppMessaging();

        let foundation = new MockFoundation(_eventManager, _appMessaging);

        let chatLogic = new ComapiChatLogic(foundation);

        let store = new MemoryConversationStore();

        spyOn(_appMessaging, "getConversationEvents").and.callThrough();;

        let chatConfig: IComapiChatConfig = {
            conversationStore: store,
            eventPageSize: 10,
            messagePageSize: 10,
            lazyLoadThreshold: 10
        };


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
                return chatLogic.initialise(chatConfig);
            })
            .then(result => {
                expect(result).toBeDefined();

                // trigger a conversation Message event that looks like a gap ...
                foundation.trigger("conversationMessageEvent", {
                    conversationEventId: 2,
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

                    expect(_appMessaging.getConversationEvents).toHaveBeenCalledWith("D35A13DF-6876-4CC8-BA70-841B45A0003C", 1, 10);

                    return store.getConversation("D35A13DF-6876-4CC8-BA70-841B45A0003C")
                        .then(conversation => {
                            expect(conversation.earliestLocalEventId).toBe(0);
                            expect(conversation.latestLocalEventId).toBe(2);
                            return store.getMessages("D35A13DF-6876-4CC8-BA70-841B45A0003C");
                        })
                        .then(messages => {
                            expect(messages.length).toBe(3);
                            expect(messages[0].id).toBe("4D319AE5-6434-4CF1-9F31-EFADC178745F");
                            expect(messages[1].id).toBe("EF567174-CFFD-4FCD-A1DF-48F2A00369DC");
                            expect(messages[2].id).toBe("E8ADFCB9-F873-4AA7-8BA7-B7966B7E4E9E");
                            done();
                        });

                }, 1000);

            });

    });

});
