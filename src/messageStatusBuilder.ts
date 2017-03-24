import {
    IMessageStatus
} from "./interfaces";


/**
 * @class MessageStatusBuilder
 * @classdesc Class that implements MessageStatusBuilder
 */
export class MessageStatusBuilder {

    /**
     * @method MessageStatusBuilder#deliveredStatusUpdate
     * @param {String} messageId
     * @returns {IMessageStatus} - Returns Mesage status object
     */
    public deliveredStatusUpdate(messageId: string): IMessageStatus {
        return {
            messageIds: [messageId],
            status: "delivered",
            timestamp: new Date().toISOString()
        };
    }
    /**
     * @method MessageStatusBuilder#deliveredStatusUpdates
     * @param {String[]} messageIds
     * @returns {IMessageStatus} - Returns Mesage status object
     */
    public deliveredStatusUpdates(messageIds: string[]): IMessageStatus {
        return {
            messageIds: messageIds,
            status: "delivered",
            timestamp: new Date().toISOString()
        };
    }

    /**
     * @method MessageStatusBuilder#readStatusUpdate
     * @param {String} messageId
     * @returns {IMessageStatus} - Returns Mesage status object
     */
    public readStatusUpdate(messageId: string): IMessageStatus {
        return {
            messageIds: [messageId],
            status: "read",
            timestamp: new Date().toISOString()
        };
    }

    /**
     * @method MessageStatusBuilder#readStatusUpdates
     * @param {String[]} messageIds
     * @returns {IMessageStatus} - Returns Mesage status object
     */
    public readStatusUpdates(messageIds: string[]): IMessageStatus {
        return {
            messageIds: messageIds,
            status: "read",
            timestamp: new Date().toISOString()
        };
    }
}
