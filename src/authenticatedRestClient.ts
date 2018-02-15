import { injectable, inject } from "inversify";
import { ILogger, IRestClient, IRestClientResult, INetworkManager } from "./interfaces";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";


@injectable()
export class AuthenticatedRestClient implements IRestClient {

    private retryCount: number = 3;
    /**        
     * AuthenticatedRestClient class constructor.
     * @class AuthenticatedRestClient
     * @ignore
     * @classdesc Class that implements an Authenticated RestClient.
     * @param {ILogger} logger - the logger 
     * @param {IRestClient} restClient - the restClient 
     * @param {INetworkManager} networkManager - the Network Manager 
     */
    constructor( @inject(INTERFACE_SYMBOLS.Logger) private logger: ILogger,
        @inject(INTERFACE_SYMBOLS.RestClient) private restClient: IRestClient,
        @inject(INTERFACE_SYMBOLS.NetworkManager) private networkManager: INetworkManager) { }

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
                return this.makeRequestWithRetry(0, this.restClient.get.bind(this.restClient), url, headers);
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
                return this.makeRequestWithRetry(0, this.restClient.post.bind(this.restClient), url, headers, data);
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
                return this.makeRequestWithRetry(0, this.restClient.patch.bind(this.restClient), url, headers, data);
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
                return this.makeRequestWithRetry(0, this.restClient.put.bind(this.restClient), url, headers, data);
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
                return this.makeRequestWithRetry(0, this.restClient.delete.bind(this.restClient), url, headers);
            });
    }


    /**
     * Method to check token prior to making a rest call and retry on 401 if necessary ...
     * @param {number} count - The number of retries (this function is called recursively)
     * @param {Function} verb  - The actual rest method to call 
     * @param {string} url  - The url
     * @param {any} [headers] - The headers
     * @param {any} [data]  - The data
     */
    private makeRequestWithRetry(count: number, verb: Function, url: string, headers?: any, data?: any) {

        return verb(url, headers, data)
            .catch(result => {
                if (count < this.retryCount && result.statusCode === 401 && this.networkManager) {
                    return this.networkManager.restartSession()
                        .then(sessionInfo => {
                            headers.authorization = this.constructAUthHeader(sessionInfo.token);
                            return this.makeRequestWithRetry(++count, verb, url, headers, data);
                        });
                }
                throw result;
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
