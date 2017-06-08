import { IComapiChatConfig } from "../interfaces/chatLayer";
import { IFoundation, IComapiConfig } from "../../src/interfaces";
import { Foundation } from "../../src/foundation";
import { SessionService } from "./sessionService";
import { ProfileService } from "./profileService";
import { MessagingService } from "./messagingService";

export class ComapiChatClient {

    private _sessionService: SessionService;
    private _profileService: ProfileService;
    private _messagingService: MessagingService;

    private _foundation: IFoundation;

    constructor(/*private _foundation: IFoundation, private _config: IComapiChatConfig*/) { }

    public get session(): SessionService {
        return this._sessionService;
    }

    public get profile(): ProfileService {
        return this._profileService;
    }

    public get messaging(): MessagingService {
        return this._messagingService;
    }

    public initialise(comapiChatConfig: IComapiChatConfig): Promise<boolean> {

        return Foundation.initialise(comapiChatConfig)
            .then((foundation) => {
                //   this.chatLogic = new ComapiChatLogic(foundation);
                //   return this.chatLogic.initialise(this.chatConfig);
                return true;
            });


    }


}
