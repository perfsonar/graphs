import moment from "moment";

import { TimeSeries, TimeRange, Event } from "pondjs";


module.exports = {
    getTimezone: function( date ) {
        let tz;
        let tzRe = /\(([^)]+)\)/;
        let out;
        let offset;

        if ( ( typeof date == "undefined" ) || date == null ) {
            return;
        } else if ( date.toString() == "Invalid Date" ) {
            tz = "";
            out = "";
        } else {
            tz = tzRe.exec( ( date ).toString() )[1];
            let dateMoment = moment( date );
            offset = dateMoment.utcOffset() / 60;
            if ( offset >= 0 ) {
                offset = "+" + offset;
            }
        }

        out = tz + " (GMT " + offset + ")";
        return out;

    },
};

