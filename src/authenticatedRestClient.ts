import { ISessionManager, ILogger, IRestClient, IRestClientResult } from "./interfaces";
import { RestClient } from "./restClient";


export class AuthenticatedRestClient extends RestClient implements IRestClient {

    /**        
     * AuthenticatedRestClient class constructor.
     * @class AuthenticatedRestClient
     * @ignore
     * @classdesc Class that implements an Authenticated RestClient.
     * @param {ILogger} logger - the logger 
     * @param {ISessionManager} sessionManager - the Session Manager 
     */
    constructor(logger: ILogger, sessionManager: ISessionManager) {
        super(logger, sessionManager);
    }

    /**
     * Method to make a GET request 
     * @method AuthenticatedRestClient#get
     * @param  {string} url
     * @param  {any} [headers]
     * @returns {Promise} - returns a promise
     */
    public get(url: string, headers?: any): Promise<IRestClientResult> {
        headers = headers || {};
        return this.sessionManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return super.get(url, headers);
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
        return this.sessionManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return super.post(url, headers, data);
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
        return this.sessionManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return super.put(url, headers, data);
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
        return this.sessionManager.getValidToken()
            .then(token => {
                headers.authorization = this.constructAUthHeader(token);
                return super.delete(url, headers);
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
