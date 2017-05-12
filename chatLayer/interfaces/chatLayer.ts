import {
    IConversationRoles,
    IMessagePart,
    IConversationMessageEvent
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
    sentEventId: number;
    metadata?: any;
    parts: IMessagePart[];
    // TODO: Decode on status updates structure ...
    // keep as-is or project onto an array ???
    statusUpdates?: any;
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
    updateMessageStatus(conversationId: string, messageId: string, profileId: string, status: string, timestamp: string): Promise<boolean>;
    // new message added 
    createMessage(message: IChatMessage): Promise<boolean>;
    // TODO: Participants need syncing too
}


export interface IOrphanedEventInfo {
    conversationId: string;
    continuationToken: number;
    // May add some more properties ...
}

// the events can be just stored as :IConversationMessageEvent

export interface IOrphanedEventManager {

    clearAll();
    clear(conversationId: string);
    getInfo(conversationId: string): Promise<IOrphanedEventInfo>;
    setInfo(info: IOrphanedEventInfo): Promise<boolean>;

    addOrphanedEvent(event: IConversationMessageEvent): Promise<boolean>;
    getOrphanedEvents(conversationId: string): Promise<IConversationMessageEvent>;
}
