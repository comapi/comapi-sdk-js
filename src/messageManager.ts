import { injectable, inject } from "inversify";

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

import { Utils } from "./utils";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";


@injectable()
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
    constructor( @inject(INTERFACE_SYMBOLS.Logger) private _logger: ILogger,
        @inject(INTERFACE_SYMBOLS.AuthenticatedRestClient) private _restClient: IRestClient,
        @inject(INTERFACE_SYMBOLS.LocalStorageData) private _localStorageData: ILocalStorageData,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig,
        @inject(INTERFACE_SYMBOLS.SessionManager) private _sessionManager: ISessionManager,
        @inject(INTERFACE_SYMBOLS.ConversationManager) private _conversationManager: IConversationManager) { }


    /**
     * @method MessagesManager#getConversationEvents 
     * @param {string} conversationId
     * @param {number} from
     * @param {number} limit
     * @returns {Promise} 
     */
    public getConversationEvents(conversationId: string, from: number, limit: number): Promise<IConversationMessageEvent[]> {

        let url = Utils.format(this._comapiConfig.foundationRestUrls.events, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            conversationId: conversationId,
            urlBase: this._comapiConfig.urlBase,
        });

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

        let url = Utils.format(this._comapiConfig.foundationRestUrls.messages, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            conversationId: conversationId,
            urlBase: this._comapiConfig.urlBase,
        });

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

        let url = Utils.format(this._comapiConfig.foundationRestUrls.messages, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            conversationId: conversationId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.post(url, {}, request)
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

        let url = Utils.format(this._comapiConfig.foundationRestUrls.messages, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            conversationId: conversationId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.post(url, {}, message)
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

        let url = Utils.format(this._comapiConfig.foundationRestUrls.statusUpdates, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            conversationId: conversationId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.post(url, headers, statuses)
            .then(function (result) {
                return Promise.resolve(result.response);
            });
    }
}
