import chai from 'chai';
var assert = chai.assert;
import GraphUtilities from "../src/GraphUtilities";

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});


describe('GraphUtilities', function() {
    describe('getTimezone', function() {
        let date; // = new Date();
        let emptyDate = new Date();

        // infer local time offset from emptyDate
        let localOffset = emptyDate.getTimezoneOffset() / 60;
        let dateString = emptyDate.toString();

        let gmtMinus = false;
        if ( dateString.match(/GMT-/) ) {
            gmtMinus = true;
        }

        date = new Date( dateString );
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
            //assert.typeOf(zone, 'string');
            done();

        });
        it('should return a string', function( done ) {
            assert.typeOf(zone, 'string');
            done();
        });

    });

});
