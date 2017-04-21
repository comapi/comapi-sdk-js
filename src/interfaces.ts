/**
 * Event manager interface
 */
export interface IEventManager {
    subscribeToLocalEvent(eventType: string, handler: Function);
    unsubscribeFromLocalEvent(eventType: string, handler?: Function);
    isSubscribedToLocalEvent(eventType: string): boolean;
    publishLocalEvent(eventType: string, data: any);
}

/**
 * Local storage interface
 */
export interface ILocalStorageData {
    getString(key: string): string;
    setString(key: string, data: string);

    getObject(key: string): Object;
    setObject(key: string, data: Object): boolean;

    remove(key: string);
}

/**
 * Log level enum
 */
export enum LogLevels {
    None,
    Error,
    Warn,
    Debug
};

/**
 * Log persistence enum
 */
export enum LogPersistences {
    None,
    IndexedDB,
    LocalStorage
};


/**
 * Log Event interface
 */
export interface ILogEvent {
    key?: number;
    logLevel: LogLevels;
    message: string;
    created: number;
    timestamp: string;
    data: any;
};


/**
 * Logger interface
 */
export interface ILogger {
    logLevel: LogLevels;
    log(message: String, data?: Object): Promise<boolean>;
    warn(message: String, data?: Object): Promise<boolean>;
    error(message: String, data?: Object): Promise<boolean>;
    clearLog(): Promise<boolean>;
    getLog(): Promise<string>;
}

/**
 * Rest client result interface
 */
export interface IRestClientResult {
    statusCode: number;
    response: any;
    // succeeded: boolean;
    headers: any;
};

/**
 * Rest client interface 
 */
export interface IRestClient {
    get(url: string, headers?: any): Promise<IRestClientResult>;
    post(url: string, headers: any, data: any): Promise<IRestClientResult>;
    put(url: string, headers: any, data: any): Promise<IRestClientResult>;
    delete(url: string, headers: any): Promise<IRestClientResult>;
}

/**
 * 
 */
export interface IApiSpaceInfo {
    createdOn: string;
    id: string;
    name: string;
    updatedOn: string;
}

/**
 * 
 */
export interface IApiSpaceAuthInfo {
    audience: string;
    idClaim: string;
    issuer: string;
    // sessionSecret: string;
    sharedSecret: string;

}

/**
 * 
 */
export interface IApiSpaceManager {
    getToken(accountId: string, profileId: string): Promise<any>;
    createApiSpace(token: string, name: string): Promise<IApiSpaceInfo>;

    updateAuth(token: string, apiSpaceId: string, authInfo: IApiSpaceAuthInfo): Promise<IApiSpaceAuthInfo>;
}

/**
 *  returned from /appspaces/{appSpaceId}/sessions/start
 *  GET
 *  {
 *      "authenticationId": "string",
 *      "provider": "jsonWebToken",
 *      "nonce": "string",
 *      "expiresOn": "2016-04-07T11:17:10.935Z"
 *  }
 */
export interface ISessionStartResponse {
    /**
     * @proprty (string) authenticationId - authenticationId generated by auth service
     */
    authenticationId: string;
    /**
     * @proprty (string) provider - "jsonWebToken"
     */
    provider: string;
    /**
     * @proprty (string) nonce - nonce generated by auth service (controlled in app space settings)
     */
    nonce: string;
    /**
     * @proprty (string) expiresOn - ISO date string 
     */
    expiresOn: string;
};

/**
 * 
 */
export interface ISession {
    id: string;
    profileId: string;

    deviceId: string;
    platform: string;
    platformVersion: string;
    sdkType: string;
    sdkVersion: string;

    sourceIp: string;
    isActive: boolean;
    createdOn: string;
    expiresOn: string;
}

/**
 * 
 */
export interface ISessionInfo {
    token: string;
    session: ISession;
}

/**
 * 
 */
export interface IBrowserInfo {
    name: string;
    version: string;
}

/**
 * Environment enum
 */
export enum Environment {
    development,
    production
};


/**
 * Session manager interface
 */
export interface ISessionManager {
    sessionInfo: ISessionInfo;
    getValidToken(): Promise<string>;
    startSession(): Promise<ISessionInfo>;
    endSession(): Promise<boolean>;
}

/**
 * Network manager interface
 */
export interface INetworkManager {
    session: ISession;
    getValidToken(): Promise<string>;
    startSession(): Promise<ISessionInfo>;
    restartSession(): Promise<ISessionInfo>;
    endSession(): Promise<boolean>;
    ensureSessionAndSocket(): Promise<ISessionInfo>;
}



/**
 * Session manager interface
 */
export interface IDeviceManager {
    setFCMPushDetails(sessionId: string, packageName: string, registrationId: string): Promise<boolean>;
    setAPNSPushDetails(sessionId: string, bundleId: string, environment: Environment, token: string): Promise<boolean>;
    removePushDetails(sessionId: string): Promise<boolean>;
}

/**
 * Session manager interface
 */
export interface IFacebookManager {
    createSendToMessengerState(data?: any): Promise<any>;
}


/**
 * Auth Challenge options definition
 */
export interface IAuthChallengeOptions {
    nonce: string;
}

// export type AuthChallenge = (options: IAuthChallengeOptions, answerAuthenticationChallenge: Function) => void;
/**
 * Auth Challenge callback signature
 */
export interface IAuthChallenge {
    (options: IAuthChallengeOptions, answerAuthenticationChallenge: Function): void;
};

/**
 * Comapi options to be passed in on startup 
 */
export interface IComapiConfig {
    apiSpaceId: string;
    logRetentionHours: number;
    authChallenge?: IAuthChallenge;
    urlBase?: string;
    webSocketBase?: string;
    logLevel?: LogLevels;
    logPersistence?: LogPersistences;
};

/**
 * Profile manager interface
 */
export interface IProfileManager {
    getProfile(id: string): Promise<any>;
    updateProfile(id: string, profile: Object, eTag?: string): Promise<any>;
    queryProfiles(query: string): Promise<any>;
}


/**
 * Log level enum
 */
export enum ConversationScope {
    public,
    participant,
};

/**
 * Conversation manager interface
 */
export interface IConversationManager {
    createConversation(conversationDetails: IConversationDetails): Promise<IConversationDetails2>;
    updateConversation(conversationDetails: IConversationDetails, eTag?: string): Promise<IConversationDetails2>;
    deleteConversation(conversationId: string): Promise<boolean>;
    getConversation(conversationId: string): Promise<IConversationDetails2>;
    addParticipantsToConversation(conversationlId: string, participants: IConversationParticipant[]): Promise<boolean>;
    deleteParticipantsFromConversation(conversationId: string, participants: string[]): Promise<boolean>;
    getParticipantsInConversation(conversationId: string): Promise<IConversationParticipant[]>;
    getConversations(scope?: ConversationScope, profileId?: string): Promise<IConversationDetails2[]>;
    sendIsTyping(conversationId: string): Promise<boolean>;
}

/**
 *  
 */
export interface IConversationPrivelages {
    canSend: boolean;
    canAddParticipants: boolean;
    canRemoveParticipants: boolean;
}

/**
 *  
 */
export interface IConversationRoles {
    owner: IConversationPrivelages;
    participant: IConversationPrivelages;
}

/**
 *
 */
export interface IConversationParticipant {
    id: string;
    role?: string;
}

/**
 * Conversation details 
 */
export interface IConversationDetails {
    id: string;
    name: string;
    description?: string;
    roles: IConversationRoles;
    isPublic: boolean;
    participants?: IConversationParticipant[];
}

/**
 * Conversation details interface
 */
export interface IConversationDetails2 extends IConversationDetails {
    _createdOn: string;
    _updatedOn: string;
    latestSentEventId?: number;
    participantCount?: number;
    ETag?: string;
}


export interface ISendMessageResult {
    id: string;
}

/**
 * 
 */
export interface IConversationMessage {
    id?: string;
    sentEventid?: number;
    metadata?: any;
    context?: any;
    /**
     *   "context": {
     *       "from": {
     *           "id": "stevanl"
     *       },
     *       "conversationId": "bc24d5b0-b03c-4594-872b-510c4af81dfe",
     *       "sentBy": "stevanl",
     *       "sentOn": "2016-10-19T11:51:26.349Z"
     *   }, 
     */
    parts?: IMessagePart[];
    alert?: IMessageAlert;
    statusUpdates?: any;
    /**
     * "statusUpdates": {
     *           "alex": {
     *               "status": "read",
     *               "on": "2016-10-19T11:52:29.704Z"
     *           }
     *       }
     */
}

/**
 * 
 */
export interface IConversationMessagesResult {
    earliestEventId: number;
    latestEventId: number;
    messages: IConversationMessage[];
    orphanedEvents?: any[];
}


/**
 * Message manager interface
 */
export interface IMessageManager {
    // _sendMessageToConversation(conversationId: string, metadata: Object, parts: IMessagePart[], alert?: IMessageAlert): Promise<ISendMessageResult>;
    sendMessageToConversation(conversationId: string, message: IConversationMessage): Promise<ISendMessageResult>;
    getConversationMessages(conversation: string, limit: number, from?: number): Promise<IConversationMessagesResult>;
    sendMessageStatusUpdates(conversation: string, statuses: IMessageStatus[]): Promise<any>;
    getConversationEvents(conversation: string, from: number, limit: number): Promise<IConversationMessageEvent[]>;
}


/**
 * 
 */
export interface IMessagePart {
    /**
     * The message part name
     */
    name?: string;
    /**
     * The messahe Part Type
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

/**
 * 
 */
export interface IApnsAlert {
    badge?: number;
    sound?: string;
    alert: string;
    payload?: any;
}

/**
 * 
 */
export interface IFcmAlert {
    collapse_key?: string;
    data?: any;
    notification: {
        title: string;
        body: string;
    };
}

/**
 *  
 */
export interface IMessageAlert {
    text: string;
    platforms: {
        apns: IApnsAlert;
        fcm: IFcmAlert;
    };
}

/**
 * 
 */
export interface IMessageStatus {
    messageIds: string[];
    status: string;
    // iso date string
    timestamp: string;
}

/**
 * 
 */
export interface IWebSocketManager {
    connect(): Promise<boolean>;
    disconnect(): Promise<boolean>;
    isConnected(): boolean;
    hasSocket(): boolean;
    send(data: any): void;
    generateInterval(k: number): number;
}

// payload for conversationMessage.sent
export interface IMessageSentPayload {
    messageId: string;
    metadata: any;
    context: any;
    parts: IMessagePart[];
    alert: IMessageAlert;
}

// payload for conversationMessage.delivered, conversationMessage.read
export interface IMessageStatusUpdatePayload {
    messageId: string;
    conversationId: string;
    profileId: string;
    timestamp: string;
}

// conversationMessage.sent, conversationMessage.delivered, conversationMessage.read all share this ... 
export interface IConversationMessageEvent {
    eventId: string;
    name: string;
    conversationId: string;
    conversationEventId: number;
    // payload will differ based on event name ...
    payload: IMessageSentPayload | IMessageStatusUpdatePayload;
}


/**
 * TODO: do we want a profileId in here ?
 */
export interface IConversationDeletedEventData {
    conversationId: string;
    createdBy: string;
    timestamp: string;
}

/**
 * TODO: do we want a profileId in here ?
 */
export interface IConversationUndeletedEventData {
    conversationId: string;
    createdBy: string;
    timestamp: string;
}


/**
 * 
 */
export interface IConversationUpdatedEventData {
    conversationId: string;
    // the user who updated the conversation
    createdBy: string;
    name: string;
    description: string;
    roles: IConversationRoles;
    isPublic: boolean;
    timestamp: string;
}

/**
 * 
 */
export interface IParticipantAddedEventData {
    conversationId: string;
    createdBy: string;
    profileId: string;
    role: string;
    timestamp: string;
}

/**
 * 
 */
export interface IParticipantRemovedEventData {
    conversationId: string;
    createdBy: string;
    profileId: string;
    timestamp: string;
}

/**
 * 
 */
export interface IParticipantTypingEventData {
    conversationId: string;
    createdBy: string;
    profileId: string;
    timestamp: string;
}


/**
 * 
 */
export interface IProfileUpdatedEvent {
    eTag: string;
    profile: any;
}

/**
 * 
 */
export interface IGetMessagesResponse {
    continuationToken?: number;
    earliestEventId?: number;
    latestEventId?: number;
    messages: IConversationMessage[];
}


export interface IAppMessaging {
    createConversation(conversationDetails: IConversationDetails): Promise<IConversationDetails2>;
    updateConversation(conversationDetails: IConversationDetails, eTag?: string): Promise<IConversationDetails2>;
    getConversation(conversationId: string): Promise<IConversationDetails2>;
    deleteConversation(conversationId: string): Promise<boolean>;
    addParticipantsToConversation(conversationId: string, participants: IConversationParticipant[]): Promise<boolean>;
    deleteParticipantsFromConversation(conversationId: string, participants: string[]): Promise<boolean>;
    getParticipantsInConversation(conversationId: string): Promise<IConversationParticipant[]>;
    getConversations(scope?: ConversationScope, profileId?: string): Promise<IConversationDetails2[]>;
    getConversationEvents(conversationId: string, from: number, limit: number): Promise<IConversationMessageEvent[]>;
    sendMessageToConversation(conversationId: string, message: IConversationMessage): Promise<ISendMessageResult>;
    sendMessageStatusUpdates(conversationId: string, statuses: IMessageStatus[]): Promise<any>;
    getMessages(conversationId: string, pageSize: number, continuationToken?: number): Promise<IGetMessagesResponse>;
    sendIsTyping(conversationId: string): Promise<boolean>;


}

export interface IProfile {
    getProfile(profileId: string): Promise<any>;
    queryProfiles(query?: string): Promise<any>;
    updateProfile(profileId: string, profile: any, eTag?: string): Promise<any>;
    getMyProfile(useEtag?: boolean): Promise<any>;
    updateMyProfile(profile: any, useEtag?: boolean): Promise<any>;
}

export interface IServices {
    appMessaging: IAppMessaging;
    profile: IProfile;
}

export interface IDevice {
    setFCMPushDetails(packageName: string, registrationId: string): Promise<boolean>;
    setAPNSPushDetails(bundleId: string, environment: Environment, token: string): Promise<boolean>;
    removePushDetails(): Promise<boolean>;
}

export interface IChannels {
    createFbOptInState(data?: any): Promise<any>;
}


/**
 * Foundation interface definition
 * static methods missing as cant define them in TS ;-(
 */
export interface IFoundation {
    services: IServices;
    device: IDevice;
    channels: IChannels;
    session: ISession;

    startSession(): Promise<ISession>;
    endSession(): Promise<boolean>;
    on(eventType: string, handler: Function): void;
    off(eventType: string, handler?: Function): void;
    getLogs(): Promise<string>;
}
