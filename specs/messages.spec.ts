import { Foundation } from "../src/foundation";
import { Config } from "./config";
import {
    IConversationDetails,
    IComapiConfig,
    IMessageStatus,
    ISendMessageResult,
    IConversationMessage,
    IConversationMessageEvent
} from "../src/interfaces";


/**
 * 
 */
describe("Messaging tests", () => {

    let foundation: Foundation;

    /**
     * 
     */
    let channelDetails: IConversationDetails = {
        id: undefined,
        isPublic: false,
        name: "My Test Channel",
        roles: {
            owner: {
                canAddParticipants: true,
                canRemoveParticipants: true,
                canSend: true,
            },
            participant: {
                canAddParticipants: true,
                canRemoveParticipants: true,
                canSend: true,
            },
        },
    };

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
                // create a new UUID for the channel
                channelDetails.id = Config.uuid();
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

        let message: IConversationMessage = {
            metadata: {},
            parts: [{
                data: "hello world",
                // name: "",
                size: 12,
                type: "text/plain",
                // url: "",
            }]
        };

        let messageId: string;

        foundation.services.appMessaging.sendMessageToConversation(channelDetails.id, message)
            .then((result: ISendMessageResult) => {
                console.log("sendMessageToChannel()", result);
                expect(result.id).toBeDefined();
                messageId = result.id;

                let statusUpdate: IMessageStatus = {
                    messageIds: [messageId],
                    status: "delivered",
                    timestamp: new Date().toISOString()
                };

                return foundation.services.appMessaging.sendMessageStatusUpdates(channelDetails.id, [statusUpdate]);
            })
            .then(result => {
                console.log("sendMessageStatusUpdates()", result);
                expect(result).toBe("OK");
                return foundation.services.appMessaging.getMessages(channelDetails.id, 100);
            })
            .then((result) => {
                console.log("getMessages()", result);
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
