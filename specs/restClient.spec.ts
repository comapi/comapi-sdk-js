import { Logger } from "../src/logger";
import { RestClient } from "../src/restClient";

/**
 * 
 */
describe("REST API TESTS", () => {
    let restClient: RestClient;

    let data = {
        key1: "val1",
        key2: "val2",
        key3: "val3"
    };

    let headers = {
        "Content-Type": "application/json"
    };

    beforeEach(done => {
        let logger = new Logger();
        restClient = new RestClient(logger);
        done();
    });

    it("should fail correctly", done => {

        restClient.post("http://fffff/missingEndpoint", headers, data)
            .catch(error => {
                expect(error.statusCode).toBe(0);
                done();
            });
    });

    it("should handle a DELETE", done => {

        restClient.delete("http://localhost:6969/testDelete", headers)
            .then(result => {
                expect(result.statusCode).toBe(204);
                done();
            });
    });



    it("should return what I expect ;-)", done => {


        restClient.get("http://localhost:6969/testGet", headers)
            .then(result => {

                console.log(JSON.stringify(result, null, 4));

                expect(result.response.key1).toBe("val1");
                expect(result.response.key2).toBe("val2");
                expect(result.response.key3).toBe("val3");

                // check some headers
                expect(result.headers !== undefined).toBeTruthy();


                expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
                expect(result.headers["X-Powered-By"]).toBe("Express");
                expect(result.headers["Content-Type"]).toBe("application/json; charset=utf-8");


                done();
            });
    });


    it("should return what was POSTED", done => {

        restClient.post("http://localhost:6969/testPost", headers, data)
            .then(result => {

                console.log(JSON.stringify(result, null, 4));


                expect(result.response.key1).toBe("val1");
                expect(result.response.key2).toBe("val2");
                expect(result.response.key3).toBe("val3");
                done();
            });
    });


    it("should return what was PUT", done => {

        restClient.put("http://localhost:6969/testPut", headers, data)
            .then(result => {

                console.log(JSON.stringify(result, null, 4));

                expect(result.response.key1).toBe("val1");
                expect(result.response.key2).toBe("val2");
                expect(result.response.key3).toBe("val3");
                done();
            });
    });




    it("should handle bad requests", done => {

        restClient.post("http://localhost:6969/testBadRequest", headers, data)
            .catch(result => {

                console.log(JSON.stringify(result, null, 4));

                expect(result.statusCode).toBe(400);
                expect(result.response.key1).toBe("val1");
                expect(result.response.key2).toBe("val2");
                expect(result.response.key3).toBe("val3");
                done();
            });


    });


    it("should handle unauthorized", done => {

        restClient.post("http://localhost:6969/testUnauthorized", headers, data)
            .catch(result => {

                console.log(JSON.stringify(result, null, 4));

                expect(result.statusCode).toBe(401);
                done();
            });


    });

    it("should 404 correctly", done => {

        restClient.post("http://localhost:6969/missingEndpoint", headers, data)
            .catch(result => {
                console.log(JSON.stringify(result, null, 4));
                expect(result.statusCode).toBe(404);
                done();
            });
    });

    it("should 500 correctly", done => {

        restClient.post("http://localhost:6969/testServerError", headers, data)
            .catch(result => {
                console.log(JSON.stringify(result, null, 4));
                expect(result.statusCode).toBe(500);
                done();
            });

    });


});


