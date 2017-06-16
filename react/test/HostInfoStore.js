import chai from 'chai';
var assert = chai.assert;

import HostInfoStore from "../src/HostInfoStore";

import jsdom from "jsdom";

var nock = require('nock');

var sinon = require('sinon');
var EventEmitter = require('events').EventEmitter;

describe('HostInfoStore', function( doneParent ) {

    describe('_getURL', function() {
        it("should generate relative URLs correctly", function() {
            HostInfoStore.serverURLBase = '';
            var result =  HostInfoStore._getURL( 'test1/test2' );
            assert.equal( result, 'test1/test2' );
            HostInfoStore.serverURLBase = 'http://host.domain.org/perfsonar-graphs/';
        });

        it("should generate absolute URLs correctly", function() {
            HostInfoStore.serverURLBase = 'http://host.domain.org/perfsonar-graphs/';
            var result =  HostInfoStore._getURL( 'cgi-bin/script.cgi' );
            assert.equal( result, 'http://host.domain.org/perfsonar-graphs/cgi-bin/script.cgi' );
        });
    });

        var scope = nock('http://host.domain.org')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=1.0.0.1&dest=2.0.0.2')
                        .reply(200,
                            [{"dest_host":"ANantes-651-1-49-2.w2-0.abo.wanadoo.fr","dest_ip":"2.0.0.2","source_host":null,"source_ip":"1.0.0.1ZZZZ"}]
                        );

        nock('http://host.domain.org')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=3.0.0.3&dest=4.0.0.4')
                        .reply(200,
[{
    "dest_host": "l0.cambridge1-sr3.bbnplanet.net",
                            "dest_ip": "4.0.0.4",
                            "source_host": "n003-000-000-000.static.ge.com",
                            "source_ip": "3.0.0.3"
}]
                        );

        nock('http://host.domain.org')
                        .get('/perfsonar-graphs/cgi-bin/graphData.cgi?action=hosts&src=3.0.0.3&dest=4.0.0.4')
                        .reply(404, "not found"
                        );
        describe('Get Host Info', function() {
                var emitter = new EventEmitter();



                it("Should return correct HostInfo data test1", function ( done ) {

                var spy = sinon.spy();

                var subscriber = function( ) {
                    var expectedResult =
                        [ { dest_host: 'ANantes-651-1-49-2.w2-0.abo.wanadoo.fr',
                            dest_ip: '2.0.0.2',
                            source_host: null,
                            source_ip: '1.0.0.1ZZZZ' } ];

                    emitter.emit('get');

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
                        var expectedResult = [{
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

                it("Should handle a 404 error from HostInfo data correctly", function ( done ) {

                    var spy = sinon.spy();
                    var successSpy = sinon.spy();

                    var errorSubscriber3 = function( ) {
                        var expectedResult = {
                            errorStatus: 'error',
                            responseText: 'not found',
                            statusText: 'error',
                            errorThrown: 404
                        };

                        var errorData = spy.args[0][0];

                        HostInfoStore.unsubscribe( errorSubscriber3 );

                        // Correct response data is returned
                        assert.deepEqual( expectedResult, errorData );

                        // Make sure we've been called once (for "error" events)
                        sinon.assert.calledOnce(spy);

                        // Make sure "success" subscriber was not called, since 
                        // there was an error
                        sinon.assert.notCalled(successSpy);
                        done();
                    };

                    HostInfoStore.subscribeError( errorSubscriber3 );


                    HostInfoStore.subscribe( successSpy );


                    HostInfoStore.retrieveHostInfo( "3.0.0.3", "4.0.0.4", spy);

                });



        });

    });
