import chai from 'chai';
var assert = chai.assert;
import HostInfoStore from "../src/HostInfoStore";


import jsdom from "node-jsdom";

//import sinon from 'sinon';

var nock = require('nock');


var window;

/*
var $;

require("node-jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }

    $ = require("jquery")(window);
*/
    //console.log("$ inside jsdom", $);

    //console.log("$ document", $);




    var sinon = require("sinon");

    //var vc = new jsdom.VirtualConsole();
    /*
       var vc = jsdom.VirtualConsole();
       vc.on("log", console.log.bind(console.log));
       vc.on("jsdomError", function jsdomError(er) {
       throw er;
       });
       */

    var window;

    var xhr, requests;

    var options = {
        //respondImmediately: true
        //autoRespond: true
    };

    /*
       before(function () { server = sinon.fakeServer.create( (options )); });
       after(function () { server.restore(); });
       */


    /*
       describe('Array', function() {
       describe('#indexOf()', function() {
       it('should return -1 when the value is not present', function() {
       assert.equal(-1, [1,2,3].indexOf(4));
       });
       });
       });
       */

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



    describe('HostInfoStore', function() {
        var options = {
            // respondImmediately: true
            //autoRespond: true
        };
        var server;
        var request = require('request');

        var scope = nock('http://perfsonar-dev8.grnoc.iu.edu')
                        .get('cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2')
                        .reply(200,
                            [{"dest_host":"ANantes-651-1-49-2.w2-0.abo.wanadoo.fr","dest_ip":"2.0.0.2","source_host":null,"source_ip":"1.0.0.1ZZZZ"}]
                        );

        nock('http://perfsonar-dev8.grnoc.iu.edu')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.3')
                        .reply(200,
                            [{"dest_host":"ANantes-651-1-49-2.w2-0.abo.wanadoo.fr","dest_ip":"2.0.0.2","source_host":null,"source_ip":"1.0.0.3ZZZZ"}]
                        );
        describe('Get Host Info', function() {

            //before(function () { server = sinon.fakeServer.create(); });
            /*
            before(function () {
                console.log("use fake server");
                server = sinon.fakeServer.create( options );
            });
            after(function () { server.restore(); });

*/
            it("makes a GET request for host info", function () {




                var callback = sinon.spy();
/*
                
                   server.respondWith("GET", "http://perfsonar-dev8.grnoc.iu.edu/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2",
                   [200, { "Content-Type": "application/json" },
                   '[{ "id": 12, "comment": "Hey there" }]']);
                   
                

                   server.respondWith("GET", "cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.3",
                   [200, { "Content-Type": "application/json" },
                   '[{ "id": 13, "comment": "Dang" }]']);
                   */

                var url = 'http://perfsonar-dev8.grnoc.iu.edu/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2';
                console.log("url", url);
/*
                request(url, function(error, response, body) {
                    console.log("error", error, "body", body);
                    server.respond();
                    if (request.status >= 200 && request.status < 400) {
                        // Success!
                        console.log("got! request!");
                        var data = JSON.parse(request.responseText);
                    } else {
                        // We reached our target server, but it returned an error
                        console.log("error!");

                    }
                    //done();
                });
                */

                var five = 5;



                HostInfoStore.retrieveHostInfo( "1.0.0.1", "2.0.0.2");

                HostInfoStore.retrieveHostInfo( "1.0.0.1", "2.0.0.3");

                //console.log("server.responses[0]", server.responses[0]);
                //server.respond();
                //done();
                console.log("server", server);

                //console.log("$ it", $);
                //console.log("server", server);
                //assert(callback.calledOnce);

                //assert.equal(server.requests.length, 0);
                //done();
                assert.equal(five, 5);
                //assert.equal(server.responses.length, 2);

                //assert($.ajax.calledWithMatch({ url: '/todo/42/items' }));

                assert.match(requests[0].url, "/todo/42/items");
            });
        });
    });
//});
