
import {
    IMessageManager,
    IMessageStatus,
    IMessagePart,
    IMessageAlert,
    ISendMessageResult,
    IConversationManager,
    IConversationMessage,
    IConversationMessageEvent,
    IConversationMessagesResult,
    ISessionManager,
    IRestClient,
    ILogger,
    ILocalStorageData,
    IComapiConfig
} from "./interfaces";

export class MessageManager implements IMessageManager {

    /**
     * MessagesManager class constructor.
     * @class MessagesManager
     * @ignore
     * @classdesc Class that implements Messages Management.
     * @parameter {ILogger} logger 
     * @parameter {IRestClient} restClient 
     * @parameter {ILocalStorageData} localStorageData 
     * @parameter {IComapiConfig} comapiConfig 
     * @parameter {ISessionManager} sessionManager
     * @parameter {IChannelManager} channelManager                    
     */
    constructor(private _logger: ILogger,
        private _restClient: IRestClient,
        private _localStorageData: ILocalStorageData,
        private _comapiConfig: IComapiConfig,
        private _sessionManager: ISessionManager,
        private _conversationManager: IConversationManager) { }


    /**
     * @method MessagesManager#getConversationEvents 
     * @param {string} conversationId
     * @param {number} from
     * @param {number} limit
     * @returns {Promise} 
     */
    public getConversationEvents(conversationId: string, from: number, limit: number): Promise<IConversationMessageEvent[]> {

        let url: string = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/events`;

        url += "?from=" + from;
        url += "&limit=" + limit;

        return this._restClient.get(url)
            .then(function (result) {
                return Promise.resolve(<IConversationMessageEvent[]>result.response);
            });
    }

    /**
     * @method MessagesManager#getConversationMessages 
     * @param {string} conversationId
     * @param {number} limit
     * @param {number} [from]
     * @returns {Promise} 
     */
    public getConversationMessages(conversationId: string, limit: number, from?: number): Promise<IConversationMessagesResult> {

        let url: string = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/messages`;

        url += `?limit=${limit}`;

        if (from !== undefined) {
            url += `&from=${from}`;
        }

        return this._restClient.get(url)
            .then(function (result) {
                return Promise.resolve(<IConversationMessagesResult>result.response);
            });
    }

    /**
     * @deprecated - use methd that uses IConversationDetails / ConversationBuilder 
     * @method MessagesManager#sendMessageToConversation 
     * @parameter {String} conversationId 
     * @parameter {Object} metadata 
     * @parameter {IMessagePart[]} parts 
     * @parameter {IMessageAlert} alert 
     * @returns {Promise} 
     */
    public _sendMessageToConversation(conversationId: string, metadata: Object, parts: IMessagePart[], alert: IMessageAlert): Promise<ISendMessageResult> {

        let request = {
            alert: alert,
            metadata: metadata,
            parts: parts,
        };

        return this._restClient.post(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/messages`, {}, request)
            .then(function (result) {
                return Promise.resolve(<ISendMessageResult>result.response);
            });
    }

    /**
     * @method MessagesManager#sendMessageToConversation2 
     * @parameter {string} conversationId 
     * @parameter {IConversationMessage} message 
     */
    public sendMessageToConversation(conversationId: string, message: IConversationMessage): Promise<ISendMessageResult> {
        return this._restClient.post(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/messages`, {}, message)
            .then(function (result) {
                return Promise.resolve(<ISendMessageResult>result.response);
            });
    }

    /**
     * @method MessagesManager#sendMessageStatusUpdates
     * @param {string} conversationId
     * @param {IMessageStatus[]} statuses
     * @returns {Promise} 
     */
    public sendMessageStatusUpdates(conversationId: string, statuses: IMessageStatus[]): Promise<any> {
        let headers = {
            "Content-Type": "application/json",
        };

        return this._restClient.post(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/messages/statusupdates`, headers, statuses)
            .then(function (result) {
                return Promise.resolve(result.response);
            });
    }
}
