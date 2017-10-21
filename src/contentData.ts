
import {
    IContentData
} from "./interfaces";

/** 
 * Helper class to create the content 
 */
export class ContentData implements IContentData {

    public file: File;
    public data: string;
    public name: string;
    public type: string;

    /**
     * 
     * @param file 
     */
    public static createFromFile(file: File): ContentData {
        return new ContentData().initFromFile(file);
    }

    /**
     * 
     * @param data 
     * @param name 
     * @param type 
     */
    public static createFromBase64(data: string, name: string, type: string): ContentData {
        return new ContentData().initFromBase64Data(data, name, type);
    }

    /**
     * 
     * @param file 
     */
    private initFromFile(file: File): ContentData {
        this.file = file;
        return this;
    }

    /**
     * 
     * @param data 
     * @param name 
     * @param type 
     */
    private initFromBase64Data(data: string, name: string, type: string): ContentData {
        this.data = data;
        this.name = name;
        this.type = type;
        return this;
    }

}

