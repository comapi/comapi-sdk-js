# SDK Initialisation

To initialise the SDK, you will need a few pre-requisites ...

1) A configured API space

2) An authentication provider that can generate a jwt that matches the auth scheme configured for your Api Space.

3) The generated JWT `must` include the provided nonce as a claim in the generated jwt 


## ES6
Here is a typescript sample using ES6 import syntax (available from the npm package)
```javascript
// some app specific imports
import { AppSettings } from "../settings";
import { AuthService } from "./auth";

// Comapi class / interface imports
import { Foundation, ComapiConfig, IAuthChallengeOptions } from "@comapi/sdk-js-foundation"

export class ComapiService {

    public sdk: Foundation;

    private authChallenge(options: IAuthChallengeOptions, answerAuthenticationChallenge) {
        this._authService.getToken(options.nonce)
            .then((token) => {
                answerAuthenticationChallenge(token);
            });
    }

    constructor(private _authService: AuthService) { }

    /**
     * Public method to encapsulate up the initialisation of Comapi 
     */
    public initialise(): Promise<Foundation> {

        return new Promise((resolve, reject) => {

            if (this._authService.isAuthenticated()) {

                let comapiConfig = new ComapiConfig()
                    .withApiSpace(AppSettings.APP_SPACE_ID)
                    // Note the this pointer binding so I can access this._authService in the authChallenge calllback
                    .withAuthChallenge(this.authChallenge.bind(this));

                Foundation.initialise(comapiConfig)
                    .then((sdk) => {
                        this.sdk = sdk;
                        console.log("foundation interface created");
                        resolve(sdk);
                    })
                    .catch((error) => {
                        console.error("initialise failed", error);
                        reject(error);
                    });
            } else {
                reject("Not logged in");
            }
        });
    }
}

```


## Classical

```javascript
function authChallenge(options, answerAuthenticationChallenge) {

    authService.getToken(options.nonce)
        .then((token) => {
            answerAuthenticationChallenge(token);
        })
        .catch(error=>{
            answerAuthenticationChallenge(null);            
        });
}

var comapiConfig = new COMAPI.ComapiConfig()
    .withApiSpace(appConfig.apiSpaceId)
    .withAuthChallenge(authChallenge);

COMAPI.Foundation.initialise(comapiConfig)
    .then(function (sdk) {
        console.log("Foundation interface created", sdk);
    })
    .catch(function (error) {
        $log.error("paragonService: failed to initialise", error);
    });

```

## Advanced options

The above examples initialised the SDK with minimal configuration. You can customise the sdk behaviour with the following optional settings

### logRetentionTime
When the SDK uses indexedDB to persist logs, they are purged on SDK initialisation.
this value represents the number of hours to keep logs for - the default value is 24

### logLevel
This parameter controls what level of logging to perform.

```javascript
export enum LogLevels {
    None,
    Error,
    Warn,
    Debug
};
```
The default setting is to only log errors.

### logPersistence
This parameter controls whether and where to persist log data.
The historic data is available via a call to `Foundation.getLogs()`
```javascript
export enum LogPersistences {
    None,
    IndexedDB,
    LocalStorage
};
```
The default setting is to use local storage.
IndexedDB is more performant but may require a poly-fill.

# Authentication

## JWT

The Comapi Auth Challenge needs to generate and return a [jwt](https://jwt.io/) via the answerAuthenticationChallenge method.

There are 4 pieces fo data that need to be specified in the Comapi portal for the ApiSpace auth settings

1) Issuer
2) Audience
3) Shared Secret
4) ID Claim

A cryptographic [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce) is used as part of the authentication flow. This is passed into the authChallenge (`options.nonce`) and needs to be added as a claim in the generated jwt.

The below sample uses [jsrsasign](https://kjur.github.io/jsrsasign/) to dynamically create a client side jwt  ...

```javascript
function authChallenge (options, answerAuthenticationChallenge) {
    // Header
    var oHeader = { alg: 'HS256', typ: 'JWT' };
    // Payload
    var tNow = KJUR.jws.IntDate.get('now');
    var tEnd = KJUR.jws.IntDate.get('now + 1day');
    var oPayload = {
        sub: "john smith",
        nonce: options.nonce,
        iss: "https://my-issuer.com",
        aud: "https://my-audience.com",
        iat: tNow,
        exp: tEnd,
    };
    var sHeader = JSON.stringify(oHeader);
    var sPayload = JSON.stringify(oPayload);
    var sJWT = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, "my shared secret");
    answerAuthenticationChallenge(sJWT);
}
```

This node express method uses the [njwt](https://github.com/jwtk/njwt) package. and achieves the same as above but server - side 

```javascript
/**
 * @Params {string} req.body.username
 * @Params {string} req.body.password
 * @Params {string} req.body.nonce
 */
app.post('/authenticate', function (req, res, next) {

    // TODO: authenticate username & password ...

    var claims = {
        iss: "https://my-issuer.com",
        sub: req.body.username,
        nonce: req.body.nonce,
        aud: "https://my-audience.com"
    }

    var jwt = njwt.create(claims, "my shared secret");
    var token = jwt.compact();
    res.json({ jwt: token });
});
```

The following auth challenge could be used in conjunction with the above node endpoint ..

```javascript
function authChallenge (options, answerAuthenticationChallenge) {

    $http.post("/authenticate", { 
            username: "johnSmith" 
            password: "Passw0rd!",
            nonce: options.nonce })
        .then(function (response) {
            answerAuthenticationChallenge(response.data.token);
        })
        .catch(function (error) {
            answerAuthenticationChallenge(null);
        });
}
```

# Sessions

To call onto any of the Comapi services, a valid session is required. This is what the authChallenge is for. Whenever Comapi needs a session and it doesn't have a currently active one, it will run through the auth flow as part of session creation.

You can explicitly start a session or the SDK will create one on the fly the first time you call a method that requires one

To start a session manually as part of the initialisation flow, you can do the following ...

```javascript
Foundation.initialise(comapiConfig)
    .then(sdk => {
        console.log("sdk initialised", sdk);        
        return sdk.startSession();
    })
    .then(sessionInfo => {
        console.log("session started", sessionInfo);
    })
    .catch(error => {
        console.error("Something went wrong", error);
    });
```