import { injectable, inject } from "inversify";

import {
    IComapiConfig,
    IRestClient,
    IReportingManager
} from "./interfaces";

import { Utils } from "./utils";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class ReportingManager implements IReportingManager {

    /**        
     * ReportingManager class constructor.
     * @class ReportingManager
     * @ignore
     * @classdesc Class that implements all the ReportingManager functionality.
     * @parameter {IRestClient} restClient 
     * @parameter {IComapiConfig} comapiConfig 
     */
    constructor( @inject(INTERFACE_SYMBOLS.AuthenticatedRestClient) private _restClient: IRestClient,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig) {
    }


    /**
     * Function to handle Deep Link Click data
     * @method ReportingManager#handleDeepLinkClick
     * @param {string} trackingId - the trackingId
     * @returns {Promise} - Returns a promise
     */
    public handleDeepLinkClick(trackingId:string): Promise<any>{
        let url = Utils.format(this._comapiConfig.foundationRestUrls.reporting + "/push", {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.post(url, {}, {            
            type: "deepLinkClick",
            trackingId
        });
    }

}
