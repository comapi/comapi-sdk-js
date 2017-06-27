import { injectable, inject } from "inversify";

import { IServices, IAppMessaging, IProfile } from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class Services implements IServices {

    /**          
     * Services class constructor.
     * @class Services
     * @classdesc Class that implements Services interface
     * @parameter {AppMessaging} _appMessaging 
     * @parameter {Profile} _profile 
     */
    constructor( @inject(INTERFACE_SYMBOLS.AppMessaging) private _appMessaging: IAppMessaging,
        @inject(INTERFACE_SYMBOLS.Profile) private _profile: IProfile) {
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
