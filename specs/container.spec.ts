import { injectable, inject, Container } from "inversify";
import "reflect-metadata";

describe("IOC tests", () => {

  it("Should be able to store bindings", () => {

    interface INinja {
      action(): string;
    }

    @injectable()
    class Ninja implements INinja {
      public action() {
        return "kill";
      }
    }
    let ninjaId = "Ninja";

    let container = new Container();
    container.bind<INinja>(ninjaId).to(Ninja);


    let ninja = container.get<INinja>(ninjaId);

    expect(ninja).toBeDefined();

    expect(ninja instanceof Ninja).toBeTruthy();

    expect(ninja.action()).toBe("kill");

  });

  it("Should fill in all dependencies", () => {

    interface ILogger {
      log(string): void;
    }

    @injectable()
    class Logger implements ILogger {
      public log(message) {
        console.log(message);
      }
    }
    let logId = "Logger";

    interface IClown {
      juggle(): void;
    }

    @injectable()
    class Clown implements IClown {

      private _logger: Logger;

      public constructor( @inject(logId) logger: Logger) {
        this._logger = logger;
      }

      public juggle() {
        this._logger.log("Im juggling");
      }

    }
    let clownId = "Clown";

    let container = new Container();
    container.bind<ILogger>(logId).to(Logger);
    container.bind<IClown>(clownId).to(Clown);

    let clown = container.get<IClown>(clownId);


    expect(clown).toBeDefined();

    clown.juggle();




  });


  it("Should fill in all dependencies", () => {

    interface ILogger {
      log(string): void;
    }

    @injectable()
    class Logger implements ILogger {
      public log(message) {
        console.log(message);
      }
    }
    let logId = "Logger";

    interface IClown {
      juggle(): void;
    }

    @injectable()
    class Clown implements IClown {

      @inject(logId) private _logger: Logger;

      public juggle() {
        this._logger.log("Im juggling");
      }

    }

    let clownId = "Clown";

    let container = new Container();
    container.bind<ILogger>(logId).to(Logger);
    container.bind<IClown>(clownId).to(Clown);

    let clown = container.get<IClown>(clownId);

    expect(clown).toBeDefined();

    clown.juggle();

  });



  it("Should fill in dynamic dependencies", () => {

    interface ILogger {
      log(string): void;
    }

    class Logger implements ILogger {
      public log(message) {
        console.log(message);
      }
    }
    let logId = "Logger";

    interface IClown {
      juggle(): void;
    }

    @injectable()
    class Clown implements IClown {

      @inject(logId) private _logger: Logger;

      public juggle() {
        this._logger.log("Im juggling");
      }

    }

    let clownId = "Clown";

    let container = new Container();
    container.bind<ILogger>(logId).toDynamicValue((context) => {
      console.log("context", context);
      return new Logger();
    });
    container.bind<IClown>(clownId).to(Clown);

    let clown = container.get<IClown>(clownId);

    expect(clown).toBeDefined();

    clown.juggle();

  });

});