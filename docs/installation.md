# Installation

Comapi SDK can be installed from either NPM or Bower depending on your intended usage.

If you are integration into a classical javascript project and you just want to include a script that exposes some global objects in your page, then use Bower.

If you are using a project that utilises ES6 modules i.e angular2, ionic2 etc., then use NPM. 

## NPM

### Install SDK ...

```shell
npm install @comapi/sdk-js-foundation --save
```

### Import into your code and access SDK methods ...

```javascript

import { Foundation } from "@comapi/sdk-js-foundation"

class MyClass{
    public displayVersion(){
        console.log(`Comapi version: ${Foundation.version}`);
    }
}

```


## Bower

### Install package from bower ...

```shell
bower install comapi-sdk-js-foundation
```

### Include the script somewhere ...

```html
<script src="bower_components/comapi-sdk-js-foundation/comapi-foundation.js"></script>
```

There is also a minified version `comapi-foundation.min.js` available.

For all subsequent classical snippets, I will assume that this script has been included

### Access SDK methods ...

```javascript
console.log("Comapi version: " + COMAPI.Foundation.version);
```

## Use of ES6 Promises

ES6 Promises are extensively used within this SDK. Depending on what browsers you are targeting, you may need to include a poly-fill for this. Several of these are available online.