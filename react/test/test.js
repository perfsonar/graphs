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
        let date = new Date();
        console.log("date", date, typeof date);
        //date = "Mon Jun 12 2017 15:28:38 GMT-0400 (EDT)";
        let zone = GraphUtilities.getTimezone( date );
        console.log("zone", zone);
        it('should return the correct value', function( done ) {
            assert.equal(zone, ' (GMT+0)');
            assert.typeOf(zone, 'string');
            done();

        });
        it('should return a string', function( done ) {
            assert.typeOf(zone, 'string');
            done();
        });

    });

});
