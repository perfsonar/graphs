import LSCacheStore from "./LSCacheStore.js";
import HostInfoStore from "./HostInfoStore";
import GraphUtilities from "./GraphUtilities";

let EventEmitter = require('events').EventEmitter;
let emitter = new EventEmitter();

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
    sources: [],
    dests: [],
    lsRequestCount: 0,

    _init: function() {
        //LSCacheStore.subscribe( LSCacheStore.LSCachesRetrievedTag, this.handleLSCachesRetrieved );

    },

    handleLSCachesRetrieved: function() {


    },

    handleInterfaceInfoError: function( data ) {

    },

    // This function actually queries the LS cache (using LSCacheStore)
    retrieveInterfaceInfo: function( sources, dests ) {

        //let sources = this.sources;
        //let dests = this.dests;

        if ( typeof sources == "undefined" || typeof dests == "undefined" ) {
            console.log("sources and/or dests undefined; aborting");
                    return;

        }
        if ( !Array.isArray( sources ) ) {
            sources = [ sources ];
        }
        if ( !Array.isArray( dests ) ) {
            dests = [ dests ];
        }
        this.sources = sources;
        this.dests = dests;

        console.log("retrieveInterfaceInfo sources", sources);
        console.log("dests", dests);

        let hosts = sources.concat( dests );
        hosts = GraphUtilities.unique( hosts );

        let query = {
              "query": {
                      "bool": {
                        "must": [
                              {"match": { "type": "interface" } },
                              {"terms": { "interface-addresses": hosts } }

                        ]
                    }
              }
              ,
              "sort": [
                  { "expires": { "order": "desc" } }

              ]

        };
        let tag = "interfaceInfo";
        LSCacheStore.queryLSCache( query, tag );
        LSCacheStore.subscribeTag( this.handleInterfaceInfoResponse.bind(this), tag );

    },

    getInterfaceInfo: function( ) {
        return this.interfaceObj;
    },

    handleInterfaceInfoResponse: function( ) {
        let data = LSCacheStore.getResponseData();
        console.log("data", data);
        data = this._parseInterfaceResults( data );
        console.log("processed data", data);
        //this.combineData();

        let interfaceObj =  this.interfaceObj
        console.log("combined data", interfaceObj);

        this.interfaceInfo = interfaceObj;

        emitter.emit("get");
    },

    _parseInterfaceResults: function( data ) {
        let out = [];
        let obj = {};
        let cache = {};
        for(let i in data.hits.hits ) {
            let row = data.hits.hits[i]._source;
            let addresses = row["interface-addresses"];
            let uuid = row["client-uuid"];
            for(let j in addresses) {
                let address = addresses[j];
                if ( !( address in obj ) ) {
                    //cache[ uuid ] = true;
                    console.log("client uuid: ", row["client-uuid"] );
                    out.push( row );
                    this.lsInterfaceResults.push( row );
                    obj[ address ] = row;
                    continue;
                }

            }

        }
        this.interfaceObj = obj;
        console.log("keyed on address", out);
        return out;
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
            let newRow = {};
            let row = rows[i];

            for (var k in sources){
                let src = sources[k];
                if (sources[k] in row["interface-addresses"]){
                    if ( ! ( sources[k] in newObj )) {
                        newObj[sources[k]] = {};
                    } else {
                        continue;
                    }

                    if (row["interface-mtu"]) {
                        let src_mtu = row["interface-mtu"];
                        newRow["interface-mtu"] = src_mtu;
                        newObj[src].mtu = src_mtu;
                    }
                    if (row["interface-addresses"]) {
                        let src_addresses = row["interface-addresses"];
                        newRow.src_addresses = src_addresses;
                        newObj[src].addresses = src_addresses;
                    }

                    if (row["interface-capacity"]) {
                        src_capacity = row["interface-capacity"];
                        newRow.src_capacity = src_capacity;
                        newObj[src].capacity = src_capacity;
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
        console.log("getInterfaceDetails details", details);
        if ( host in details ) {
            console.log("found details for ", host, details[host]);
            return details[host];
        } else {
            console.log("host details not found; searching");
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
