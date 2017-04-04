# Query a list of conversations

This is how you would query for  list of ALL conversations that a user is a member of ...

```javascript
sdk.foundation.services.appMessaging.getConversations()
    .then(conversations => {
        console.log("getConversations() succeeded", conversations);
    })
    .catch(error => {
        console.log("getConversations() failed", error);
    })
```

There are also some optional arguments to `getConversations()`:


```javascript
/**
 * Function to get all conversations (not any messages) the user is a participant in
 * @method ConversationManager#getConversations 
 * @param {ConversationScope} [scope] - the conversation scope ["public"|"participant"]
 * @param {string} [profileId] - The profileId to search with
 * @returns {Promise} 
 */
```

# Query a specific conversation

To query the details of a specific conversation with a known conversationId, you can do the following ...

```javascript
sdk.foundation.services.appMessaging.getConversation("CA29B56B-30D6-4217-9C99-577AA7525B92")
    .then(conversation => {
        console.log("getConversation() succeeded", conversations);
    })
    .catch(error => {
        console.log("getConversation() failed", error);
    })
```