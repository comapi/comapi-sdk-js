# Sending a message

## Basic plain text message

The next thing that you are going to want to do is send a message to your newly created conversation.

You can use the `MessageBuilder` interface to build your message. This abstracts away the complexities of JSON formatting.

The simplest message that can be sent is plain text, so lets start with that ...

### ES6
```javascript
import { MessageBuilder } from "@comapi/foundation"

let message = new MessageBuilder().withText("Hello world");

sdk.services.appMessaging.sendMessageToConversation(channelDetails.id, message)
    .then(result => {
        console.log("sendMessageToConversation() succeeded", result);
    })
    .catch(error => {
        console.error("sendMessageToConversation() failed", result);
    });
```

### Classic
```javascript
var message = new COMAPI.MessageBuilder().withText("Hello world");

sdk.services.appMessaging.sendMessageToConversation(channelDetails.id, message)
    .then(function(result){
        console.log("sendMessageToConversation() succeeded", result);
    })
    .catch(function(error){
        console.error("sendMessageToConversation() failed", result);
    });
```

## Message parts

A message in Comapi messaging consists of an array of message parts. In the above sample, there was a single part of type `text/plain`. You can have as many parts as you like and each part can be of the format of your choosing. The underlying structure of a message part is as follows (all the properties are optional - you can use as you see fit):

```javascript
export interface IMessagePart {
    /**
     * The message part name
     */
    name?: string;
    /**
     * The message Part Type
     */
    type?: string;
    /**
     * The message URL
     */
    url?: string;
    /**
     * Te message data
     */
    data?: string;
    /**
     * The size of the data 
     */
    size?: number;
}
```

There are 2 helper methods available to allow more complex parts to be added:

### withData

Here we will create a message with 2 parts, the first part being plain text, the second being an image attachment.
Note that the data type field is completely up to the integrator to use as they see fit. I have just adopted Mime types for these samples.

```javascript

    // some data uri for an image ...
    let data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="

    let message = new MessageBuilder()
        .withText("Check out this image ...")
        .withData("image/png", data);
```

### withPart

If you woud like to manually create the parts yourself, then you can do the following 

```javascript

    let textPart = {
        data: "Check out this image ...",
        type: "text/plain",
        size: 24 // Note:  size is optional, use as required
    };

    let imagePart = {        
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
        type: "image/png",
    };

    let message = new MessageBuilder()
        .withPart(textPart)
        .withPart(imagePart);

```


## Push Notifications

If you woud like to have a push notification sent with the message, you can specify a generic message for both FCM & APNS and further customise the platform specific payloads ...

### Generic settings

```javascript
    let message = new MessageBuilder()
        .withText("Hello world")
        .withPush("Hi there");
```

### Platform Specific overrides

```javascript

let apnsAlert = {
    badge: 1,
    sound: "ping.aiff",
    alert: "hello"
};

let fcmAlert = {
    notification: {
        body: ";-)",
        title: "hello"
    }
};    

let message = new MessageBuilder()
    .withText("Hello world")
    .withPush("Hi there")
    .withFcmAlert(fcmAlert)
    .withApnsAlert(apnsAlert);

```

## Metadata

You can also send some metadata along with the message. This can be any object.

```javascript
let message = new MessageBuilder()
    .withText("Hello world")
    .withMetadata({prop1: "val1", prop2: 2});
```



# Events

| Event        | Details  |
| ------------- | -----:|
| conversationMessage.sent | A message has been sent to the conversation |
| conversationMessage.delivered | A participant has marked a message as delivered |
| conversationMessage.read | A participant has marked a message as read |
