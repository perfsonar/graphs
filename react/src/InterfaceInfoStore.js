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
    interfaceObj: {},
    lsInterfaceResults: [],
    lsURLs: [],
    sources: [],
    dests: [],
    lsRequestCount: 0,
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
                this.lsRequestCount++;
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
        this.addData( data );
        this.interfaceInfo = data;
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
    },
    addData: function( data ) {
            this.lsInterfaceResults.push( data );
            console.log("added interface data", data);
            /*
        if (! $.isEmptyObject(data) ) {
            this.lsInterfaceResults.push( data );
            console.log("added interface data", data);
        } else {
            console.log( "interface data was emtpy!" );

        }
        */
        console.log("this.lsInterfaceResults", this.lsInterfaceResults);
        console.log("lsInterfaceResults.length", this.lsInterfaceResults.length, "requestCount", this.lsRequestCount);
        if ( this.lsInterfaceResults.length == this.lsRequestCount ) {
            this.combineData();
        }

    },

    combineData: function( ) {
        let sources = this.sources;
        let dests = this.dests;
        let rows = this.lsInterfaceResults;

        let src_capacity = "Unknown";
        let src_mtu = "Unknown";
        let dest_capacity = "Unknown";
        let dest_mtu = "Unknown";
        let src_addresses;
        let dest_addresses;

        let newObj = {};
        for(var i in rows) {
            let results = rows[i];

            let newRow = {};
            for (var j in results){
                let row = rows[i][j];
                console.log("row", row);

                for (var k in sources){
                    if (sources[k] == row.source_ip){

                        if (row.source_mtu) {
                            src_mtu = row.source_mtu;
                        }
                        if (row.source_addresses) {
                            src_addresses = row.source_addresses;
                        }

                        if (row.source_capacity) {
                            src_capacity = row.source_capacity;
                        }
                        newRow.src_mtu = src_mtu;
                        newRow.src_capacity = src_capacity;
                        newRow.src_addresses = src_addresses;

                        newObj[row.source_ip] = {};
                        newObj[row.source_ip].mtu = src_mtu;
                        newObj[row.source_ip].addresses = src_addresses;
                        newObj[row.source_ip].capacity = src_capacity;


                    }

                    if(dests[k] == row.dest_ip){

                        if (row.dest_mtu) {
                            dest_mtu = row.dest_mtu;
                        }
                        if (row.dest_addresses) {
                            dest_addresses = row.dest_addresses;
                        }
                        if (row.dest_capacity) {
                            dest_capacity = row.dest_capacity;
                        }
                        newRow.dest_mtu = dest_mtu;
                        newRow.dest_addresses = dest_addresses;
                        newRow.dest_capacity = dest_capacity;

                        newObj[row.dest_ip] = {};
                        newObj[row.dest_ip].mtu = dest_mtu;
                        newObj[row.dest_ip].addresses = dest_addresses;
                        newObj[row.dest_ip].capacity = dest_capacity;
                    }
                }
            }
                if ( !  $.isEmptyObject( newRow ) ) {
                    this.interfaceInfo.push( newRow );
                    console.log("added new row; interfaceInfo:", this.interfaceInfo);
                    console.log("newObj", newObj);
                }
        }
        console.log("combined sources: ", sources);
        console.log("combined dests: ", dests);
        emitter.emit("get");
    }
};
