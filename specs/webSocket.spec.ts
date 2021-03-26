import {
    IEventManager,
    ISessionManager,
    ISessionInfo,
    IComapiConfig,
    IConversationDeletedEventData,
    IConversationUpdatedEventData,
    IParticipantRemovedEventData,
    IParticipantAddedEventData,
    IConversationMessageEvent,
    IProfileUpdatedEvent,
    IMessageStatusUpdatePayload,
    IMessageSentPayload,
    IParticipantTypingEventData,
    IParticipantTypingOffEventData
} from "../src/interfaces";

import { Config } from "./config";
import { Logger } from "../src/logger";
import { WebSocketManager } from "../src/webSocketManager";
import { EventManager } from "../src/eventManager";
import { LocalStorageData } from "../src/localStorageData";
import { EventMapper } from "../src/eventMapper";

/**
 * Currently using an actual websocket, may change to mock ...
 * http://stackoverflow.com/questions/23151954/stubbing-websocket-in-javascript-with-jasmine
 */
describe("webSocket Manager tests", () => {

    let defaultWebSocketBase = Config.getWebSocketBase();
    let eventManager: IEventManager;
    let webSocketManager: WebSocketManager;
    /**
     * Mock SessionManager - we just need getValidAuthHeader
     */
    class MockSessionManager implements ISessionManager {

        private _sessionInfo: any = {
            token: "1.2.3"
        };
        public initialise(): Promise<boolean> { return Promise.resolve(true); }
        get sessionInfo(): ISessionInfo { return this._sessionInfo; }
        public getValidToken(): Promise<string> { return Promise.resolve(this._sessionInfo.token); }
        public startSession(): Promise<ISessionInfo> { return Promise.resolve(null); }
        public endSession(): Promise<boolean> { return Promise.resolve(true); }
        public ensureSession(): Promise<ISessionInfo> { return Promise.resolve(this.sessionInfo); }
        public requestSession(): Promise<ISessionInfo> { return Promise.resolve(this.sessionInfo); }
        public removeSession() { return Promise.resolve(false); }

    }

    /**
     * 
     */
    let comapiConfig: IComapiConfig = {
        // just a random guid - we won't create an app space ...
        apiSpaceId: "7CACC97C-FC36-4744-BF1E-BA71801E4BEA",
        authChallenge: Config.authChallenge,
        logRetentionHours: 1,
        urlBase: Config.getUrlBase(),
        webSocketBase: Config.getWebSocketBase(),
    };

    /**
     * 
     */
    beforeEach(done => {

        eventManager = new EventManager();

        let data = new LocalStorageData(undefined);
        let logger = new Logger(eventManager, data);
        let sessionManager = new MockSessionManager();
        let eventMapper = new EventMapper();

        webSocketManager = new WebSocketManager(logger, data, comapiConfig, sessionManager, eventManager, eventMapper);
        /* tslint:disable:no-string-literal */
        webSocketManager["enabled"] = true;
        console.log("created new websocket for test");
        done();
    });

    /**
     * 
     */
    afterEach(done => {
        // put back the endpoint to the correct value
        comapiConfig.webSocketBase = defaultWebSocketBase;
        done();
    });

    /**
     * 
     */
    it("should connect and disconnect", done => {

        webSocketManager.connect()
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
                return webSocketManager.disconnect();
            })
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeFalsy();
                done();
            });
    });


    /**
     * 
     */
    it("should connect, connect  and disconnect", done => {

        webSocketManager.connect()
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
                return webSocketManager.connect();
            })
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
                return webSocketManager.disconnect();
            })
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeFalsy();
                done();
            });
    });

    /**
     * 
     */
    it("should connect, disconnect, connect, disconnect", done => {

        webSocketManager.connect()
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
                return webSocketManager.connect();
            })
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
                return webSocketManager.disconnect();
            })
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeFalsy();
                return webSocketManager.connect();
            })
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
                return webSocketManager.disconnect();
            })
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeFalsy();
                done();
            });
    });



    /**
     * 
     */
    it("should connect and receive some data", done => {

        eventManager.subscribeToLocalEvent("webSocketEvent", event => {
            console.log("got webSocketEvent");

            expect(event.name).toBe("socket.info");
            expect(event.context.createdBy).toBe("stevanl");

            webSocketManager.disconnect()
                .then(() => {
                    let isConnected = webSocketManager.isConnected();
                    console.log("isConnected = " + isConnected);
                    expect(isConnected).toBeFalsy();
                    done();
                });
        });

        webSocketManager.connect()
            .then(() => {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
            });
    });

    /**
     * 
     */
    it("should connect and send some data", done => {

        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on connection         
        eventManager.subscribeToLocalEvent("webSocketEvent", event => {
            seenEvent = true;
            console.log("got webSocketEvent");

            if (event.name === "socket.info") {
                webSocketManager.send({ message: "echo" });
            } else {
                expect(event.message).toBe("echo");
                webSocketManager.disconnect()
                    .then(function () {
                        let isConnected = webSocketManager.isConnected();
                        console.log("isConnected = " + isConnected);
                        expect(isConnected).toBeFalsy();
                        done();
                    });
            }
        });

        webSocketManager.connect()
            .then(function () {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeTruthy();
            });
    });


    /**
     * 
     */
    it("should generate an interval", done => {

        let interval = webSocketManager.generateInterval(100);

        expect(interval).toBeGreaterThan(0);

        expect(interval).toBeLessThan((30 * 1000) + 1);

        done();

    });


    /**
     * 
     */
    it("should fail to connect with a bad url", done => {

        comapiConfig.webSocketBase = "ws://junk";

        webSocketManager.connect()
            .then(function (connected) {
                let isConnected = webSocketManager.isConnected();
                console.log("isConnected = " + isConnected);
                expect(isConnected).toBeFalsy();
                expect(connected).toBeFalsy();
                done();
            });
    });

    /**
     * 
     */
    it("should map conversation.delete", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("conversationDeleted", (event: IConversationDeletedEventData) => {
            seenEvent = true;

            expect(event.conversationId).toBe("ad07ce73-9aab-4e1e-be6a-2d5f19473a01");
            expect(event.createdBy).toBe("stevanl");
            expect(event.timestamp).toBe("2016-10-18T11:26:23.269Z");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();
                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "a8d173c9-04a2-427c-8ffa-e6b7c41ec9cd",
                    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                    "name": "conversation.delete",
                    "payload": {
                        "date": "2016-10-18T11:26:23.264Z"
                    },
                    "context": {
                        "createdBy": "stevanl"
                    },
                    "revision": 2,
                    "conversationId": "ad07ce73-9aab-4e1e-be6a-2d5f19473a01",
                    "publishedOn": "2016-10-18T11:26:23.269Z"
                });

            });
    });

    /**
     * 
     */
    it("should map conversation.update", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("conversationUpdated", (event: IConversationUpdatedEventData) => {
            seenEvent = true;

            expect(event.conversationId).toBe("cf201df2-ffde-40ca-b975-23f01b97ecde");
            expect(event.createdBy).toBe("stevanl");
            expect(event.timestamp).toBe("2016-10-18T11:27:28.608Z");

            // the user who updated the conversation
            expect(event.name).toBe("zzzzzzc");
            expect(event.description).toBe("qqqqq");
            expect(event.isPublic).toBeFalsy();
            expect(event.roles).toEqual({
                "owner": {
                    "canSend": true,
                    "canAddParticipants": true,
                    "canRemoveParticipants": true
                },
                "participant": {
                    "canSend": true,
                    "canAddParticipants": true,
                    "canRemoveParticipants": true
                }
            });

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();
                });

        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "6b38e89a-ac07-4b35-add9-4ca458d59a10",
                    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                    "name": "conversation.update",
                    "payload": {
                        "description": "qqqqq",
                        "isPublic": false,
                        "name": "zzzzzzc",
                        "roles": {
                            "owner": {
                                "canSend": true,
                                "canAddParticipants": true,
                                "canRemoveParticipants": true
                            },
                            "participant": {
                                "canSend": true,
                                "canAddParticipants": true,
                                "canRemoveParticipants": true
                            }
                        }
                    },
                    "context": {
                        "createdBy": "stevanl"
                    },
                    "revision": 2,
                    "conversationId": "cf201df2-ffde-40ca-b975-23f01b97ecde",
                    "publishedOn": "2016-10-18T11:27:28.608Z"
                });
            });
    });

    /**
     * 
     */
    it("should map conversation.participantAdded", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("participantAdded", (event: IParticipantAddedEventData) => {
            seenEvent = true;

            expect(event.conversationId).toBe("d11bfbe9-0279-4460-a148-bce6af4f3dea");
            expect(event.createdBy).toBe("stevanl");
            expect(event.profileId).toBe("alex");
            expect(event.role).toBe("participant");
            expect(event.timestamp).toBe("2016-10-18T11:36:32.168Z");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();
                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "8e64c04d-e30c-4799-88e2-2a6e1d16443c",
                    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                    "name": "conversation.participantAdded",
                    "payload": {
                        "profileId": "alex",
                        "role": "participant",
                        "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea",
                        "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78"
                    },
                    "context": {
                        "createdBy": "stevanl"
                    },
                    "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea",
                    "publishedOn": "2016-10-18T11:36:32.168Z"
                });
            });
    });

    /**
     * 
     */
    it("should map conversation.participantRemoved", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("participantRemoved", (event: IParticipantRemovedEventData) => {
            seenEvent = true;

            expect(event.conversationId).toBe("cf201df2-ffde-40ca-b975-23f01b97ecde");
            expect(event.createdBy).toBe("stevanl");
            expect(event.profileId).toBe("alex");
            expect(event.timestamp).toBe("2016-10-18T11:35:11.206Z");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();

                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "b2cff124-e824-4c21-8102-f60dfa249744",
                    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                    "name": "conversation.participantRemoved",
                    "payload": {
                        "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                        "profileId": "alex",
                        "conversationId": "cf201df2-ffde-40ca-b975-23f01b97ecde"
                    },
                    "context": {
                        "createdBy": "stevanl"
                    },
                    "conversationId": "cf201df2-ffde-40ca-b975-23f01b97ecde",
                    "publishedOn": "2016-10-18T11:35:11.206Z"
                });
            });
    });

    it("should map conversation.participantTyping", done => {

        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("participantTyping", (event: IParticipantTypingEventData) => {
            seenEvent = true;

            expect(event.conversationId).toBe("anon_1p4l0t3.M0rsy");
            expect(event.createdBy).toBe("access:9a7d437f-6e79-4d8e-bf4d-d511d2dc84a6");
            expect(event.profileId).toBe("M0rsy");
            expect(event.timestamp).toBe("2017-04-24T07:31:41.226Z");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();

                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "1009a317-b948-4171-81d5-36107ddb1411",
                    "payload": {
                        "conversationId": "anon_1p4l0t3.M0rsy",
                        "profileId": "M0rsy"
                    },
                    "context": {
                        "createdBy": "access:9a7d437f-6e79-4d8e-bf4d-d511d2dc84a6",
                        "createdOn": "2017-04-24T07:31:41.226Z"
                    },
                    "accountId": 39694,
                    "apiSpaceId": "53364198-3f3f-4723-ab8f-70680c1113b1",
                    "name": "conversation.participantTyping",
                    "publishedOn": "2017-04-24T07:31:41.226Z"
                });
            });

    });

    it("should map conversation.participantTypingOff", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("participantTypingOff", (event: IParticipantTypingOffEventData) => {
            seenEvent = true;

            expect(event.conversationId).toBe("anon_1p4l0t3.M0rsy");
            expect(event.createdBy).toBe("access:9a7d437f-6e79-4d8e-bf4d-d511d2dc84a6");
            expect(event.profileId).toBe("M0rsy");
            expect(event.timestamp).toBe("2017-04-24T07:31:41.752Z");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();

                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "be3399de-f3c3-44d6-9766-bc12b81dab4a",
                    "payload": {
                        "conversationId": "anon_1p4l0t3.M0rsy",
                        "profileId": "M0rsy"
                    },
                    "context": {
                        "createdBy": "access:9a7d437f-6e79-4d8e-bf4d-d511d2dc84a6",
                        "createdOn": "2017-04-24T07:31:41.752Z"
                    },
                    "accountId": 39694,
                    "apiSpaceId": "53364198-3f3f-4723-ab8f-70680c1113b1",
                    "name": "conversation.participantTypingOff",
                    "publishedOn": "2017-04-24T07:31:41.752Z"
                });
            });
    });

    /**
     * 
     */
    it("should map conversationMessage.read", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("conversationMessageEvent", (event: IConversationMessageEvent) => {
            seenEvent = true;

            expect(event.conversationEventId).toBe(2);
            expect(event.conversationId).toBe("d11bfbe9-0279-4460-a148-bce6af4f3dea");
            expect(event.eventId).toBe("b8604278-da0c-4165-b7db-a7a670c7e8e0");
            expect(event.name).toBe("conversationMessage.read");

            // Different ways to reference the payload object ;-)
            let paylaod = event.payload as IMessageStatusUpdatePayload;

            expect((event.payload as IMessageStatusUpdatePayload).messageId).toBe("9a7bb0ae-803a-489c-9b94-1588e169cc04");
            expect(paylaod.conversationId).toBe("d11bfbe9-0279-4460-a148-bce6af4f3dea");
            expect((<IMessageStatusUpdatePayload>event.payload).profileId).toBe("alex");
            expect((<IMessageStatusUpdatePayload>event.payload).timestamp).toBe("2016-10-18T11:41:47.194Z");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();

                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "b8604278-da0c-4165-b7db-a7a670c7e8e0",
                    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                    "name": "conversationMessage.read",
                    "payload": {
                        "messageId": "9a7bb0ae-803a-489c-9b94-1588e169cc04",
                        "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea",
                        "profileId": "alex",
                        "timestamp": "2016-10-18T11:41:47.194Z"
                    },
                    "context": {
                        "createdBy": "alex"
                    },
                    "revision": 2,
                    "conversationEventId": 2,
                    "publishedOn": "2016-10-18T11:41:47.392Z"
                });
            });
    });


    /**
     * 
     */
    it("should map conversationMessage.delivered", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("conversationMessageEvent", (event: IConversationMessageEvent) => {
            seenEvent = true;

            expect(event.conversationEventId).toBe(1);
            expect(event.conversationId).toBe("d11bfbe9-0279-4460-a148-bce6af4f3dea");
            expect(event.eventId).toBe("94a33cb0-550d-4179-abc2-7f77f7c5bfdc");
            expect(event.name).toBe("conversationMessage.delivered");

            expect((<IMessageStatusUpdatePayload>event.payload).messageId).toBe("9a7bb0ae-803a-489c-9b94-1588e169cc04");
            expect((<IMessageStatusUpdatePayload>event.payload).conversationId).toBe("d11bfbe9-0279-4460-a148-bce6af4f3dea");
            expect((<IMessageStatusUpdatePayload>event.payload).profileId).toBe("alex");
            expect((<IMessageStatusUpdatePayload>event.payload).timestamp).toBe("2016-10-18T11:41:40.238Z");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();
                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "94a33cb0-550d-4179-abc2-7f77f7c5bfdc",
                    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                    "name": "conversationMessage.delivered",
                    "payload": {
                        "messageId": "9a7bb0ae-803a-489c-9b94-1588e169cc04",
                        "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea",
                        "profileId": "alex",
                        "timestamp": "2016-10-18T11:41:40.238Z"
                    },
                    "context": {
                        "createdBy": "alex"
                    },
                    "revision": 1,
                    "conversationEventId": 1,
                    "publishedOn": "2016-10-18T11:41:40.432Z"
                });
            });
    });

    /**
     * 
     */
    it("should map conversationMessage.sent", done => {

        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("conversationMessageEvent", (event: IConversationMessageEvent) => {
            seenEvent = true;

            expect(event.conversationEventId).toBe(3);
            expect(event.conversationId).toBe("d11bfbe9-0279-4460-a148-bce6af4f3dea");
            expect(event.eventId).toBe("dbd78ac2-faa6-426f-acf5-99d8b3e08b98");
            expect(event.name).toBe("conversationMessage.sent");

            expect((<IMessageSentPayload>event.payload).messageId).toBe("5035615c-e370-4bec-b1f5-793faa866c43");
            expect((<IMessageSentPayload>event.payload).metadata).toEqual({});
            expect((<IMessageSentPayload>event.payload).context).toEqual({
                "from": {
                    "id": "alex",
                    "name": "alex"
                },
                "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea",
                "sentBy": "alex",
                "sentOn": "2016-10-18T11:47:46.511Z"
            });
            expect((<IMessageSentPayload>event.payload).parts).toEqual([
                {
                    "name": "body",
                    "type": "text/plain",
                    "data": "hello",
                    "size": 5
                }
            ]);
            expect((<IMessageSentPayload>event.payload).alert).toEqual({
                "text": "New Message",
                "platforms": {
                    "apns": {
                        "badge": 1,
                        "sound": "ping.aiff",
                        "alert": "hello",
                        "payload": {
                            "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea"
                        }
                    },
                    "fcm": {
                        "collapse_key": "",
                        "data": {
                            "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea"
                        },
                        "notification": {
                            "title": "Paragin Chat",
                            "body": "hello"
                        }
                    }
                }
            });

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();
                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "dbd78ac2-faa6-426f-acf5-99d8b3e08b98",
                    "apiSpaceId": "f4a5894e-259a-4030-8424-1eb74306be78",
                    "name": "conversationMessage.sent",
                    "payload": {
                        "messageId": "5035615c-e370-4bec-b1f5-793faa866c43",
                        "metadata": {},
                        "context": {
                            "from": {
                                "id": "alex",
                                "name": "alex"
                            },
                            "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea",
                            "sentBy": "alex",
                            "sentOn": "2016-10-18T11:47:46.511Z"
                        },
                        "parts": [
                            {
                                "name": "body",
                                "type": "text/plain",
                                "data": "hello",
                                "size": 5
                            }
                        ],
                        "alert": {
                            "text": "New Message",
                            "platforms": {
                                "apns": {
                                    "badge": 1,
                                    "sound": "ping.aiff",
                                    "alert": "hello",
                                    "payload": {
                                        "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea"
                                    }
                                },
                                "fcm": {
                                    "collapse_key": "",
                                    "data": {
                                        "conversationId": "d11bfbe9-0279-4460-a148-bce6af4f3dea"
                                    },
                                    "notification": {
                                        "title": "Paragin Chat",
                                        "body": "hello"
                                    }
                                }
                            }
                        }
                    },
                    "context": {
                        "createdBy": "alex"
                    },
                    "revision": 3,
                    "conversationEventId": 3,
                    "publishedOn": "2016-10-18T11:47:46.514Z"
                });
            });
    });

    /**
     * 
     */
    it("should map profile.update", done => {
        let seenEvent = false;

        // wire up an event handler - the "socket service" will send some data on conection         
        eventManager.subscribeToLocalEvent("profileUpdated", (event: IProfileUpdatedEvent) => {
            seenEvent = true;

            expect(event.profile.id).toBe("stevanl");
            expect(event.profile.avatar).toBe("https://scontent.cdninstagram.com/hphotos-xfa1/t51.2885-15/e15/11312369_411970819011603_251239785_n.jpg");
            expect(event.eTag).toBe("\"1b-jOXbdoTPVPyduUDoiscQOg\"");

            webSocketManager.disconnect()
                .then(function () {
                    expect(seenEvent).toBeTruthy();
                    done();
                });
        });

        webSocketManager.connect()
            .then(function () {
                webSocketManager.send({
                    "eventId": "d327a7a2-2e38-4b46-a278-c02092bfd1b7",
                    "accountId": 39694,
                    "apiSpaceId": "3396616a-2157-4cc9-9679-77531ccc888a",
                    "name": "profile.update",
                    "payload": {
                        "id": "stevanl",
                        "avatar": "https://scontent.cdninstagram.com/hphotos-xfa1/t51.2885-15/e15/11312369_411970819011603_251239785_n.jpg"
                    },
                    "eTag": "\"1b-jOXbdoTPVPyduUDoiscQOg\"",
                    "context": {
                        "createdBy": "stevanl"
                    },
                    "revision": 14,
                    "profileId": "stevanl",
                    "publishedOn": "2017-01-26T09:26:33.356Z"
                });
            });
    });


});
