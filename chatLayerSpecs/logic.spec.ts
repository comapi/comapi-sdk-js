import {
    ComapiChatLogic
} from "../chatLayer/src/chatLogic";


import {
    IFoundation, IConversationDetails, IConversationDetails2, IConversationParticipant, ConversationScope, IConversationMessageEvent, IConversationMessage, ISendMessageResult, IMessageStatus,
    ISession, IServices, IAppMessaging, IProfile, IDevice, IChannels, IGetMessagesResponse, IComapiConfig
} from "../src/interfaces";
import { IComapiChatConfig, IConversationStore, IChatConversation, IChatMessage } from "../chatLayer/interfaces/chatLayer";
import { ComapiChatConfig } from "../chatLayer/src/chatConfig"


/**
 * THe most basic initialisation
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

    class MockStore implements IConversationStore {
        getConversations(): Promise<IChatConversation[]> {
            return Promise.resolve([]);
        }
        getConversation(conversationId: string): Promise<IChatConversation> {
            throw new Error("Method not implemented.");
        }
        createConversation(conversation: IChatConversation): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        updateConversation(conversation: IChatConversation): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        deleteConversation(conversationId: string): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        reset(): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        getMessage(conversationId: string, messageId: string): Promise<IChatMessage> {
            throw new Error("Method not implemented.");
        }
        deleteConversationMessages(conversationId: string): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        updateMessageStatus(conversationId: string, messageId: string, profileId: string, status: string, timestamp: string): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        createMessage(message: IChatMessage): Promise<boolean> {
            throw new Error("Method not implemented.");
        }
        getMessages(conversationId: string): Promise<IChatMessage[]> {
            throw new Error("Method not implemented.");
        }

    }

    it("should initialise", done => {

        let foundation = new MockFoundation();

        let chatConfig = new ComapiChatConfig()
            .withStore(new MockStore())
            .withEventPageSize(10)
            .withMessagePageSize(10)
            .withLazyLoadThreshold(0)

        let chatLogic = new ComapiChatLogic(foundation, chatConfig);

        chatLogic.initialise(chatConfig)
            .then(result => {
                expect(result).toBeDefined();
                return chatLogic.getConversations();
            })
            .then(result => {
                expect(result).toBeDefined();
                expect(result.length).toBe(0);
                done();
            })

    });

});
