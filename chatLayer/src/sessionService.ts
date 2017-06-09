import { IFoundation, ISession } from "../../src/interfaces";
import { IComapiChatConfig } from "../interfaces/chatLayer";


export class SessionService {

    constructor(private _foundation: IFoundation, private _config: IComapiChatConfig) { }

    /**
     * 
     */
    public startSession(): Promise<ISession> {
        return this._foundation.startSession();
    }

    /**
     * 
     */
    public get session(): ISession {
        return this._foundation.session;
    }

    /**
     * 
     */
    public endSession(): Promise<boolean> {
        return this._foundation.endSession()
            .then(() => {
                return this._config.conversationStore.reset();
            });
    }

}
