
import {
    IContentData
} from "./interfaces";

/* 
 * Helper class to create the content 
 */
export class ContentData implements IContentData {

    public file: File;
    public data: string;
    public name: string;
    public type: string;

    /**
     * Static method that creates and initialises a ContentData instance from a File object  
     * @param {File} file - the file object 
     * @returns {ContentData}
     */
    public static createFromFile(file: File): ContentData {
        return new ContentData().initFromFile(file);
    }

    /**
     * Static method that creates and initialises a ContentData instance from raw base64 data
     * @param {string} data - the base64 data
     * @param {string} name - the name of the attachment
     * @param {string} type - the type of attachment
     * @returns {ContentData}
     */
    public static createFromBase64(data: string, name: string, type: string): ContentData {
        return new ContentData().initFromBase64Data(data, name, type);
    }

    /**        
     * ContentData class constructor.
     * @class ContentData
     * @classdesc Class that implements Content Data.
     */
    /* tslint:disable:no-empty */
    constructor() { }
    /* tslint:enable:no-empty */

    /**
     * Method that initialises a ContentData instance from a File object  
     * @method ContentData#initFromFile
     * @param {File} file - the file object 
     * @returns {ContentData}
     */
    public initFromFile(file: File): ContentData {
        this.file = file;
        return this;
    }

    /**
     * Method that initialises a ContentData instance from raw base64 data
     * @method ContentData#initFromBase64Data
     * @param {string} data - the base64 data
     * @param {string} name - the name of the attachment
     * @param {string} type - the type of attachment
     * @returns {ContentData}
     */
    public initFromBase64Data(data: string, name: string, type: string): ContentData {
        this.data = data;
        this.name = name;
        this.type = type;
        return this;
    }

}

