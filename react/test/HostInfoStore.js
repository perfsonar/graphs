import chai from 'chai';
var assert = chai.assert;
import HostInfoStore from "../src/HostInfoStore";

HostInfoStore.serverURLBase = 'http://perfsonar-dev8.grnoc.iu.edu/perfsonar-graphs/';

console.log( "serverURLBase", HostInfoStore.serverURLBase);

import jsdom from "node-jsdom";

var nock = require('nock');

var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;


describe('HostInfoStore', function( doneParent ) {

        var scope = nock('http://perfsonar-dev8.grnoc.iu.edu')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2')
                        .reply(200,
                            [{"dest_host":"ANantes-651-1-49-2.w2-0.abo.wanadoo.fr","dest_ip":"2.0.0.2","source_host":null,"source_ip":"1.0.0.1ZZZZ"}]
                        );

        nock('http://perfsonar-dev8.grnoc.iu.edu')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=3.0.0.3&dest=4.0.0.4')
                        .reply(200,
[{
    "dest_host": "l0.cambridge1-sr3.bbnplanet.net",
                            "dest_ip": "4.0.0.4",
                            "source_host": "n003-000-000-000.static.ge.com",
                            "source_ip": "3.0.0.3"
}]
                        );
        describe('Get Host Info', function() {
                var emitter = new EventEmitter();






                var url = 'http://perfsonar-dev8.grnoc.iu.edu/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2';
                //console.log("url", url);

                var five = 5;
                it("Should return correct HostInfo data test1", function ( done ) {

                var spy = sinon.spy();
                //emitter.on('get', spy);
                //emitter.on('get', function() { console.log("got 'get~!!!'!!!!11") } );

                var subscriber = function( ) {
                    var expectedResult =
                        [ { dest_host: 'ANantes-651-1-49-2.w2-0.abo.wanadoo.fr',
                            dest_ip: '2.0.0.2',
                            source_host: null,
                            source_ip: '1.0.0.1ZZZZ' } ];

                    emitter.emit('get');
                    //spy();

                    var outputData = HostInfoStore.getHostInfoData();

                    HostInfoStore.unsubscribe( subscriber );
                    assert.deepEqual( expectedResult, outputData );
                    //sinon.assert.calledOnce(spy);
                    done();
                };

                HostInfoStore.subscribe( subscriber );
                //HostInfoStore.subscribe( spy );


                HostInfoStore.retrieveHostInfo( "1.0.0.1", "2.0.0.2");

                });

                it("Should return correct HostInfo data test2", function ( done ) {

                var spy = sinon.spy();
                //emitter.on('get', spy);

                var subscriber2 = function( ) {
                    var expectedResult =
                    [{
                        "dest_host": "l0.cambridge1-sr3.bbnplanet.net",
                        "dest_ip": "4.0.0.4",
                        "source_host": "n003-000-000-000.static.ge.com",
                        "source_ip": "3.0.0.3"
                    }];
                    emitter.emit('get');
                    //spy();
                    //sinon.assert.calledOnce(spy);

                    var outputData = HostInfoStore.getHostInfoData();

                    HostInfoStore.unsubscribe( subscriber2 );

                    assert.deepEqual( expectedResult, outputData );
                    done();
                };

                HostInfoStore.subscribe( subscriber2 );
                //HostInfoStore.subscribe( spy );


                HostInfoStore.retrieveHostInfo( "3.0.0.3", "4.0.0.4");

                });

                //sinon.assert.calledOnce(spy);


                //

                //console.log("spy.calledOnce", spy.calledOnce);
                //assert(spy.calledOnce);

                //HostInfoStore.retrieveHostInfo( "1.0.0.1", "2.0.0.3");

                //console.log("scope", scope);
                assert.equal(five, 5);
        });
    });
