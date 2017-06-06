import {
    // IComapiConfig,
    // IConversationRoles,
    IMessagePart,
    IConversationParticipant
} from "../../src/interfaces";


export interface IStatusUpdates {
    [profileId: string]: {
        status: string;
        on: string;
    };
}

/**
 * 
 */
export interface IChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    sentOn: string;
    sentEventId: number;
    metadata?: any;
    parts: IMessagePart[];
    statusUpdates?: IStatusUpdates;
}

/**
 * 
 */
export interface IChatConversation {
    id: string;
    name: string;
    description?: string;
    roles: any;
    isPublic: boolean;

    // remove optional and use -1 to mean the same thing ..
    earliestLocalEventId?: number;
    latestLocalEventId?: number;

    latestRemoteEventId?: number;

    //// can I remove ?
    continuationToken?: number;
    eTag?: string;
    lastMessageTimestamp?: string;
}

/**
 * Aggregate of all entities needed to render a detail view
 */
export interface IChatInfo {
    conversation: IChatConversation;
    messages?: IChatMessage[];
    participants?: IConversationParticipant[];
}


/**
 * 
 */
export interface IComapiChatConfig {
    conversationStore: IConversationStore;
    eventPageSize: number;
    messagePageSize: number;
    lazyLoadThreshold: number;
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
    deleteConversationMessages(conversationId: string): Promise<boolean>;


    reset(): Promise<boolean>;
    // sdk calls this to see whether it needs to update / add the new message 
    getMessage(conversationId: string, messageId: string): Promise<IChatMessage>;
    // read / delivered info has been added, hand back to client to store ...
    updateMessageStatus(conversationId: string, messageId: string, profileId: string, status: string, timestamp: string): Promise<boolean>;
    // getMessageStatus(conversationId: string, messageId: string): Promise<boolean>;

    // new message added 
    createMessage(message: IChatMessage): Promise<boolean>;

    getMessages(conversationId: string): Promise<IChatMessage[]>;

    // TODO: Participants need syncing too

}





export interface IChatLogic {
    /**
     * 
     */
    initialise(config: IComapiChatConfig): Promise<boolean>;
    /**
     * 
     */
    synchronize(): Promise<boolean>;
    /**
     * 
     */
    getPreviousMessages(conversationId: string): Promise<boolean>;
}
