var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();

import LSCacheStore from "./LSCacheStore.js";

if ( typeof window == "undefined" ) {
    var $;
    if ( typeof $ == "undefined" ) {
        require("node-jsdom").env("", function(err, window) {
            //var $;
            if (err) {
                console.error(err);
                return;
            }

            $ = require("jquery")(window);
        });
    }

} else {
    $ = jQuery;
}



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

    retrieveTracerouteData: function ( sources, dests, ma_url ) {
        let baseUrl = "cgi-bin/graphData.cgi?action=has_traceroute_data";
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

            this.tracerouteReqs = sources.length;

            this.serverRequest = $.get( url, function(data) {
                    this.handleTracerouteResponse( data, i );
                }.bind(this));

        }



    },
    _getURL( relative_url ) {
        return this.serverURLBase + relative_url;
    },
    retrieveHostLSData: function( hostUUIDs, lsCacheURL ) {
        if ( !Array.isArray( hostUUIDs ) ) {
            hostUUIDs = [ hostUUIDs ];
        }


        let query = {
              "query": {
                  "constant_score": {
                        "filter": {
                          "bool": {
                            "must": [
                                  {"match": { "type": "host" } },
                                  {"terms": { "client-uuid": hostUUIDs } }

                            ]
                        }
                        }
                  }
              }
              ,
              "sort": [
                  { "expires": { "order": "desc" } }

              ]

        };
        console.log("hostinfo query", query);

        let preparedQuery = JSON.stringify( query );
        console.log("hostinfo stringified query", preparedQuery);




        $.ajax({
            url: lsCacheURL,
            data: preparedQuery,
            dataType: 'json',
            type: "POST"
        })
        .done(function(data, textStatus, jqXHR) {
                    console("data from host request", data);
                    //this.handleInterfaceInfoResponse( data );
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
        this.serverRequest = $.get( 
                url,
                function(data) {
                    console.log("hostInfo data", data);
                    this.handleHostInfoResponse( data );
                }.bind(this));

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

                    if ( $.isFunction( callback ) ) {
                        callback( errorObj );
                    }

                    emitter.emit("error");

                }.bind(this) );
        }
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


