import {
    IConversationMessage,
    IConversationDetails
} from "../../src/interfaces";



/**
 * Conversation plus some additional necessary fieds
 */
export interface IChatConversation extends IConversationDetails {
    earliestEventId?: number;
    latestEventId?: number;
    continuationToken?: number;
}
/**
 * 
 */
export interface IConversationStore {

    getConversations(): Promise<IChatConversation[]>;

    getConversation(conversationId: string): Promise<IChatConversation>;
    createConversation(conversation: IChatConversation): Promise<boolean>;
    updateConversation(conversation: IChatConversation): Promise<boolean>;
    deleteConversation(conversationId: string): Promise<boolean>;

    // sdk calls this to see whether it needs to update / add the new message 
    getMessage(conversationId: string, messageId: string): Promise<IConversationMessage>;
    // read / delivered info has been added, hand back to client to store ...
    updateStatuses(conversationId: string, messageId: string, statusUdates: any): Promise<boolean>;
    // new message added 
    createMessage(message: IConversationMessage): Promise<boolean>;

}
