# Typescript

This library was written in typescript, hence all entities that the SDK deals with have an associated interface.

Assuming you installed the sdk via npm, you can access all of the relevant interfaces as required.

Here is a simple example showing how you would go about importing an interface ... 

```javascript
import { 
    Foundation,
    IConversationMessage
} from "@comapi/foundation"

export class MessagesHelper {

    /**
     * Method to determine whether a message has been read or not by  user
     * @param {IConversationMessage} message - the message to check
     * @param {string} profileId - the profileId to check read status against 
     */
    public static isMessageRead(message: IConversationMessage, profileId: string):boolean {
    
        var isRead = false;

        // if the message was sent by this person then skip ...
        if (message.context.from.id !== profileId) {
            // are there status updates and is ther eone for this user
            if (message.statusUpdates && message.statusUpdates[profileId]) {
                // is it read ?
                if (message.statusUpdates[profileId].status === "read") {
                    isRead = true;
                }
            }
        } else {
            // the user who wrote the message obviously read it ...
            isRead = true;
        }

        return isRead;    
    }
}
```

If you look in `node_modles/@comapi/foundation/src/interfaces.d.ts`, you will see what interfaces are available.

