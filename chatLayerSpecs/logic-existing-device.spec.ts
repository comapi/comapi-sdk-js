import {
    ComapiChatLogic
} from "../chatLayer/src/chatLogic";


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
                    id: "F2695C92-6FCA-4464-ABF1-C16EDB06B2F3",
                    latestSentEventId: 0,
                },
                {
                    id: "9FBC01DE-03C2-43C2-8722-8FAE729BB769",
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

            switch (conversationId) {
                case "F2695C92-6FCA-4464-ABF1-C16EDB06B2F3":
                    return Promise.resolve({
                        continuationToken: -1,
                        earliestEventId: 0,
                        latestEventId: 0,
                        messages: [{
                            id: "2EDB545D-B4A1-44DF-A5D2-5F67379F3986",
                            sentEventId: 0,
                            metadata: {},
                            context: {
                                conversationId: "F2695C92-6FCA-4464-ABF1-C16EDB06B2F3",
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
            // TODO: will need to mock some events - not sure how ???
            // throw new Error("Method not implemented.");
        }
        off(eventType: string, handler?: Function): void {
            throw new Error("Method not implemented.");
        }
        getLogs(): Promise<string> {
            throw new Error("Method not implemented.");
        }
    };

    it("should initialise", done => {

        let foundation = new MockFoundation();

        let chatLogic = new ComapiChatLogic(foundation);

        let store = new MemoryConversationStore();

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
                return store.createMessage({
                    id: "52C1315C-BD26-4A39-A316-5DB70C59E163",
                    conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                    senderId: "unitTester",
                    sentOn: new Date().toISOString(),
                    sentEventId: 1,
                    parts: [],
                });
            })
            .then(created => {
                return chatLogic.initialise(chatConfig);
            })
            .then(result => {
                expect(result).toBeDefined();
                return chatLogic.getConversations();
            })
            .then(result => {
                expect(result).toBeDefined();
                expect(result.length).toBe(2);
                return chatLogic.getConversationInfo("F2695C92-6FCA-4464-ABF1-C16EDB06B2F3");
            })
            .then(result => {
                expect(result).toBeDefined();
                return chatLogic.getPreviousMessages("F2695C92-6FCA-4464-ABF1-C16EDB06B2F3");
            })
            .then(result => {
                expect(result).toBeDefined();
                done();
            });

    });

});
