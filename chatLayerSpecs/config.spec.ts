import { ComapiChatConfig } from "../chatLayer/src/chatConfig"

describe("chat config tests", () => {

    it("should build an IComapiChatConfig object", () => {

        let config = new ComapiChatConfig()
            .withApiSpace("CBA5F811-34F6-4572-8651-30BD20C5552F")
            .withStore(null)
            .withEventPageSize(2)
            .withMessagePageSize(3)
            .withLazyLoadThreshold(4);

        expect(config.conversationStore).toBeNull();
        expect(config.eventPageSize).toBe(2);
        expect(config.messagePageSize).toBe(3);
        expect(config.lazyLoadThreshold).toBe(4);

    });
});