# Profile API

When a user is created, a profile is also automatically generated. 
The application can store user specific information in the profile.

## Querying the user's profile

```javascript
sdk.profile.getMyProfile()
    .then(function (profile) {
        console.log("getMyProfile() succeeded", profile);
    })
    .catch(function (error) {
        console.error("getMyProfile() failed", error);
    });
```

## Updating the user's profile

```javascript
sdk.services.profile.updateMyProfile(profile)
    .then(function (updatedProfile) {
        console.error("updateMyProfile() succeeded", updatedProfile);
    })
    .catch(function (error) {
        console.error("updateMyProfile() failed", error);
    });
```

## eTags

The sdk internally uses [eTags](https://en.wikipedia.org/wiki/HTTP_ETag) to prevent simultaneous updates of the profile from overwriting each other.

If you want to update a profile, you need to query it first, make the appropriate changes to it and then update it.Whe the profile is queried, an eTag is internally stored and passed back in the update. If they don't match, an error wil be returned. This means that the state of the profile has changed since it was queried and what we tried to update is now stale.

For more info on where eTags are used in the Comapi sdk, please see this [section](./eTags.md)
