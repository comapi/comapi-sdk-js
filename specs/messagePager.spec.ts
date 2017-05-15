import {
    IMessageManager,
    IConversationMessage,
    ISendMessageResult,
    IConversationMessagesResult,
    IMessageStatus,
    IConversationMessageEvent,
} from "../src/interfaces";

import { MessagePager } from "../src/messagePager";
import { LocalStorageData } from "../src/localStorageData";
import { Logger } from "../src/logger";


describe("Message Pager tests", () => {

    beforeEach(() => {
        localStorage.removeItem("comapi.orphanedEevnts");
    });


    interface IResponseHandler {
        (count: number): IConversationMessagesResult;
    };

    // Use a mock message manager that will return specific payloads that we can control ... 
    class MockMessageManager implements IMessageManager {

        /**
         * 
         */
        private count: number = 0;

        /**
         * _responseHandler will return test specific responses ...
         */
        constructor(private _responseHandler?: IResponseHandler) { }

        public sendMessageToConversation(conversationId: string, message: IConversationMessage): Promise<ISendMessageResult> {
            return Promise.reject<ISendMessageResult>({ message: "not implemented" });
        }

        public getConversationMessages(conversation: string, limit: number, from?: number): Promise<IConversationMessagesResult> {
            return Promise.resolve(this._responseHandler(this.count++));
        }

        public sendMessageStatusUpdates(conversation: string, statuses: IMessageStatus[]): Promise<any> {
            return Promise.resolve("OK");
        }

        public getConversationEvents(conversation: string, from: number, limit: number): Promise<IConversationMessageEvent[]> {
            return Promise.reject<IConversationMessageEvent[]>({ message: "not implemented" });
        }
    }

    /**
     * Pass in an invalid continuation token
     */
    it("should fail correttly and reset orphaned event cache with an invalid continuation token", done => {

        let messagePager: MessagePager = new MessagePager(new Logger(), new LocalStorageData(), new MockMessageManager());

        messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 100, 13434324)
            .then(result => {
                fail("Should not resolve");
            })
            .catch(error => {
                expect(error.message).toBeDefined();
                done();
            });
    });

    /**
     * Pass in an invalid continuation token
     */
    it("should fail correttly when end is hit", done => {

        let messagePager: MessagePager = new MessagePager(new Logger(), new LocalStorageData(), new MockMessageManager());

        messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 100, 0)
            .then(result => {
                fail("Should not resolve");
            })
            .catch(error => {
                expect(error.message).toBeDefined();
                done();
            });
    });


    /**
     * Iterate over until we get all messages and then check them ...
     * TODO: check the ordering is correct
     */
    it("should get an entire conversation in pages", done => {

        /**
         * Assumptions...
         *  -   The test will call with a page size of 2
         *  -   There are 6 messages in the conversation
         *  -   
         */
        function responseHandler(page: number): IConversationMessagesResult {
            "use strict";
            switch (page) {
                case 2:
                    return <IConversationMessagesResult>{
                        earliestEventId: 0,
                        latestEventId: 1,
                        messages: <IConversationMessage[]>[{
                            "id": "38f54543-bbf9-4e02-b196-baaf3726c9b3",
                            "parts": [{ "type": "text/plain", "data": "message 0" }],
                        },
                        {
                            "id": "7F42B364-1050-49EE-8754-B8760184F6C1",
                            "parts": [{ "type": "text/plain", "data": "message 1" }],
                        }],
                        orphanedEvents: []
                    };

                case 1:
                    return <IConversationMessagesResult>{
                        earliestEventId: 2,
                        latestEventId: 3,
                        messages: <IConversationMessage[]>[{
                            "id": "7F42B364-1050-49EE-8754-B8760184F6C1",
                            "parts": [{ "type": "text/plain", "data": "message 2" }],
                        },
                        {
                            "id": "8EC65A78-83D7-4DC4-B515-0333DF28B0D6",
                            "parts": [{ "type": "text/plain", "data": "message 3" }],
                        }],
                        orphanedEvents: []
                    };

                case 0:
                    return <IConversationMessagesResult>{
                        earliestEventId: 4,
                        latestEventId: 5,
                        messages: <IConversationMessage[]>[{
                            "id": "CF6B26AD-AFA2-4C3D-B60F-94B1FD9778EC",
                            "parts": [{ "type": "text/plain", "data": "message 4" }],
                        },
                        {
                            "id": "96872AEF-B927-4997-9F1C-4FE627418232",
                            "parts": [{ "type": "text/plain", "data": "message 5" }],
                        }],
                        orphanedEvents: []
                    };

                default:
                    console.error("Something has gone wrong");
                    break;
            }

        }

        let messagePager: MessagePager = new MessagePager(new Logger(), new LocalStorageData(), new MockMessageManager(responseHandler));

        messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 2)
            .then(result1 => {
                expect(result1.messages.length).toBe(2);
                messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 2, result1.continuationToken)
                    .then(getMessagesResponse => {
                        expect(getMessagesResponse.messages.length).toBe(2);
                        messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 2, getMessagesResponse.continuationToken)
                            .then(result3 => {
                                expect(result3.messages.length).toBe(2);
                                done();
                            });
                    });
            });
    });


    /**
     * 
     */
    it("should correctly mark messages as delivered", done => {

        function responseHandler(page: number): IConversationMessagesResult {
            "use strict";
            return <IConversationMessagesResult>{
                earliestEventId: 0,
                latestEventId: 5,
                messages: <IConversationMessage[]>[{
                    "id": "38f54543-bbf9-4e02-b196-baaf3726c9b3",
                    "parts": [{ "type": "text/plain", "data": "message 0" }],
                    "context": { "from": { "id": "notMe" } }
                },
                {
                    "id": "7F42B364-1050-49EE-8754-B8760184F6C1",
                    "parts": [{ "type": "text/plain", "data": "message 1" }],
                    "context": { "from": { "id": "notMe" } }
                },
                {
                    "id": "7F42B364-1050-49EE-8754-B8760184F6C1",
                    "parts": [{ "type": "text/plain", "data": "message 2" }],
                    "context": { "from": { "id": "notMe" } }
                },
                {
                    "id": "8EC65A78-83D7-4DC4-B515-0333DF28B0D6",
                    "parts": [{ "type": "text/plain", "data": "message 3" }],
                    "context": { "from": { "id": "notMe" } }
                },
                {
                    "id": "CF6B26AD-AFA2-4C3D-B60F-94B1FD9778EC",
                    "parts": [{ "type": "text/plain", "data": "message 4" }],
                    "context": { "from": { "id": "notMe" } }
                },
                {
                    "id": "96872AEF-B927-4997-9F1C-4FE627418232",
                    "parts": [{ "type": "text/plain", "data": "message 5" }],
                    "context": { "from": { "id": "notMe" } }
                }
                ],
                orphanedEvents: []
            };
        }

        let messagePager: MessagePager = new MessagePager(new Logger(), new LocalStorageData(), new MockMessageManager(responseHandler));

        messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 10)
            .then(result => {
                return messagePager.markMessagesAsDelivered("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", result.messages, "me");
            })
            .then(result => {
                expect(result).toBe("OK");
                done();
            });
    });

    /**
     * Iterate over until we get all messages and then check them ...
     * TODO: check the ordering is correct
     */
    it("should get an entire conversation in pages containing orphaned events", done => {

        /**
         * Assumptions...
         *  -   The test will call with a page size of 2
         *  -   There are 6 messages in the conversation
         *  -   
         */
        function responseHandler(page: number): IConversationMessagesResult {
            "use strict";
            switch (page) {
                case 2:
                    return <IConversationMessagesResult>{
                        earliestEventId: 0,
                        latestEventId: 1,
                        messages: <IConversationMessage[]>[{
                            "id": "38f54543-bbf9-4e02-b196-baaf3726c9b3",
                            "parts": [{ "type": "text/plain", "data": "message 0" }],
                            "statusUpdates": {}
                        },
                        {
                            "id": "7F42B364-1050-49EE-8754-B8760184F6C1",
                            "parts": [{ "type": "text/plain", "data": "message 1" }],
                            "statusUpdates": {}
                        }],
                        orphanedEvents: []
                    };

                case 1:
                    return <IConversationMessagesResult>{
                        earliestEventId: 2,
                        latestEventId: 3,
                        messages: <IConversationMessage[]>[{
                            "id": "7F42B364-1050-49EE-8754-B8760184F6C1",
                            "parts": [{ "type": "text/plain", "data": "message 2" }],
                            "statusUpdates": {}
                        },
                        {
                            "id": "8EC65A78-83D7-4DC4-B515-0333DF28B0D6",
                            "parts": [{ "type": "text/plain", "data": "message 3" }],
                            "statusUpdates": {}
                        }],
                        orphanedEvents: []
                    };

                case 0:
                    return <IConversationMessagesResult>{
                        earliestEventId: 6,
                        latestEventId: 7,
                        messages: <IConversationMessage[]>[{
                            "id": "CF6B26AD-AFA2-4C3D-B60F-94B1FD9778EC",
                            "parts": [{ "type": "text/plain", "data": "message 4" }],
                            "statusUpdates": {}
                        },
                        {
                            "id": "96872AEF-B927-4997-9F1C-4FE627418232",
                            "parts": [{ "type": "text/plain", "data": "message 5" }],
                            "statusUpdates": {}
                        }],
                        orphanedEvents: [
                            {
                                "id": 4,
                                "data": {
                                    "name": "read",
                                    "payload": {
                                        "messageId": "8EC65A78-83D7-4DC4-B515-0333DF28B0D6",
                                        "conversationId": "3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4",
                                        "isPublicConversation": false,
                                        "profileId": "alex",
                                        "timestamp": "2016-11-08T12:48:53.088Z"
                                    },
                                    "eventId": "8605dbd1-6a10-4405-8966-1eb7dfaefea4",
                                    "profileId": "alex"
                                }
                            },
                            {
                                "id": 5,
                                "data": {
                                    "name": "delivered",
                                    "payload": {
                                        "messageId": "8EC65A78-83D7-4DC4-B515-0333DF28B0D6",
                                        "conversationId": "3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4",
                                        "isPublicConversation": false,
                                        "profileId": "alex",
                                        "timestamp": "2016-11-08T12:48:53.088Z"
                                    },
                                    "eventId": "8605dbd1-6a10-4405-8966-1eb7dfaefea4",
                                    "profileId": "alex"
                                }
                            }
                        ]
                    };

                default:
                    console.error("Something has gone wrong");
                    break;
            }

        }

        let messagePager: MessagePager = new MessagePager(new Logger(), new LocalStorageData(), new MockMessageManager(responseHandler));

        messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 2)
            .then(result1 => {
                expect(result1.messages.length).toBe(2);
                messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 2, result1.continuationToken)
                    .then(getMessagesResponse => {
                        expect(getMessagesResponse.messages.length).toBe(2);

                        expect(getMessagesResponse.messages[1].id).toBe("8EC65A78-83D7-4DC4-B515-0333DF28B0D6");
                        // expect 8EC65A78-83D7-4DC4-B515-0333DF28B0D6 to be read
                        expect(getMessagesResponse.messages[1].statusUpdates.alex).toBeDefined();
                        expect(getMessagesResponse.messages[1].statusUpdates.alex.status).toBe("read");

                        messagePager.getMessages("3F404B9B-1651-4D8D-A0D1-D7C2A0BDD5F4", 2, getMessagesResponse.continuationToken)
                            .then(result3 => {
                                expect(result3.messages.length).toBe(2);
                                done();
                            });
                    });
            });
    });

});




