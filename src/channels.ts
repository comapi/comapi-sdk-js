import {
    IFacebookManager,
    IChannels
} from "./interfaces";

import { SessionAndSocketResolver } from "./resolver";

export class Channels implements IChannels {

    /**          
     * Channels class constructor.
     * @class Channels
     * @classdesc Class that implements Channels interface
     * @parameter {SessionAndSocketResolver} resolver 
     * @parameter {IFacebookManager} facebookManager 
     */
    constructor(private _sessionAndSocketResolver: SessionAndSocketResolver, private _facebookManager: IFacebookManager) { }

    /**
     * Method to create opt in state for facebook messenger
     * @method Channels#createFbOptInState     
     * @param {any} [data] - the data to post
     */
    public createFbOptInState(data?: any): Promise<any> {
        return this._sessionAndSocketResolver.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._facebookManager.createSendToMessengerState(data);
            });
    }

}
