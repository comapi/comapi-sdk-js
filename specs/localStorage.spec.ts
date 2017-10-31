import { LocalStorageData } from "../src/localStorageData";

/**
 * 
 */
describe("localStorage tests", () => {
  let ls;

  let data = {
    key1: "val1",
    key2: "val2",
    key3: "val3"
  };

  beforeEach(() => {
    ls = new LocalStorageData(undefined);
    ls.prefix = "unit.tests.";
  });

  it("should add a value", (done) => {

    ls.setObject("testKey", data)
      .then(result => {
        return ls.getObject("testKey");
      })
      .then(result => {
        expect(result.key1).toEqual(data.key1);
        expect(result.key2).toEqual(data.key2);
        expect(result.key3).toEqual(data.key3);
        done();
      });
  });



  it("should delete a value", (done) => {

    ls.remove("testKey")
      .then(result => {
        return ls.getObject("testKey");
      })
      .then(result => {
        expect(result).toEqual(null);
        done();
      });
  });

  it("should fail gracefully when cant set", (done) => {

    let obj: any = {};
    obj.a = { b: obj };

    ls.setObject("testKey2", obj)
      .then(succeeded => {
        expect(succeeded).toEqual(false);
        return ls.getObject("testKey2");
      })
      .then(result => {
        expect(result).toEqual(null);
        done();
      });

  });


  it("should fail gracefully when cant get", (done) => {

    // put some junk in taht won't parse
    // this test just to get code coverage ...
    ls.setString("testKey3", "[broken")
      .then(result => {
        return ls.getObject("testKey3");
      })
      .then(result => {
        expect(result).toEqual(null);
        return ls.remove("testKey3");
      })
      .then(result => {
        done();
      });

  });

});
