var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();

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
                urls.push(url);

                this.serverRequest = $.get( url, function(data) {
                    this.handleMetadataResponse(data, direction[j]);
                }.bind(this)); // TODO: double check this logic. are we using correct reqCount?

                reqCount++;
            }
        }
/*
        for(let i in urls) {
            let url = urls[i];
            this.serverRequest = $.get( url, function(data) {
                this.handleMetadataResponse(data);
            }.bind(this));

        }
        */
        /*
           this.serverRequest = $.get(url, function ( data ) {
           console.log('ajax request came back; throughput data', Date(), data );
           var values = this.esmondToTimeSeries( data, 'throughput' );
           throughputValues = values.values;
           throughputSeries = values.series;
           console.log('throughput values', Date(), throughputValues);
//this.renderChart();
this.forceUpdate();
}.bind(this));
*/

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
            console.log("datum", datum);
            for( let j in datum["event-types"] ) {
                let eventTypeObj = datum["event-types"][j];
                let eventType = eventTypeObj["event-type"];
                let summaries = eventTypeObj["summaries"];
                let summaryType = defaultSummaryType;
                
                let uri = null;

                if ( $.inArray( eventType, multipleTypes ) >= 0 ) {
                    summaryType = "statistics";
                    let win = $.grep( summaries, function( summary, k ) {
                        return summary["summary-type"] == summaryType && summary["summary-window"] == window;
                    });
                    console.log("win", win);
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
                    console.log("single value window", win);
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
                //console.log("uri", uri);
                // TODO: add timerange to URL
                uri += "?time-start=" + start + "&time-end=" + end;
                let url = baseURL + uri;
                console.log("url", url);

                urls.push( {eventType: eventType, url: url, direction: direction});

                dataReqCount++; // TODO: double check the ordre of this and the request

                this.serverRequest = $.get( url, function(data) {
                    this.handleDataResponse(data, eventType, direction);
                }.bind(this));
                

            }
        }
        /*
        for(let i in urls) {
            let obj = urls[i];
            let url = obj.url;
            let eventType = obj.eventType;
            this.serverRequest = $.get( url, function( data ) {
                this.handleDataResponse( data, eventType );
            }.bind(this));
        }
        */

    },
    handleDataResponse: function( data, eventType, direction ) {
        //console.log("response data: ", data);
        let row = {};
        row.eventType = eventType;
        row.direction = direction;
        row.data = data;
        this.chartData.push( row );
        //$.merge( this.chartData, data );
        completedDataReqs++;
        if ( completedDataReqs == dataReqCount ) {
            //console.log("done getting data");
            let endTime = Date.now();
            let duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED ALL DATA ", dataReqCount, " REQUESTS in", duration);
            console.log("chartData: ", this.chartData);
            completedDataReqs = 0;
            dataReqCount = 0;
            return this.chartData;

        }
    },
    render: function() {
    },

};
