import {
    IConversationManager,
    IConversationParticipant,
    ConversationScope,
    IConversationDetails,
    IConversationDetails2,
    ISessionManager,
    IRestClient,
    ILogger,
    ILocalStorageData,
    IComapiConfig
} from "./interfaces";

export class ConversationManager implements IConversationManager {

    //  This object is an in-memory dictionary of last sent timestamps (conversationId: timestamp) ...
    //  "FA93AA1B-DEA5-4182-BE67-3DEAF4021040": "2017-02-28T14:48:21.634Z"
    private isTypingInfo: any = {};
    // same for typing off 
    private isTypingOffInfo: any = {};

    /**
     * ConversationManager class constructor.
     * @class ConversationManager
     * @ignore
     * @classdesc Class that implements Conversation Management.
     * @parameter {ILogger} logger 
     * @parameter {IRestClient} restClient 
     * @parameter {ILocalStorageData} localStorageData 
     * @parameter {IComapiConfig} ComapiConfig 
     * @parameter {ISessionManager} sessionManager 
     */
    constructor(private _logger: ILogger,
        private _restClient: IRestClient,
        private _localStorageData: ILocalStorageData,
        private _comapiConfig: IComapiConfig,
        private _sessionManager: ISessionManager) { }


    /**
     * Function to create a onversation
     * @method ConversationManager#createConversation 
     * @param {IConversationDetails} conversationDetails
     * @returns {Promise} 
     */
    public createConversation(conversationDetails: IConversationDetails): Promise<IConversationDetails2> {

        return this._restClient.post(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations`, {}, conversationDetails)
            .then(function (result) {
                result.response.ETag = result.headers.ETag;
                return Promise.resolve<IConversationDetails2>(result.response);
            });
    }

    /**
     * Function to update a conversation
     * @method ConversationManager#updateConversation
     * @param {IConversationDetails} conversationDetails
     * @param {string} [eTag] - the eTag 
     * @returns {Promise} 
     */
    public updateConversation(conversationDetails: IConversationDetails, eTag?: string): Promise<IConversationDetails2> {
        let headers = {};

        if (eTag) {
            headers["if-match"] = eTag;
        }

        let args = {
            description: conversationDetails.description,
            isPublic: conversationDetails.isPublic,
            name: conversationDetails.name,
            roles: conversationDetails.roles,
        };

        return this._restClient.put(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationDetails.id}`, headers, args)
            .then(function (result) {
                result.response.ETag = result.headers.ETag;
                return Promise.resolve<IConversationDetails2>(result.response);
            });
    }


    /**
     * Function to get a conversation
     * @method ConversationManager#getConversation 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public getConversation(conversationId: string): Promise<IConversationDetails2> {
        return this._restClient.get(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}`)
            .then(function (result) {
                result.response.ETag = result.headers.ETag;
                return Promise.resolve<IConversationDetails2>(result.response);
            });
    }


    /**
     * Function to delete a conversation
     * @method ConversationManager#deleteConversation 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public deleteConversation(conversationId: string): Promise<boolean> {
        return this._restClient.delete(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}`, {})
            .then(function (result) {
                return Promise.resolve(true);
            });
    }

    /**
     * Function to add participants to a conversation
     * @method ConversationManager#addParticipantsToConversation 
     * @param {string} conversationId
     * @param {IConversationParticipant[]} participants
     * @returns {Promise} 
     */
    public addParticipantsToConversation(conversationId: string, participants: IConversationParticipant[]): Promise<boolean> {
        return this._restClient.post(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/participants`, {}, participants)
            .then(function (result) {
                return Promise.resolve(true);
            });
    }

    /**
     * Function to remove participants to a conversation
     * @method ConversationManager#deleteParticipantsFromConversation 
     * @param {string} conversationId
     * @param {string[]} participants
     * @returns {Promise} 
     */
    public deleteParticipantsFromConversation(conversationId: string, participants: string[]): Promise<boolean> {
        let query = "";

        for (let i = 0; i < participants.length; i++) {
            query += (i === 0 ? "?id=" + participants[i] : "&id=" + participants[i]);
        }

        return this._restClient.delete(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/participants` + query, {})
            .then(function (result) {
                return Promise.resolve(true);
            });
    }

    /**
     * Function to get participantss in a conversation
     * @method ConversationManager#getParticipantsInConversation 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public getParticipantsInConversation(conversationId: string): Promise<IConversationParticipant[]> {

        return this._restClient.get(`${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/participants`)
            .then(function (result) {
                return Promise.resolve<IConversationParticipant[]>(result.response);
            });
    }

    /**
     * @method ConversationManager#getConversations 
     * @param {ConversationScope} [scope]
     * @param {string} [profileId]
     * @returns {Promise} 
     */
    public getConversations(scope?: ConversationScope, profileId?: string): Promise<IConversationDetails2[]> {
        let url: string = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations`;

        if (scope || profileId) {

            url += "?";

            if (scope !== undefined) {
                url += "scope=" + ConversationScope[scope] + "&";
            }

            if (profileId !== undefined) {
                url += "profileId=" + profileId;
            }
        }

        return this._restClient.get(url)
            .then(function (result) {
                return Promise.resolve<IConversationDetails2[]>(result.response);
            });

    }

    /**
     * Function to send an is-typing event
     * @method ConversationManager#sendIsTyping 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public sendIsTyping(conversationId: string): Promise<boolean> {

        // we only want to call this once every n seconds (10?)
        if (this.isTypingInfo[conversationId]) {

            let lastSentTime = new Date(this.isTypingInfo[conversationId]);

            let now = new Date();

            let diff = (now.getTime() - lastSentTime.getTime()) / 1000;

            if (diff < (this._comapiConfig.isTypingTimeout || 10)) {
                return Promise.resolve(false);
            }
        }

        let url: string = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/typing`;

        return this._restClient.post(url, {}, {})
            .then(result => {
                this.isTypingInfo[conversationId] = new Date().toISOString();
                return Promise.resolve(true);
            });
    }

    /**
     * Function to send an is-typing off event
     * @method ConversationManager#sendIsTyping 
     * @param {string} conversationId
     * @returns {Promise} 
     */
    public sendIsTypingOff(conversationId: string): Promise<boolean> {
        // we only want to call this once every n seconds (10?)
        if (this.isTypingOffInfo[conversationId]) {

            let lastSentTime = new Date(this.isTypingOffInfo[conversationId]);

            let now = new Date();

            let diff = (now.getTime() - lastSentTime.getTime()) / 1000;

            if (diff < (this._comapiConfig.isTypingOffTimeout || 10)) {
                return Promise.resolve(false);
            }
        }

        let url: string = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/conversations/${conversationId}/typing`;

        return this._restClient.delete(url, {})
            .then(result => {
                this.isTypingOffInfo[conversationId] = new Date().toISOString();
                return Promise.resolve(true);
            });
    }



}
