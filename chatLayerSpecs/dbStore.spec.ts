import {
    IndexedDBConversationStore
} from "../chatLayer/src/dbStore";

import {
    IChatConversation
} from "../chatLayer/interfaces/chatLayer";


import { ConversationBuilder } from "../src/conversationBuilder";
import { MessageBuilder } from "../src/messageBuilder";
import { Utils } from "../src/utils";

import { IConversationMessage } from "../src/interfaces"

/**
 * 
 */
describe("IndexedDBConversationStore tests", () => {

    function createMessage(conversationId: string, sentEventid: number): IConversationMessage {
        let message = new MessageBuilder().withText("hello");
        message.context = { conversationId: conversationId };
        message.sentEventid = sentEventid;
        message.id = Utils.uuid();
        return message;
    }

    let conversationStore: IndexedDBConversationStore;

    beforeEach(done => {
        conversationStore = new IndexedDBConversationStore();

        conversationStore.initialise()
            .then(succeeded => {
                done();
            });
    });

    afterEach(done => {
        conversationStore.emptyDatabase()
            .then(succeeded => {
                done();
            });
    });


    it("should create a Conversation and return succeeded", done => {
        let conversation = new ConversationBuilder().withName("Test Conversation #1");
        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                done();
            });
    });


    it("should fail if try to create a Conversation that already exists", done => {
        let conversation = new ConversationBuilder().withName("Test Conversation #1");
        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();

                conversationStore.createConversation(conversation)
                    .catch(error => {
                        expect(error.message).toBeDefined();
                        done();
                    });

            });
    });

    it("should create a Conversation and allow it to be queried with getConversation", done => {
        let id: string = "myConversationId";
        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);
        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();

                conversationStore.getConversation(id)
                    .then(conversation => {
                        expect(conversation.id).toBe(id);
                        done();
                    });
            });
    });


    it("should create a Conversation and allow it to be queried with getConversations", done => {
        let id: string = "myConversationId";
        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);
        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();

                conversationStore.getConversations()
                    .then(conversations => {
                        expect(conversations.length).toBe(1);
                        expect(conversations[0].id).toBe(id);
                        done();
                    });
            });
    });


    it("should create a Conversation and allow it to be updated", done => {
        let id: string = "myConversationId";
        let desc: string = "updated the desc";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);
        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();

                conversation.description = desc;

                conversationStore.updateConversation(conversation)
                    .then(succeeded => {
                        expect(succeeded).toBeTruthy();

                        conversationStore.getConversation(id)
                            .then(conversation => {
                                expect(conversation.description).toBe(desc);
                                done();
                            });
                    });
            });
    });

    it("should fail if try to update a Conversation that doesn't exist", done => {
        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);

        conversationStore.updateConversation(conversation)
            .catch(error => {
                expect(error.message).toBeDefined();
                done();
            });
    });

    it("should create a Conversation and allow it to be deleted", done => {
        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);
        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();

                conversationStore.deleteConversation(id)
                    .then(succeeded => {
                        expect(succeeded).toBeTruthy();

                        conversationStore.getConversation(id)
                            .then(conversation => {
                                expect(conversation).toBe(null);
                                done();
                            });
                    });
            });
    });

    it("should fail to delete a conversation that doesn't exist", done => {
        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);

        conversationStore.deleteConversation(id)
            .catch(error => {
                expect(error.message).toBeDefined();
                done();
            });
    });


    it("should fail add a message to a conversation that doesn't exist", done => {
        let id: string = "myConversationId";
        let message = new MessageBuilder().withText("hello");

        message.context = { conversationId: id };

        conversationStore.createMessage(message)
            .catch(error => {
                expect(error.message).toBeDefined();
                done();
            });
    });

    it("should add messages to a conversation", done => {

        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);

        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();

                let message1 = createMessage(id, 1);
                let message2 = createMessage(id, 2);
                let message3 = createMessage(id, 3);

                conversationStore.createMessage(message1)
                    .then(succeeded => {
                        return conversationStore.createMessage(message3);
                    })
                    .then(succeeded => {
                        return conversationStore.createMessage(message2);
                    })
                    .then(succeeded => {
                        return conversationStore.getMessages(id)
                    })
                    .then(messages => {
                        expect(messages.length).toBe(3);
                        expect(messages[0].sentEventid).toBe(1);
                        expect(messages[1].sentEventid).toBe(2);
                        expect(messages[2].sentEventid).toBe(3);
                        done();
                    })
            });
    });

    it("should add messages to a conversation and get them by messageId", done => {

        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);

        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();

                let message1 = createMessage(id, 1);
                let message2 = createMessage(id, 2);
                let message3 = createMessage(id, 3);

                conversationStore.createMessage(message1)
                    .then(succeeded => {
                        return conversationStore.createMessage(message2);
                    })
                    .then(succeeded => {
                        return conversationStore.createMessage(message3);
                    })
                    .then(succeeded => {
                        return conversationStore.getMessage(conversation.id, message2.id);
                    })
                    .then(mesage => {
                        expect(mesage.sentEventid).toBe(2);
                        done();
                    });
            });
    });

    it("should retun null if message in conversation doesnt eist", done => {

        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);

        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                return conversationStore.getMessage(conversation.id, "???");
            })
            .then(mesage => {
                expect(mesage).toBe(null);
                done();
            });
    });

    it("should allow status updates to a message", done => {
        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);

        let message1 = createMessage(id, 1);

        let statusUpdate = {
            "alex": {
                "status": "read",
                "on": "2016-10-19T11:52:29.704Z"
            }
        };

        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                return conversationStore.createMessage(message1);
            })
            .then(succeeded => {
                return conversationStore.updateStatuses(id, message1.id, statusUpdate);
            })
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                return conversationStore.getMessage(conversation.id, message1.id);
            })
            .then(message => {
                expect(message).toBeTruthy();
                expect(message.statusUpdates).toEqual(statusUpdate);
                done();
            });
    });

    it("should fail if attempting to apply status updates to an unknown message", done => {
        let id: string = "myConversationId";

        let conversation = new ConversationBuilder().withName("Test Conversation #1").withId(id);

        let statusUpdate = {
            "alex": {
                "status": "read",
                "on": "2016-10-19T11:52:29.704Z"
            }
        };

        conversationStore.createConversation(conversation)
            .then(succeeded => {
                expect(succeeded).toBeTruthy();
                return conversationStore.updateStatuses(id, "???", statusUpdate);
            })
            .catch(error => {
                expect(error.message).toBeDefined();
                done();
            });
    });

});