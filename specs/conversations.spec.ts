import { Config } from "./config";
import { Foundation } from "../src/foundation";
import { IComapiConfig, IConversationDetails, IConversationParticipant, ConversationScope } from "../src/interfaces";

/**
 * 
 */
describe("Conversations tests", () => {

    var foundation: Foundation;

    /**
     * 
     */
    var comapiConfig: IComapiConfig = {
        apiSpaceId: undefined,
        authChallenge: Config.authChallenge,
        isTypingOffTimeout: 1,
        isTypingTimeout: 1,
        logRetentionHours: 1,
        urlBase: Config.getUrlBase(),
        webSocketBase: Config.getWebSocketBase(),
    };

    /**
     * 
     */
    var conversationDetails: IConversationDetails = {
        id: undefined,
        isPublic: false,
        name: "My Test Conversation",
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

    console.log("onversationDetails:", conversationDetails);


    /**
     * 
     */
    var members: IConversationParticipant[] = [
        {
            id: "member1",
            role: "member",
        }, {
            id: "member2",
            role: "member",
        }, {
            id: "member3",
            role: "member",
        }, {
            id: "member4",
            role: "member",
        },
    ];

    beforeAll(done => {

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
    var originalTimeout;

    beforeEach(done => {

        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

        localStorage.removeItem("comapi.session");
        localStorage.removeItem("comapi.deviceId");

        conversationDetails.id = Config.uuid();

        Foundation.initialise(comapiConfig)
            .then(result => {
                foundation = result;
                return foundation.startSession();
            })
            .then(sessionInfo => {
                console.log("session started", sessionInfo);
                done();
            })
            .catch(error => {
                fail("beforeEach failed");
            });
    });

    /**
     * 
     */
    afterEach(done => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

        foundation.endSession()
            .then(() => {
                console.log("session ended");
                done();
            }).catch(error => {
                fail("endSession failed: " + JSON.stringify(error));
            });
    });

    /**
     * 
     */
    it("should create & delete a conversation", done => {

        console.log("Creating a conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                console.log("createConversation()", result);
                expect(result.id).toBe(conversationDetails.id);
                expect(result.ETag).toBeDefined();

                return foundation.services.appMessaging.deleteConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("deleteConversation()", result);
                done();
            })
            .catch(error => {
                fail(error);
            });

    });

    /**
     * 
     */
    it("should create & update a conversation with correct eTag", done => {

        console.log("Creating a conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                console.log("createConversation()", result);
                expect(result.id).toBe(conversationDetails.id);
                expect(result.ETag).toBeDefined();

                var copy = JSON.parse(JSON.stringify(conversationDetails));

                copy.name = "My Updated Test Conversation";

                return foundation.services.appMessaging.updateConversation(copy, result.ETag);
            })
            .then(result => {
                console.log("updateConversation()", result);
                expect(result.name).toBe("My Updated Test Conversation");
                return foundation.services.appMessaging.deleteConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("deleteConversation()", result);
                done();
            })
            .catch(error => {
                fail(error);
            });

    });


    /**
     * 
     */
    it("should fail to update a conversation with wrong eTag", done => {

        console.log("Creating a conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                console.log("createConversation()", result);
                expect(result.id).toBe(conversationDetails.id);
                expect(result.ETag).toBeDefined();

                var copy = JSON.parse(JSON.stringify(conversationDetails));

                copy.name = "My Updated Test Conversation";

                return new Promise((resolve, reject) => {
                    foundation.services.appMessaging.updateConversation(copy, "wrong!!!")
                        .catch(error => {
                            console.error("updateConversation()", error);
                            expect(error.statusCode).toBe(412);
                            resolve(true);
                        });

                });
            })
            .then(result => {
                return foundation.services.appMessaging.deleteConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("deleteConversation()", result);
                done();
            })
            .catch(error => {
                fail(error);
            });

    });



    /**
     * 
     */
    it("should query for list of Conversation", done => {

        console.log("Creating a Conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                console.log("createConversation()", result);
                expect(result.id).toBe(conversationDetails.id);
                expect(result.ETag).toBeDefined();

                return foundation.services.appMessaging.getConversations(ConversationScope.public, "stevanl");
            })
            .then(result => {
                console.log("getConversations()", result);
                expect(result.length).toBeGreaterThan(0);

                return foundation.services.appMessaging.deleteConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("deleteConversation()", result);
                done();
            })
            .catch(error => {
                fail(error);
            });

    });


    /**
     * 
     */
    it("should query for specific Conversation", done => {

        console.log("Creating a Conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                console.log("createConversation()", result);
                expect(result.id).toBe(conversationDetails.id);
                expect(result.ETag).toBeDefined();

                return foundation.services.appMessaging.getConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("getConversation()", result);
                expect(result.id).toBe(conversationDetails.id);

                return foundation.services.appMessaging.deleteConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("deleteConversation()", result);
                done();
            })
            .catch(error => {
                fail(error);
            });

    });

    /**
     * 
     */
    it("should fail querying for invalid Conversation", done => {

        foundation.services.appMessaging.getConversation(conversationDetails.id)
            .catch(error => {
                console.log("createConversation()", error);
                expect(error.statusCode).toBe(404);
                done();
            });
    });

    /**
     * 
     */
    it("should add / remove members to / from a Conversation", done => {
        console.log("Creating a Conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                console.log("createConversation()", result);
                expect(result.id).toBe(conversationDetails.id);
                expect(result.ETag).toBeDefined();

                return foundation.services.appMessaging.addParticipantsToConversation(conversationDetails.id, members);
            })
            .then(result => {
                console.log("addMembersToConversation()", result);
                return foundation.services.appMessaging.getParticipantsInConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("getMembersInConversation()", result);
                expect(result.length).toBe(5);

                return foundation.services.appMessaging.deleteParticipantsFromConversation(conversationDetails.id, ["member1", "member2", "member3", "member4"]);
            })
            .then(result => {
                console.log("deleteMembersFromConversation()", result);
                return foundation.services.appMessaging.getParticipantsInConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("getMembersInConversation()", result);
                expect(result.length).toBe(1);

                return foundation.services.appMessaging.deleteConversation(conversationDetails.id);
            })
            .then(result => {
                console.log("deleteConversation()", result);
                done();
            })
            .catch(error => {
                fail(error);
            });
    });

    /**
     * Typing indicators should only actually get send every x seconds ...
     */
    it("should send typing idicators correctly", done => {
        console.log("Creating a conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                return foundation.services.appMessaging.sendIsTyping(conversationDetails.id);
            })
            .then(sent1 => {
                expect(sent1).toBeTruthy();
                return foundation.services.appMessaging.sendIsTyping(conversationDetails.id);
            })
            .then(sent2 => {
                expect(sent2).toBeFalsy();
                setTimeout(() => {
                    return foundation.services.appMessaging.sendIsTyping(conversationDetails.id)
                        .then(sent3 => {
                            expect(sent3).toBeTruthy();
                            done();
                        });
                }, 1500);
            })
            .catch(error => {
                fail(error);
            });
    });

    /**
     * Typing off indicators should only actually get send every x seconds ...
     */
    it("should send typing Off idicators correctly", done => {
        console.log("Creating a conversation ...", conversationDetails);
        foundation.services.appMessaging.createConversation(conversationDetails)
            .then(result => {
                return foundation.services.appMessaging.sendIsTypingOff(conversationDetails.id);
            })
            .then(sent1 => {
                expect(sent1).toBeTruthy();
                return foundation.services.appMessaging.sendIsTypingOff(conversationDetails.id);
            })
            .then(sent2 => {
                expect(sent2).toBeFalsy();
                setTimeout(() => {
                    return foundation.services.appMessaging.sendIsTypingOff(conversationDetails.id)
                        .then(sent3 => {
                            expect(sent3).toBeTruthy();
                            done();
                        });
                }, 1500);
            })
            .catch(error => {
                fail(error);
            });
    });

});

