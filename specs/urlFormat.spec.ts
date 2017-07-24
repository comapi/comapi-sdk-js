import { Utils } from "../src/utils";

/**
 * 
 */
describe("Url formatting Tests", () => {

    let getParticipantsUrl: string = "{{urlBase}}/apispaces/{{apiSpaceId}}/conversations/{{conversationId}}/participants";

    it("should format a url", () => {

        let model = {
            apiSpaceId: "1234",
            conversationId: "5678",
            urlBase: "http://test.com",
        };

        let formatted = Utils.format(getParticipantsUrl, model);

        expect(formatted).toBe("http://test.com/apispaces/1234/conversations/5678/participants");

    });

    it("should format correctly with missing data", () => {

        let model = {
            apiSpaceId: "1234",
            // conversationId: "5678",
            urlBase: "http://test.com",
        };

        let formatted = Utils.format(getParticipantsUrl, model);

        expect(formatted).toBe("http://test.com/apispaces/1234/conversations//participants");

    });




});
