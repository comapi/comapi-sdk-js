import { IFoundation } from "../../src/interfaces";
import { IComapiChatConfig } from "../interfaces/chatLayer";


export class SessionService {

    constructor(private _foundation: IFoundation, private _config: IComapiChatConfig) { }


    public startSession() {
        return this._foundation ? this._foundation.startSession() : Promise.reject({ message: "No Foundation interface" });
    }

    public endSession() {
        return this._foundation ? this._foundation.endSession()
            .then(() => {
                return this._config.conversationStore.reset();
            }).then(reset => {
                //  this._hasSynced = false;
                return reset;
            }) : Promise.reject({ message: "No Foundation interface" });

    }

}
