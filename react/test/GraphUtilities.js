import chai from 'chai';
var assert = chai.assert;
import GraphUtilities from "../src/GraphUtilities";


describe('GraphUtilities', function() {
    describe('getTimezone', function() {
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
        it('should return a string', function( done ) {
            assert.typeOf(zone, 'string');
            done();
        });

    });

});
