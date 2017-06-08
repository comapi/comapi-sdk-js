import { ComapiConfig } from "../../src/comapiConfig"
import { IComapiChatConfig, IConversationStore } from "../interfaces/chatLayer"

export class ComapiChatConfig extends ComapiConfig implements IComapiChatConfig {

    public conversationStore: IConversationStore;
    public eventPageSize: number = 10;
    public messagePageSize: number = 10;
    public lazyLoadThreshold: number = 1;
    public getConversationSleepTimeout: number = 1000;
    public getConversationMaxRetry: number = 3;

    /**
     * ComapiChatConfig class constructor.
     * @class ComapiChatConfig
     * @classdesc Class that implements IComapiChatConfig and extends ComapiConfig
     */
    constructor() {
        super();
        this.conversationStore = undefined;
    }

    /**
     * Function to set the Conversation Store
     * @method ComapiChatConfig#withStore
     * @param {IConversationStore} conversationStore - The conversation store 
     * @returns {ComapiChatConfig} - Returns reference to itself so methods can be chained
     */
    public withStore(conversationStore: IConversationStore) {
        this.conversationStore = conversationStore;
        return this;
    }

    /**
     * Function to set the event page size
     * @method ComapiChatConfig#withEventPageSize
     * @param {number} eventPageSize - The event page size 
     * @returns {ComapiChatConfig} - Returns reference to itself so methods can be chained
     */
    public withEventPageSize(eventPageSize: number) {
        this.eventPageSize = eventPageSize;
        return this;
    }

    /**
     * Function to set the message Page Size
     * @method ComapiChatConfig#withMessagePageSize
     * @param {number} messagePageSize - The message page size 
     * @returns {ComapiChatConfig} - Returns reference to itself so methods can be chained
     */
    public withMessagePageSize(messagePageSize: number) {
        this.messagePageSize = messagePageSize;
        return this;
    }


    /**
     * Function to set the lazy load threshold
     * @method ComapiChatConfig#withLazyLoadThreshold
     * @param {number} lazyLoadThreshold - The lazy Load Threshold
     * @returns {ComapiChatConfig} - Returns reference to itself so methods can be chained
     */
    public withLazyLoadThreshold(lazyLoadThreshold: number) {
        this.lazyLoadThreshold = lazyLoadThreshold;
        return this;
    }


}