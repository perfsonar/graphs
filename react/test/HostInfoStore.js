import chai from 'chai';
var assert = chai.assert;
//import HostInfoStore from "../src/HostInfoStore";


import jsdom from "node-jsdom";


var window;
//var sinon;
//var $;
/*
    jsdom.env({
        html: "",
        scripts: ["node_modules/jquery/dist/jquery.js",
                  "node_modules/sinon/pkg/sinon.js"],
        features: {
            ProcessExternalResources: ["script"],
            FetchExternalResources: ["script", "link"],
        },
        //virtualConsole: vc,
        done: function _done(error, w) {
            if (error) {
                throw error;
            }
            window = w;
            $ = w.$;
            sinon = w.sinon;
            globals.$ = $;
            done();
        },

    });
*/

//var $ = require("jquery");

var $;

require("node-jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }

    $ = require("jquery")(window);
    console.log("$ inside jsdom", $);

console.log("$ document", $);


var sinon = require("sinon");


//import sinon from 'sinon';
//jsdom({src: fs.readFileSync('vendor/bower/jquery/dist/jquery.js', 'utf-8')});

//var vc = new jsdom.VirtualConsole();
/*
var vc = jsdom.VirtualConsole();
vc.on("log", console.log.bind(console.log));
vc.on("jsdomError", function jsdomError(er) {
    throw er;
});
*/

var window;
/*
before(function (done) {
    jsdom.env({
        html: "",
        scripts: ["node_modules/jquery/dist/jquery.js",
                  "node_modules/sinon/pkg/sinon.js"],
        features: {
            ProcessExternalResources: ["script"],
            FetchExternalResources: ["script", "link"],
        },
        //virtualConsole: vc,
        done: function _done(error, w) {
            if (error) {
                throw error;
            }
            window = w;
            $ = w.$;
            sinon = w.sinon;
            done();
        },

    });
});
*/
var server;
var xhr, requests;

var options = {
    respondImmediately: true
    //autoRespond: true
};
before(function () { server = sinon.fakeServer.create( (options )); });
//after(function () { server.restore(); });



describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});

/*
before(function () {
    console.log("usefakerequest");
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];
    xhr.onCreate = function (req) { console.log("pusshing req", req );  requests.push(req); };
});
after(function () {
    // Like before we must clean up when tampering with globals.
    xhr.restore();
});

*/

it("makes a GET request for host info", function () {
    //getTodos(42, sinon.spy());
    let callback = sinon.spy();

 //sinon.stub($, 'ajax');

    server.respondWith("GET", "cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2",
            [200, { "Content-Type": "application/json" },
             '[{ "id": 12, "comment": "Hey there" }]']);

    server.respondWith("GET", "cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.3",
            [200, { "Content-Type": "application/json" },
             '[{ "id": 13, "comment": "Dang" }]']);


    $.ajax({ 
                url: "cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2", 
                success: function( data ) {
                    console.log("got!", data);
                    callback(null, data);
                }
            });

    $.ajax({ 
                url: "cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.3", 
                success: function( data ) {
                    console.log("got!", data);
                    callback(null, data);
                }
            });
    //HostInfoStore.retrieveHostInfo( "1.0.0.1", "2.0.0.2", callback );
    console.log("server", server);
    console.log("server.responses[1]", server.responses[1]);
    //server.respond();
/*
    server.requests[0].respond(
        200,
        { "Content-Type": "application/json" },
        JSON.stringify([{ id: 1, text: "Provide examples", done: true }])
    );
*/

    console.log("$ it", $);
    console.log("server", server);
    //assert(callback.calledOnce);

    //assert.equal(server.requests.length, 1);
    assert.equal(server.responses.length, 2);

    //assert($.ajax.calledWithMatch({ url: '/todo/42/items' }));

    //assert.match(requests[0].url, "/todo/42/items");
});

});
