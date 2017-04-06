import {
    IConversationRoles,
    IMessagePart
} from "../../src/interfaces";


/**
 * 
 */
export interface IChatConversation {
    id: string;
    name: string;
    description?: string;
    roles: IConversationRoles;
    isPublic: boolean;
    earliestEventId?: number;
    latestEventId?: number;
    continuationToken?: number;
}


/**
 * 
 */
export interface IChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    sentOn: string;
    sentEventid: number;
    metadata?: any;
    parts: IMessagePart[];
    statusUpdates: any;
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
    getMessage(conversationId: string, messageId: string): Promise<IChatMessage>;
    // read / delivered info has been added, hand back to client to store ...
    updateStatuses(conversationId: string, messageId: string, statusUdates: any): Promise<boolean>;
    // new message added 
    createMessage(message: IChatMessage): Promise<boolean>;


    // TODO: Participants need syncing too

}
