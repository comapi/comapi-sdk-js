
import {
    IChatConversation,
    IChatMessage,
    IConversationStore,
} from "../interfaces/chatLayer";


/**
 * 
 */
export class MemoryConversationStore implements IConversationStore {

    private conversations: IChatConversation[] = [];

    // How to store the messages ? Thats up to the integrator ...
    // will create a dictionary keyed off conversationId ...

    private messageStore: { [id: string]: IChatMessage[]; } = {};

    /**
     * 
     */
    public reset(): Promise<boolean> {
        this.conversations = [];
        this.messageStore = {};
        return Promise.resolve(true);
    }

    /**
     * 
     * @param conversationId 
     */
    public getConversation(conversationId: string): Promise<IChatConversation> {
        return new Promise((resolve, reject) => {
            resolve(this._findConversation(conversationId));
        });
    }

    /**
     * @param conversation 
     */
    public createConversation(conversation: IChatConversation): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // not going to bother checking existence in reference implementation ...
            if (this._indexOfConversation(conversation.id) === -1) {
                this.conversations.push(<IChatConversation>conversation);
                this.messageStore[conversation.id] = [];
                resolve(true);
            } else {
                reject({ message: `Conversation ${conversation.id} already exists` });
            }
        });
    }

    /**
     * @param conversation 
     */
    public updateConversation(conversation: IChatConversation): Promise<boolean> {

        console.log("%c updateConversation', 'background: #222; color: #bada55", conversation);

        return new Promise((resolve, reject) => {

            let found = this._findConversation(conversation.id);

            if (found) {
                found.name = conversation.name;
                found.description = conversation.description;
                found.roles = conversation.roles;
                found.isPublic = conversation.isPublic;
                found.earliestLocalEventId = conversation.earliestLocalEventId;
                found.latestLocalEventId = conversation.latestLocalEventId;
                found.continuationToken = conversation.continuationToken;

                resolve(true);
            } else {
                reject({ message: `Conversation ${conversation.id} not found` });
            }
        });
    }

    /**
     * @param conversation 
     */
    public deleteConversation(conversationId: string): Promise<boolean> {

        return new Promise((resolve, reject) => {
            let index = this._indexOfConversation(conversationId);
            if (index >= 0) {
                this.conversations.splice(index, 1);

                // crater all messages too
                this.messageStore[conversationId] = undefined;

                resolve(true);
            } else {
                reject({ message: `Conversation ${conversationId} not found` });
            }
        });
    }

    /**
     * 
     * @param conversationId 
     * @param messageId 
     */
    public getMessage(conversationId: string, messageId: string): Promise<IChatMessage> {
        return new Promise((resolve, reject) => {
            resolve(this._findMessage(conversationId, messageId));
        });
    }

    /**
     * 
     * @param message 
     */
    public updateMessageStatus(conversationId: string, messageId: string, profileId: string, status: string, timestamp: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            let message = this._findMessage(conversationId, messageId);

            if (message) {
                // if we get delivered and read out of order, dont overwrite "read" with delivered 
                if (message.statusUpdates &&
                    message.statusUpdates[profileId] &&
                    message.statusUpdates[profileId].status === "read") {
                    console.log("<-- updateMessageStatus(false)");
                    resolve(false);
                } else {

                    if (!message.statusUpdates) {
                        message.statusUpdates = {};
                    }

                    message.statusUpdates[profileId] = {
                        status,
                        on: timestamp
                    };
                    console.log("<-- updateMessageStatus(true)");
                    resolve(true);
                }
            } else {
                reject({ message: `Message ${messageId} not found in conversation ${conversationId}` });
            }
        });
    }

    /**
     * 
     * @param message 
     */
    public createMessage(message: IChatMessage): Promise<boolean> {
        return new Promise((resolve, reject) => {

            // check for dupes
            if (this._findMessage(message.conversationId, message.id) === null) {
                // messages are ordered by sentEventId
                // iterate backwards to see where to insert (will 99% prob be just on the end)
                // UNLESS we are backfilling where it is prob going to be the beginning ...
                // may be better off just appending and sorting ???

                let conversationMessages: IChatMessage[] = this.messageStore[message.conversationId];

                if (conversationMessages) {

                    let position: number = /*conversationMessages.length*/0; // lets default to the beginning ..
                    for (let i = conversationMessages.length - 1; i >= 0; i--) {
                        let _message = conversationMessages[i];

                        if (_message.sentEventId < message.sentEventId) {
                            position = i + 1;
                            break;
                        }
                    }

                    conversationMessages.splice(position, 0, message);
                    resolve(true);

                } else {
                    reject({ message: `Conversation ${message.conversationId} not found in messageStore` });
                }
            } else {
                console.warn("Message already in store", message);
                resolve(false);
            }
        });
    }

    /**
     * 
     */
    public getConversations(): Promise<IChatConversation[]> {
        return Promise.resolve(this.conversations);
    }

    /**
     * Method for app to use
     */
    public getMessages(conversationId: string): Promise<IChatMessage[]> {
        let conversationMessages: IChatMessage[] = this.messageStore[conversationId];
        return Promise.resolve(conversationMessages ? conversationMessages : []);
    }

    /**
     * @param conversationId 
     */
    private _findConversation(conversationId: string): IChatConversation {
        let result: IChatConversation[] = this.conversations.filter(x => x.id === conversationId);
        return result.length === 1 ? result[0] : null;
    }


    /**
     * @param conversationId 
     */
    private _indexOfConversation(conversationId: string): number {
        return this.conversations.map(function (c) { return c.id; }).indexOf(conversationId);
    }

    /**
     * 
     * @param conversationId 
     * @param messageId 
     */
    private _findMessage(conversationId: string, messageId: string): IChatMessage {
        let conversationMessages: IChatMessage[] = this.messageStore[conversationId];

        if (conversationMessages) {
            let message: IChatMessage[] = conversationMessages.filter(x => x.id === messageId);
            // return message.length === 1 ? message[0] : null;
            if (message.length === 1) {
                return message[0];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

}
