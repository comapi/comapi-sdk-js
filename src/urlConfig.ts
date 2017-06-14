import { IFoundationRestUrls } from "./interfaces";


export class FoundationRestUrls implements IFoundationRestUrls {

    // Conversations
    public conversations: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations";


    public conversation: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations/{{conversationId}}";


    public participants: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations/{{conversationId}}/participants";


    public typing: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations/{{conversationId}}/typing";

    // DEVICES
    public push: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/sessions/{{sessionId}}/push";

    // FACEBOOK

    public facebook: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/channels/facebook/state";

    // Messages
    public events: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations/{{conversationId}}/events";

    public messages: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations/{{conversationId}}/messages";

    public statusUpdates: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations/{{conversationId}}/messages/statusupdates";

    // Profile

    public profiles: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/profiles";

    public profile: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/profiles/{{profileId}}";

    // session
    public sessions: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/sessions";
    public sessionStart: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/sessions/start";
    public session: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/sessions/{{sessionId}}";

}
