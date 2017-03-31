
var express = require("express");
var bodyParser = require("body-parser");
var njwt = require("njwt");
var etag = require('etag');

var app = express();


var cors = require('cors')

app.use(bodyParser.json());

var corsOptions = {
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    origin: "*",
    exposedHeaders: ["ETag", "Last-Modified", "Access-Control-Allow-Origin", "X-Powered-By"]
};

var signingKey = "205BD61A-B86E-4A3D-9023-F2B1880A0F8F";


function uuid() {
    var d = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Profile mock storage
 */

var profiles = {};


app.use(cors(corsOptions));

app.options('*', cors(corsOptions)); // include before other routes

app.get('/testGet', function (req, res, next) {
    res.status(200).json({ key1: "val1", key2: "val2", key3: "val3" });
});

app.post('/testPost', function (req, res, next) {
    res.status(200).json(req.body);
});

app.put('/testPut', function (req, res, next) {
    res.status(200).json(req.body);
});

app.delete('/testDelete', function (req, res, next) {
    res.sendStatus(204);
});

app.post('/testBadRequest', function (req, res, next) {
    res.status(400).json(req.body);
});

app.post('/testUnauthorized', function (req, res, next) {

    if (req.headers.authorization) {
        // don't really care what it is set to ;-)
        if (req.headers.authorization.indexOf("Bearer ") === 0) {
            var jwt = req.headers.authorization.substr(7);

            if (jwt.length) {
                console.log("testUnauthorized got a jwt: " + jwt);
                res.sendStatus(204);
            } else {
                console.log("testUnauthorized no jwt");
                res.sendStatus(401);
            }
        } else {
            console.log("testUnauthorized no bearer prefix");
            res.sendStatus(401);
        }

    } else {
        console.log("testUnauthorized no jwt");
        res.sendStatus(401);
    }
});

app.post('/testServerError', function (req, res, next) {
    res.sendStatus(500);
});

var profileId = "1375DD09-F19E-4A5B-A14F-6F71B5CF52DF";

Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

app.post('/apispaces/:appSpaceId/sessions', function (req, res, next) {

    // am expecting following in the body:
    // authenticationId
    // jwt

    if (req.body.authenticationId !== undefined && req.body.authenticationToken !== undefined) {

        // some garbage claims ...
        var claims = {
            iss: "issuer",
            sub: "username",
            aud: "audience"
        }

        var jwt = njwt.create(claims, signingKey);

        var sessionInfo = {
            "token": jwt.compact(),
            "session": {
                "id": "56D3B29F-B783-4873-9B8E-DEE28A68CB98",
                "profileId": profileId,
                "deviceId": req.body.deviceId,
                "platform": req.body.platform,
                "platformVersion": req.body.platformVersion,
                "sdkType": req.body.sdkType,
                "sdkVersion": req.body.sdkVersion,
                "sourceIp": "127.0.0.1",
                "isActive": true,
                "createdOn": new Date().toISOString(),
                "expiresOn": new Date().addDays(1).toISOString()
            }
        };


        profiles[profileId] = {
            id: profileId
        };

        res.status(200).json(sessionInfo);

    } else {
        res.sendStatus(400);
    }

});

app.delete('/apispaces/:appSpaceId/sessions/:id', function (req, res, next) {
    var id = req.params.id;

    res.sendStatus(204);
});


app.get('/apispaces/:appSpaceId/sessions/start', function (req, res, next) {

    var authenticationInfo = {
        nonce: "29534444-77BC-44A1-9ECC-0EFA2455835D",
        authenticationId: "510FEFAE-69B1-4434-BB10-EFE77C7B4CD9",
        provider: "jsonWebToken",
        expiresOn: new Date().toISOString()
    };

    res.status(200).json(authenticationInfo);
});




function setEtagHeader(res, data) {
    var _etag = etag(JSON.stringify(data));
    console.log("ETag: " + _etag);
    res.setHeader('ETag', _etag);
}

/**
 * Copy the conversation info and lose the participants prior to setting the ETag ;-)
 */
function setConversationEtagHeader(res, conversationInfo) {
    var copy = JSON.parse(JSON.stringify(conversationInfo));
    delete copy.participants;
    delete copy.createdOn;
    delete copy.updatedOn;
    setEtagHeader(res, copy);
}

function getConversationEtagValue(conversationInfo) {
    var copy = JSON.parse(JSON.stringify(conversationInfo));
    delete copy.participants;
    delete copy.createdOn;
    delete copy.updatedOn;
    return etag(JSON.stringify(copy));
}




/**
 * UPDATE
 */
app.put('/apispaces/:appSpaceId/profiles/:id', function (req, res, next) {
    var id = req.params.id;

    if (profiles[id] !== undefined) {
        var ifMatchHeader = req.headers['if-match'];

        if (ifMatchHeader) {

            var storedEtag = etag(JSON.stringify(profiles[id]));

            if (storedEtag != ifMatchHeader) {
                console.log("There was a concurrency issue updating a profile please refresh and try again");
                res.status(412).send("There was a concurrency issue updating a profile please refresh and try again");
                return;
            }
        }

        setEtagHeader(res, req.body);

        profiles[req.body.id] = req.body;

        var response = clone(req.body);

        // TODO: see if we need this
        response.id = req.body.id,
            response._createdOn = "2016-04-22T12:08:29.534Z";
        response._updatedOn = "2016-04-22T12:08:29.534Z";

        res.status(201).json(response);

    } else {
        res.sendStatus(401);
    }


});


/**
 * GET
 */
app.get('/apispaces/:appSpaceId/profiles/:id', function (req, res, next) {
    var id = req.params.id;

    if (profiles[id] !== undefined) {

        setEtagHeader(res, profiles[id]);

        var response = clone(profiles[id]);
        response.id = id;
        response._createdOn = new Date().toISOString();
        response._updatedOn = response._createdOn;

        res.status(200).json(response);
    } else {
        res.sendStatus(404);
    }

});


/**
 * get profiles 
 */
app.get('/apispaces/:appSpaceId/profiles', function (req, res, next) {

    var query = req.query;

    console.log("query: ", query);

    var response = [profiles[profileId]];

    res.status(200).json(response);
});



/**
 * Dummy method to create a jwt that comapi service will be able to process
 */
app.post('/authenticate', function (req, res, next) {

    var claims = {
        iss: req.body.issuer,
        sub: req.body.username,
        nonce: req.body.nonce,
        aud: req.body.audience
    }

    var jwt = njwt.create(claims, req.body.sharedSecret);

    console.log("jwt:  " + JSON.stringify(jwt, null, 4));

    var token = jwt.compact();

    console.log("token:  " + token);

    res.json({ jwt: token });
});

/**
 * Dummy method to create a new jwt that comapi service will be able to process
 */
app.get('/refresh', function (req, res, next) {

    try {

        var jwt = req.headers.authorization.substr(7);

        var verifiedJwt = njwt.verify(jwt, signingKey);

        var claims = {
            iss: verifiedJwt.body.iss,
            sub: verifiedJwt.body.sub,
            nonce: req.headers.nonce,
            aud: verifiedJwt.body.aud
        }

        var jwt = njwt.create(claims, signingKey);

        console.log("jwt:  " + JSON.stringify(jwt, null, 4));

        var token = jwt.compact();

        console.log("token:  " + token);

        res.json({ jwt: token });

    } catch (e) {
        res.sendStatus(401);
    }
});





var http = require('http').Server(app);

http.listen(6969, function () {
    console.log('Node app is running on port', 6969);
});


/**
 * conversation dummy interface
 */


var conversations = {

};

/**
 * CREATE
 */
app.post('/apispaces/:appSpaceId/conversations', function (req, res, next) {

    if (conversations[req.body.id] === undefined) {
        conversations[req.body.id] = req.body;

        conversations[req.body.id].createdOn = conversations[req.body.id].updatedOn = new Date().toDateString()

        // add an empty array if one not specified ...
        if (!conversations[req.body.id].participants) {
            conversations[req.body.id].participants = [];
        }

        // add an empty messages if one not specified ...
        conversations[req.body.id].messages = [];

        // add an empty events if one not specified ...
        conversations[req.body.id].events = [];
        conversations[req.body.id].nextEventId = 0;


        // add "me" in as a participant of type owner  
        if (req.headers.authorization) {
            // chop off Bearer
            var jwt = req.headers.authorization.substr(7);

            try {
                var verifiedJwt = njwt.verify(jwt, signingKey);
                var me = verifiedJwt.body.sub;

                // make sure I am an owner ...                
                conversations[req.body.id].participants.push({ id: me, role: "owner" });

            } catch (e) {
                console.log(e);
            }
        }

        setConversationEtagHeader(res, conversations[req.body.id]);

        res.status(201).json(conversations[req.body.id]);

    } else {
        // Conflict
        res.sendStatus(409);
    }

});

/**
 * UPDATE
 */
app.put('/apispaces/:appSpaceId/conversations/:conversationId', function (req, res, next) {
    var conversationId = req.params.conversationId;

    function _updateConversation() {

        // UPDATE the conversation 
        conversations[conversationId].name = req.body.name;
        conversations[conversationId].description = req.body.description;
        conversations[conversationId].roles = req.body.roles;
        conversations[conversationId].isPublic = req.body.isPublic;
        conversations[conversationId].updatedOn = new Date().toDateString();

        setConversationEtagHeader(res, conversations[conversationId]);
        res.status(200).json(conversations[conversationId]);
    }


    if (conversations[conversationId] !== undefined) {

        var ifMatchHeader = req.headers['if-match'];

        if (ifMatchHeader) {

            var eTag = getConversationEtagValue(conversations[conversationId]);

            if (eTag !== ifMatchHeader) {

                res.status(412).send("The specified 'if-match' header was not valid, refresh and retry")
            } else {
                _updateConversation();
            }

        } else {
            _updateConversation();
        }

    } else {
        res.status(404).send("The conversation was not found")
    }
});

/**
 * GET
 */
app.get('/apispaces/:appSpaceId/conversations/:conversations', function (req, res, next) {

    var conversationId = req.params.conversations;

    if (conversations[conversationId] !== undefined) {

        setConversationEtagHeader(res, conversations[conversationId]);

        res.status(200).json(conversations[conversationId]);

    } else {
        // Not found
        // res.sendStatus(404);
        res.status(404).send("The conversation was not found")
    }

});


/**
 * DELETE
 */
app.delete('/apispaces/:appSpaceId/conversations/:conversationId', function (req, res, next) {

    var conversationId = req.params.conversationId;

    if (conversations[conversationId] !== undefined) {

        delete conversations[conversationId];

        // No Content
        res.sendStatus(204);

    } else {
        // Not found
        // res.sendStatus(404);
        res.status(404).send("The conversation was not found")
    }

});


function findParticipant(participants, id) {

    // console.log("Looking for \""+id+"\" ...");

    var index = -1;

    for (var i = 0, len = participants.length; i < len; i++) {

        // console.log("is it  \""+participants[i].id+"\" ???");

        if (participants[i].id === id) {
            // console.log("Found in position " +i );
            return i;
        }
    }

    return index;
}


/**
 * add participants to conversation 
 */
app.post('/apispaces/:appSpaceId/conversations/:conversationId/participants', function (req, res, next) {

    var conversationId = req.params.conversationId;

    var conversation = conversations[conversationId];

    if (conversation === undefined) {
        res.sendStatus(404);
    } else {

        var participants = req.body;

        participants.forEach(function (participant) {

            if (findParticipant(conversation.participants, participant.id) === -1) {
                conversation.participants.push({ id: participant.id });
            }

        });

        res.sendStatus(201);

    }

});

/**
 * get participants in conversation 
 */
app.get('/apispaces/:appSpaceId/conversations/:conversationId/participants', function (req, res, next) {

    var conversationId = req.params.conversationId;

    if (conversations[conversationId] === undefined) {
        res.sendStatus(404);
    } else {
        res.status(200).json(conversations[conversationId].participants);
    }

});

/**
 * delete participants in conversation 
 */
app.delete('/apispaces/:appSpaceId/conversations/:conversationId/participants', function (req, res, next) {

    var conversationId = req.params.conversationId;

    var conversation = conversations[conversationId];
    // Standarise the id parameter into an array when a single value comes back
    var ids = req.query.id instanceof Array ? req.query.id : [req.query.id];

    if (conversation === undefined) {
        res.sendStatus(404);
    } else {

        ids.forEach(function (id) {

            var index = findParticipant(conversation.participants, id);

            if (index !== -1) {
                conversation.participants.splice(index, 1);
            }

        });

        res.sendStatus(204);
    }

});


/**
 * Messages
 */
app.post('/apispaces/:appSpaceId/conversations/:conversationId/messages', function (req, res, next) {

    var conversationId = req.params.conversationId;
    var conversation = conversations[conversationId];

    if (conversation === undefined) {
        res.sendStatus(404);
    } else {
        var message = req.body;

        message.id = uuid();

        conversation.messages.push(message);

        conversation.events.push({
            id: conversation.nextEventId++,
            name: "conversationMessage.sent",
        });

        res.status(200).json({ id: message.id });
    }
});

/**
 * isTyping ;-)
 */
app.post('/apispaces/:appSpaceId/conversations/:conversationId/typing', function (req, res, next) {
    res.sendStatus(204);
});

app.post('/apispaces/:appSpaceId/conversations/:conversationId/messages/statusUpdates', function (req, res, next) {

    var conversationId = req.params.conversationId;
    var conversation = conversations[conversationId];

    if (conversation === undefined) {
        res.sendStatus(404);
    } else {
        var updates = req.body;

        updates.forEach(function (update) {

            conversation.events.push({
                id: conversation.nextEventId++,
                name: "conversationMessage." + update.status
            });

        });

        res.send("OK");
    }
});

/**
 * Messges
 */

app.get('/apispaces/:appSpaceId/conversations/:conversationId/messages', function (req, res, next) {

    var conversationId = req.params.conversationId;
    var conversation = conversations[conversationId];

    if (conversation === undefined) {
        res.sendStatus(404);
    } else {

        var response = {
            earliestEventId: 0,
            messages: conversation.messages,
            orphanedEvents: []
        };

        res.status(200).json(response);
    }
});

app.get('/apispaces/:appSpaceId/conversations/:conversationId/events', function (req, res, next) {

    var conversationId = req.params.conversationId;
    var conversation = conversations[conversationId];

    if (conversation === undefined) {
        res.sendStatus(404);
    } else {

        res.status(200).json(conversation.events);
    }
});


/**
 * get token 
 */
app.get('/token/:accountId/:profileId', function (req, res, next) {

    var claims = {
        "accountId": req.params.accountId,
        "permissions": [
            "apps:r",
            "apps:w",
            "apps:d",
            "apps",
            "auth:w",
            "auth:r",
            "auth:d",
            "prof:wo",
            "prof:wa",
            "prof:ro",
            "prof:ra",
            "prof:do",
            "prof:da",
            "chan:rpu",
            "chan:rpr",
            "chan:wpu",
            "chan:wpr",
            "chan:dpu",
            "chan:dpr"
        ],
        "aud": "*",
        "iss": "https://sitf.co.uk",
        "sub": req.params.profileId
    };

    var jwt = njwt.create(claims, signingKey);

    res.status(200).json({ token: jwt.compact() });
});

/**
 * create app space 
 */
app.post('/apispaces', function (req, res, next) {

    var jwt = req.headers.authorization.substr(7);

    try {
        var verifiedJwt = njwt.verify(jwt, signingKey);
        var me = verifiedJwt.body.sub;


        res.status(200).json({
            id: uuid(),
            name: req.body.name,
            createdOn: "2016-08-04T11:41:44.690Z",
            updatedOn: "2016-08-04T11:41:44.690Z"
        });


    } catch (e) {
        console.log(e);
        res.sendStatus(401);
    }

});
/**
 * update app space auth
 */
app.put('/apispaces/:appSpaceId/auth', function (req, res, next) {

    var jwt = req.headers.authorization.substr(7);

    try {
        var verifiedJwt = njwt.verify(jwt, signingKey);
        var me = verifiedJwt.body.sub;

        res.status(200).json({
            audience: req.body.audience,
            idClaim: req.body.idClaim,
            issuer: req.body.issuer,
            sharedSecret: req.body.sharedSecret,
            sessionSecret: uuid()
        });

    } catch (e) {
        console.log(e);
        res.sendStatus(401);
    }

});



/**
 * get conversations 
 */
app.get('/apispaces/:appSpaceId/conversations', function (req, res, next) {

    var result = [];

    var keys = Object.keys(conversations);

    keys.forEach(function (key) {
        result.push(conversations[key]);
    });

    res.status(200).json(result);
});


/**
 * Dummy push methods
 */
app.put('/apispaces/:appSpaceId/sessions/:sessionId/push', function (req, res, next) {
    res.sendStatus(200);
});

app.delete('/apispaces/:appSpaceId/sessions/:sessionId/push', function (req, res, next) {
    res.sendStatus(204);
});

/**
 * Dummy FB method
 */
app.post('/apispaces/:appSpaceId/channels/facebook/state', function (req, res, next) {
    res.send("688E1E43-4899-47D3-A44D-09414880A5A6");
});



