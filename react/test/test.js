//var assert = require('assert');

//import assert from 'chai';

import chai from 'chai';

var assert = chai.assert;

//var GraphUtilities = require("GraphUtilities");
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
        console.log("empty date", emptyDate.toString());
        //let dateString = "Mon Jun 12 2017 15:28:38 GMT-0400 (EDT)";
        //let dateString = "2017-06-12T20:24:03.916Z GMT-0400";
        //let dateString = "2017-06-12 20:24:03 GMT-0400";
        //dateString = "2017-06-12T20:22:33.349Z";
        let dateString = "Tue Jun 13 2017 00:24:03 GMT-0400 (UTC)";
        date = new Date( dateString );
        console.log("date", date.toString(), typeof date);
        let zone = GraphUtilities.getTimezone( date );
        console.log("zone", zone);
        it('should return the correct value', function( done ) {
            assert.equal(zone, ' (GMT+0)');
            //assert.typeOf(zone, 'string');
            done();

        });
        it('should return a string', function( done ) {
            assert.typeOf(zone, 'string');
            done();
        });

    });

});
