import moment from "moment-timezone";

import { TimeSeries, TimeRange, Event } from "pondjs";


module.exports = {
    getTimezone: function( date ) {
        console.log("getTimezone called with ", date );
        let tz;
        let tzRe = /\(([^)]+)\)/;
        let out;
        let offset;

        if ( ( typeof date == "undefined" ) || date == null ) {
            return;
        } else if ( date == "Invalid Date" ) {
            tz = "";
            out = "";
        } else {
            tz = tzRe.exec( date );
            if ( typeof tz == "undefined" || tz === null ) {
                // timezone is unknown
                return "";
            } else {
                tz = tz[1];
                let dateObj = new Date( date );
                let dateMoment = moment( dateObj );
                offset = dateMoment.utcOffset() / 60;
                if ( typeof ( offset ) != "undefined" && offset >= 0 ) {
                    offset = "+" + offset;
                }
            }
        }

        //out = tz + " (GMT " + offset + ")";
        out = " (GMT" + offset + ")";
        return out;

    },

    getTimeVars: function (period) {
        let timeDiff;
        let summaryWindow;
        if (period == '4h') {
            timeDiff = 60*60 * 4;
            summaryWindow = 0;
        } else if (period == '1d') {
            timeDiff = 86400;
            summaryWindow = 300;
        } else if (period == '3d') {
            timeDiff = 86400 * 3;
            summaryWindow = 300;
        } else if (period == '1w') {
            timeDiff = 86400*7;
            summaryWindow = 3600;
        } else if (period == '1m') {
            timeDiff = 86400*31;
            summaryWindow = 3600;
        } else if (period == '1y') {
            timeDiff = 86400*365;
            summaryWindow = 86400;
        }
        let timeRange = {
            timeDiff: timeDiff,
            summaryWindow: summaryWindow,
            timeframe: period
        };
        return timeRange;

    }

};

