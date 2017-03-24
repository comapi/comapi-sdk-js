import {
    IComapiConfig,
    IRestClient,
    IFacebookManager
} from "./interfaces";

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
        let url = `${this._comapiConfig.urlBase}/apispaces/${this._comapiConfig.apiSpaceId}/channels/facebook/state`;
        return this._restClient.post(url, {}, data || {});
    }
}
