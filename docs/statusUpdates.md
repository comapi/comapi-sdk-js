# Message status updates

Message status updates are sent by the application when a message is received or when the message has been read.
If you query for messags using `sdk.services.appMessaging.getMessages()`, they will be auomatically marked as `delivered`. 
It is the application's responsibility to mark New messages received from the web socket. 
It is also the application's responsibility to mark the messages as read whenever this occurrs. (This is optional functionlity)


To send a message status update, you can use the `MessageStatusBuilder` interface.

### ES6 implementation of marking a message as `delivered`
```javascript
import { MessageStatusBuilder } from "@comapi/foundation";

// Note I am using the version that takes a single messageId in this sample
let status = new MessageStatusBuilder().deliveredStatusUpdate("C984814D-B714-4DC8-8DFF-33C29082ACEA");

// we can send multiple updates of different types with this method, hence the array ...
sdk.services.appMessaging.sendMessageStatusUpdates([status]);
```

### Classical implementation of marking a message as `read`
```javascript
// Note I am using the version that takes a list of messageId's in this sample
var status = new COMAPI.MessageStatusBuilder().readStatusUpdates(["C984814D-B714-4DC8-8DFF-33C29082ACEA", "88E43FA4-9705-44F5-8DE6-4B9DD5E46DF3"]);

sdk.services.appMessaging.sendMessageStatusUpdates([status]);
```

See the API documentatin for the full list of methods avaliable. There are methods for single or multiple updates for both `read` and delivered `statuses`
