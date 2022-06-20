# Cordova Integration

This SDK can easily be incorporated into a cordova app. 
There is no specific Comapi plugin as such as all the necessary functionality required to configure push notifictions are present in the core sdk. You just need to install the SDK into your app.

See the [Installation](./installation.md) section for details of how to do this.

For [Ionic 2](http://ionicframework.com), follow the NPM guidelines.

For Ionic 1 or similar, follow the Bower guidelines.

You will however need a push notification plugin. The SDK implements push in a standard way so you can just install [phonegap-plugin-push](https://github.com/phonegap/phonegap-plugin-push) or use something similar.


Here are some snippets showing how to send the registrationId to Comapi

Retrieving the push registrationId is an asynchronous task that will be performed AFTER the cordova `deviceready` event has fired.
This needs to be passed to Comapi and can be passed via ComapiConfig or after the SDK is initialised and a valid session has been created.

## Getting the registrationId
This snippet is using the `Push` plugin from Ionic Native to retrieve the registrationId and then initialise the sdk
```javascript
import { Push } from 'ionic-native';
import { Foundation, Environment, ComapiConfig, IPushConfig } from "@comapi/sdk-js-foundation";


platform.ready().then(() => {

    let push = Push.init({
        ios: {
        alert: "true",
        badge: true,
        sound: 'false'
        }
    });

    push.on('registration', (data) => {
        console.log("got a registrationId", data.registrationId);

        let pushConfig: IPushConfig = {};

        // NOTE: you cannot set both apns and fcm 
        // - identify the platform and set the appropriate device specific config
        // this device object is from cordova-plugin-device
        if (device.platform === 'iOS') {
            pushConfig.apns = {
                bundleId: ">>> My Bundle Id <<<",
                environment: Environment.development, 
                token: data.registrationId
            };       
        } else if (device.platform === 'Android') {
            pushConfig.fcm = {
                package: ">>> My Package Name <<<",
                registrationId: data.registrationId
            };
        }

        var comapiConfig = new ComapiConfig()
            .withApiSpace(AppSettings.APP_SPACE_ID)
            .withAuthChallenge(challengeHandler)
            .withPushConfiguration(pushConfig);

        const _comapiSDK;

        Foundation.initialise(comapiConfig)
            .then(function (result) {
                _comapiSDK = result;
                console.log("Initialised, starting session ...")
                return _comapiSDK.startSession();
            });
    });
 
    push.on('notification', (data) => {
        console.log("got a pushNotification", data);
    });
    
}
```

## Sending the registrationId to Comapi
The registrationId can either be passed at initialisation time as in the above snippet or passed separately depending on your requirements.

This function snippet shows how to send the registrationId to Comapi manually


```javascript
function setPushDetails(sdk, registrationId){
    // There are separate methods to call depending on platform ...
    if (platform.is('ios')) {

        // You will need to create an APNS cert. in the apple developer portal.
        // Then you must upload it to your API space in the Comapi portal.
        // Can be a development or production cert, hence the environment parameter
        sdk.device.setAPNSPushDetails(">>> My Bundle Id <<<", Environment.development, registrationId)
        .then(result => {
            console.log("setAPNSPushDetails() succeeded", result);
        })
        .catch(error => {
            console.error("setAPNSPushDetails() failed", error);
        });

    }else if(platform.is('android')){

        sdk.device.setFCMPushDetails(">>> My Package Name <<<", registrationId)
        .then(result => {
            console.log("setFCMPushDetails() succeeded", result);
        })
        .catch(error => {
            console.error("setFCMPushDetails() failed", error);
        });
    }
}
```

## Push Payloads

When you send a [message](./sendMessage.md), you can individually craft the platform specific payloads.
They will be received in the notification event handler shown in the first snippet.