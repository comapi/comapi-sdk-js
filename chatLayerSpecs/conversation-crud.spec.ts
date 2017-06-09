import {
    ComapiChatLogic
} from "../chatLayer/src/chatLogic";


import {
    IFoundation, IConversationDetails, IConversationDetails2, IConversationParticipant, ConversationScope, IConversationMessageEvent, IConversationMessage, ISendMessageResult, IMessageStatus,
    ISession, IServices, IAppMessaging, IProfile, IDevice, IChannels, IGetMessagesResponse, IComapiConfig
} from "../src/interfaces";

import { ComapiChatConfig } from "../chatLayer/src/chatConfig"

import {
    EventManager
} from "../src/eventManager";

import {
    Utils
} from "../src/utils";

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
        private nextEventId: number = 0;
        constructor(private _eventManager: EventManager) { }

        createConversation(conversationDetails: IConversationDetails): Promise<IConversationDetails> {
            // real sdk will trigger this 
            this.trigger("participantAdded", {
                conversationId: conversationDetails.id,
                createdBy: "unitTestUser",
                profileId: "unitTestUser",
                role: undefined,
                timestamp: new Date().toISOString()
            });
            // real sdk will return this + some extra fields that we dont care about ...
            return Promise.resolve(conversationDetails);
        }
        updateConversation(conversationDetails: IConversationDetails, eTag?: string): Promise<IConversationDetails2> {
            throw new Error("Method not implemented.");
        }
        getConversation(conversationId: string): Promise<IConversationDetails2> {
            switch (conversationId) {
                case "51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3":
                    return Promise.resolve({
                        id: "51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3",
                        name: "Crud Test",
                        roles: undefined,
                        isPublic: false
                    });

                default:
                    throw new Error("Method not implemented.");
            }

        }
        deleteConversation(conversationId: string): Promise<boolean> {
            return Promise.resolve(true);
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
            // chat layer will insert ...
            return Promise.resolve({
                id: Utils.uuid(),
                eventId: ++this.nextEventId
            });
        }
        sendMessageStatusUpdates(conversationId: string, statuses: IMessageStatus[]): Promise<any> {
            throw new Error("Method not implemented.");
        }
        getMessages(conversationId: string, pageSize: number, continuationToken?: number): Promise<IGetMessagesResponse> {

            switch (conversationId) {
                case "51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3":
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

        // use this to mock events ;-)
        trigger(eventType: string, data: any) {
            this._eventManager.publishLocalEvent(eventType, data);
        }

    };

    class MockFoundation implements IFoundation {

        constructor(private _eventManager: EventManager) {

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

        services: IServices = {
            appMessaging: new MockAppMessaging(this._eventManager),
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

    it("should perform crud operations", done => {

        let eventManager = new EventManager();

        let foundation = new MockFoundation(eventManager);

        let store = new MemoryConversationStore();

        let chatConfig = new ComapiChatConfig()
            .withStore(store)
            .withEventPageSize(10)
            .withMessagePageSize(10)
            .withLazyLoadThreshold(10)

        let chatLogic = new ComapiChatLogic(foundation, chatConfig);

        return chatLogic.initialise(chatConfig)
            .then(result => {
                expect(result).toBeDefined();
                return chatLogic.getConversations();
            })
            .then(result => {
                expect(result).toBeDefined();

                return chatLogic.createConversation({
                    id: "51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3",
                    name: "Crud Test",
                    roles: undefined,
                    isPublic: false
                });
            })
            .then(rslt => {
                return store.getConversation("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3");
            })
            .then(storeConv => {
                expect(storeConv).not.toBeNull();
                expect(storeConv.id).toBe("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3");
                expect(storeConv.earliestLocalEventId).not.toBeDefined();
                expect(storeConv.latestLocalEventId).not.toBeDefined();
                expect(storeConv.continuationToken).not.toBeDefined();
                expect(storeConv.latestRemoteEventId).not.toBeDefined();
                return chatLogic.sendMessage("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3", "hello");
            })
            .then(rslt => {
                expect(rslt).toBeTruthy();
                return store.getMessages("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3");
            })
            .then(messages => {
                expect(messages.length).toBe(1);
                expect(messages[0].conversationId).toBe("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3");
                expect(messages[0].parts).toBeDefined();
                expect(messages[0].parts.length).toBe(1);
                expect(messages[0].parts[0].data).toBe("hello");
                return chatLogic.deleteConversation("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3");
            })
            .then(rslt => {
                return store.getConversation("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3");
            })
            .then(storeConv => {
                expect(storeConv).toBeNull();
                return store.getMessages("51E4CF4A-F6FC-4343-A6AF-F7DCD01BE3A3");
            })
            .then(messages => {
                expect(messages.length).toBe(0);
                done();
            });
    });

});
