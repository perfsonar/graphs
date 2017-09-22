import chai from 'chai';
var assert = chai.assert;

import HostInfoStore from "../js-shared/lib/DataStores/HostInfoStore";

var w3cjs = require('w3cjs');

var file = "public/index.html";

describe("Validate HTML of main homepage", function() {
        it("page should have no html errors", function( done ) {

            var valid = false;
            var results = w3cjs.validate({
                file: file,
                callback: function(err, res) {
                    if ( res.messages.length > 0 ) {
                        console.log("validation messages", res);

                    }
                    assert.empty( res.messages );
                    done();

                }
            });

    });

});

