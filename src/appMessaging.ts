import { injectable, inject } from "inversify";

import {
    IConversationManager,
    IConversationDetails,
    IConversationDetails2,
    IConversationParticipant,
    ConversationScope,
    IMessageManager,
    IConversationMessageEvent,
    IConversationMessage,
    ISendMessageResult,
    IMessageStatus,
    IGetMessagesResponse,
    INetworkManager,
    IMessagePager,
    IContentManager,
    IContentData,
    IUploadContentResult
} from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class AppMessaging {

    /**          
     * AppMessaging class constructor.
     * @class  AppMessaging
     * @classdesc Class that implements AppMessaging
     * @param {INetworkManager} networkManager 
     * @param {IConversationManager} conversationManager 
     * @param {IMessageManager} messageManager 
     */
    constructor(@inject(INTERFACE_SYMBOLS.NetworkManager) private _networkManager: INetworkManager,
        @inject(INTERFACE_SYMBOLS.ConversationManager) private _conversationManager: IConversationManager,
        @inject(INTERFACE_SYMBOLS.MessageManager) private _messageManager: IMessageManager,
        @inject(INTERFACE_SYMBOLS.MessagePager) private _messagePager: IMessagePager,
        @inject(INTERFACE_SYMBOLS.ContentManager) private _contentManager: IContentManager) { }

    /**
     * Function to enable socket connections.
     * @method AppMessaging#enableSocket
     * @returns {Promise} 
     */
    public enableSocket(): Promise<boolean> {
        return this._networkManager.setWebsocketEnabled(true);
    }

    /**
     * Function to create a conversation
     * @method AppMessaging#createConversation 
     * @param {IConversationDetails} conversationDetails - the conversation details (use `ConversationBuilder` to create this)
     * @returns {Promise} 
     */
    public createConversation(conversationDetails: IConversationDetails): Promise<IConversationDetails2> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.createConversation(conversationDetails);
            });
    }

    /**
     * Function to update a conversation
     * @method AppMessaging#updateConversation
     * @param {IConversationDetails} conversationDetails - the conversation details (use `ConversationBuilder` to create this)
     * @param {string} [eTag] - the eTag 
     * @returns {Promise} 
     */
    public updateConversation(conversationDetails: IConversationDetails, eTag?: string): Promise<IConversationDetails2> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.updateConversation(conversationDetails, eTag);
            });
    }

    /**
     * Function to get a conversation
     * @method AppMessaging#getConversation 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public getConversation(conversationId: string): Promise<IConversationDetails2> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.getConversation(conversationId);
            });
    }

    /**
     * Function to delete a conversation
     * @method AppMessaging#deleteConversation 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public deleteConversation(conversationId: string): Promise<boolean> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.deleteConversation(conversationId);
            })
            .then((deleted) => {
                return this._messagePager.resetConversation(conversationId);
            });
    }

    /**
     * Function to add participants to a conversation
     * @method AppMessaging#addParticipantsToConversation 
     * @param {string} conversationId
     * @param {IConversationParticipant[]} participants
     * @returns {Promise} 
     */
    public addParticipantsToConversation(conversationId: string, participants: IConversationParticipant[]): Promise<boolean> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.addParticipantsToConversation(conversationId, participants);
            });
    }

    /**
     * Function to remove participants to a conversation
     * @method AppMessaging#deleteParticipantsFromConversation 
     * @param {string} conversationId
     * @param {string[]} participants
     * @returns {Promise} 
     */
    public deleteParticipantsFromConversation(conversationId: string, participants: string[]): Promise<boolean> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.deleteParticipantsFromConversation(conversationId, participants);
            });
    }

    /**
     * Function to get participantss in a conversation
     * @method AppMessaging#getParticipantsInConversation 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public getParticipantsInConversation(conversationId: string): Promise<IConversationParticipant[]> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.getParticipantsInConversation(conversationId);
            });
    }

    /**
     * Function to get all conversations  the user is a participant in
     * @method AppMessaging#getConversations 
     * @param {ConversationScope} [scope] - the conversation scope ["`public`"|"`participant`"]
     * @param {string} [profileId] - The profileId to search with
     * @returns {Promise} 
     */
    public getConversations(scope?: ConversationScope, profileId?: string): Promise<IConversationDetails2[]> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.getConversations(scope, profileId);
            });
    }

    /**
     * Function to get events from a conversation
     * @method AppMessaging#getConversationEvents 
     * @param {string} conversationId - the conversation Id
     * @param {number} from - the event Id to start from 
     * @param {number} limit - the maximum number of events to retrievee
     * @returns {Promise} 
     */
    public getConversationEvents(conversationId: string, from: number, limit: number): Promise<IConversationMessageEvent[]> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._messageManager.getConversationEvents(conversationId, from, limit);
            });
    }

    /**
     * Function to send a message to a conversation
     * @method AppMessaging#sendMessageToConversation 
     * @param {string} conversationId  - the conversation Id
     * @param {IConversationMessage} - the message to send (Use `MessageBuilder` to create a message)
     * @returns {Promise} 
     */
    public sendMessageToConversation(conversationId: string, message: IConversationMessage): Promise<ISendMessageResult> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._messageManager.sendMessageToConversation(conversationId, message);
            });
    }

    /**
     * Function to sent message status udates for messages in a conversation
     * @method AppMessaging#sendMessageStatusUpdates
     * @param {string} conversationId  - the conversation Id
     * @param {IMessageStatus[]} statuses -  the message statuses (Use `MessageStatusBuilder` to create the status objects)
     * @returns {Promise} 
     */
    public sendMessageStatusUpdates(conversationId: string, statuses: IMessageStatus[]): Promise<any> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._messageManager.sendMessageStatusUpdates(conversationId, statuses);
            });
    }

    /**
     * Get a page of messages, internally deal with orphaned events etc ...
     * @method AppMessaging#getMessages 
     * @param {string} id - the conversationId
     * @param {number} pageSize - the page size
     * @param {number} [continuationToken] - the continuation token (optional - if not specified then retrieve from the end) 
     * @returns {Promise<IGetMessagesResponse>}
     */
    public getMessages(conversationId: string, pageSize: number, continuationToken?: number): Promise<IGetMessagesResponse> {
        let profileId: string;
        let _getMessagesResponse: IGetMessagesResponse;
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                profileId = sessionInfo.session.profileId;
                return this._messagePager.getMessages(conversationId, pageSize, continuationToken);
            })
            .then((getMessagesResponse) => {
                _getMessagesResponse = getMessagesResponse;
                return this._messagePager.markMessagesAsDelivered(conversationId, getMessagesResponse.messages, profileId);
            })
            .then(markDeliveredresponse => {
                return Promise.resolve(_getMessagesResponse);
            });
    }

    /**
     * Function to send typing event to a conversation
     * @method AppMessaging#sendIsTyping 
     * @param {string} conversationId - the conversation Id 
     * @returns {Promise} 
     */
    public sendIsTyping(conversationId: string): Promise<boolean> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.sendIsTyping(conversationId);
            });
    }

    /**
     * Function to send typing off event to a conversation
     * @method AppMessaging#sendIsTypingOff 
     * @param {string} conversationId - the conversation Id 
     * @returns {Promise} 
     */
    public sendIsTypingOff(conversationId: string): Promise<boolean> {
        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._conversationManager.sendIsTypingOff(conversationId);
            });
    }

    /**
     * Method to upload content data
     * @method AppMessaging#uploadContent
     * @param {ContentData} content - the content
     * @returns {IUploadContentResult} - the result
     */
    public uploadContent(content: IContentData, folder?: string): Promise<IUploadContentResult> {

        return this._networkManager.ensureSession()
            .then((sessionInfo) => {
                return this._contentManager.uploadContent(content, folder);
            });
    }
}
