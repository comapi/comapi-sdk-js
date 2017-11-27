import { injectable, inject } from "inversify";

import {
    ILogger,
    IComapiConfig,
    IContentData,
    INetworkManager,
    IUploadContentResult
} from "./interfaces";

import { INTERFACE_SYMBOLS } from "./interfaceSymbols";
import { Utils } from "./utils";


@injectable()
export class ContentManager {

    /**        
     * ContentManager class constructor.
     * @class ContentManager
     * @ignore
     * @classdesc Class that implements all the ContentManager functionality.
     * @parameter {ILogger} logger 
     * @parameter {IRestClient} restClient 
     * @parameter {IComapiConfig} ComapiConfig 
     */
    constructor( @inject(INTERFACE_SYMBOLS.Logger) private _logger: ILogger,
        @inject(INTERFACE_SYMBOLS.NetworkManager) private networkManager: INetworkManager,
        @inject(INTERFACE_SYMBOLS.ComapiConfig) private _comapiConfig: IComapiConfig) {
    }

    /**
     * Method to upload content data
     * @param {string} folder - the folder
     * @param {ContentData} content - the content
     * @returns {IUploadContentResult} - the result
     */
    public uploadContent(content: IContentData, folder?: string): Promise<IUploadContentResult> {

        let url = Utils.format(this._comapiConfig.foundationRestUrls.content, {
            apiSpaceId: this._comapiConfig.apiSpaceId,
            urlBase: this._comapiConfig.urlBase,
        });

        return this.networkManager.getValidToken()
            .then(token => {

                return new Promise<IUploadContentResult>((resolve, reject) => {
                    let xhr = new XMLHttpRequest();
                    xhr.open("POST", url);
                    xhr.setRequestHeader("authorization", this.constructAUthHeader(token));

                    let body;

                    if (content.file) {
                        let fd = new FormData();
                        fd.append("file", content.file);
                        body = fd;
                    } else {
                        xhr.setRequestHeader("Content-Type", "application/json");

                        body = JSON.stringify({
                            data: content.data,
                            name: content.name,
                            type: content.type
                        });
                    }

                    xhr.send(body);

                    xhr.onload = () => {
                        let response: IUploadContentResult;

                        try {
                            response = JSON.parse(xhr.responseText);

                            if (this._logger) {
                                this._logger.log(`uploadContent() returned this object: `, response);
                            }

                        } catch (e) {

                            if (this._logger) {
                                this._logger.log(`uploadContent returned this text: ${xhr.responseText}`);
                            }

                            reject(xhr.responseText);
                        }

                        if (xhr.status === 200) {
                            resolve(response);
                        } else {
                            reject(response);
                        }
                    };

                    xhr.onerror = () => {
                        reject(xhr.responseText);
                    };

                    xhr.onabort = () => {
                        reject(xhr.responseText);
                    };

                    xhr.onprogress = (evt) => {
                        if (evt.lengthComputable) {
                            let percentComplete = (evt.loaded / evt.total) * 100;
                            console.log("onprogress: " + percentComplete + " %");
                        }
                    };
                });
            });
    }

    /**
     * Method to create an auth header from a token
     * @method ContentManager#constructAUthHeader
     * @param {string} token
     * @returns {string} - returns the auth header
     */
    private constructAUthHeader(token) {
        return "Bearer " + token;
    }

}
