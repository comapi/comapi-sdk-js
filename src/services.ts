import { AppMessaging } from "./appMessaging";
import { Profile } from "./profile";

export class Services {

    /**          
     * Services class constructor.
     * @class Services
     * @classdesc Class that implements Services interface
     * @parameter {AppMessaging} _appMessaging 
     * @parameter {Profile} _profile 
     */
    constructor(private _appMessaging: AppMessaging, private _profile: Profile) {
    }

    /**
     * Method to get AppMessaging interface
     * @method Services#appMessaging
     * @returns {AppMessaging} - Returns AppMessaging interface
     */
    public get appMessaging(): AppMessaging {
        return this._appMessaging;
    }

    /**
     * Method to get Profile interface
     * @method Services#profile
     * @returns {Profile} - Returns Profile interface
     */
    public get profile(): Profile {
        return this._profile;
    }


}
