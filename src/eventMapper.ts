import { injectable } from "inversify";


import {
    IEventMapper,
    IConversationDeletedEventData,
    IConversationUndeletedEventData,
    IConversationUpdatedEventData,
    IParticipantAddedEventData,
    IParticipantRemovedEventData,
    IParticipantTypingEventData,
    IParticipantTypingOffEventData,
    IConversationMessageEvent,
    IProfileUpdatedEvent
} from "./interfaces";

@injectable()
export class EventMapper implements IEventMapper {

    public conversationDeleted(event: any): IConversationDeletedEventData {
        return {
            conversationId: event.conversationId,
            createdBy: event.context.createdBy,
            timestamp: event.publishedOn,
        };
    }

    public conversationUndeleted(event: any): IConversationUndeletedEventData {
        return {
            conversationId: event.conversationId,
            createdBy: event.context.createdBy,
            timestamp: event.publishedOn,
        };
    }

    public conversationUpdated(event: any): IConversationUpdatedEventData {
        return {
            conversationId: event.conversationId,
            // the user who updated the conversation
            createdBy: event.context.createdBy,
            description: event.payload.description,
            eTag: event.etag,
            isPublic: event.payload.isPublic,
            name: event.payload.name,
            roles: event.payload.roles,
            timestamp: event.publishedOn,
        };
    }

    public participantAdded(event: any): IParticipantAddedEventData {
        return {
            conversationId: event.conversationId,
            createdBy: event.context.createdBy,
            profileId: event.payload.profileId,
            role: event.payload.role,
            timestamp: event.publishedOn,
        };
    }

    public participantRemoved(event: any): IParticipantRemovedEventData {
        return {
            conversationId: event.conversationId,
            createdBy: event.context.createdBy,
            profileId: event.payload.profileId,
            timestamp: event.publishedOn,
        };
    }

    public participantTyping(event: any): IParticipantTypingEventData {
        return {
            conversationId: event.payload.conversationId,
            createdBy: event.context.createdBy,
            profileId: event.payload.profileId,
            timestamp: event.publishedOn,
        };
    }

    public participantTypingOff(event: any): IParticipantTypingOffEventData {
        return {
            conversationId: event.payload.conversationId,
            createdBy: event.context.createdBy,
            profileId: event.payload.profileId,
            timestamp: event.publishedOn,
        };
    }

    public conversationMessageSent(event: any): IConversationMessageEvent {
        return {
            conversationEventId: event.conversationEventId,
            conversationId: event.payload.context.conversationId,
            eventId: event.eventId,
            name: "conversationMessage.sent",
            payload: {
                alert: event.payload.alert,
                context: event.payload.context,
                messageId: event.payload.messageId,
                metadata: event.payload.metadata,
                parts: event.payload.parts,
            }
        };
    }

    public conversationMessageRead(event: any): IConversationMessageEvent {
        return {
            conversationEventId: event.conversationEventId,
            conversationId: event.payload.conversationId,
            eventId: event.eventId,
            name: "conversationMessage.read",
            payload: {
                conversationId: event.payload.conversationId,
                messageId: event.payload.messageId,
                profileId: event.payload.profileId,
                timestamp: event.payload.timestamp
            }
        };
    }

    public conversationMessageDelivered(event: any): IConversationMessageEvent {
        return {
            conversationEventId: event.conversationEventId,
            conversationId: event.payload.conversationId,
            eventId: event.eventId,
            name: "conversationMessage.delivered",
            payload: {
                conversationId: event.payload.conversationId,
                messageId: event.payload.messageId,
                profileId: event.payload.profileId,
                timestamp: event.payload.timestamp
            }
        };
    }

    public profileUpdated(event: any): IProfileUpdatedEvent {
        return {
            eTag: event.eTag,
            profile: event.payload
        };
    }
}
