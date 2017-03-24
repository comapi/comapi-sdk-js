# Creating a conversation

The first thing you probably want to do is create a conversation and add some participants.
I will assume you have an initialised sdk at this point.

To create a conversation, you should use the `ConversationBuilder` class in conjunction with the `createConversation()` method.

A unique ConversationId is required to create a conversation. This is up to the integrator to provide. 
The ConversationBuilder interface will automatically create a guid for this when it is instanciated.
You can override this behaviour and specify your own id using the `withId("myCOnversationId")` method.

Note that the methods on this interface cen be chained together. See the sdk docs for a complete list of options.

## ES6 
Here is an ES6 sample

```javascript

import { ConversationBuilder } from "@comapi/foundation";

let conversation = new ConversationBuilder().withName("Support").withDescription("Support related chat").withUsers(["johnSmith", "joeBloggs"]);

sdk.services.appMessaging.createConversation(channelDetails)
    .then(conversationInfo => {
        console.log("conversation created", conversationInfo);
    })
    .catch(error => {
        fail("conversation creation failed: ", error);
    });
``` 


## Classical

```javascript
var conversation = new COMAPI.ConversationBuilder().withName("Support").withDescription("Support related chat").withUsers(["johnSmith", "joeBloggs"]);

sdk.services.appMessaging.createConversation(channelDetails)
    .then(function(conversationInfo) {
        console.log("conversation created", conversationInfo);
    })
    .catch(function(error) {
        fail("conversation creation failed: ", error);
    });
```

These samples are basically the same bar the import of `ConversationBuilder` which is available from the `COMAPI` global.



# Adding participants to a conversation

Participants can be added when the conversation is created or on the fly at a later date. To add a participant, you need to specify 2 pieces of information :

1) `profileId` - the profileId of the user to add
2) `role` - the role of the participant ["member"|"owner"]

i.e.

```javascript
    var participants = [
        {
            id: "johnSmith",
            role: "member",
        }, {
            id: "joeBloggs",
            role: "member",
        }
    ];
```



the `addParticipantsToConversation()` method takes a conversationId and an array of participant objects

```javascript
return sdk.services.appMessaging.addParticipantsToConversation(conversationInfo.id, participants)
    .then(result => {
        console.log("addMembersToConversation() succeeded", result);
    })
    .catch(error => {
        console.error("addMembersToConversation() failed", error);
    });
```



# Removing participants from a conversation

To delete a participant, you use the `deleteParticipantsFromConversation()` method. You can specify a list of users to remove.

```javascript
sdk.services.appMessaging.deleteParticipantsFromConversation(conversationInfo.id, ["joeBloggs", "johnSmith"])
    .then(result => {
        console.log("deleteParticipantsFromConversation() succeeded", result);
    })
    .catch(error => {
        console.error("deleteParticipantsFromConversation() failed", error);
    });
```


# Listing participants in a conversation

To query all the participants in a conversation, you use the `getParticipantsInConversation` method.
An array of participants is returned in the Promise result.

```javascript
sdk.services.appMessaging.getParticipantsInConversation(conversationInfo.id)
    .then(result => {
        console.log("getParticipantsInConversation() succeeded", result);
    })
    .catch(error => {
        console.error("getParticipantsInConversation() failed", error);
    });
```

# Deleting a conversation

To delete a conversation, you simpley use the `deleteConversation()` method.

```javascript
sdk.services.appMessaging.deleteConversation(conversationInfo.id)
    .then(result => {
        console.log("deleteConversation() succeeded", result);
    })
    .catch(error => {
        console.error("deleteConversation() failed", error);
    });
```

# Conversation related events

All of these methods will generate events which can be handled in your app. There is a specific [events](./websocketEvents.md) section where I will cover this in more detail particulaly in terms of event payloads. Events are especially useful when there is more than one user of your app, so all devices / users get notified of any conversation related changes.

| Event        | Details  |
| ------------- | -----:|
| conversationDeleted | The conversation has been deleted |
| conversationUndeleted | The conversation has been un-deleted |
| conversationUpdated |  The conversation has been updated (name / description changed) |
| participantAdded | A participant has been added to a conversaton |
| participantRemoved |  A participant has been removed from a conversaton |
| participantTyping |  A participant is `typing` in a conversation |
