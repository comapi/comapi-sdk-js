import { LocalStorageData } from "../src/localStorageData";

/**
 * 
 */
describe("localStorage tests", () => {
  var ls;

  var data = {
    key1: "val1",
    key2: "val2",
    key3: "val3"
  };

  beforeEach(() => {
    ls = new LocalStorageData("unit.tests.");
  });

  it("should add a value", () => {

    ls.setObject("testKey", data);

    var result = ls.getObject("testKey");

    expect(result.key1).toEqual(data.key1);
    expect(result.key2).toEqual(data.key2);
    expect(result.key3).toEqual(data.key3);

  });



  it("should delete a value", () => {

    ls.remove("testKey");
    var result = ls.getObject("testKey");

    expect(result).toEqual(null);

  });

  it("should fail gracefully when cant set", () => {

    var obj: any = {};
    obj.a = { b: obj };

    var succeeded = ls.setObject("testKey2", obj);

    expect(succeeded).toEqual(false);

    var result = ls.getObject("testKey2");

    expect(result).toEqual(null);


  });


  it("should fail gracefully when cant get", () => {

    // put some junk in taht won't parse
    // this test just to get code coverage ...
    ls.setString("testKey3", "[broken");

    var result = ls.getObject("testKey3");

    expect(result).toEqual(null);

    ls.remove("testKey3");

  });

});
