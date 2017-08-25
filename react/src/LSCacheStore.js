let EventEmitter = require('events').EventEmitter;
let emitter = new EventEmitter();

const lsCacheHostsURL = "cgi-bin/graphData.cgi?action=ls_cache_hosts";
const lsQueryURL = "cgi-bin/graphData.cgi?action=interfaces";
const proxyURL = '/perfsonar-graphs/cgi-bin/graphData.cgi?action=ls_cache_data&url=';


/*
 * DESCRIPTION OF CLASS HERE
*/

module.exports = {
    LSCachesRetrievedTag: "lsCaches",
    useProxy: false,
    lsCacheURL: null,

    retrieveLSList: function() {
        $.get( lsCacheHostsURL, function(data) {
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
        //this.retrieveLSHosts();
        emmiter.emit( LSCachesRetrievedTag );

    },

    subscribeLSCaches: function( callback ) {
        emitter.on( LSCachesRetrievedTag, callback );

    },

    unsubscribeLSCaches: function( callback ) {
        emitter.removeListener( LSCachesRetrievedTag, callback );

    },

    // TODO: convert this function to a generic one that can take a query as a parameter
    // and a callback
    retrieveLSHosts: function() {
        lsCacheURL += "_search";
        let sources = this.sources;
        let dests = this.dests;

        console.log("lsCacheURL", lsCacheURL);
        console.log("sources", sources);
        console.log("dests", dests);

        let hosts = sources.concat( dests );
        hosts = this.unique( hosts );

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

        HostInfoStore.retrieveHostLSData( hosts, lsCacheURL );

        console.log("query", query);

        let preparedQuery = JSON.stringify( query );

        console.log("stringified query", preparedQuery);

        console.log("lsCacheURL", lsCacheURL);

        $.ajax({
            url: lsCacheURL,
            data: preparedQuery,
            dataType: 'json',
            type: "POST"
        })
        .done(function(data, textStatus, jqXHR) {
                    console("data from posted request", data);
                    this.lsRequestCount++;
                    this.handleInterfaceInfoResponse( data );
        }.bind(this))
        .fail(function(data) {

                    // if we get an error, try the cgi instead 
                    // and set a new flag, useProxy  and make
                    // all requests through the proxy CGI
                    if ( data.status == 404 ) {
                        console.log("got here!");
                        this.useProxy = true;
                        let url = this.getProxyURL( lsCacheURL );
                        console.log("proxy URL", url);

                        //query.action = "ls_cache_data";
                        //query.url = lsCacheURL;
                        preparedQuery = JSON.stringify( query );

                        let postData = {
                            "query": preparedQuery,
                            "action": "ls_cache_data",
                            "url": lsCacheURL

                        };

                        $.ajax({
                            url: url,
                            data: postData,
                            dataType: 'json',
                            type: "POST"
                        })
                            .done (function(data, textStatus, jsXHR) {
                                console.log("query data!", data);
                                this.handleInterfaceInfoResponse(data);
                            }.bind(this))
                            .fail (function( data ) {
                                  this.handleInterfaceInfoError(data);
                            }.bind(this));




                        } else {
                            console.log('fail jqXHR, textStatus, errorThrown', jqXHR, textStatus, errorThrown);
                            this.handleInterfaceInfoError( data );

                        }

        }.bind(this));



    },
    getProxyURL( url ) {

        let proxy = this.parseUrl( proxyURL );

        if ( this.useProxy ) {
            url = encodeURIComponent( url );
            url = proxyURL + url;
        }
        let urlObj = this.parseUrl( url );
        url = urlObj.origin + urlObj.pathname + urlObj.search;
        return url;

    },

    parseUrl: (function () {
        return function (url) {
            var a = document.createElement('a');
            a.href = url;

            // Work around a couple issues:
            // - don't show the port if it's 80 or 443 (Chrome didn''t do this, but IE did)
            // - don't append a port if the port is an empty string ""
            let port = "";
            if ( typeof a.port != "undefined" ) {
                if ( a.port != "80" && a.port != "443" && a.port != "" ) {
                    port = ":" + a.port;
                }
            }

            let host = a.host;
            let ret = {
                host: a.host,
                hostname: a.hostname,
                pathname: a.pathname,
                port: a.port,
                protocol: a.protocol,
                search: a.search,
                hash: a.hash,
                origin: a.protocol + "//" + a.hostname + port
            };
            return ret;
        }
    })(),

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
        data = this._parseInterfaceResults( data );
        console.log("processed data", data);
        this.addData( data );
        this.interfaceInfo = data;
    },

    _parseInterfaceResults: function( data ) {
        let out = {};
        for(let i in data.hits.hits ) {
            let row = data.hits.hits[i]._source;
            let addresses = row["interface-addresses"];
            for(let j in addresses) {
                let address = addresses[j];
                if ( !( address in out ) ) {
                    out[ address ] = row;
                    console.log("client uuid: ", row["client-uuid"] );

                }

            }



        }
        console.log("keyed on address", out);
        return out;
    },

    unique: function (arr) {
        var i,
            len = arr.length,
            out = [],
            obj = { };

        for (i = 0; i < len; i++) {
            obj[arr[i]] = 0;
        }
        for (i in obj) {
            out.push(i);
        }
        out = Object.keys( obj );
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

module.exports.retrieveLSList();
