let EventEmitter = require('events').EventEmitter;

let emitter = new EventEmitter();

const lsCacheHostsURL = "cgi-bin/graphData.cgi?action=ls_cache_hosts";
const lsQueryURL = "cgi-bin/graphData.cgi?action=interfaces";


module.exports = {

    /* Expects an object of hosts like this (keys must be src, dst (can be multiple -- number of sources and dests must match) ): 
     * {
     *   src: "1.2.3.4,"
     *   dst: "2.3.4.5",
     * }
     * Createes a cache keyed on ip addressas
     * { 
     *   {"ip"}: { addresses, mtu, capacity}
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
    lsCacheURL: null,
    /*
    getInitialState() {
        return {
        };

    },
    */

    retrieveLSList: function() {
        this.serverRequest = $.get( lsCacheHostsURL, function(data) {
            console.log("lscachehosts", data);
            this.handleLSListResponse( data );
        }.bind(this));
    },
    handleLSListResponse: function( data ) {
        this.lsURLs = data;
        console.log("lsURLs", data);
        if ( typeof data == "undefined" || ! Array.isArray( data ) ) {
            console.log("LS cache host data is invalid/missing");
        } else if ( data.length > 0  ) {
            console.log("array of LS cache host data");
            this.lsCacheURL = data[0].url;
            if ( this.lsCacheURL === null ) {
                console.log("no url found!");

            }
            console.log("selecting cache url: ", this.lsCacheURL);
        } else {
            console.log("no LS cache host data available");

        }
        //this.performLSCalls();
        this.retrieveLSHosts();

    },

    retrieveLSHosts: function() {
        let lsCacheURL = this.lsCacheURL;
        lsCacheURL += "_search";
        let sources = this.sources;
        let dests = this.dests;

        console.log("lsCacheURL", lsCacheURL);
        console.log("sources", sources);
        console.log("dests", dests);

        //let hosts = sources.concat( dests );
        let hosts = sources[0];

        let query = {
              "query": {
                      "bool": {
                        "must": [
                              {"match": { "type": "interface" } },
                              {"match": { "interface-addresses": hosts } }

                        ]
                    }
              }
        };

        console.log("query", query);

        query = JSON.stringify( query );

        console.log("stringified query", query);

        this.serverRequest = $.ajax({ 
            url: lsCacheURL, 
            data: query, 
            dataType: 'json',
            type: "POST",
            success: function(data, textStatus, jqXHR) {
                    console("data from posted request", data);
                    this.lsRequestCount++;
                    this.handleInterfaceInfoResponse( data );
                }.bind(this),
            fail: function(jqXHR, textStatus, errorThrown) {
                    console.log('fail jqXHR, textStatus, errorThrown', jqXHR, textStatus, errorThrown);
                }.bind(this)

        });




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

        this.retrieveLSList();

    },
    getInterfaceInfo: function( ) {
        return this.interfaceObj;
    },
    handleInterfaceInfoResponse: function( data ) {
        console.log("data", data);
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

                for (var k in sources){
                    if (sources[k] == row.source_ip){
                        if ( ! ( row.source_ip in newObj )) {
                            newObj[row.source_ip] = {};
                        }

                        if (row.source_mtu) {
                            src_mtu = row.source_mtu;
                            newRow.src_mtu = src_mtu;
                            newObj[row.source_ip].mtu = src_mtu;
                        }
                        if (row.source_addresses) {
                            src_addresses = row.source_addresses;
                            newRow.src_addresses = src_addresses;
                            newObj[row.source_ip].addresses = src_addresses;
                        }

                        if (row.source_capacity) {
                            src_capacity = row.source_capacity;
                            newRow.src_capacity = src_capacity;
                            newObj[row.source_ip].capacity = src_capacity;
                        }



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
                }
        }
        this.interfaceObj = newObj;
        emitter.emit("get");
    },
    // Retrieves interface details for a specific ip and returns them
    // Currently keys on ip; could extend to search all addresses later if needed
    getInterfaceDetails: function( host ) {
        let details = this.interfaceObj || {};
        if ( host in details ) {
            return details[host];
        } else {
            for(let i in details ) {
                let row = details[i];

                for( let j in row.addresses ) {
                    let address = row.addresses[j];
                    if ( address == host ) {
                        return details[i];
                    } else {
                        let addrs = host.split(",");
                        if ( addrs.length > 1 ) {
                            // handle case where addresses have comma(s)
                            for(var k in addrs) {
                                if ( addrs[k] == address ) {
                                    return details[i];
                                }
                            }


                        }
                    }

                }


            }

        }
        // host not found in the cache, return empty object
        return {};
    }
};
