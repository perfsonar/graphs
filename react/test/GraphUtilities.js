import chai from 'chai';
var assert = chai.assert;
import GraphUtilities from "../src/GraphUtilities";

// Unit tests for GraphUtilities.getTimezone() function
describe('GraphUtilities', function() {
    describe('getTimezone', function() {
        // Test with current time/local timezone
        let currentDate = new Date();

        // infer local time offset from currentDate
        let localOffset = currentDate.getTimezoneOffset() / 60;
        let dateString = currentDate.toString();

        let gmtMinus = false;
        if ( dateString.match(/GMT-/) ) {
            gmtMinus = true;
        }

        let zone = GraphUtilities.getTimezone( dateString );
        let expectedRet = ' (GMT';
        if ( gmtMinus ) {
            expectedRet += '-' + localOffset;
        } else {
            expectedRet += '+' + localOffset;

        }
        expectedRet += ')';

        it('should return the correct value', function( done ) {
            assert.equal(zone, expectedRet);
            done();
        });

        // Test with empty string
        // should return empty string
        expectedRet = "";
        zone = GraphUtilities.getTimezone( "" );
        it('should return an empty string when timezone is unknown', function( done ) {
            assert.equal(zone, expectedRet);
            done();
        });

        // Test with null value
        // should return null value
        expectedRet = null;
        zone = GraphUtilities.getTimezone( null );
        it('should return null when datestring is null', function( done ) {
            assert.isUndefined(zone);
            done();
        });

        // Test with undefined value
        // should return undefined value
        zone = GraphUtilities.getTimezone( undefined );
        it('should return undefined when datestring is undefined', function( done ) {
            assert.isUndefined(zone);
            done();
        });

    });

});


// Unit tests for GraphUtilities.getTimeVars() function
describe('GraphUtilities', function() {
    describe('getTimeVars', function() {
        // create an array of hashes that contains the test values and expected results
        let expectedValues = {
            "4h":  { timeDiff: 14400, summaryWindow: 0, timeframe: "4h" } ,
            "12h": { timeDiff: 43200, summaryWindow: 0, timeframe: "12h" } ,
            "1d":  { timeDiff: 86400, summaryWindow: 300, timeframe: "1d" },
            "3d":  { timeDiff: 259200, summaryWindow: 300, timeframe: "3d" },
            "1w":  { timeDiff: 604800, summaryWindow: 3600, timeframe: "1w" },
            "1m":  { timeDiff: 2678400, summaryWindow: 3600 , timeframe: "1m" },
            "1y":  { timeDiff: 31536000, summaryWindow: 86400, timeframe: "1y" }
        };

        for(var key in expectedValues ) {
            let expected = expectedValues[key];
            let values = GraphUtilities.getTimeVars( key );

            it('should return the correct values for ' + key, function( done ) {
                assert.deepEqual(values, expected);
                done();
            });



        }


    });
});

// Unit tests for GraphUtilities.getTimeVars() function
describe('GraphUtilities', function() {
    describe('formatSItoSI', function() {
        // create an array of hashes that contains the test values and expected results
        let expectedValues = {
            "1024 MB":   [ "1 GB", "M" ],
            "1024 KHz":  [ "1 MHz", "K" ],
            "0.5 MHz":   [ "512 KHz", "M" ],
            "512 Mbps":  [ "0.5 Gbps", "M"] 
        };

        for(var val in expectedValues ) {
            let expected = val; //expectedValues[key];
            let params = expectedValues[val];
            let values = GraphUtilities.formatSItoSI( params[0], params[1] );

            it('should return the correct values for ' + val, function( done ) {
                assert.deepEqual(values, expected);
                done();
            });



        }


    });
});
