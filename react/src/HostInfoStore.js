var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();

const axios = require('axios');

const _ = require('underscore');

/*
if ( (typeof jQuery) != "undefined" ) {
    $ = jQuery;
} else {
    $ = require('jquery');
}
*/
module.exports = {

    /* Expects an object of hosts like this (keys must be src, dst (can be multiple -- number of sources and dests must match) ): 
     * {
     *   src: "1.2.3.4,"
     *   dst: "2.3.4.5",
     * }
     * returns host info as
     * { 
     *   src_ip: "1.2.3.4", 
     *   src_host: "hostname.domain"
     *   ...
     *  }
     */
    hostInfo: [],
    tracerouteReqs: 0,
    tracerouteReqsCompleted: 0,
    tracerouteInfo: [],
    serverURLBase: "",

    retrieveTracerouteData: function ( sources, dests, ma_urls ) {
        let baseUrl = "cgi-bin/graphData.cgi?action=has_traceroute_data";
        if ( !_.isArray( ma_urls ) ) {
            ma_urls = [ ma_urls ];
        }
        if ( !_.isArray( sources ) ) {
            sources = [ sources ];
        }
        if ( !_.isArray( dests ) ) {
            dests = [ dests ];
        }
        for( let i in sources ) {
            let ma = ma_urls[i];
            let src = sources[i];
            let dst = dests[i];

            let url = baseUrl;
            url += "&url=" + ma;
            url += "&source=" + src;
            url += "&dest=" + dst

            this.tracerouteReqs = sources.length;
            this.i = i;

            var self = this;
            axios.get(url)
                .then(function(data) {
                    console.log('axios data', data);
                    self.handleTracerouteResponse( data.data, self.i );

                })
                .catch(function(err) {
                    console.log("Error retrieving traceroute data:", err);

                });

            /*
            var xhr = this._createXhr();

            this.serverRequest = xhr.open( "GET",  url );
                    
            xhr.onload = (function(data) {
                    this.handleTracerouteResponse( data, i );
            }).bind(this);

            }
            xhr.send();
            */
    }



    },

    _createXhr: function () {
        return new XMLHttpRequest();
    },

    _getURL: function( relative_url ) {
        return this.serverURLBase + relative_url;
    },
    retrieveHostInfo: function( source_input, dest_input, callback ) {
        let url = this._getURL("cgi-bin/graphData.cgi?action=hosts");

        let sources;
        let dests;
        if ( Array.isArray( source_input ) ) {
            sources = source_input;
        } else {
            sources = [ source_input ];
        }
        if ( Array.isArray( dest_input ) ) {
            dests = dest_input
        } else {
            dests = [ dest_input ];
        }
        for (let i=0; i<sources.length; i++ ) {
            url += "&src=" + sources[i];
            url += "&dest=" + dests[i];

        }

        /*
        var xhr = this._createXhr();
        this.serverRequest = xhr.open( "GET",  url );
                    
        xhr.onload = function(data) { 
            this.handleHostInfoResponse( data );

        }.bind(this);
         xhr.send();
         */
            var self = this;
            axios.get(url)
                .then(function(data) {
                    console.log('axios HOST data', data);
                    self.handleHostInfoResponse( data.data );

                })
                .catch(function(err) {
                    console.log("Error retrieving HOST data:", err);

                });

                /*

        if ( typeof this.serverRequest != "undefined "  ) {

                this.serverRequest.fail(function( jqXHR ) {
                    var responseText = jqXHR.responseText;
                    var statusText = jqXHR.statusText;
                    var errorThrown = jqXHR.status;

                    var errorObj = {
                        errorStatus: "error",
                        responseText: responseText,
                        statusText: statusText,
                        errorThrown: errorThrown
                    };

                    if ( _.isFunction( callback ) ) {
                        callback( errorObj );
                    }

                    emitter.emit("error");

                }.bind(this) );
        }
                */
            //console.log( this.serverRequest.error() );

    },
    getHostInfoData: function( ) {
        return this.hostInfo;
    },
    handleHostInfoResponse: function( data ) {
        this.hostInfo = data;
        emitter.emit("get");
    },
    handleTracerouteResponse: function( data, i ) {
        this.tracerouteReqsCompleted++;
        this.tracerouteInfo.push( data );
        if ( this.tracerouteReqsCompleted == this.tracerouteReqs ) {
            this.mergeTracerouteData();

        }
    },
    mergeTracerouteData: function() {
        emitter.emit("getTrace");
    },
    getTraceInfo: function() {
        return this.tracerouteInfo;
    },
    subscribeTrace: function( callback ) {
        emitter.on("getTrace", callback);
    },
    unsubscribeTrace: function( callback ) {
        emitter.off("getTrace", callback);
    },
    subscribe: function( callback ) {
        emitter.on("get", callback);
    },
    unsubscribe: function( callback ) {
        emitter.removeListener("get", callback);
    },
    subscribeError: function( callback ) {
        emitter.on("error", callback);
    },
    unsubscribeError: function( callback ) {
        emitter.removeListener("error", callback);
    },

};

    
