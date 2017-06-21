import { injectable, inject } from "inversify";
import { ILogger, IRestClient, IRestClientResult, INetworkManager } from "./interfaces";
import { RestClient } from "./restClient";


@injectable()
export class AuthenticatedRestClient implements IRestClient {

    /**        
     * AuthenticatedRestClient class constructor.
     * @class AuthenticatedRestClient
     * @ignore
     * @classdesc Class that implements an Authenticated RestClient.
     * @param {ILogger} logger - the logger 
     * @param {IRestClient} restClient - the restClient 
     * @param {INetworkManager} networkManager - the Network Manager 
     */
    constructor( @inject("Logger") private logger: ILogger,
        @inject("RestClient") private restClient: IRestClient,
        @inject("NetworkManager") private networkManager: INetworkManager) { }

    /**
     * Method to make a GET request 
     * @method AuthenticatedRestClient#get
     * @param  {string} url
     * @param  {any} [headers]
     * @returns {Promise} - returns a promise
     */
    public get(url: string, headers?: any): Promise<IRestClientResult> {
        headers = headers || {};
        return this.networkManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return this.restClient.get(url, headers);
            });
    }

    /**
     * Method to make a POST request  
     * @method AuthenticatedRestClient#post
     * @param  {string} url
     * @param  {any} data
     * @param  {any} headers
     * @returns {Promise} - returns a promise
     */
    public post(url: string, headers: any, data: any): Promise<IRestClientResult> {
        return this.networkManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return this.restClient.post(url, headers, data);
            });
    }

    /**
     * Method to make a PATCH request  
     * @method AuthenticatedRestClient#patch
     * @param  {string} url
     * @param  {any} data
     * @param  {any} headers
     * @returns {Promise} - returns a promise
     */
    public patch(url: string, headers: any, data: any): Promise<IRestClientResult> {
        return this.networkManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return this.restClient.patch(url, headers, data);
            });
    }


    /**
     * Method to make a PUT request 
     * @method AuthenticatedRestClient#put
     * @param  {string} url
     * @param  {any} headers
     * @param  {any} data
     * @returns {Promise} - returns a promise
     */
    public put(url: string, headers: any, data: any): Promise<IRestClientResult> {
        return this.networkManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return this.restClient.put(url, headers, data);
            });
    }

    /**
     * Method to make a DELETE request
     * @method AuthenticatedRestClient#delete
     * @param  {string} url
     * @param  {any} headers
     * @returns {Promise} - returns a promise
     */
    public delete(url: string, headers: any): Promise<IRestClientResult> {
        return this.networkManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return this.restClient.delete(url, headers);
            });
    }

    /**
     * Method to create an auth header from a token
     * @method AuthenticatedRestClient#constructAUthHeader
     * @param {string} token
     * @returns {string} - returns the auth header
     */
    private constructAUthHeader(token) {
        return "Bearer " + token;
    }

}
