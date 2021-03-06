import chai from 'chai';
var assert = chai.assert;

import HostInfoStore from "../src/HostInfoStore";

var w3cjs = require('w3cjs');

var file = "public/index.html";

describe("Validate HTML of main homepage", function() {
        it("page should have no html errors", function( done ) {

            var valid = false;
            var results = w3cjs.validate({
                file: file,
                callback: function(err, res) {
                    if ( res && res.messages.length > 0 ) {
                        console.log("validation messages", res);

                    } else {
                        //console.log("no validation errors found");

                    }
                    assert.empty( res.messages );
                    done();

                }
            });

    });

});

