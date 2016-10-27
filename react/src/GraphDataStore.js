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

module.exports = {

    eventTypes: ['throughput', 'histogram-owdelay', 'packet-loss-rate',
                    'packet-retransmits', 'histogram-rtt', 'failures'],
            //|| ['histogram-rtt'];
    maURL: null,

    initVars: function() {
        chartMetadata = [];
        chartData = [];
        this.eventTypes = ['throughput', 'histogram-owdelay', 'packet-loss-rate',
                    'packet-retransmits', 'histogram-rtt', 'failures'];
        this.dataFilters = [];
        this.itemsToHide = [];
        this.errorData = undefined;

    },

    getHostPairMetadata: function ( sources, dests, startInput, endInput, ma_url, params ) {
        start = startInput;
        end = endInput;

        this.initVars();

        this.maURL = new URL(ma_url);
        if ( !$.isArray( sources ) ) {
            sources = [ sources ];
        }
        if ( !$.isArray( dests ) ) {
            dests = [ dests ];
        }

        if ( !$.isArray( ma_url ) ) {
            ma_url = [ ma_url ];
        }



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

                        }

                    }
                }



                // url += "&time-start=" + start + "&time-end=" + end; TODO: add this back?
                console.log("metadata url: ", url);

                this.serverRequest = $.get( url, function(data) {
                    this.handleMetadataResponse(data, direction[j]);
                }.bind(this))
                .fail(function( data ) {
                    this.handleMetadataError( data );
                }.bind(this)
                );

                reqCount++;
            }
        }
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
            data = this.filterEventTypes( chartMetadata );
            data = this.getData( chartMetadata );
            console.log("chartMetadata", chartMetadata);
            if ( chartMetadata.length == 0 ) {
                emitter.emit("get");

            }

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
    getData: function( metaData, window ) {
        window = 3600; // todo: this should be dynamic
        //window = 86400; // todo: this should be dynamic
        let defaultSummaryType = "aggregation"; // TODO: allow other aggregate types
        let multipleTypes = [ "histogram-rtt", "histogram-owdelay" ];
        let baseURL = this.maURL.origin;
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
                    let win = $.grep( summaries, function( summary, k ) {
                        return summary["summary-type"] == summaryType && summary["summary-window"] == window;
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
                    let win = $.grep( summaries, function( summary, k ) {
                        return summary["summary-type"] == summaryType && summary["summary-window"] == window;
                    });
                    // TODO: allow lower summary windows
                    if ( win.length > 1 ) {
                        console.log("WEIRD: multiple summary windows found. This should not happen.");
                    } else if ( win.length == 1 ) {
                        console.log("one summary window found");
                        uri = win[0].uri;
                    } else {
                        console.log("no summary windows found");
                    }


                }

                if ( uri === null ) {
                    console.log("uri not found, setting ... ");
                    uri = eventTypeObj["base-uri"];
                }
                uri += "?time-start=" + start + "&time-end=" + end;
                let url = baseURL + uri;
                console.log("data url", url);
                let row = pruneDatum( datum );
                row.protocol = datum["ip-transport-protocol"];
                row.ipversion = ipversion;

                dataReqCount++;

                if ( eventType == "failures" ) {
                    console.log("FAILURES row", row);

                }
                this.serverRequest = $.get( url, function(data) {
                    this.handleDataResponse(data, eventType, row);
                }.bind(this));


            }
        }

    },
    handleDataResponse: function( data, eventType, datum ) {
        let direction = datum.direction;
        let protocol = datum.protocol;
        let row = datum;
        row.eventType = eventType;
        row.data = data;
        if (data.length > 0) {
            chartData.push( row );
        }
        completedDataReqs++;
        if ( completedDataReqs == dataReqCount ) {
            let endTime = Date.now();
            let duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED ALL DATA ", dataReqCount, " REQUESTS in", duration);
            completedDataReqs = 0;
            dataReqCount = 0;

            // TODO: change this so it creates the esmond time series upon completion of each request, rather than after all requests has completed

            let newChartData = this.esmondToTimeSeries( chartData );

            chartData = newChartData;

            endTime = Date.now();
            duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED CREATING TIMESERIES in " , duration);
            console.log("chartData: ", chartData);
            emitter.emit("get");

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
        let unique = {};
        $.each( data, function( index, datum ) {
            $.each( fields, function( field ) {
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

        // loop through non-failures first, find maxes
        // then do failures and scale values
        $.each( inputData, function( index, datum ) {
            let max;
            let min;
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
            mainTestType = self.eventTypeToTestType( mainEventType );

            $.each(datum.data, function( valIndex, val ) {
                const ts = val["ts"];
                const timestamp = new moment(new Date(ts * 1000)); // 'Date' expects milliseconds
                let failureValue = null;
                let value = val["val"];
                if ( eventType == 'histogram-owdelay') {
                    value = val["val"].minimum;
                } else if ( eventType == 'histogram-rtt' ) {
                    value = val["val"].minimum;
                }
                if (value <= 0 ) {
                    console.log("VALUE IS ZERO OR LESS", Date());
                    value = 0.000000001;
                }
                if ( eventType == "failures" ) {
                    // handle failures, which are supposed to be NaN
                    failureValue = value;

                } else if ( isNaN(value) ) {
                    console.log("VALUE IS NaN", eventType);
                }
                if ( failureValue != null ) {
                    let failureObj = {
                        errorText: failureValue.error,
                        value: 85,
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
                        value: 0.85 * max,
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
    eventTypeToTestType: function( eventType ) {
        let testType;
        if (eventType == "histogram-owdelay" || eventType == "histogram-rtt" ){
            testType = "latency";
        } else if ( eventType == "throughput") {
            testType = "throughput";
        } else if ( eventType == "packet-loss-rate" ) {
            testType = "loss";
        }
        return testType;

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
