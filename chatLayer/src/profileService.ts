import { IFoundation } from "../../src/interfaces";
import { IComapiChatConfig } from "../interfaces/chatLayer";

export class ProfileService {

    constructor(private _foundation: IFoundation, private _config: IComapiChatConfig) { }


    public getMyProfile(): Promise<any> {
        return this._foundation.services.profile.getMyProfile();
    }




}
