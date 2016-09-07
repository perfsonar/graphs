import moment from "moment";

import { TimeSeries, TimeRange } from "pondjs";

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

    },

    getHostPairMetadata: function ( sources, dests, startInput, endInput, ma_url ) {
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


                let url = ma_url + "?source=" + src + "&destination=" + dst;
                // url += "&time-start=" + start + "&time-end=" + end; TODO: add this back?
                console.log("metadata url: ", url);

                this.serverRequest = $.get( url, function(data) {
                    this.handleMetadataResponse(data, direction[j]);
                }.bind(this)); // TODO: double check this logic. are we using correct reqCount?

                reqCount++;
            }
        }
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
            console.log("getData datum", datum);
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

                // TODO: change failures so they are per event type

                if ( uri === null ) {
                    console.log("uri not found, setting ... ");
                    uri = eventTypeObj["base-uri"];
                }
                // TODO: add timerange to URL
                uri += "?time-start=" + start + "&time-end=" + end;
                let url = baseURL + uri;
                console.log("data url", url);
                let row = pruneDatum( datum );
                row.protocol = datum["ip-transport-protocol"];
                row.ipversion = ipversion;

                dataReqCount++; // TODO: double check the ordre of this and the request

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
        //row.direction = direction;
        row.data = data;
        //row.protocol = protocol;
        if (data.length > 0) {
            chartData.push( row );
        }
        //$.merge( chartData, data );
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

    getChartData: function( filters, itemsToHide ) {
        //itemsToHide = this.itemsToHide;
        itemsToHide = this.pruneItemsToHide( itemsToHide );
        let data = chartData;
        let min;
        let max;
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
        let max;
        let min;
        let output = [];
        let self = this;
        console.log("esmondToTimeSeries inputData", inputData);
        $.each( inputData, function( index, datum ) {
            let eventType = datum.eventType;
            let direction = datum.direction;
            let protocol = datum.protocol;
            let mainEventType = self.getMainEventType( datum["event-types"] );
            //datum.mainEventType = mainEventType;

            var values = [];
            var series = {};

            $.each(datum.data, function( valIndex, val ) {
                const ts = val["ts"];
                const timestamp = new moment(new Date(ts * 1000)); // 'Date' expects milliseconds
                var value = val["val"];
                if ( eventType == 'histogram-owdelay') {
                    //eventType = 'owdelay';
                    //datum.eventType = 'owdelay';
                    value = val["val"].minimum;
                } else if ( eventType == 'histogram-rtt' ) {
                    //eventType = 'rtt';
                    value = val["val"].minimum;
                }
                // TODO: fix failures
                if (value <= 0 ) {
                    console.log("VALUE IS ZERO OR LESS", Date());
                    value = 0.000000001;
                }
                if ( isNaN(value) ) {
                    console.log("VALUE IS NaN", eventType);
                }
                values.push([timestamp.toDate().getTime(), value]);

            });

            series = new TimeSeries({
                name: eventType + "." + direction,
                columns: ["time", "value"],
                points: values
            });

            let ipversion = datum.ipversion;
            // TODO: add ipversion to the date selector here (maybe not?)

            if ( !( eventType in outputData ) ) {
                outputData[eventType] = {};
                outputData[eventType][ipversion] = {};
            } else {
                if (typeof outputData[eventType].min != "undefined") {
                    max = outputData[eventType].min;
                }
                if (typeof outputData[eventType].max != "undefined") {
                    max = outputData[eventType].max;
                }
            }
            let row = {};
            let testType;
            if (eventType == "histogram-owdelay" || eventType == "histogram-rtt" ){
                testType = "latency";
            } else if ( eventType == "throughput") {
                testType = "throughput";
            } else if ( eventType = "packet-loss-rate" ) {
                testType = "loss";
            }
            let mainTestType;
            if (mainEventType == "histogram-owdelay" || mainEventType == "histogram-rtt" ){
                mainTestType = "latency";
            } else if ( mainEventType == "throughput") {
                mainTestType = "throughput";
            } else if ( mainEventType = "packet-loss-rate" ) {
                mainTestType = "loss";
            }

            row.properties = pruneDatum( datum );
            row.properties.eventType = eventType;
            row.properties.mainEventType = mainEventType;
            row.properties.testType = testType;
            row.properties.mainTestType = mainTestType;
            row.values = series;
            output.push(row);

        });
        return output;
    },
    subscribe: function( callback ) {
        emitter.on("get", callback);
    },
    unsubscribe: function( callback ) {
        emitter.off("get", callback);
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
