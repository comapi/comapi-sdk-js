# Cordova Integration

This SDK can easily be incorporated into a cordova app. 
There is no specific Comapi plugin as such as all the necessary functionality required to configure push notifictions are present in the core sdk. You just need to install the sdk into your app.

See the [Installation](./installation.md) section for details of how to do this.

For [Ionic 2](http://ionicframework.com), follow the NPM guidelines.

For Ionic 1 or similar, follow th Bower guidelines.

You will however need a push notification plugin. The SDK implements push in a sandard way so you can just install [phonegap-plugin-push](https://github.com/phonegap/phonegap-plugin-push) or use something similar.


Here are some snippets showing how to send the registrationId to Comapi

Retrieving the push regitrationId is an asynchronous task that will be performed AFTER the cordove `deviceready` event has fired.
This needs to be passed to Comapi and can only be passed after the sdk is initialised and a valid session has been created.
There is potential for a race confition here so i will split the two tasks apart and save the registrationId to localStorage for the purposes of this snippet.

## Getting the registrationId
This snippet is using the `Push` plugin from Ionic Native to retrieve the registrationId and setup a notification handler. There is no Comapi code in here.
```javascript
import { Push } from 'ionic-native';

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
        localStorage.setItem("registrationId", data.registrationId);
    });

    push.on('notification', (data) => {
        console.log("got a pushNotification", data);
    });
    
}
```

## Sending the registrationId to Comapi
This snippet shows how to send the registrationId to Comapi.
The assumption is that you have an initialised sdk and a valid session at this point. Note the Environment import.
```javascript
import { Environment } from "@comapi/sdk-js-foundation";

// Put this somewhere appropriate in your app (at the end of you initialisation/login flow)

let registrationId = localStorage.getItem("registrationId");
// skip if registrationId hasn't been collected
if(registrationId){

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
            console.error("setAPNSPushDetails() faied", error);
        });

    }else if(platform.is('android')){

        sdk.device.setFCMPushDetails(">>> My Package Name <<<", registrationId)
        .then(result => {
            console.log("setFCMPushDetails() succeeded", result);
        })
        .catch(error => {
            console.error("setFCMPushDetails() faied", error);
        });

    }
}else{
    console.error("no registrationId ;-(");
}
```

## Push Payloads

When you send a [message](./sendMessage.md), you can individully craft the platform specific payloads.
They will be received in the notification event handler shown in the first snippet.



