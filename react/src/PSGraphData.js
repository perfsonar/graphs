var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();

let completedReqs = 0;
let startTime = Date.now();
module.exports = {

    eventTypes: ['throughput', 'histogram-owdelay', 'packet-loss-rate',
                    'packet-retransmits', 'histogram-rtt', 'failures'],
            //|| ['histogram-rtt'];

    getHostPairMetadata: function ( sources, dests, start, end, ma_url ) {
        if ( !$.isArray( sources ) ) {
            sources = [ sources ];
        }
        if ( !$.isArray( dests ) ) {
            dests = [ dests ];
        }
        let reqCount = 0;

        for( let i in sources ) {
            let directions = [ [ sources[i], dests[i] ], 
                [ dests[i], sources[i] ] ];
            console.log("directions", directions);
            for( let j in directions ) {
                console.log("directions[j]", directions[j]);
                let src = directions[j][0];
                let dst = directions[j][1];
                console.log("got here!", src, dst, start, end);


                let url = ma_url + "?source=" + src + "&destination=" + dst;
                url += "&time-start=" + start + "&time-end=" + end;
                console.log("url: ", url);
                this.serverRequest = $.get( url, function(data) {
                    this.handleMetadataReponse(data, reqCount);
                }.bind(this));
                reqCount++;
            }
        }
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
    handleMetadataReponse: function( data, reqCount ) {
        console.log("data", data);
        completedReqs++;
        if ( completedReqs == reqCount ) {
            let endTime = Date.now();
            let duration = ( endTime - startTime ) / 1000;
            console.log("COMPLETED ALL", reqCount, " REQUESTS in", duration);
            completedReqs = 0;
            data = this.filterEventTypes( data );
            data = this.getData( data);

        }


    },
    filterEventTypes: function( data, eventTypesParam ) {
        let eventTypes = this.getEventTypes( eventTypesParam );
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
    getData: function( metaData ) {



    },
    render: function() {
    },

};
