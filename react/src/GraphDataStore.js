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
let start = Math.floor( Date.now() - 7 * 86400 / 1000 );
let end = Math.ceil( Date.now() / 1000 );

module.exports = {

    eventTypes: ['throughput', 'histogram-owdelay', 'packet-loss-rate',
                    'packet-retransmits', 'histogram-rtt', 'failures'],
            //|| ['histogram-rtt'];
    maURL: null,
    chartMetadata: [],
    chartData: [],

    getHostPairMetadata: function ( sources, dests, startInput, endInput, ma_url ) {
        start = startInput;
        end = endInput;

        this.maURL = new URL(ma_url);
        if ( !$.isArray( sources ) ) {
            sources = [ sources ];
        }
        if ( !$.isArray( dests ) ) {
            dests = [ dests ];
        }

        if ( ! end ) {
            end = Math.ceil( Date.now() / 1000 ); 
        }

        if ( ! start ) {
            start = Math.floor( end - 86400 * 7 ); // TODO: 7 days a good default?
        }
        console.log("start", start);
        console.log("end", end);

        let urls = [];
        for( let i in sources ) {
            let directions = [ [ sources[i], dests[i] ], 
                [ dests[i], sources[i] ] ];
            let direction = [ "forward", "reverse" ];
            console.log("directions", directions);
            for( let j in directions ) {
                console.log("directions[j]", directions[j]);
                let src = directions[j][0];
                let dst = directions[j][1];
                console.log("got here!", src, dst, start, end);


                let url = ma_url + "?source=" + src + "&destination=" + dst;
                url += "&time-start=" + start + "&time-end=" + end;
                console.log("url: ", url);
                urls.push(url); // TODO: review -- do we need this?

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
        console.log("data", data);
        $.merge( this.chartMetadata, data );
        completedReqs++;
        if ( completedReqs == reqCount ) {
            let endTime = Date.now();
            let duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED ALL", reqCount, " REQUESTS in", duration);
            completedReqs = 0;
            data = this.filterEventTypes( this.chartMetadata );
            data = this.getData( this.chartMetadata );
            console.log("chartMetadata", this.chartMetadata);

        }


    },
    filterEventTypes: function( data, eventTypesParam ) {
        //let eventTypes = this.getEventTypes( eventTypesParam );
        let eventTypes = this.getEventTypes();
        console.log("eventTypes", eventTypes);

        let tests = $.map( data, function( test, i ) {
            console.log("test", test);
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
        console.log("tests after mapping: ", tests);


        return tests;
    },
    getEventTypes: function( eventTypesParam ) {
        let eventTypes = eventTypesParam || this.eventTypes;
        for(var i in eventTypes) {
            eventTypes.push( eventTypes[i] + "-reverse" );


        }
        console.log("eventTypes", eventTypes);
        return eventTypes;

    },
    getData: function( metaData, window ) {
        window = 3600; // todo: this should be dynamic
        //window = 86400; // todo: this should be dynamic
        let defaultSummaryType = "aggregation"; // TODO: allow other aggregate types
        let multipleTypes = [ "histogram-rtt", "histogram-owdelay" ];
        let baseURL = this.maURL.origin;
        let urls = [];
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
                    console.log("source", source, ipversion);

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
                //console.log("uri", uri);
                // TODO: add timerange to URL
                uri += "?time-start=" + start + "&time-end=" + end;
                let url = baseURL + uri;
                console.log("url", url);
                let row = pruneDatum( datum );
                row.protocol = datum["ip-transport-protocol"];
                row.ipversion = ipversion;
                console.log("row", row);
                /*
                let row = {
                    eventType: eventType,
                    url: url,
                    direction: direction,
                    protocol: datum["ip-transport-protocol"],
                    ipversion: ipversion
                };
                */

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
            this.chartData.push( row );
        }
        //$.merge( this.chartData, data );
        completedDataReqs++;
        if ( completedDataReqs == dataReqCount ) {
            //console.log("done getting data");
            let endTime = Date.now();
            let duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED ALL DATA ", dataReqCount, " REQUESTS in", duration);
            //console.log("chartData: ", this.chartData);
            completedDataReqs = 0;
            dataReqCount = 0;

            // TODO: change this so it creates the esmond time series upon completion of each request, rather than after all requests has completed

            let newChartData = this.esmondToTimeSeries( this.chartData );

            this.chartData = newChartData;

            endTime = Date.now();
            duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED CREATING TIMESERIES in " , duration);
            console.log("chartData: ", this.chartData);
            emitter.emit("get");

        }
    },
    getChartDataOld: function( eventType ) {
        let data = this.chartData;
        let results;
        if ( typeof eventType == "undefined" || typeof data[ eventType ] == "undefined" ) {
            results = data;
        } else {
            results = data[ eventType ];
            /*
            results = $.grep( data, function(e) {
                return e[eventType];
            });
            */

        }
        return results;

    },
    getChartData: function( filters ) {
        let data = this.chartData;
        console.log("getting chart data ... filters", filters); // TODO: figure out why filters sometimes undefined
        let min;
        let max;
        let results = $.grep( data, function( e, i ) {
            //console.log("grepping e", e, "i", i, "filters", filters);
            let found = true;
            for (var key in filters ) {
                let val = filters[key];
                //console.log("key", key, "val", val);
                if ( ( key in e.properties ) && e.properties[key] == val ) {
                    found = true;
                } else {
                    return false;
                }
            }
            return found;
        });
        $.each( results, function( i, val ) {
            let values = val.values;
            let valmin = values.min();

            // Update the min for the filtered data
            if ( !isNaN( Math.min( valmin, min ) ) ) {
                min = Math.min( valmin, min );
            } else if ( !isNaN( valmin ) ) {
                min = valmin;
            }

            // Update the max for the event type
            let valmax = values.max();
            // Update the max for the filtered data
            if ( !isNaN( Math.max( valmax, max ) ) ) {
                max = Math.max( valmax, max );
            } else if ( !isNaN( valmax ) ) {
                max = valmax;
            }
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
        let data = this.chartData;
        let unique = {};
        $.each( data, function( index, datum ) {
            $.each( fields, function( field ) {
                let val = datum.properties[field];
                console.log("field", field, "val", val, "unique", unique);
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
        console.log("unique", unique);
        return unique;

    },
    esmondToTimeSeries: function( inputData ) {
        let outputData = {};
        let max;
        let min;
        let output = [];
        console.log("esmondToTimeSeries inputData", inputData);
        $.each( inputData, function( index, datum ) {
            let eventType = datum.eventType;
            let direction = datum.direction;
            let protocol = datum.protocol;

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
            //console.log('creating series ...', Date());

            series = new TimeSeries({
                name: eventType + "." + direction,
                columns: ["time", "value"],
                points: values
            });
            //console.log('created series ...', series, "values", values);

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
            //let row = pruneDatum( datum );
            let row = {};
            row.properties = pruneDatum( datum );
            //row.properties = {};
            //row.properties.direction = direction;
            //row.properties.protocol = protocol;
            row.properties.eventType = eventType;
            row.values = series;
            output.push(row);
            console.log("output", output);

            /*

            // Update the min for the event type
            if ( !isNaN( Math.min( series.min(), min ) ) ) {
                outputData[eventType].min = Math.min( series.min(), min );
            } else if ( !isNaN( series.min() ) ) {
                outputData[eventType].min = series.min();
            }

            // Update the max for the event type
            if ( !isNaN( Math.max( series.max(), max ) ) ) {
                outputData[eventType].max = Math.max( series.max(), max );
            } else if ( !isNaN( series.max() ) ) {
                outputData[eventType].max = series.max();
            }

            if ( ! ( "results" in outputData[eventType][ipversion] ) ) {
                outputData[eventType][ipversion].results = [];
            }
            outputData[eventType][ipversion].results.push( row );
            */
            //row.ipversion = ipversion;
        });
        console.log("outputData", outputData);
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
