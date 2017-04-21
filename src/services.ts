import { IServices, IAppMessaging, IProfile } from "./interfaces";

export class Services implements IServices {

    /**          
     * Services class constructor.
     * @class Services
     * @classdesc Class that implements Services interface
     * @parameter {AppMessaging} _appMessaging 
     * @parameter {Profile} _profile 
     */
    constructor(private _appMessaging: IAppMessaging, private _profile: IProfile) {
    }

    /**
     * Method to get AppMessaging interface
     * @method Services#appMessaging
     * @returns {AppMessaging} - Returns AppMessaging interface
     */
    public get appMessaging(): IAppMessaging {
        return this._appMessaging;
    }

    /**
     * Method to get Profile interface
     * @method Services#profile
     * @returns {Profile} - Returns Profile interface
     */
    public get profile(): IProfile {
        return this._profile;
    }


}
