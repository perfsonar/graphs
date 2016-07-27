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
    /*
    getInitialState() {
        return {
        };

    },
    */

    getHostInfo: function( source_input, dest_input ) {
        let url = "http://perfsonar-dev.grnoc.iu.edu/perfsonar-graphs/graphData.cgi?action=hosts";
        //url += "&src=140.182.44.162&dest=140.182.45.175";
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
        console.log( "HostInfo data", data );
        //this.setState({hostInfo: data});
        this.hostInfo = data;
        emitter.emit("get");
    },
    subscribe: function( callback ) {
        emitter.on("get", callback);
    },
    unsubscribe: function( callback ) {
        emitter.off("get", callback);
    },

};
