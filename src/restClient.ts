import { injectable, inject, optional } from "inversify";
import { ILogger, IRestClient, IRestClientResult, INetworkManager } from "./interfaces";
import { INTERFACE_SYMBOLS } from "./interfaceSymbols";

@injectable()
export class RestClient implements IRestClient {

    // TODO: Needs review ... this generates a circular dependency ...
    protected networkManager: INetworkManager;


    private _readyStates: string[] = [
        "request not initialized",
        "server connection established",
        "request received ",
        "processing request",
        "request finished and response is ready"
    ];

    /**        
     * RestClient class constructor.
     * @class RestClient
     * @ignore
     * @classdesc Class that implements a RestClient.
     * @param {ILogger} [logger] - the logger 
     * @param {INetworkManager} [networkManager] - the network Manager 
     */
    constructor( @inject(INTERFACE_SYMBOLS.Logger) @optional() protected logger?: ILogger,
        /*@inject("NetworkManager") @optional() protected networkManager?: INetworkManager*/) { }



    /**
     * Method to make a GET request 
     * @method RestClient#get
     * @param  {string} url
     * @param  {any} [headers]
     * @returns {Promise} - returns a promise
     */
    public get(url: string, headers?: any): Promise<IRestClientResult> {
        return this.makeRequest("GET", url, headers);
    }

    /**
     * Method to make a POST request  
     * @method RestClient#post
     * @param  {string} url
     * @param  {any} data
     * @param  {any} headers
     * @returns {Promise} - returns a promise
     */
    public post(url: string, headers: any, data: any): Promise<IRestClientResult> {
        return this.makeRequest("POST", url, headers, data);
    }

    /**
     * Method to make a PUT request 
     * @method RestClient#put
     * @param  {string} url
     * @param  {any} headers
     * @param  {any} data
     * @returns {Promise} - returns a promise
     */
    public put(url: string, headers: any, data: any): Promise<IRestClientResult> {
        return this.makeRequest("PUT", url, headers, data);
    }

    /**
     * Method to make a PATCH request 
     * @method RestClient#patch
     * @param  {string} url
     * @param  {any} headers
     * @param  {any} data
     * @returns {Promise} - returns a promise
     */
    public patch(url: string, headers: any, data: any): Promise<IRestClientResult> {
        return this.makeRequest("PATCH", url, headers, data);
    }


    /**
     * Method to make a DELETE request
     * @method RestClient#delete
     * @param  {string} url
     * @param  {any} headers
     * @returns {Promise} - returns a promise
     */
    public delete(url: string, headers: any): Promise<IRestClientResult> {
        return this.makeRequest("DELETE", url, headers);
    }

    /**
     * @param  {XMLHttpRequest} request
     * @param  {any} headers
     */
    private addHeaders(request: XMLHttpRequest, headers: any) {
        for (let prop in headers) {
            if (headers.hasOwnProperty(prop)) {
                request.setRequestHeader(prop, headers[prop]);
            }
        }
    }

    /**
     * 
     */
    private getResponseHeaders(xhr: XMLHttpRequest): any {
        let headers = {};

        let headerStr = xhr.getAllResponseHeaders();

        if (headerStr) {
            let headerPairs = headerStr.split("\u000d\u000a");

            for (let i = 0; i < headerPairs.length; i++) {
                let headerPair = headerPairs[i];
                // Can't use split() here because it does the wrong thing
                // if the header value has the string ": " in it.
                let index = headerPair.indexOf("\u003a\u0020");
                if (index > 0) {
                    let key = headerPair.substring(0, index);
                    let val = headerPair.substring(index + 2);
                    headers[key] = val;
                }
            }
        }

        return headers;
    }

    /**
     * 
     */
    private createCORSRequest(method, url): XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {

            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(method, url, true);

        } /*else if (typeof XDomainRequest != "undefined") {

                // Otherwise, check if XDomainRequest.
                // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
                xhr = new XDomainRequest();
                xhr.open(method, url);

            } else {

                // Otherwise, CORS is not supported by the browser.
                xhr = null;

            }*/
        return xhr;
    }

    /**
     * @param  {string} method (GET,POST,PUT,DELETE)
     * @param  {string} url
     * @param  {any} [headers]
     * @param  {any} [data]
     * @returns {Promise} - returns a promise
     */
    private makeRequest(method: string, url: string, headers?: any, data?: any): Promise<IRestClientResult> {

        return new Promise((resolve, reject) => {

            headers = headers || {};

            // We want this as a default default ...
            if (!headers["Content-Type"]) {
                headers["Content-Type"] = "application/json";
            }

            // Edge wants to cache requests by default ...
            if (!headers["Cache-Control"]) {
                headers["Cache-Control"] = "no-cache";
            }

            if (this.logger) {
                this.logger.log(`${method}'ing ${url}  ...`);
            }

            let xhr = this.createCORSRequest(method, url);

            if (this.logger) {
                this.logger.log("Created XMLHttpRequest ...");
            }

            if (headers !== undefined) {
                this.addHeaders(xhr, headers);
            }

            if (this.logger) {
                this.logger.log("added headers", headers);
            }

            xhr.onload = () => {

                if (this.logger) {
                    this.logger.log("xhr.onload", xhr.responseText);
                }

                let succeeded: boolean = xhr.status >= 200 && xhr.status < 300;

                let result: IRestClientResult = {
                    headers: this.getResponseHeaders(xhr),
                    response: undefined,
                    statusCode: xhr.status,
                };

                if (xhr.responseText) {
                    try {
                        result.response = JSON.parse(xhr.responseText);

                        if (this.logger) {
                            this.logger.log(`${method}'ing to ${url} returned this object: `, result.response);
                        }

                    } catch (e) {
                        result.response = xhr.responseText;

                        if (this.logger) {
                            this.logger.log(`${method}'ing to ${url} returned this text: ${xhr.responseText}`);
                        }
                    }
                }

                if (succeeded) {
                    resolve(result);
                } else {
                    reject(result);
                }
            };

            xhr.onerror = () => {
                // There was a connection error of some sort
                if (this.logger) {
                    this.logger.log("xhr.onerror", xhr.responseText);
                }

                if (this.logger) {
                    this.logger.error(`${method}'ing to ${url} failed`);
                }

                let result: IRestClientResult = {
                    headers: this.getResponseHeaders(xhr),
                    response: xhr.responseText,
                    statusCode: xhr.status,
                };

                reject(result);
            };

            xhr.onreadystatechange = (evt) => {
                if (this.logger) {
                    this.logger.log(`onreadystatechange: ${this._readyStates[xhr.readyState]} [status=${xhr.status}]`);
                }
            };

            xhr.onabort = (evt) => {
                if (this.logger) {
                    this.logger.log("onabort", evt);
                }
            };

            xhr.send(data ? JSON.stringify(data) : null);

            if (this.logger) {
                this.logger.log("send data", data);
            }
        });
    }
}
