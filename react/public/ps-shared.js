webpackJsonp([2,3],{

/***/ 905:
/*!**************************************************!*\
  !*** ./js-shared/lib/DataStores/LSCacheStore.js ***!
  \**************************************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var _GraphUtilities = __webpack_require__(/*! ../Utils/GraphUtilities */ 906);
	
	var _GraphUtilities2 = _interopRequireDefault(_GraphUtilities);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var EventEmitter = __webpack_require__(/*! events */ 803).EventEmitter;
	var emitter = new EventEmitter();
	var querystring = __webpack_require__(/*! querystring */ 907);
	
	var axios = __webpack_require__(/*! ../axios-instance-config.js */ 910);
	
	var lsCacheHostsURL = "cgi-bin/graphData.cgi?action=ls_cache_hosts";
	var lsQueryURL = "cgi-bin/graphData.cgi?action=interfaces";
	var proxyURL = "/perfsonar-graphs/cgi-bin/graphData.cgi?action=ls_cache_data&url=";
	
	/*
	 * DESCRIPTION OF CLASS HERE
	*/
	
	module.exports = {
	    LSCachesRetrievedTag: "lsCaches",
	    useProxy: false,
	    lsCacheURL: null,
	    data: null,
	
	    retrieveLSList: function retrieveLSList() {
	        axios.get(lsCacheHostsURL).then(function (response) {
	            var data = response.data;
	            console.log("lscachehosts", data);
	            this.handleLSListResponse(data);
	        }.bind(this));
	    },
	
	    handleLSListResponse: function handleLSListResponse(data) {
	        this.lsURLs = data;
	        console.log("lsURLs", data);
	        if (typeof data == "undefined" || !Array.isArray(data)) {
	            console.log("LS cache host data is invalid/missingZ");
	        } else if (data.length > 0) {
	            console.log("array of LS cache host data");
	            this.lsCacheURL = data[0].url;
	            if (this.lsCacheURL === null) {
	                console.log("no url found!");
	            }
	            console.log("selecting cache url: ", this.lsCacheURL);
	            emitter.emit(this.LSCachesRetrievedTag);
	        } else {
	            console.log("no LS cache host data available");
	        }
	        //LSCacheStore.subscribe( 
	        //this.retrieveLSHosts();
	    },
	
	    subscribeLSCaches: function subscribeLSCaches(callback) {
	        emitter.on(this.LSCachesRetrievedTag, callback);
	    },
	
	    unsubscribeLSCaches: function unsubscribeLSCaches(callback) {
	        emitter.removeListener(this.LSCachesRetrievedTag, callback);
	    },
	
	    subscribeTag: function subscribeTag(callback, tag) {
	        emitter.on(tag, callback);
	    },
	
	    unsubscribeTag: function unsubscribeTag(callback, tag) {
	        emitter.off(tag, callback);
	    },
	
	    // TODO: convert this function to a generic one that can take a query as a parameter
	    // and a callback
	    queryLSCache: function queryLSCache(query, message) {
	        var lsCacheURL = this.lsCacheURL + "_search";
	
	        //this.retrieveHostLSData( hosts, lsCacheURL );
	
	        console.log("query", query);
	
	        var preparedQuery = JSON.stringify(query);
	
	        console.log("stringified query", preparedQuery);
	
	        console.log("lsCacheURL", lsCacheURL);
	        console.log("message", message);
	
	        this.message = message;
	
	        var self = this;
	        var successCallback = function successCallback(data) {
	            self.handleLSCacheDataResponse(data, message);
	        };
	
	        axios({
	            "url": lsCacheURL,
	            "data": preparedQuery,
	            "dataType": 'json',
	            "method": "POST"
	        }).then(function (response) {
	            var data = response.data;
	            console.log("data from posted request FIRST DONE SECTION", data);
	            //this.handleInterfaceInfoResponse( data );
	            //this.handleLSCacheDataResponse( data, message );
	            successCallback(data);
	        }.bind(this)).catch(function (error) {
	            console.log("error", error);
	
	            if (error.response) {
	                // The request was made and the server responded with a status code
	                // that falls out of the range of 2xx
	                console.log("response error", error.response.data);
	                console.log(error.response.status);
	                console.log(error.response.headers);
	            } else if (error.request) {
	                // The request was made but no response was received
	                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
	                // http.ClientRequest in node.js
	                console.log("request error", error.request);
	                // if we get an error, try the cgi instead
	                // and set a new flag, useProxy  and make
	                // all requests through the proxy CGI
	                var request = error.request;
	                if (request.status == 0) {
	                    console.log("got here!");
	                    this.useProxy = true;
	                    var url = this.getProxyURL(lsCacheURL);
	                    console.log("proxy URL", url);
	
	                    preparedQuery = JSON.stringify(query);
	
	                    var postData = {
	                        "query": preparedQuery,
	                        "action": "ls_cache_data",
	                        "dataType": 'json',
	                        "url": lsCacheURL
	
	                    };
	
	                    var preparedData = JSON.stringify(postData);
	
	                    axios({
	                        url: url,
	                        data: querystring.stringify(postData),
	                        //dataType: 'json',
	                        method: "POST"
	                    }).then(function (response) {
	                        var data = response.data;
	                        console.log("query data! SECOND DONE SECTIONz", data);
	                        //this.handleInterfaceInfoResponse(data);
	                        //this.handleLSCacheDataResponse( data, message );
	                        successCallback(data);
	                    }.bind(this)).catch(function (data) {
	                        //this.handleInterfaceInfoError(data);
	                    }.bind(this));
	                } else {
	                    // Something happened in setting up the request that triggered an Error
	                    console.log('Error', error.message);
	                }
	                console.log(error.config);
	            } else {
	                console.log('fail jqXHR, textStatus, errorThrown', jqXHR, textStatus, errorThrown);
	                this.handleInterfaceInfoError(data);
	            }
	        }.bind(this));
	    },
	    handleLSCacheDataResponse: function handleLSCacheDataResponse(data, message) {
	        console.log("handling LS cache data response (data, message)", data, message);
	        this.data = data;
	        emitter.emit(this.message);
	    },
	
	    getResponseData: function getResponseData() {
	        console.log("getting response data ...");
	        return this.data;
	    },
	
	    getProxyURL: function getProxyURL(url) {
	
	        var proxy = this.parseUrl(proxyURL);
	
	        if (this.useProxy) {
	            url = encodeURIComponent(url);
	            url = proxyURL + url;
	        }
	        var urlObj = this.parseUrl(url);
	        url = urlObj.origin + urlObj.pathname + urlObj.search;
	        return url;
	    },
	
	
	    parseUrl: function () {
	        return function (url) {
	            var a = document.createElement('a');
	            a.href = url;
	
	            // Work around a couple issues:
	            // - don't show the port if it's 80 or 443 (Chrome didn''t do this, but IE did)
	            // - don't append a port if the port is an empty string ""
	            var port = "";
	            if (typeof a.port != "undefined") {
	                if (a.port != "80" && a.port != "443" && a.port != "") {
	                    port = ":" + a.port;
	                }
	            }
	
	            var host = a.host;
	            var ret = {
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
	        };
	    }(),
	
	    retrieveInterfaceInfo: function retrieveInterfaceInfo(source_input, dest_input) {
	
	        var sources = void 0;
	        var dests = void 0;
	        if (Array.isArray(source_input)) {
	            sources = source_input;
	        } else {
	            sources = [source_input];
	        }
	        if (Array.isArray(dest_input)) {
	            dests = dest_input;
	        } else {
	            dests = [dest_input];
	        }
	        this.sources = sources;
	        this.dests = dests;
	
	        //this.retrieveLSList();
	    },
	    getInterfaceInfo: function getInterfaceInfo() {
	        return this.interfaceObj;
	    },
	    handleInterfaceInfoResponse: function handleInterfaceInfoResponse(data) {
	        console.log("data", data);
	        data = this._parseInterfaceResults(data);
	        console.log("processed data", data);
	        //this.addData( data );
	        this.interfaceInfo = data;
	    },
	
	    _parseInterfaceResults: function _parseInterfaceResults(data) {
	        var out = {};
	        for (var i in data.hits.hits) {
	            var row = data.hits.hits[i]._source;
	            var addresses = row["interface-addresses"];
	            for (var j in addresses) {
	                var address = addresses[j];
	                if (!(address in out)) {
	                    out[address] = row;
	                    console.log("client uuid: ", row["client-uuid"]);
	                }
	            }
	        }
	        console.log("keyed on address", out);
	        return out;
	    },
	
	    subscribe: function subscribe(callback) {
	        emitter.on("get", callback);
	    },
	    unsubscribe: function unsubscribe(callback) {
	        emitter.off("get", callback);
	    },
	
	    array2param: function array2param(name, array) {
	        var joiner = "&" + name + "=";
	        return joiner + array.join(joiner);
	    },
	
	    // Retrieves interface details for a specific ip and returns them
	    // Currently keys on ip; could extend to search all addresses later if needed
	    getInterfaceDetails: function getInterfaceDetails(host) {
	        var details = this.interfaceObj || {};
	        if (host in details) {
	            return details[host];
	        } else {
	            for (var i in details) {
	                var row = details[i];
	
	                for (var j in row.addresses) {
	                    var address = row.addresses[j];
	                    if (address == host) {
	                        return details[i];
	                    } else {
	                        var addrs = host.split(",");
	                        if (addrs.length > 1) {
	                            // handle case where addresses have comma(s)
	                            for (var k in addrs) {
	                                if (addrs[k] == address) {
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

/***/ }),

/***/ 906:
/*!***********************************************!*\
  !*** ./js-shared/lib/Utils/GraphUtilities.js ***!
  \***********************************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var _momentTimezone = __webpack_require__(/*! moment-timezone */ 805);
	
	var _momentTimezone2 = _interopRequireDefault(_momentTimezone);
	
	var _pondjs = __webpack_require__(/*! pondjs */ 644);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	module.exports = {
	    getTimezone: function getTimezone(date) {
	        var tz = void 0;
	        var tzRe = /\(([^)]+)\)/;
	        var out = void 0;
	        var offset = void 0;
	
	        if (typeof date == "undefined" || date == null) {
	            return;
	        } else if (date == "Invalid Date") {
	            tz = "";
	            out = "";
	        } else {
	            tz = tzRe.exec(date);
	            if (typeof tz == "undefined" || tz === null) {
	                // timezone is unknown
	                return "";
	            } else {
	                tz = tz[1];
	                var dateObj = new Date(date);
	                var dateMoment = (0, _momentTimezone2.default)(dateObj);
	                offset = dateMoment.utcOffset() / 60;
	                if (typeof offset != "undefined" && offset >= 0) {
	                    offset = "+" + offset;
	                }
	            }
	        }
	
	        out = " (GMT" + offset + ")";
	        return out;
	    },
	
	    getTimeVars: function getTimeVars(period) {
	        var timeDiff = void 0;
	        var summaryWindow = void 0;
	        if (period == '4h') {
	            timeDiff = 60 * 60 * 4;
	            summaryWindow = 0;
	        } else if (period == '12h') {
	            timeDiff = 60 * 60 * 12;
	            summaryWindow = 0;
	        } else if (period == '1d') {
	            timeDiff = 86400;
	            summaryWindow = 300;
	        } else if (period == '3d') {
	            timeDiff = 86400 * 3;
	            summaryWindow = 300;
	        } else if (period == '1w') {
	            timeDiff = 86400 * 7;
	            summaryWindow = 3600;
	        } else if (period == '1m') {
	            timeDiff = 86400 * 31;
	            summaryWindow = 3600;
	        } else if (period == '1y') {
	            timeDiff = 86400 * 365;
	            summaryWindow = 86400;
	        }
	        var timeRange = {
	            timeDiff: timeDiff,
	            summaryWindow: summaryWindow,
	            timeframe: period
	        };
	        return timeRange;
	    },
	
	    // Returns the UNIQUE values of an array
	    unique: function unique(arr) {
	        var i,
	            len = arr.length,
	            out = [],
	            obj = {};
	
	        for (i = 0; i < len; i++) {
	            obj[arr[i]] = 0;
	        }
	        out = Object.keys(obj);
	        return out;
	    },
	
	    formatBool: function formatBool(input, unknownText) {
	        var out = void 0;
	        if (input === true || input === 1 || input == "1") {
	            out = "Yes";
	        } else if (input === false || input === 0 || input == "0") {
	            out = "No";
	        }
	        out = this.formatUnknown(out, unknownText);
	        return out;
	    },
	
	    formatSItoSI: function formatSItoSI(value, Y) {
	        console.log("value", value);
	        var out = value;
	        var re = /^(\d+\.?\d*)\s?([KMGT])(\w*)/;
	        var results = value.match(re);
	        if (results !== null) {
	            var values = {};
	            values.K = 1024;
	            values.M = 1024 * 1024;
	            values.G = 1024 * 1024 * 1024;
	            console.log("values", values);
	            console.log("value, re, results", value, re, results);
	
	            out = results[1];
	
	            if (results[2].toUpperCase() in values) {
	                var X = results[2];
	                out = out * values[results[2]];
	                // convert to Y
	                out = out / values[Y];
	                out = Math.round(out * 10) / 10;
	                out += " " + Y + results[3];
	            };
	        }
	        console.log("outvalue", out);
	
	        return out;
	    },
	
	    formatUnknown: function formatUnknown(str, unknownText) {
	        if (typeof unknownText == "undefined" || unknownText === null) {
	            unknownText = "unknown";
	        }
	        if (typeof str == "undefined" || str === null || str == "") {
	            return unknownText;
	        } else {
	            return str;
	        }
	    }
	
	};

/***/ }),

/***/ 910:
/*!************************************************!*\
  !*** ./js-shared/lib/axios-instance-config.js ***!
  \************************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var axios = __webpack_require__(/*! axios */ 911);
	var http = __webpack_require__(/*! http */ 938);
	var https = __webpack_require__(/*! https */ 969);
	
	module.exports = axios.create({
	  //60 sec timeout
	  timeout: 60000,
	
	  //keepAlive pools and reuses TCP connections, so it's faster
	  httpAgent: new http.Agent({ keepAlive: true }),
	  httpsAgent: new https.Agent({ keepAlive: true }),
	
	  //follow up to 10 HTTP 3xx redirects
	  maxRedirects: 10,
	
	  //cap the maximum content length we'll accept to 50MBs, just in case
	  maxContentLength: 50 * 1000 * 1000
	});
	
	//optionally add interceptors here...

/***/ })

});
//# sourceMappingURL=ps-shared.js.map