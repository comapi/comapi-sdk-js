import { Foundation } from "../src/foundation";
import { Config } from "./config";
import {
    IConversationDetails,
    IComapiConfig,
    ISendMessageResult,
    IConversationMessageEvent
} from "../src/interfaces";


import { ConversationBuilder } from "../src/conversationBuilder";
import { MessageBuilder } from "../src/messageBuilder";
import { MessageStatusBuilder } from "../src/messageStatusBuilder";

/**
 * 
 */
describe("Messaging tests", () => {

    let foundation: Foundation;

    let channelDetails: IConversationDetails;

    /**
     * 
     */
    let comapiConfig: IComapiConfig = {
        apiSpaceId: undefined,
        authChallenge: Config.authChallenge,
        logRetentionHours: 1,
        urlBase: Config.getUrlBase(),
        webSocketBase: Config.getWebSocketBase(),

    };

    beforeAll(done => {

        localStorage.removeItem("comapi.session");
        localStorage.removeItem("comapi.deviceId");

        // Create a new app space for this test ...
        Config.createAppSpace()
            .then(appSpaceId => {
                comapiConfig.apiSpaceId = appSpaceId;
                done();
            })
            .catch(error => {
                fail(error.message);
            });
    });

    /**
     * 
     */
    beforeEach(done => {

        Foundation.initialise(comapiConfig)
            .then(result => {
                foundation = result;
                return foundation.startSession();
            })
            .then(sessionInfo => {
                console.log("session started", sessionInfo);

                /**
                 * Conversation Builder in use ...
                 */
                channelDetails = new ConversationBuilder().withName("My Test Channel");

                return foundation.services.appMessaging.createConversation(channelDetails);
            })
            .then(channelInfo2 => {
                console.log("channel created", channelInfo2);
                done();
            })
            .catch(error => {
                fail("beforeEach failed: " + error.message);
            });
    });

    /**
     * 
     */
    afterEach(done => {

        foundation.services.appMessaging.deleteConversation(channelDetails.id)
            .then(() => {
                console.log("channel deleted");
                return foundation.endSession();
            })
            .then(() => {
                console.log("session ended");
                done();
            }).catch(error => {
                fail("afterEach failed: " + error.message);
            });
    });

    /**
     * 
     */
    it("should send a message and get an id back", done => {

        /**
         * Helper method to create a message (creates a IMessagePart[] with one part)
         * Notice the methods in MessageBuilder are static so no need to 'new' anything ...
         */
        let message = new MessageBuilder().withText("hello world");

        let messageId: string;

        // higher level method that takes just the chammel dets and message parts
        foundation.services.appMessaging.sendMessageToConversation(channelDetails.id, message)
            .then((result: ISendMessageResult) => {
                console.log("sendMessageToChannel()", result);
                expect(result.id).toBeDefined();
                messageId = result.id;

                /**
                 * Helper method to create a status update (creates a IMessageStatus[] with one iten)
                 * Notice the methods in MessageStatusBuider are static so no need to 'new' anything ...
                 */
                let statusUpdate = new MessageStatusBuilder().deliveredStatusUpdate(messageId);

                return foundation.services.appMessaging.sendMessageStatusUpdates(channelDetails.id, [statusUpdate]);
            })
            .then(result => {
                console.log("sendMessageStatusUpdates()", result);
                expect(result).toBe("OK");
                return foundation.services.appMessaging.getMessages(channelDetails.id, 100);
            })
            .then((result) => {
                console.log("getConversationMessages()", result);
                expect(result).toBeDefined();
                expect(result.messages).toBeDefined();
                expect(result.messages.length).toBeGreaterThan(0);
                expect(result.messages).toContain(jasmine.objectContaining({ id: messageId }));

                return foundation.services.appMessaging.getConversationEvents(channelDetails.id, 0, 100);
            })
            .then((result: IConversationMessageEvent[]) => {
                console.log("getConversationEvents()", result);
                expect(result).toBeDefined();
                expect(result.length).toBe(2);

                expect(result[0].name).toBe("conversationMessage.sent");
                expect(result[1].name).toBe("conversationMessage.delivered");
                done();
            })
            .catch(error => {
                fail(error.message);
            });
    });


    /**
     * THis is just a dupe - it is using the older sendMessageToConversation() method that takes more args ...
     */
    it("should send a message and get an id back2", done => {

        // note this one just returns a part
        let message = new MessageBuilder().withText("hello world");

        let messageId: string;

        foundation.services.appMessaging.sendMessageToConversation(channelDetails.id, message)
            .then((result: ISendMessageResult) => {
                console.log("sendMessageToChannel()", result);
                expect(result.id).toBeDefined();
                messageId = result.id;

                let statusUpdate = new MessageStatusBuilder().deliveredStatusUpdate(messageId);

                return foundation.services.appMessaging.sendMessageStatusUpdates(channelDetails.id, [statusUpdate]);
            })
            .then(result => {
                console.log("sendMessageStatusUpdates()", result);
                expect(result).toBe("OK");
                return foundation.services.appMessaging.getMessages(channelDetails.id, 100);
            })
            .then((result) => {
                console.log("getConversationMessages()", result);
                expect(result).toBeDefined();
                expect(result.messages).toBeDefined();
                expect(result.messages.length).toBeGreaterThan(0);
                expect(result.messages).toContain(jasmine.objectContaining({ id: messageId }));

                return foundation.services.appMessaging.getConversationEvents(channelDetails.id, 0, 100);
            })
            .then((result: IConversationMessageEvent[]) => {
                console.log("getConversationEvents()", result);
                expect(result).toBeDefined();
                expect(result.length).toBe(2);

                expect(result[0].name).toBe("conversationMessage.sent");
                expect(result[1].name).toBe("conversationMessage.delivered");
                done();
            })
            .catch(error => {
                fail(error.message);
            });
    });


});
