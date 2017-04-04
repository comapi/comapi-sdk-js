# Querying Messages 

This interface allows you to get messages from the end of the conversation one page at a time. This will allow you to implement the classic pull down to load more interface. 

This method uses a continuation token manage the paging. If you want to enumerate from the end, you don't specify a token. As part of the response, a continuation token is returned along with the messages. This is fed back in the next time we want to query for messages. If the wrong token is specified, the method will return an error and you wi have to go beck to the end of the list of messages. 


Here is the first call to the api - I have specified a conversationId and a page size of 100 ...
```javascript
//  Call the getMessages() api for the first time
sdk.services.appMessaging.getMessages("CA29B56B-30D6-4217-9C99-577AA7525B92", 100 )
    .then(response => {
        console.log("getMessages() succeeded", response);
        console.log("Here are your messages ...", response.messages);
        console.log("Here is your continuation token, store this and use the next time you call this method", response.continuationToken);        
    })
    .catch(response => {
        console.error("getMessages() failed", error);
    });
```

To query the previous page of messages, you need to feed in the continuation token that was returned the lst time you queried this conversation. The token is specific to this conversation only.

```javascript
// Call the getMessages() api for the second time
// 
sdk.services.appMessaging.getMessages("CA29B56B-30D6-4217-9C99-577AA7525B92", 100, continuationToken )
    .then(response => {
        console.log("getMessages() succeeded", response);
        console.log("Here are your messages ...", response.messages);
        console.log("Here is an updated continuation token", response.continuationToken);
    })
    .catch(response => {
        console.error("getMessages() failed", error);
    });
```

You can keep doing this until you reach the beginning of the conversation ...

When the continuation token returned is `<= 0`, you  have all the messages 


Here is the definition of the response returned via a promise from the call to `getMessages()`

```javascript
export interface IGetMessagesResponse {
    continuationToken?: number;
    earliestEventId?: number;
    latestEventId?: number;
    messages: IConversationMessage[];
}
```

The eventId's will be used later when we handle incoming events from the web-socket.



The foundation SDK doesn't deal with any kind of conversation persistence - that is up to you manage. 
You may choose to just query messages from the end of the conversation every time and not bother persisting anything. 


# Applying realtime events to conversation Messages stored locally

Whether you choose to store your messages in some database, or just in-memory you will need to deal with new events that arrive.
These events will take the form of new messages and messages getting marked as delivered / read. I will deal with this in detail in the [websocketEvents](./websocketEvents.md) section.