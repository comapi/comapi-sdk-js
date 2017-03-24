# Events

Realtime events are delivered to the sdk via a websocket. These events can be subscribed to via the following methods ...

### Subscribe to an event
```javascript
sdk.on("profileUpdated", function (event) {
    console.log("profileUpdated", event);
});
```

### Unsubscribe from an event
```javascript
sdk.off("profileUpdated");
```

## Complete list of events


| Event Name | Event Payload | Description |
| ---------- | ------------- | ----------- |
| conversationDeleted | [IConversationDeletedEventData](#iconversationdeletedeventdata) |  Sent when a conversation is deleted
| conversationUndeleted | [IConversationUndeletedEventData](#iconversationundeletedeventdata) |  Sent when a conversation is undeleted
| conversationUpdated | [IConversationUpdatedEventData](#iconversationupdatedeventdata) |  Sent when a conversation is updated
| participantAdded | [IParticipantAddedEventData](#iparticipantaddedeventdata) | Sent when a participant is added to a conversation. Whan a conversation is created, this event will also fire with the owner's profileId.
| participantRemoved | [IParticipantRemovedEventData](#iparticipantremovedeventdata) |  Sent when a participant is removed to a conversation. App needs to check whether the participant is the current user and locally remove the conversation from the UI.
| participantTyping | [IParticipantTypingEventData](#iparticipanttypingeventdata) | Sent when a participant is typing in a conversation
| profileUpdated | [IProfileUpdatedEvent](#iprofileupdatedevent) | Sent when a user's profile is updated  
| conversationMessageEvent | [IConversationMessageEvent](#iconversationmessageevent) | This event is sent for all conversation message related activity. It encapsulates the `sent`, `delivered` and `read` events. It is defined like this so you can handle webocket conversation message events and events requested from  `sdk.services.appMessaging.getConversationEvents()` seamelessly.





## IConversationDeletedEventData
```javascript
export interface IConversationDeletedEventData {
    conversationId: string;
    createdBy: string;
    timestamp: string;
}      
```

## IConversationUndeletedEventData
```javascript
export interface IConversationUndeletedEventData {
    conversationId: string;
    createdBy: string;
    timestamp: string;
}      
```

## IConversationUpdatedEventData
```javascript
export interface IConversationUpdatedEventData {
    conversationId: string;
    createdBy: string;
    name: string;
    description: string;
    roles: IConversationRoles;
    isPublic: boolean;
    timestamp: string;
}      
```

## IParticipantAddedEventData
```javascript
export interface IParticipantAddedEventData {
    conversationId: string;
    createdBy: string;
    profileId: string;
    role: string;
    timestamp: string;
}
```

## IParticipantRemovedEventData
```javascript
export interface IParticipantRemovedEventData {
    conversationId: string;
    createdBy: string;
    profileId: string;
    timestamp: string;
}
```
## IParticipantTypingEventData
```javascript
export interface IParticipantTypingEventData {
    conversationId: string;
    createdBy: string;
    profileId: string;
    timestamp: string;
}
```
## IProfileUpdatedEvent
```javascript
export interface IProfileUpdatedEvent {
    eTag: string;
    profile: any;
}
```

## IConversationMessageEvent
This event encapsulates `sent`, `delivered` and `read` events.


```javascript
export interface IConversationMessageEvent {
    eventId: string;
    // name field will be ["conversationMessage.sent" | "conversationMessage.read" | "conversationMessage.delivered"]
    name: string;
    conversationId: string;
    conversationEventId: number;
    // payload will differ based on event name ...
    payload: IMessageSentPayload | IMessageStatusUpdatePayload;
}

// payload for conversationMessage.sent
export interface IMessageSentPayload {
    messageId: string;
    metadata: any;
    context: any;
    parts: IMessagePart[];
    alert: IMessageAlert;
}

// payload for conversationMessage.delivered, conversationMessage.read
export interface IMessageStatusUpdatePayload {
    messageId: string;
    conversationId: string;
    profileId: string;
    timestamp: string;
}
```
