import {
    IMessagePart,
    IApnsAlert,
    IFcmAlert
} from "../src/interfaces";

import { ConversationBuilder } from "../src/conversationBuilder";
import { MessageBuilder } from "../src/messageBuilder";
import { MessageStatusBuilder } from "../src/messageStatusBuilder";


describe("Builder tests", () => {

    let regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    /**
     * 
     */
    it("should build an IConversationDetails object", done => {

        let conversation = new ConversationBuilder().withName("name").withDescription("description").withUsers(["participant1", "participant2", "participant3"]);

        expect(conversation.id).toBeDefined();

        expect(conversation.name).toBe("name");
        expect(conversation.description).toBe("description");

        done();
    });

    /**
     * 
     */
    it("should build an IConversationDetails object using minimal options", done => {

        let conversation = new ConversationBuilder();

        expect(conversation.id).toBeDefined();

        expect(regexGuid.test(conversation.id)).toBeTruthy();

        done();
    });

    /**
     * 
     */
    it("should build an IConversationDetails object with user and priviledges", done => {

        let conversation = new ConversationBuilder()
            .withId("1234")
            .withName("test name")
            .withDescription("test description")
            .withUser("fred")
            .withOwnerPrivelages({
                "canSend": true,
                "canAddParticipants": true,
                "canRemoveParticipants": true
            })
            .withParticipantPrivelages({
                "canSend": true,
                "canAddParticipants": true,
                "canRemoveParticipants": true
            });

        expect(conversation.id).toBe("1234");

        expect(conversation.name).toBe("test name");
        expect(conversation.description).toBe("test description");
        expect(conversation.participants.length).toBe(1);

        done();
    });



    /**
     * 
     */
    it("should build an IConversationMessage object using all options", done => {

        let part: IMessagePart = {
            data: "alert('hello')",
            size: 14,
            type: "application/x-javascript",
        };

        let apnsAlert: IApnsAlert = {
            "badge": 1,
            "sound": "ping.aiff",
            "alert": "hello"
        };

        let fcmAlert: IFcmAlert = {
            notification: {
                body: ";-)",
                title: "hello"
            }
        };

        let message = new MessageBuilder()
            .withText("this is a text message")
            .withData("text/html", "<h1>This is some html</h1>")
            .withPart(part)
            .withPush("Push Title")
            .withApnsAlert(apnsAlert)
            .withFcmAlert(fcmAlert);

        expect(message.parts.length).toBe(3);

        done();
    });


    /*
     * 
     */
    it("should build an IMessageStatus object", done => {

        let status1 = new MessageStatusBuilder().deliveredStatusUpdate("C984814D-B714-4DC8-8DFF-33C29082ACEA");

        expect(status1.messageIds.length).toBe(1);

        let status2 = new MessageStatusBuilder().deliveredStatusUpdates(["C984814D-B714-4DC8-8DFF-33C29082ACEA", "007D58E7-6A6D-4EF5-ABA7-4B475D91FAC5"]);

        expect(status2.messageIds.length).toBe(2);

        done();
    });

});
