import {
    IComapiConfig,
    IRestClient,
    IFacebookManager
} from "./interfaces";

import { Utils } from "./utils";
export class FacebookManager implements IFacebookManager {

    /**        
     * FacebookManager class constructor.
     * @class FacebookManager
     * @ignore
     * @classdesc Class that implements all the FacebookManager functionality.
     * @parameter {IRestClient} restClient 
     * @parameter {IComapiConfig} comapiConfig 
     */
    constructor(private _restClient: IRestClient,
        private _comapiConfig: IComapiConfig) {
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
