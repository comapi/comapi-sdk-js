import { injectable, inject } from "inversify";

import {
    IFacebookManager,
    IChannels,
    INetworkManager
} from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class Channels implements IChannels {

    /**          
     * Channels class constructor.
     * @class Channels
     * @classdesc Class that implements Channels interface
     * @parameter {NetworkManager} networkManager 
     * @parameter {IFacebookManager} facebookManager 
     */
    constructor( @inject(INTERFACE_SYMBOLS.NetworkManager) private _networkManager: INetworkManager,
        @inject(INTERFACE_SYMBOLS.FacebookManager) private _facebookManager: IFacebookManager) { }

    /**
     * Method to create opt in state for facebook messenger
     * @method Channels#createFbOptInState     
     * @param {any} [data] - the data to post
     */
    public createFbOptInState(data?: any): Promise<any> {
        return this._networkManager.ensureSessionAndSocket()
            .then((sessionInfo) => {
                return this._facebookManager.createSendToMessengerState(data);
            });
    }

}
