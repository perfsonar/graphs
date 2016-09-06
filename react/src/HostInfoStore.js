var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();



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
    /*
    getInitialState() {
        return {
        };

    },
    */

    retrieveTracerouteData: function ( sources, dests, ma_url ) {
        let baseUrl = "graphData.cgi?action=has_traceroute_data";
        baseUrl += "&url=" + ma_url;
        if ( !$.isArray( sources ) ) {
            sources = [ sources ];
        }
        if ( !$.isArray( dests ) ) {
            dests = [ dests ];
        }
        for( let i in sources ) {
            let src = sources[i];
            let dst = dests[i];

            let url = baseUrl + "&source=" + src;
            url += "&dest=" + dst
            console.log("tracerout url");

            this.tracerouteReqs = sources.length;

            this.serverRequest = $.get( url, function(data) {
                    this.handleTracerouteResponse( data, i );
                }.bind(this));

        }



    },
    retrieveHostInfo: function( source_input, dest_input ) {
        let url = "graphData.cgi?action=hosts";
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
        console.log("sources", sources);
        console.log("dests", dests);
        for (let i=0; i<sources.length; i++ ) {
            url += "&src=" + sources[i];
            url += "&dest=" + dests[i];

        }
        console.log("url", url);
        this.serverRequest = $.get( url, function(data) {
            this.handleHostInfoResponse( data );
        }.bind(this));

    },
    getHostInfoData: function( ) {
        return this.hostInfo;
    },
    handleHostInfoResponse: function( data ) {
        this.hostInfo = data;
        emitter.emit("get");
    },
    handleTracerouteResponse: function( data, i ) {
        //this.tracerouteInfo = data;
        console.log( "trace data", data, "i", i );
        this.tracerouteReqsCompleted++;
        this.tracerouteInfo.push( data );
        if ( this.tracerouteReqsCompleted == this.tracerouteReqs ) {
            this.mergeTracerouteData();

        }
    },
    mergeTracerouteData: function() {
        console.log("trace completed", this.tracerouteInfo);
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
        emitter.off("get", callback);
    },

};
