import {
    IConversationMessage, IMessagePart, IMessageAlert, IApnsAlert, IFcmAlert
} from "./interfaces";


/**
 * @class MessageBuilder
 * @classdesc Class that implements MessageBuilder
 */
export class MessageBuilder implements IConversationMessage {

    public metadata: any = {};
    public parts: IMessagePart[] = [];
    public alert: IMessageAlert = undefined;

    /**
     * Method to create a simple text based message 
     * @method MessageBuilder#withText
     * @param {String} text - the text of the message
     * @returns {MessageBuilder}  - Returns reference to itself so methods can be chained
     */
    public withText(text): MessageBuilder {
        this.parts.push({
            data: text,
            size: text.length,
            type: "text/plain",
        });
        return this;
    }

    /**
     * Method to create a message containing a single data part
     * @method MessageBuilder#withData
     * @param {String} type - the type of the data i.e. `image/png`
     * @param {String} data - the data (if you want to pass binary data, then base64 encode it first)
     * @returns {MessageBuilder}  - Returns reference to itself so methods can be chained
     */
    public withData(type: string, data: string) {
        this.parts.push({
            data: data,
            size: data.length,
            type: type,
        });
        return this;
    }

    /**
     * Method to add a message part to the message. This can be called multiple times
     * @method MessageBuilder#withPart
     * @param {IMessagePart} part - the message part to add
     * @returns {MessageBuilder}  - Returns reference to itself so methods can be chained
     */
    public withPart(part: IMessagePart) {
        this.parts.push(part);
        return this;
    }

    /**
     * Method to set the generic title for a push message. It also allocates placeholders for apns and fcm info
     * @method MessageBuilder#withPush
     * @param {String} text - The title of the push message. Note call this method BEFORE `withApnsAlert()` and `withFcmAlert()`
     * @returns {MessageBuilder}  - Returns reference to itself so methods can be chained
     */
    public withPush(text) {

        this.alert = {
            "text": text,
            "platforms": {
                "apns": undefined,
                "fcm": undefined
            }
        };

        return this;
    }

    /**
     * Method to specify APNS specific push info - Note: must call `withPush()` first.
     * @method MessageBuilder#withApnsAlert
     * @param {IApnsAlert} info - the APNS speific push info 
     * @returns {MessageBuilder}  - Returns reference to itself so methods can be chained
     */
    public withApnsAlert(info: IApnsAlert) {
        // TODO: cater for incorrect usage
        this.alert.platforms.apns = info;
        return this;
    }

    /**
     * Method to specify FCM specific push info - Note: must call `withPush()` first.
     * @method MessageBuilder#withFcmAlert
     * @param {IFcmAlert} info - the FCM speific push info 
     * @returns {MessageBuilder}  - Returns reference to itself so methods can be chained
     */
    public withFcmAlert(info: IFcmAlert) {
        // TODO: cater for incorrect usage        
        this.alert.platforms.fcm = info;
        return this;
    }

    /**
     * Method to specify additional metadata to accompany the message
     * @method MessageBuilder#withMetadata
     * @param {any} metadata - the metadata.
     * @returns {MessageBuilder}  - Returns reference to itself so methods can be chained
     */
    public withMetadata(metadata: any) {
        this.metadata = metadata;
        return this;
    }
}
