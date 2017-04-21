import {
    IFacebookManager,
    IChannels,
    INetworkManager
} from "./interfaces";

export class Channels implements IChannels {

    /**          
     * Channels class constructor.
     * @class Channels
     * @classdesc Class that implements Channels interface
     * @parameter {NetworkManager} networkManager 
     * @parameter {IFacebookManager} facebookManager 
     */
    constructor(private _networkManager: INetworkManager, private _facebookManager: IFacebookManager) { }

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
