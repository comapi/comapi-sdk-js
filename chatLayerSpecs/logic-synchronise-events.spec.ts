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
 * This test emulates an existing device that is out of sync - conversation will synchronise and update with events:
 * - on startup, call to IAppMessaging.getConversations() will reveal a gap that will be filled by loadng a few pages of events.
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
            throw new Error("Method not implemented.");
        }
        getConversations(scope?: ConversationScope, profileId?: string): Promise<IConversationDetails2[]> {
            // need to return with latestSentEventId set so that chat logic decides to sync ...
            return Promise.resolve([{
                id: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                name: "Conversation 1",
                roles: undefined,
                isPublic: false,
                _createdOn: new Date().toISOString(),
                _updatedOn: new Date().toISOString(),
                latestSentEventId: 20
            }]);
        }
        getConversationEvents(conversationId: string, from: number, limit: number): Promise<IConversationMessageEvent[]> {
            return Promise.resolve([
                {
                    conversationEventId: 1,
                    conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                    eventId: "F4184777-CCFE-4433-B95E-3D876012F05F",
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
        }
        sendMessageToConversation(conversationId: string, message: IConversationMessage): Promise<ISendMessageResult> {
            throw new Error("Method not implemented.");
        }
        sendMessageStatusUpdates(conversationId: string, statuses: IMessageStatus[]): Promise<any> {
            throw new Error("Method not implemented.");
        }
        getMessages(conversationId: string, pageSize: number, continuationToken?: number): Promise<IGetMessagesResponse> {
            throw new Error("Method not implemented.");
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

        store.createConversation({
            id: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
            name: "Conversation 1",
            roles: undefined,
            isPublic: false,
            continuationToken: -1,
            earliestLocalEventId: 0,
            latestLocalEventId: 0
        })
            .then(result => {
                // Need at least one  message in there already, otherwise it wont use events to refresh ...
                return store.createMessage({
                    id: "4D319AE5-6434-4CF1-9F31-EFADC178745F",
                    conversationId: "D35A13DF-6876-4CC8-BA70-841B45A0003C",
                    senderId: "unitTester",
                    sentOn: new Date().toISOString(),
                    sentEventId: 0,
                    parts: [],
                });
            })
            .then(result => {
                return chatClient._initialise(foundation, chatConfig)
            })
            .then(result => {
                expect(result).toBeDefined();
                return chatClient.messaging.getConversations();
            })
            .then(result => {
                expect(result).toBeDefined();


                // check we have updated correctly
                done();

            });
    });

});
