import chai from 'chai';
var assert = chai.assert;
import HostInfoStore from "../src/HostInfoStore";

HostInfoStore.serverURLBase = 'http://perfsonar-dev8.grnoc.iu.edu/perfsonar-graphs/';

console.log( "serverURLBase", HostInfoStore.serverURLBase);

import jsdom from "node-jsdom";

var nock = require('nock');

var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;


    describe('HostInfoStore', function( done ) {
        var options = {
            // respondImmediately: true
            //autoRespond: true
        };

        var scope = nock('http://perfsonar-dev8.grnoc.iu.edu')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2')
                        .reply(200,
                            [{"dest_host":"ANantes-651-1-49-2.w2-0.abo.wanadoo.fr","dest_ip":"2.0.0.2","source_host":null,"source_ip":"1.0.0.1ZZZZ"}]
                        );

        nock('http://perfsonar-dev8.grnoc.iu.edu')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.3')
                        .reply(200,
                            [{"dest_host":"ANantes-651-1-49-2.w2-0.abo.wanadoo.fr","dest_ip":"2.0.0.2","source_host":null,"source_ip":"1.0.0.3ZZZZ"}]
                        );
        describe('Get Host Info', function() {
                var emitter = new EventEmitter();

            //before(function () { server = sinon.fakeServer.create(); });
            /*
            before(function () {
                console.log("use fake server");
                server = sinon.fakeServer.create( options );
            });
            after(function () { server.restore(); });

*/
            it("Should return correct HostInfo data", function () {




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

                var spy = sinon.spy();
                //emitter.on('get', spy);
                emitter.on('get', function() { console.log("got 'get~!!!'!!!!11") } );

                let subscriber = function( ) {
                    console.log("got got got!!!!");
                    emitter.emit('get');
                    //spy();
                    sinon.assert.calledOnce(spy);

                    let outputData = HostInfoStore.getHostInfoData();
                    console.log("outputData", outputData);

                    let expectedResult =
                        [ { dest_host: 'ANantes-651-1-49-2.w2-0.abo.wanadoo.fr',
                            dest_ip: '2.0.0.2',
                            source_host: null,
                            source_ip: '1.0.0.1ZZZZ' }
                        ];

                    assert.equalDeep( expectedResult, outputData );
                    done();
                };

                HostInfoStore.subscribe( subscriber );
                //HostInfoStore.subscribe( spy );


                HostInfoStore.retrieveHostInfo( "1.0.0.1", "2.0.0.2");


                //sinon.assert.calledOnce(spy);


                //

                //console.log("spy.calledOnce", spy.calledOnce);
                //assert(spy.calledOnce);

                //HostInfoStore.retrieveHostInfo( "1.0.0.1", "2.0.0.3");

                //console.log("scope", scope);

                //console.log("server.responses[0]", server.responses[0]);
                //server.respond();
                //done();
                //console.log("server", server);

                //console.log("$ it", $);
                //console.log("server", server);
                //assert(callback.calledOnce);

                //assert.equal(server.requests.length, 0);
                //done();
                assert.equal(five, 5);
                //assert.equal(server.responses.length, 2);

                //assert($.ajax.calledWithMatch({ url: '/todo/42/items' }));

                //assert.match(requests[0].url, "/todo/42/items");
            });
        });
    });
//});
