import {
    IConversationDetails, IConversationRoles, IConversationParticipant, IConversationPrivelages
} from "./interfaces";

import { Utils } from "./utils";

export class ConversationBuilder implements IConversationDetails {

    /**
     * The conversation id
     */
    public id: string;
    /**
     * The conversation name
     */
    public name: string;
    /**
     * The conversation description
     */
    public description: string = undefined;
    /**
     * The conversation roles
     */
    public roles: IConversationRoles = {
        "owner": {
            "canSend": true,
            "canAddParticipants": true,
            "canRemoveParticipants": true
        },
        "participant": {
            "canSend": true,
            "canAddParticipants": true,
            "canRemoveParticipants": true
        }
    };
    /**
     * The isPublic field
     */
    public isPublic: boolean = false;
    /**
     * The participants
     */
    public participants: IConversationParticipant[] = undefined;

    /**
     * ConversationBuilder class constructor.
     * initialises the id with a guid
     * @class ConversationBuilder
     * @classdesc Class that implements ConversationBuilder
     */
    constructor() {
        this.id = Utils.uuid();
    }

    /**
     * Method to specify the conversationId (defaults to a new guid if not used)
     * @method ConversationBuilder#withId
     * @param {string} id
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withId(id: string): ConversationBuilder {
        this.id = id;
        return this;
    }

    /**
     * Method to specify the conversation name
     * @method ConversationBuilder#withName
     * @param {string} name
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withName(name: string): ConversationBuilder {
        this.name = name;
        return this;
    }

    /**
     * Method to specify the conversation description
     * @method ConversationBuilder#withDescription
     * @param {string} description
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withDescription(description: string): ConversationBuilder {
        this.description = description;
        return this;
    }

    /**
     * Method to specify initial participant list (will all be members)
     * @method ConversationBuilder#withUsers
     * @param {string[]} users
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withUsers(users: string[]): ConversationBuilder {
        this.participants = [];
        for (let user of users) {
            this.participants.push({ id: user });
        }
        return this;
    }

    /**
     * Method to specify initial participant (will be a member)
     * @method ConversationBuilder#withUser
     * @param {string} user
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withUser(user: string): ConversationBuilder {
        this.participants = [{ id: user }];
        return this;
    }

    /**
     * Method to specify initial participants -  takes an array of IConversationParticipant objects which enables individual
     * roles to be specified for each user.
     * @method ConversationBuilder#withParticipants
     * @param {IConversationParticipant[]} participants
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withParticipants(participants: IConversationParticipant[]): ConversationBuilder {
        this.participants = participants;
        return this;
    }

    /**
     * Method to set owner privelages for the conversation
     * @method ConversationBuilder#withOwnerPrivelages
     * @param {IConversationPrivelages} privelages
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withOwnerPrivelages(privelages: IConversationPrivelages) {
        this.roles.owner = privelages;
        return this;
    }

    /**
     * Method to set participant privelages for the conversation
     * @method ConversationBuilder#withParticipantPrivelages
     * @param {IConversationPrivelages} privelages
     * @returns {ConversationBuilder} - Returns reference to itself so methods can be chained
     */
    public withParticipantPrivelages(privelages: IConversationPrivelages) {
        this.roles.participant = privelages;
        return this;
    }

}
