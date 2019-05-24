import moment from "moment-timezone";

import { TimeSeries, TimeRange, Event } from "pondjs";


module.exports = {
    getTimezone: function( date ) {
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

        out = " (GMT" + offset + ")";
        return out;

    },

    getTimeVars: function (period) {
	let timeframe = period.toString(); 
	if(timeframe.endsWith("h")||timeframe.endsWith("d")||timeframe.endsWith("w")||timeframe.endsWith("m")||timeframe.endsWith("y"))
        {
                var ch = timeframe.substring(0, timeframe.length - 1);
                var dmy = timeframe.charAt(timeframe.length - 1);
                timeframe = parseFloat(ch);
                switch(dmy){
                        case 'h': timeframe*= 60*60; break;
                        case 'd': timeframe*= 86400; break;
                        case 'w': timeframe*= 86400*7; break;
                        case 'm': timeframe*= 86400*31; break;
                        case 'y': timeframe*= 86400*365;
                }
                timeframe = Math.round(timeframe);
        }
        else{
                timeframe = parseFloat(timeframe);
                timeframe = Math.round(timeframe);
        }
 	
	let timeDiff = timeframe;
        let summaryWindow;
        if (period == '1h') {
            timeDiff = 60*60 * 1;
            summaryWindow = 0;
        } else if (period == '12h') {
            timeDiff = 60*60 * 12;
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
        } else if (period == '2w') {
            timeDiff = 86400*14;
            summaryWindow = 3600;
        } else if (period == '3w') {
            timeDiff = 86400*21;
            summaryWindow = 3600;
        }else if (period == '30d') {
            timeDiff = 86400*30;
            summaryWindow = 3600;
        } else if (period == '1m') {
            timeDiff = 86400*31;
            summaryWindow = 3600;
        } else if (period == '1y') {
            timeDiff = 86400*365;
            summaryWindow = 86400;
        }
	else{
                summaryWindow = 86400;
        }        
        //period = timeframe;
        let timeRange = {
            timeDiff: timeDiff,
            summaryWindow: summaryWindow,
            timeframe: period
        };
        return timeRange;
    }

};

