import { injectable, inject } from "inversify";

import {
    IComapiConfig,
    IRestClient,
    IFacebookManager
} from "./interfaces";

import { Utils } from "./utils";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class FacebookManager implements IFacebookManager {

    /**        
     * FacebookManager class constructor.
     * @class FacebookManager
     * @ignore
     * @classdesc Class that implements all the FacebookManager functionality.
     * @parameter {IRestClient} restClient 
     * @parameter {IComapiConfig} comapiConfig 
     */
    constructor( @inject(INTERFACE_SYMBOLS.AuthenticatedRestClient) private _restClient: IRestClient,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig) {
    }

    /**
     * @param {any} [data] - the data to post
     */
    public createSendToMessengerState(data?: any): Promise<any> {

        let url = Utils.format(this._comapiConfig.foundationRestUrls.facebook, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this._restClient.post(url, {}, data || {});
    }
}
