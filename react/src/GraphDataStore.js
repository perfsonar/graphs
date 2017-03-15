import moment from "moment";

import { TimeSeries, TimeRange, Event } from "pondjs";

let ipaddr = require('ipaddr.js');

let EventEmitter = require('events').EventEmitter;

let emitter = new EventEmitter();

let reqCount = 0;
let dataReqCount = 0;
let completedReqs = 0;
let completedDataReqs = 0;

let startTime = Date.now();
let start;// = Math.floor( Date.now() - 7 * 86400 / 1000 );
let end; // = Math.ceil( Date.now() / 1000 );

let chartMetadata = [];
let chartData = [];
let maURLs = [];

let metadataURLs = {};
let dataURLs = {};

let proxyURL = '/perfsonar-graphs/cgi-bin/graphData.cgi?action=ma_data&url=';

let lossTypes = [ 'packet-loss-rate', 'packet-count-lost', 'packet-count-sent', 'packet-count-lost-bidir', 'packet-loss-rate-bidir' ];

module.exports = {

    maURL: null,

    initVars: function() {
        chartMetadata = [];
        chartData = [];
        maURLs = [];
        metadataURLs = {};
        dataURLs = {};
        reqCount = 0;
        dataReqCount = 0;
        completedReqs = 0;
        completedDataReqs = 0;
        this.useProxy = false;
        this.summaryWindow = 3600;
        this.eventTypeStats = {};

        this.eventTypes = ['throughput', 'histogram-owdelay', 'packet-loss-rate',
                    'packet-loss-rate-bidir',
                    'packet-count-lost', 'packet-count-sent', 'packet-count-lost-bidir',
                    'packet-retransmits', 'histogram-rtt', 'failures'];
        this.dataFilters = [];
        this.itemsToHide = [];
        this.errorData = null;

    },

    getHostPairMetadata: function ( sources, dests, startInput, endInput, ma_url, params, summaryWindow ) {
        start = startInput;
        end = endInput;

        this.initVars();

        this.summaryWindow = summaryWindow;

        if ( !$.isArray( sources ) ) {
            sources = [ sources ];
        }
        if ( !$.isArray( dests ) ) {
            dests = [ dests ];
        }

        if ( !$.isArray( ma_url ) ) {
            ma_url = [ ma_url ];
        }

        maURLs = ma_url;



        if ( ! end ) {
            //end = Math.ceil( Date.now() / 1000 ); 
        }

        if ( ! start ) {
            //start = Math.floor( end - 86400 * 7 ); // TODO: 7 days a good default?
        }


        for( let i in sources ) {
            let directions = [ [ sources[i], dests[i] ], 
                [ dests[i], sources[i] ] ];
            let direction = [ "forward", "reverse" ];
            for( let j in directions ) {
                let src = directions[j][0];
                let dst = directions[j][1];

                let url = ma_url[i] + "?source=" + src + "&destination=" + dst;

                if ( params !== null && typeof params != "undefined" ) {
                    for(let name in params) {
                        let val = params[name];
                        if ( typeof val == "undefined" ) {
                            continue;
                        }
                        if ( !$.isArray( val ) ) {
                            val = [ val ];
                        }
                        if ( name == "tool" ) {
                            for(let j in val ) {
                                url += "&tool-name=" + val[i];
                            }
                        } else if ( name == "ipversion" ) {
                            if ( val[i] == 4 ) {
                                url += "&dns-match-rule=only-v4";
                            } else if ( val[i] == 6 ) {
                                url += "&dns-match-rule=only-v6";
                            }
                        } else if ( name == "agent" ) {
                            if ( typeof val[i] != "undefined" ) {
                                url += "&measurement-agent=" + val[i];
                            }
                        }

                    }
                }

                //url += "&time-start=" + start + "&time-end=" + end; //TODO: add this back?

                url = this.getMAURL( url );

                console.log("metadata url: ", url);

                // Make sure we don't retrieve the same URL twice

                if ( metadataURLs[url] ) {
                    continue;

                } else {
                    metadataURLs[url] = 1;

                }

                this.serverRequest = $.get( url, function(data) {
                    this.handleMetadataResponse(data, direction[j]);
                }.bind(this))
                .fail(function( data ) {
                    // if we get an error, try the cgi instead 
                    // and set a new flag, useProxy  and make
                    // all requests through the proxy CGI
                    if ( data.status == 404 ) {
                        this.useProxy = true;
                        url = this.getMAURL( url );
                        this.serverRequest = $.get( url, function(data) {
                            this.handleMetadataResponse(data, direction[j]);
                        }.bind(this))
                        .fail(function( data ) {
                            this.handleMetadataError( data );
                        }.bind(this)
                        )


                        } else {
                            this.handleMetadataError( data );

                        }

                        }.bind(this)
                );

                reqCount++;
            }
        }
},
    getMAURL( url ) {
        if ( this.useProxy ) {
            url = encodeURIComponent( url );
            url = proxyURL + url;
        }
        return url;

    },
    handleMetadataError: function( data ) {
        this.errorData = data;
        emitter.emit("error");

    },
    getErrorData: function() {
        return this.errorData;

    },
    handleMetadataResponse: function( data, direction ) {
        //data.label = label;
        for(let i in data) {
            data[i].direction = direction;
        }
        $.merge( chartMetadata, data );
        completedReqs++;
        if ( completedReqs == reqCount ) {
            let endTime = Date.now();
            let duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED ALL", reqCount, " REQUESTS in", duration);
            completedReqs = 0;
            reqCount = 0;
            if ( chartMetadata.length == 0 ) {
                emitter.emit("empty");
                return;

            }
            data = this.filterEventTypes( chartMetadata );
            data = this.getData( chartMetadata );
            console.log("chartMetadata", chartMetadata);

        } else {
            console.log("completed " + reqCount + " requests");

        }


    },
    filterEventTypes: function( data, eventTypesParam ) {
        //let eventTypes = this.getEventTypes( eventTypesParam );
        let eventTypes = this.getEventTypes();

        let tests = $.map( data, function( test, i ) {
            let matchingEventTypes = $.map( test['event-types'], function( eventType, j ) {
                let ret = $.inArray( eventType['event-type'], eventTypes );
                if ( ret >= 0 ) {
                    return eventType;
                } else {
                    return null;
                }

            });
            if ( matchingEventTypes.length > 0 ) {
                // use i to extract the test? return the test?
                //test['event-types'] = matchingEventTypes;
                test['event-types'] = [];
                test['event-types'] = $.extend(true, [],  matchingEventTypes);
                return test;
            } else {
                return null;
            }



        });


        return tests;
    },
    getEventTypes: function( eventTypesParam ) {
        let eventTypes = eventTypesParam || this.eventTypes;
        for(var i in eventTypes) {
            eventTypes.push( eventTypes[i] + "-reverse" );


        }
        return eventTypes;

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
    getData: function( metaData ) {
        let summaryWindow = this.summaryWindow; // || 3600; // todo: this should be dynamic
        //summaryWindow = 86400; // todo: this should be dynamic
        let defaultSummaryType = "aggregation"; // TODO: allow other aggregate types
        let multipleTypes = [ "histogram-rtt", "histogram-owdelay" ];

        for(let ma_url in maURLs) {
            // "new URL" is clearer but doesn't work with some browsers
            // *ahem* IE, Edge ...
            //let maURL = new URL( maURLs[ma_url] );
            let maURL = this.parseUrl( maURLs[ma_url] );
            console.log("maURL", maURL);

            let baseURL = maURL.origin;
            dataReqCount = 0;
            for(let i in metaData) {
                let datum = metaData[i];
                let direction = datum.direction;
                for( let j in datum["event-types"] ) {
                    let eventTypeObj = datum["event-types"][j];
                    let eventType = eventTypeObj["event-type"];
                    let summaries = eventTypeObj["summaries"];
                    let summaryType = defaultSummaryType;

                    let source = datum.source;

                    let addr = ipaddr.parse( source );

                    let ipversion;
                    if ( ipaddr.isValid( source ) ) {
                        ipversion = addr.kind( source ).substring(3);

                    } else {
                        console.log("invalid IP address");

                    }

                    let uri = null;

                    if ( $.inArray( eventType, multipleTypes ) >= 0 ) {
                        summaryType = "statistics";
                        var that = this;
                        let win = $.grep( summaries, function( summary, k ) {
                            return summary["summary-type"] == summaryType && summary["summary-window"] == that.summaryWindow;
                        });
                        if ( win.length > 1 ) {
                            console.log("WEIRD: multiple summary windows found. This should not happen.");
                        } else if ( win.length == 1 ) {
                            console.log("one summary window found");
                            uri = win[0].uri;
                        } else {
                            console.log("no summary windows found");
                        }

                    } else {
                        summaryType = "aggregation"
                        var that = this;
                        let win = $.grep( summaries, function( summary, k ) {
                            return summary["summary-type"] == summaryType && summary["summary-window"] == that.summaryWindow;
                        });

                        // TODO: add ability to use aggregates
                        // HERE NOW!

                        // TODO: allow lower summary windows
                        if ( win.length > 1 ) {
                            console.log("WEIRD: multiple summary windows found. This should not happen.", win);
                        } else if ( win.length == 1 ) {
                            console.log("one summary window found", summaryWindow, eventType, win);
                            uri = win[0].uri;
                        } else {
                            console.log("no summary windows found", summaryWindow, eventType, win);
                        }


                    }

                    if ( uri === null ) {
                        uri = eventTypeObj["base-uri"];
                    }
                    uri += "?time-start=" + start + "&time-end=" + end;
                    let url = baseURL + uri;

                    // If using CORS proxy
                    if ( this.useProxy ) {
                        url = encodeURIComponent( url );
                        url = proxyURL + url;
                    }

                    console.log("data url", url);

                    // Make sure we don't retrieve the same URL twice
                    if ( dataURLs[url] ) {
                        console.log("got the same URL twice: ", url);
                        //continue;

                    } else {
                        dataURLs[url] = 1;

                    }
                    let row = pruneDatum( datum );
                    row.protocol = datum["ip-transport-protocol"];
                    row.ipversion = ipversion;

                    dataReqCount++;

                    if ( eventType == "failures" ) {
                        console.log("FAILURES row", row);

                    }
                    this.serverRequest = $.get( url, function(data) {
                        this.handleDataResponse(data, eventType, row);
                    }.bind(this))
                    .fail(function( data ) {
                        console.log("get data failed; skipping this collection");
                        this.handleDataResponse(null);
                        //completedDataReqs++;
                        //dataReqCount--;
                        /*
                        if ( dataReqCount <= 0 ) {
                            this.handleMetadataError( data );
                        }
                        */
                    }.bind(this));


                }
            }
        }

    },
    handleDataResponse: function( data, eventType, datum ) {
        if ( data !== null ) {
            let direction = datum.direction;
            let protocol = datum.protocol;
            let row = datum;
            row.eventType = eventType;
            row.data = data;
            if (data.length > 0) {
                chartData.push( row );
                console.log("got datapoints", data.length, "eventType", eventType);
            }
        }
        completedDataReqs++;
        if ( completedDataReqs >= dataReqCount ) {
            let endTime = Date.now();
            let duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED ALL DATA ", dataReqCount, " REQUESTS in", duration);

            // TODO: change this so it creates the esmond time series upon completion of each request, rather than after all requests has completed

            chartData = this.esmondToTimeSeries( chartData );

            endTime = Date.now();
            duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED CREATING TIMESERIES in " , duration);
            console.log("chartData: ", chartData);

            var self = this;

            if ( chartData.length > 0 ) {
                emitter.emit("get");
            } else {
                emitter.emit("empty");

            }

            completedDataReqs = 0;
            dataReqCount = 0;


        } else {
            console.log("handled " + completedDataReqs + " out of " + dataReqCount + " data requests");

        }
    },

    toggleType: function( options ) {
        options = this.pruneItemsToHide( options );
        this.itemsToHide = options;
        emitter.emit("get");
    },

    pruneItemsToHide: function ( options ) {
        let oldOptions = options;
        options = [];
        for(let id in oldOptions ) {
            options.push( oldOptions[id] );
        }
        return options;
    },

    filterData: function( data, filters, itemsToHide ) {
        let results = $.grep( data, function( e, i ) {
            let found = true;
            for (var key in filters ) {
                let val = filters[key];
                if ( ( key in e.properties ) && e.properties[key] == val ) {
                    found = true;
                } else {
                    return false;
                }
            }
            return found;
        });
        // Filter out items in the itemsToHide array
        if ( typeof itemsToHide != "undefined" && itemsToHide.length > 0 ) {
            results = $.grep( results, function( e, i ) {
                let show = false;
                for ( var j in itemsToHide ) {
                    let found = 0;
                    let item = itemsToHide[j];
                    for( var key in item ) {
                        let val = item[key];
                        if ( ( key in e.properties ) && e.properties[key] == val ) {
                            show  = false || show;
                            if ( e.properties.eventType == "packet-loss-rate" && e.properties.mainTestType == "throughput" ) {
                                console.log("packet-loss throughput");

                            }
                            found++;
                        } else {
                            show = true || show;
                        }
                    }
                    show = ( found < Object.keys( item ).length );
                    if ( found >= Object.keys( item ) .length ) {
                        return false;

                    }
                }
                return show;
            });
        }

        return results;

    },

    getChartData: function( filters, itemsToHide ) {
        itemsToHide = this.pruneItemsToHide( itemsToHide );
        let data = chartData;
        let results = this.filterData( data, filters, itemsToHide );
        let min;
        let max;

        let self = this;
        $.each( results, function( i, val ) {
            let values = val.values;
            if ( typeof values == "undefined" ) {
                return true;
            }
            let valmin = values.min();
            let valmax = values.max();

            min = self.getMin( min, valmin );
            max = self.getMax( max, valmax );
        });
        let stats = {
            min: min,
            max: max
        };

        return {
            stats: stats,
            results: results
        };

    },
    getMin: function( val1, val2  ) {
            // Get the min of the provided values
            let min;
            if ( !isNaN( Math.min( val1, val2 ) ) ) {
                min = Math.min( val1, val2 );
            } else if ( !isNaN( val1 ) ) {
                min = val1;
            } else if ( ! isNaN( val2 ) ) {
                min = val2;
            }
            return min;
    },
    getMax: function( val1, val2 ) {
            // Get the max of the provided values
            let max;
            if ( !isNaN( Math.max( val1, val2 ) ) ) {
                max = Math.max( val1, val2 );
            } else if ( !isNaN( val1 ) ) {
                max = val1;
            } else if ( !isNaN( val2 ) ) {
                max = val2;

            }
            return max;
    },
    getUniqueValues: function( fields ) {
        let data = chartData;
        var self = {};
        self.data = data;
        let unique = {};
        $.each( data, function( index, datum ) {
            $.each( fields, function( field ) {
                let dat =  self.data;
                let val = datum.properties[field];
                if ( ! ( field in unique) ) {
                    unique[field] = {};
                    unique[field][val] = 1;
                }
                unique[field][val] = 1;
            });
        });
        $.each( unique, function( key, val ) {
            unique[key] = Object.keys( val );

        });
        return unique;

    },
    getMainEventType: function( eventTypes ) {
        let mainTypes = {
            "throughput": 1,
            "histogram-owdelay": 1,
            "histogram-rtt": 1
        };
        for( var i in eventTypes ) {
            let type = eventTypes[i]["event-type"];
            if ( type in mainTypes ) {
                return type;
            }
        }
        return;
    },
    esmondToTimeSeries: function( inputData ) {
        let outputData = {};
        let output = [];
        let self = this;
        console.log("esmondToTimeSeries inputData", inputData);
        if ( ( typeof inputData == "undefined" ) || inputData.length == 0 ) {
            return [];
        }

        // loop through non-failures first, find maxes
        // then do failures and scale values
        $.each( inputData, function( index, datum ) {
            let max;
            let min;
            if ( $.isEmptyObject( datum ) || !$.isPlainObject( datum ) || typeof datum == "undefined" ) {
                    return true;

            }
            let eventType = datum.eventType;
            let direction = datum.direction;
            let protocol = datum.protocol;
            if ( eventType == "failures" ) {
                return true;
            }
            if ( !( eventType in outputData ) ) {
                outputData[eventType] = {};
            } else {
                if (typeof outputData[eventType].min != "undefined") {
                    min = outputData[eventType].min;
                }
                if (typeof outputData[eventType].max != "undefined") {
                    max = outputData[eventType].max;
                }
            }
            let mainEventType = self.getMainEventType( datum["event-types"] );

            let values = [];
            let failureValues = [];
            let series = {};
            let failureSeries = {};

            let testType;
            let mainTestType;


            testType = self.eventTypeToTestType( eventType );
            if ( typeof testType == "undefined" ) {
                console.log("undefined testType", datum);
                return true;

            }
            mainTestType = self.eventTypeToTestType( mainEventType );

            if ( typeof datum == "undefined" || typeof datum.data == "undefined" || datum.data.length == 0 ) {
                return true;

            }

            $.each(datum.data, function( valIndex, val ) {
                const ts = val["ts"];
                const timestamp = new moment(new Date(ts * 1000)); // 'Date' expects milliseconds
                let failureValue = null;
                let value = val["val"];
                if ( eventType == 'histogram-owdelay') {
                    value = val["val"].minimum;
                } else if ( eventType == 'histogram-rtt' ) {
                    value = val["val"].minimum;
                } else if ( eventType == 'packet-count-lost' ) {
                    if ( val["val"] > 0 ) {
                        //console.log('packet count lost > 0', val);
                    }

                } else if ( eventType == 'packet-count-sent' ) {
                    //console.log('packet count sent', val);

                } else if ( eventType == 'packet-retransmits' ) {
                } else if ( eventType == "packet-loss-rate" || eventType == "packet-loss-rate-bidir" ) {
                    // convert to %
                    value *= 100;

                }

                if (value <= 0 && eventType != "histogram-owdelay" ) {
                    //console.log("VALUE IS ZERO OR LESS", Date());
                    value = 0.000000001;
                }
                if ( eventType == "failures" ) {
                    // handle failures, which are supposed to be NaN
                    failureValue = value;

                } else if ( isNaN(value) ) {
                    //console.log("VALUE IS NaN", eventType);
                }
                if ( failureValue != null ) {
                    let failureObj = {
                        errorText: failureValue.error,
                        value: 95,
                        type: "error"
                    };
                    let errorEvent = new Event( timestamp, failureObj );
                    failureValues.push( errorEvent );
                } else {
                    values.push([timestamp.toDate().getTime(), value]);
                }
                if ( typeof min == "undefined" ) {
                    min = value;
                } else if ( value < min ) {
                    min = value;
                }
                if ( typeof max == "undefined" ) {
                    max = value;
                } else if ( value > max ) {
                    max = value;
                }

            });

            series = new TimeSeries({
                name: eventType + "." + direction,
                columns: ["time", "value"],
                points: values
            });


            let ipversion = datum.ipversion;

            outputData[ eventType ].max = max;
            outputData[ eventType ].min = min;

            let row = {};

            row.properties = pruneDatum( datum );
            row.properties.eventType = eventType;
            row.properties.mainEventType = mainEventType;
            row.properties.testType = testType;
            row.properties.mainTestType = mainTestType;
            row.values = series;
            output.push(row);

        });

        console.log("outputData", outputData);
        console.log("output", output);
        this.eventTypeStats = outputData;

        // Create retransmit series
        output = this.pairRetrans( output );

        // Create failure series

        $.each( inputData, function( index, datum ) {
            let eventType = datum.eventType;
            let direction = datum.direction;
            let protocol = datum.protocol;
            if ( eventType != "failures" ) {
                return true;
            }
            let mainEventType = self.getMainEventType( datum["event-types"] );

            let min = 0;
            let max;
            if ( typeof mainEventType != "undefined"
                    && mainEventType in outputData
                    && "max" in outputData[ mainEventType ] ) {
                max = outputData[ mainEventType ].max;
            }
            if ( isNaN(max) ) {
                max = 1;

            }
            //datum.mainEventType = mainEventType;

            let failureValues = [];
            let failureSeries = {};

            let testType;
            let mainTestType;

            testType = self.eventTypeToTestType( eventType );
            mainTestType = self.eventTypeToTestType( mainEventType );
            $.each(datum.data, function( valIndex, val ) {
                const ts = val["ts"];
                const timestamp = new moment(new Date(ts * 1000)); // 'Date' expects milliseconds
                let failureValue = null;
                let value = val["val"];
                if ( eventType == "failures" ) {
                    failureValue = value;
                } 
                if ( failureValue != null ) {
                    let failureObj = {
                        errorText: failureValue.error,
                        value: 0.9 * max,
                        type: "error"
                    };
                    let errorEvent = new Event( timestamp, failureObj );
                    failureValues.push( errorEvent );
                }

            });
            failureSeries = new TimeSeries( {
                name: eventType + "." + direction + ".failures",
                events: failureValues,
            });
            let row = {};

            row.properties = pruneDatum( datum );
            row.properties.min = min;
            row.properties.max = max;
            row.properties.eventType = eventType;
            row.properties.mainEventType = mainEventType;
            row.properties.testType = testType;
            row.properties.mainTestType = mainTestType;
            row.values = failureSeries;
            output.push(row);
        });
        return output;
    },
    scaleValues: function( series, maxVal ) {
        var seriesMax = series.max();
        if ( typeof maxVal == "undefined" ) {
            maxVal = seriesMax;
        }
        var scaled = series.map( function( e ) {
            let time = e.timestamp();
            let value = e.value();
            if ( maxVal == 0 || seriesMax == 0 || value == 1e-9 ) {
                value = 1e-9;
            } else {
                value = e.value() * maxVal / seriesMax;
            }
            let newEvent = new Event( time, {"value": value});
            return newEvent;
        });
        return scaled;


    },
    eventTypeToTestType: function( eventType ) {
        let testType;
        if (eventType == "histogram-owdelay" || eventType == "histogram-rtt" ){
            testType = "latency";
        } else if ( eventType == "throughput" || eventType == "packet-retransmits") {
            testType = "throughput";
        } else if ( lossTypes.indexOf( eventType ) > -1 ) {
            testType = "loss";
        }
        return testType;

    },
    pairRetrans: function( data ) {
        let retransFilter = { eventType: "packet-retransmits" };
        let retransData = this.filterData( data, retransFilter, [] );
        let tputFilter = { eventType: "throughput", "ip-transport-protocol": "tcp" };
        let tputData = this.filterData( data, tputFilter ); 
        let newSeries = [];

        let deleteIndices = [];

        for(var i in retransData ) {
            let row = retransData[i];
            let eventType = row.properties.eventType;
            let key = row.properties["metadata-key"];
            let direction = row.properties["direction"];

            // If this is throughput, add the value of the
            // corresponding retrans type 
            let self = this;
            self.row = row;
            self.key = key;
            self.direction = direction;

            let indices = $.map( data, function( row, index ) {
                if ( eventType == "packet-retransmits" ) {
                    var tpItem = data[index];

                    // If the value has the same "metadata-key", it's from the same test

                    if ( tpItem.properties["metadata-key"] == self.key && tpItem.properties["direction"] == self.direction ) {
                        if ( tpItem.properties.eventType == "throughput" ) {

                            // handle the throughput/retrans values
                            let newEvents = [];
                            for ( let reEvent of self.row.values.events() ) {
                                if ( typeof reEvent == "undefined" || reEvent === null ) {
                                    return null;
                                }

                                let retransVal = reEvent.value();

                                if ( retransVal < 1 ) {
                                    continue;

                                }

                                let tputVal = tpItem.values.atTime( reEvent.timestamp() ).value();

                                let newEvent = new Event(reEvent.timestamp(), { value: tputVal, retrans: retransVal }); 
                                newEvents.push( newEvent );
                            }
                            const series = new TimeSeries({
                                name: "Retransmits",
                                events: newEvents
                            });
                            let newRow = {};
                            newRow.properties = self.row.properties;
                            newRow.values = series;
                            newSeries.push( newRow );
                        } else if ( eventType == "packet-retransmits" ) {
                            return index;
                        }

                    }
                }



            });
            deleteIndices = deleteIndices.concat( indices );

        }

        // Delete the original test results with "packet-retransmits"

        let reducedData = $.map( data, function( item, index ) {
            if ( deleteIndices.indexOf( index ) > -1 ) {
                return null;
            } else {
                return item;
            }
        });

        data = reducedData.concat( newSeries );

        return data;

    },
    pairSentLost: function( data ) {
        let deleteIndices = [];

        for(var i in data ) {
            let row = data[i];
            let eventType = row.properties.eventType;
            let key = row.properties["metadata-key"];

            // If this is packet-count-sent, add the value to the
            // corresponding packet-count-lost type and delete this

            if ( eventType == "packet-loss-rate" || eventType == "packet-loss-rate-bidir"  ) {
                let indices = $.map( data, function( item, index ) {
                    // If the value has the same "metadata-key", it's from the same test
                    if ( item.properties["metadata-key"] == key ) {
                        if ( item.properties.eventType == "packet-count-sent" ) {
                            row.sentValue = data[index].value;
                            return index;
                        } else if ( item.properties.eventType == "packet-count-lost" ) {
                            row.lostValue = data[index].value;
                            return index;
                        } else if ( item.properties.eventType == "packet-count-lost-bidir" ) {
                            row.lostValue = data[index].value;
                            return index;
                        }
                    }
                });

                deleteIndices = deleteIndices.concat( indices );

            }

        }

        // Delete the values with "packet-count-sent"
        data = $.map( data, function( item, index ) {
            if ( deleteIndices.indexOf( index ) > -1 ) {
                return null;
            } else {
                return item;
            }
        });

        return data;

    },
    subscribe: function( callback ) {
        emitter.on("get", callback);
    },
    unsubscribe: function( callback ) {
        emitter.off("get", callback);
    },
     subscribeError: function( callback ) {
        emitter.on("error", callback);
    },
    unsubscribeError: function( callback ) {
        emitter.off("error", callback);
    },
    subscribeEmpty: function( callback ) {
        emitter.on("empty", callback);
    },
    unsubscribeEmpty: function( callback ) {
        emitter.off("empty", callback);
    },
    render: function() {
    },

};

let pruneDatum = function( oldDatum ) {
        let datum = {};
        for(let i in oldDatum) {
            if ( i != "data" ) {
                datum[i] = oldDatum[i];
            }
        }
        return datum;
    };
