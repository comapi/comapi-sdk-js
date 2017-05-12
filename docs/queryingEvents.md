# Querying events

Conversations messages and their relative statuses are generated from an immutable event store. To build up a conversation, we play through the events and that is projected into an ordered list of messages. These events are available to the client either from the web-socket or from a call to `sdk.services.appMessaging.getConversationEvents()`.

The `live` web-socket events are delivered to the app in realtime and need to be applied to the local conversation message store. If the client has any gaps, they can query a range of events using `getConversationEvents()`. The event payload is the same whether it is received from the web-socket of from this api method.

To query events, we can do the following ....


```javascript
// retrieve up to 100 events from position 0
sdk.services.appMessaging.getConversationEvents("5D21F17C-B2EC-4622-848E-5A2A916953EA", 0, 100)
    .then(events => {
        console.log("getConversationEvents() succeeded", events);
    })
    .catch(error => {
        console.error("getConversationEvents() failed", error);
    });
```


# Applying events


After you have initially loaded up a conversation, it becomes your responsibility to process the incoming web-socket events / query events from `getConversationEvents()` and update the messages accordingly.

There are 3 events that may need processing depending on whether you intend to mark messages as delivered / read.

## conversationMessage.sent
This event signifies that a new message has been posted to the conversation. If this message wasn't sent by you, you should send a status update marking this message as delivered. You will also want to add this message to your local message store. You can identify the position to insert this message by looking at the sentEventId property on the messages in your message store and the conversationEventId property on the sent event. Messages should be ordered based on this sequence.

## conversationMessage.read
This event signifies that a someone has marked a message as `read`.

## conversationMessage.delivered
This event signifies that a someone has marked a message as `delivered`. Messages get automatically marked as delivered when you query messages with `sdk.services.appMessaging.getMessages()`.


```javascript
sdk.on("conversationMessageEvent", function (event) {
    
    // Check that we haven't processed this event already ....
    // when we call getMessages(), part of the response are 2 properties:
    // earliestEventId and latestEventId.
    // we need to maintain these and adjust when we query messages

    if(event.conversationEventId > earliestEventId ||
       event.conversationEventId < latestEventId){
        console.log("event already seen", event);
        return;
    }

    switch (event.name) {
        case "conversationMessage.sent":
        // add message to local conversation store 
        // also end a messageStatus update of delivered for this message
        // You can send another update of read when you display the message to the user
        break;

        case "conversationMessage.read":
        // update statusUpdates in locally stored message object (if found) to reflect message is read by event.payload.profileId
        break;

        case "conversationMessage.delivered":
        // update statusUpdates in locally stored message object (if found) to reflect message was delivered to event.payload.profileId
        break;
    }
});
```

## StatusUpdates 
Status updates are stored against a `statusUpdates` property on a message and is of the following structure. The status will either be `delivered` or `read`. if it is read, it implied to also be delivered.
```json
{
    "alex": {
        "status": "read",
        "on": "2016-10-19T11:52:29.704Z"
    },
    "dave": {
        "status": "delivered",
        "on": "2016-10-19T11:00:29.704Z"
    },
}
```



# IGetMessagesResponse
```javascript
export interface IGetMessagesResponse {
    continuationToken?: number;
    earliestEventId?: number;
    latestEventId?: number;
    messages: IConversationMessage[];
}
```