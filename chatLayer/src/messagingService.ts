import { IFoundation, IConversationParticipant } from "../../src/interfaces";
import { IComapiChatConfig, IChatConversation, IChatMessage, IChatInfo } from "../interfaces/chatLayer";

export class MessagingService {

    constructor(private _foundation: IFoundation, private _config: IComapiChatConfig) { }

    public synchronize(): Promise<boolean> {
        throw "Not implemented";
    }

    public getPreviousMessages(conversationId: string): Promise<boolean> {
        throw "Not implemented";
    }

    public getConversations(): Promise<IChatConversation[]> {
        throw "Not implemented";
    }

    public getConversationInfo(conversationId: string): Promise<IChatInfo> {
        throw "Not implemented";
    }

    public sendMessage(conversationId: string, text: string): Promise<boolean> {
        throw "Not implemented";
    }

    public markMessagesAsRead(conversationId: string, messageIds: string[]): Promise<boolean> {
        throw "Not implemented";
    }

    public markAllMessagesAsRead(conversationId: string): Promise<boolean> {
        throw "Not implemented";
    }

    public isMessageRead(message: IChatMessage, profileId?: string): boolean {
        throw "Not implemented";
    }

    public createConversation(conversation: IChatConversation): Promise<boolean> {
        throw "Not implemented";
    }

    public updateConversation(conversation: IChatConversation): Promise<boolean> {
        throw "Not implemented";
    }

    public deleteConversation(conversationId: string): Promise<boolean> {
        throw "Not implemented";
    }

    public getParticipantsInConversation(conversationId: string): Promise<IConversationParticipant[]> {
        throw "Not implemented";
    }

    public addParticipantsToConversation(conversationId: string, participants: IConversationParticipant[]): Promise<boolean> {
        throw "Not implemented";
    }
    public deleteParticipantsFromConversation(conversationId: string, participants: string[]): Promise<boolean> {
        throw "Not implemented";
    }
}
