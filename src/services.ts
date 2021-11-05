import { injectable, inject } from "inversify";

import { IServices, IAppMessaging, IAppMessagingInternal, IProfile, IReportingManager } from "./interfaces";

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
    constructor(@inject(INTERFACE_SYMBOLS.AppMessaging) private _appMessaging: IAppMessagingInternal,
        @inject(INTERFACE_SYMBOLS.Profile) private _profile: IProfile, @inject(INTERFACE_SYMBOLS.Reporting) private _reporting: IReportingManager) {
    }

    /**
     * Method to get AppMessaging interface
     * @method Services#appMessaging
     * @returns {AppMessaging} - Returns AppMessaging interface
     */
    public get appMessaging(): IAppMessaging {
        this._appMessaging.enableSocket();
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

    /**
     * Method to get Reporting interface
     * @method Services#reporting
     * @returns {Reporting} - Returns Reporting interface
     */
     public get reporting(): IReportingManager {
        return this._reporting;
    }

}
