let EventEmitter = require('events').EventEmitter;

let emitter = new EventEmitter();

const lsListURL = "http://perfsonar-dev.grnoc.iu.edu/perfsonar-graphs/graphData.cgi?action=ls_hosts";
const lsQueryURL = "http://perfsonar-dev.grnoc.iu.edu/perfsonar-graphs/graphData.cgi?action=interfaces";


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
    interfaceInfo: [],
    lsURLs: [],
    sources: [],
    dests: [],
    /*
    getInitialState() {
        return {
        };

    },
    */

    retrieveLSList: function() {
        this.serverRequest = $.get( lsListURL, function(data) {
            this.handleLSListResponse( data );
        }.bind(this));
    },
    handleLSListResponse: function( data ) {
        console.log("ls list", data);
        this.lsURLs = data;
        this.performLSCalls();

    },
    performLSCalls: function() {
        let lsURLs = this.lsURLs;
        let sources = this.sources;
        let dests = this.dests;
        for(var i in lsURLs) {
            let lsURL = lsURLs[i];
            let url = lsQueryURL;
            url += "&ls_url=" + encodeURI( lsURL );
            url += this.array2param("source", sources);
            url += this.array2param("dest", dests);
            console.log("ls url: " + url);
            this.serverRequest = $.get( url, function(data) {
                this.handleInterfaceInfoResponse( data );
            }.bind(this))
            .fail( function(jqXHR, textStatus, errorThrown) {
                console.log('fail jqXHR, textStatus, errorThrown', jqXHR, textStatus, errorThrown);
            }.bind(this));

        }

    },
    retrieveInterfaceInfo: function( source_input, dest_input ) {


        let url = "http://perfsonar-dev.grnoc.iu.edu/perfsonar-graphs/graphData.cgi?action=hosts";
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
        this.sources = sources;
        this.dests = dests;
        console.log("sources", sources);
        console.log("dests", dests);

        this.retrieveLSList();
        /*
        for (let i=0; i<sources.length; i++ ) {
            url += "&src=" + sources[i];
            url += "&dest=" + dests[i];

        }
        console.log("url", url);
        this.serverRequest = $.get( url, function(data) {
            this.handleInterfaceInfoResponse( data );
        }.bind(this));
        */

    },
    getInterfaceInfoData: function( ) {
        return this.interfaceInfo;
    },
    handleInterfaceInfoResponse: function( data ) {
        console.log( "InterfaceInfo data", data );
        this.interfaceInfo = data;
        emitter.emit("get");
    },
    subscribe: function( callback ) {
        emitter.on("get", callback);
    },
    unsubscribe: function( callback ) {
        emitter.off("get", callback);
    },

    array2param: function( name, array ) {
        var joiner = "&" + name + "=";
        return joiner + array.join(joiner);
    }
};
