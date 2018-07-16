import React from "react";
import _ from "underscore";

import Chart1 from "./chart1.jsx";
import ChartHeader from "./ChartHeader";
import HostInfoStore from "./HostInfoStore";
import GraphUtilities from "./GraphUtilities";
//import GraphDataStore from "./GraphDataStore";

import "../css/graphs.css";
//import "../../toolkit/web-ng/root/css/app.css"
import "../../toolkit/web-ng/root/js/app.js"

const text = 'perfSONAR chart';

const now = Math.floor( new Date().getTime() / 1000 );

const defaults = {
    summaryWindow: 3600,
    start: now - 86400*7,
    end: now,
    timeframe: "1w",
};

const scheme = {
    requests: "#2ca02c",
    connections: "#990000"
};


const connectionsStyle = {
    color: scheme.requests,
    strokeWidth: 1
};

const requestsStyle = {
    stroke: "#990000",
    strokeWidth: 2,
    strokeDasharray: "4,2"
};

const lineStyles = {
    value: {
        stroke: scheme.requests,
        strokeWidth: 1
    }
};

/*
 * Colors from mockup
 * blue: #004987
 * purple: #750075
 * orange: #ff8e01
*/

// Colors from old graphs
const tcpColor = "#0076b4"; // blue
const udpColor = "#cc7dbe"; // purple
const ipv4Color = "#e5a11c"; // yellow
const ipv6Color = "#633"; // brown from old graphs

const ipv4Style = {
    color: ipv4Color
}


const reverseStyles = {
    value: {
        stroke: scheme.connections,
        strokeDasharray: "4,2",
        strokeWidth: 1
    }
}

const axisLabelStyle = {
    labelColor: "black"
    //labelOffset: -15
    //labelWeight: 100,
    //labelSize: 12
}

const offsets = {
    label: -15
}

const chartRow = {
    height: 150
}

const brushStyle = {
    boxShadow: "inset 0px 2px 5px -2px rgba(189, 189, 189, 0.75)",
    background: "#FEFEFE",
    paddingTop: 10
};

// These aliases allow us to use shorter strings in the URL to indicate values
// which are hidden. 
// This hash lets us map from Long to Short aliases, for example to take the full show/hide
// string and turn it into a short alias to put in the URL
const showHideAliasesLongToShort = {
    "eventType_throughput_protocol_tcp_": "throughput_tcp",
    "eventType_throughput_protocol_udp_": "throughput_udp",
    "eventType_packet-loss-rate_mainEventType_histogram-owdelay_": "loss_owdelay",
    "eventType_packet-loss-rate_mainTestType_throughput_": "loss_throughput",
    "eventType_histogram-owdelay_": "latency_owdelay",
    "eventType_histogram-rtt_": "latency_ping",
    "direction_forward_": "forward",
    "direction_reverse_": "reverse",
    "eventType_failures_": "failures",
    "eventType_packet-retransmits_": "retrans",
    "eventType_packet-loss-rate-bidir_": "loss_ping"
};

// This hash lets us map from Short to Long aliases, for example
// to take a value from the URL and derive the longer value
let showHideAliasesShortToLong = {};
for( var key in showHideAliasesLongToShort ) {
    let val = showHideAliasesLongToShort[key];
    showHideAliasesShortToLong[val] = key;
}

export default React.createClass({
    displayName: "ChartLayout",

    colors: {
        tcp: "#0076b4", // blue
        udp: "#cc7dbe", // purple
        ipv4: "#e5a11c", // yellow
        ipv6: "#633" // brown from old graphs

    },

    getColors() {
        return this.colors;
    },

    //mixins: [Highlighter],

    getInitialState() {
        var newState = this.getQueryString();
        return {
            title: text,
            src: newState.src,
            dst: newState.dst,
            displaysetsrc: newState.displaysetsrc,
            displaysetdest: newState.displaysetdest,
            start: newState.start,
            end: newState.end,
            timeframe: newState.timeframe,
            ma_url: newState.ma_url,
            ma_url_reverse: newState.ma_url_reverse,
            agent: newState.agent,
            summaryWindow: newState.summaryWindow,
            itemsToHide: newState.itemsToHide,
            tool: newState.tool,
            ipversion: newState.ipversion,
            hashValues: newState.hashValues,
            active: newState.active
        };
    },
    contextTypes: {
        router: React.PropTypes.func
    },
    toggleType: function( options, event ) {
        let newItems = this.state.itemsToHide;
        let sorted = Object.keys( options ).sort();
        let id = "";
        for(let i in sorted) {
            let key = sorted[i]
            let val = options[key];
            id += key + "_" + val + "_";
        }
        if ( id in newItems ) {
            delete newItems[id];
        } else {
            //let newItems = {};
            newItems[id] = options;
        }
        let active = this.state.active;
        active[id] = !active[id];
        this.setState({ active: active, itemsToHide: newItems } );

        let activeHash = this.state.hashValues;
        for(let key in active) {
            let show = active[key];
            let shortKey = showHideAliasesLongToShort[key];
            if (! show ) {
                activeHash["hide_" + shortKey] = !active[key];
            } else {
                delete activeHash["hide_" + shortKey];
            }

        }
        this.setState( { hashValues: activeHash } );
        this.setHashVals( activeHash );
        //this.setHashVals( newItems );

        //this.setHashVals( this.state.hashValues );
        //this.updateURLHash();
        event.preventDefault();

        //return false;
    },


    getActiveClass: function ( value ) {
        if ( value === true ) {
            return "active";
        } else {
            return "";
        }

    },
    render() {
        if ( typeof this.state.src == "undefined" 
                || typeof this.state.dst == "undefined"
                || typeof this.state.start == "undefined"
                || typeof this.state.end == "undefined"
                || typeof this.state.timeframe == "undefined"
                || typeof this.state.ma_url == "undefined" ) {
            return ( <div></div> );

        }
        return (

                <div className="graph">
                <ChartHeader 
                    sources={this.state.src}
                    dests={this.state.dst}
                    start={this.state.start}
                    end={this.state.end}
                    timeframe={this.state.timeframe}
                    updateTimerange={this.handleTimerangeChange}
                    ma_url={this.state.ma_url}
                />

                    {/* GRAPH: Select Data*/}
                    <div className="graph-filters">
                        <div className="graph-filter left">
                            <ul className=" graph-filter__list">
                                <li className={"graph-filter__item graph-filter__item throughput-tcp " + this.getActiveClass( this.state.active["eventType_throughput_protocol_tcp_"] )}>
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "throughput", protocol: "tcp"})}>Tput (TCP)</a>
                                </li>
                                <li className={"graph-filter__item graph-filter__item udp " + this.getActiveClass( this.state.active["eventType_throughput_protocol_udp_"] )}  >
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "throughput", protocol: "udp"}) }>Tput (UDP)</a>
                                </li>
                                <li className={"graph-filter__item graph-filter__item loss-throughput " + this.getActiveClass( this.state.active["eventType_packet-loss-rate_mainTestType_throughput_"] ) }>
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "packet-loss-rate", mainTestType: "throughput"})}>Loss (UDP)</a>
                                </li>
                                <li className={"graph-filter__item graph-filter__item loss-latency " + this.getActiveClass( this.state.active["eventType_packet-loss-rate_mainEventType_histogram-owdelay_"] )}>
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "packet-loss-rate", mainEventType: "histogram-owdelay"})}>Loss (owamp)</a>
                                </li>
                                <li className={"graph-filter__item graph-filter__item loss-ping " + this.getActiveClass( this.state.active["eventType_packet-loss-rate-bidir_"] )}>
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "packet-loss-rate-bidir"})}>Loss (ping)</a>
                                </li>

                                <li className={"graph-filter__item graph-filter__item packet-retransmits " + this.getActiveClass( this.state.active["eventType_packet-retransmits_"] )}>
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "packet-retransmits"})}>Retrans
                                    <svg width="10" height="10" className="direction-label">
                                          <circle cx="5" cy="5" r="4" fill="#cc7dbe" />
                                    </svg>
                                    </a>
                                </li>

                                <li className={"graph-filter__item ipv6 " + this.getActiveClass( this.state.active["eventType_histogram-owdelay_"] )}>
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "histogram-owdelay"})}>Latency</a>
                                </li>
                                <li className={"graph-filter__item ipv4 " + this.getActiveClass( this.state.active["eventType_histogram-rtt_"])} >
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "histogram-rtt"})}>Latency (ping)</a>
                                </li>
                            </ul>
                        </div>

                        <div className="graph-filter right hidden">
                              <a href="#" className="graph-settings sidebar-popover-toggle js-sidebar-popover-toggle"><i className="fa fa-gear"></i></a>
                            <div className="sidebar-popover options-popover">
                                <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                                <h4 className="options-popover__heading">Advanced Graph Options</h4>
                                <ul className="options-popover__list">
                                    <li><strong>Scale/Smoothing</strong></li>
                                    <li>
                                        <ul className="options-popover__row">
                                            <li>Latency</li>
                                            <li> <input type="checkbox" name="latency-log" id="latency-log" />
                                                 <label htmlFor="latency-log">apply logarithmic scale</label> </li>
                                            <li> <input type="checkbox" name="latency-interp" id="latency-interp" />
                                                 <label htmlFor="latency-interp">interpolate between intervals</label> </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <ul className="options-popover__row">
                                            <li>Loss </li>
                                            <li> <input type="checkbox" name="loss-log" id="loss-log" />
                                                 <label htmlFor="loss-log">apply logarithmic scale</label> </li>
                                            <li> <input type="checkbox" name="loss-interp" id="loss-interp" />
                                                 <label htmlFor="loss-interp">interpolate between intervals</label> </li>
                                        </ul>
                                    </li>
                                    <li>
                                        <ul className="options-popover__row">
                                            <li>Throughput</li>
                                            <li> <input type="checkbox" name="thruput-log" id="thruput-log" />
                                                 <label htmlFor="thruput-log">apply logarithmic scale</label> </li>
                                            <li> <input type="checkbox" name="thruput-interp" id="thruput-interp" />
                                                 <label htmlFor="thruput-interp">interpolate between intervals</label> </li>
                                        </ul>
                                    </li>
                                </ul>
                            </div> 
                        </div>

                        <div className="graph-filter right">
                            <ul className=" graph-filter__list">
                                <li className={"graph-filter__item graph-filter__item--forward " + this.getActiveClass( this.state.active["direction_forward_"] ) }>
                                    <a href="#" onClick={this.toggleType.bind(this, {direction: "forward"})}>Forward
                                    <svg width="18" height="4" className="direction-label">
                                          <line x1="0" y1="2" x2="18" y2="2" stroke="white" strokeWidth="3" />
                                    </svg>
                                    </a>
                                </li>
                                <li className={"graph-filter__item graph-filter__item--reverse " + this.getActiveClass( this.state.active["direction_reverse_"] )}>
                                    <a href="#" onClick={this.toggleType.bind(this, {direction: "reverse"})}>Reverse
                                    <svg width="18" height="4" className="direction-label">
                                          <line x1="0" y1="2" x2="18" y2="2" stroke="white" strokeWidth="3" strokeDasharray="4,2" />
                                    </svg>
                                    </a>
                                </li>
                                <li className={"graph-filter__item graph-filter__item--failures " + this.getActiveClass( this.state.active["eventType_failures_"] ) }>
                                    <a href="#" onClick={this.toggleType.bind(this, {"eventType": "failures"})}>Failures
                                    <svg width="10" height="10" className="direction-label">
                                          <circle cx="5" cy="5" r="4" fill="red" />
                                    </svg>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>


                    {/* GRAPH: Graph Wrapper */}
                    <div className="graph-wrapper">

                                <div className="graphholder">
                                    <Chart1
                                        src={this.state.src}
                                        dst={this.state.dst}
                                        displaysetsrc={this.state.displaysetsrc}
                                        displaysetdest={this.state.displaysetdest}
                                        start={this.state.start}
                                        end={this.state.end}
                                        summaryWindow={this.state.summaryWindow}
                                        ma_url={this.state.ma_url}
                                        ma_url_reverse={this.state.ma_url_reverse}
                                        agent={this.state.agent}
                                        tool={this.state.tool}
                                        ipversion={this.state.ipversion}
                                        updateHiddenItems={this.handleHiddenItemsChange}
                                        itemsToHide={this.state.itemsToHide}
                                        ref="chart1"
                                    />
                                </div>
                    </div>

                {/* End graph */}
                </div>

        );
    },


    componentDidMount: function() {
        //HostInfoStore.retrieveTracerouteData( this.props.sources, this.props.dests, this.props.ma_url );
        if ( $.isArray( this.state.src ) ) {
            document.title = "pS results between " + this.state.src.join(", ") + " and " + this.state.dst.join(", ");
        } else {
            document.title = "pS results between " + this.state.src + " and " + this.state.dst;

        }

    },
/*
    componentWillUnmount: function() {
        ChartHeader.unsubscribe("timeframeChange", this.handleTimerangeChange);
    },
    */

    handleTimerangeChange: function( newTime, noupdateURL ) {
        let timeVars = GraphUtilities.getTimeVars( newTime.timeframe );
        let timeDiff = timeVars.timeDiff;
        let oldStart = this.state.start;
        let oldEnd = this.state.end;
        let oldDiff = oldEnd - oldStart;

        const now = Math.floor( new Date().getTime() / 1000 );

        if ( now - newTime.end < oldDiff/2 ) {
            newTime.end = now;
            newTime.start = newTime.end - timeDiff;

        }

        this.setState( newTime );
        this.setHashVals( newTime );
    },

    setHashVals: function( options ) {
        let hashVals = this.state.hashValues;
        for(let key in options) {
            hashVals[key] = options[key];
        }
        this.setState({hashValues: hashVals});
        this.updateURLHash();

    },
    updateURLHash: function( vals ) {
        let hash = "#";
        let hashVals;
        if ( typeof vals == "undefined" ) {
            hashVals = this.state.hashValues;
        } else {
            hashVals = vals;
        }
        let arr = [];
        for(let key in hashVals ) {
            let val = encodeURIComponent( hashVals[key] );
            arr.push( key + "=" + val );
        }
        hash += arr.join("&");
        window.location.hash = hash;

    },

    getQueryString: function() {
        var qs = this.props.location.query;

        // get hash values
        let hash = this.props.location.hash;
        let hashRe = /^#/;
        hash = hash.replace( hashRe, "");

        let hashPairs = hash.split("&");
        let hashObj = {};
        for(let i in hashPairs ) {
            // parse key=val 
            let row = hashPairs[i].split("=");
            let key = row[0];
            let val = row[1];
            if ( typeof val == "undefined") {
                continue;
            }
            hashObj[key] = val;
        }



        let src = qs.source;
        let dst = qs.dest;
        let displaysetsrc = qs.displaysetsrc;
        let displaysetdest = qs.displaysetdest;
        let start = defaults.start;
        let end = defaults.end;
        let timeframe = defaults.timeframe;
        let tool = qs.tool;
        let agent = qs.agent || [];
        let summaryWindow = qs.summaryWindow;

        let ipversion;
        //let timeRange = this.getTimeVars( defaults.timeframe );
        //
        if ( "timeframe" in hashObj && hashObj.timeframe != "" ) {
            timeframe = hashObj.timeframe;

        }

        let timeVars = GraphUtilities.getTimeVars( timeframe );

        if ( typeof hashObj.start != "undefined" ) {
            start = hashObj.start;
        } else if ( typeof hashObj.start_ts != "undefined" ) {
            start = hashObj.start_ts;
        }

        if ( typeof hashObj.end != "undefined" ) {
            end = hashObj.end;
        } else if ( typeof hashObj.end_ts != "undefined" ) {
            end = hashObj.end_ts;
        }

        if ( typeof qs.ipversion != "undefined" ) {
            ipversion = qs.ipversion;
        }

        if ( typeof hashObj.summaryWindow != "undefined" ) {
            summaryWindow = hashObj.summaryWindow;
        }

        if ( typeof summaryWindow == "undefined" ) {
            //summaryWindow = 3600;
            summaryWindow = timeVars.summaryWindow;

        }

        hashObj.start = start;
        hashObj.end = end;
        hashObj.summaryWindow = summaryWindow;

        let ma_urls = qs.url || location.origin + "/esmond/perfsonar/archive/";
        let localhostRe = /localhost/i;

        if ( !$.isArray( ma_urls ) ) {
            ma_urls = [ ma_urls ];
        }

        if ( !$.isArray( agent ) ) {
            agent = [ agent ];
        }

        // Get MA URLs
        for(let i in ma_urls ) {
            let ma_url = ma_urls[i];
            let found = ma_url.match( localhostRe );
            let host = location.host;
            if ( found !== null ) {

                // replace 'localhost' with the local hostname
                let new_url = ma_url.replace( localhostRe,  host );

                ma_urls[i] = new_url;
            }
        }
        
        //reverse URLs
        let ma_urls_reverse = qs.reverseurl || ma_urls;
        if ( !$.isArray( ma_urls_reverse ) ) {
            ma_urls_reverse = [ ma_urls_reverse ];
        }
        for(let i in ma_urls_reverse ) {
            let ma_url_reverse = ma_urls_reverse[i];
            let found = ma_url_reverse.match( localhostRe );
            let host = location.host;
            if ( found !== null ) {

                // replace 'localhost' with the local hostname
                let new_url = ma_url_reverse.replace( localhostRe,  host );

                ma_url_reverse[i] = new_url;
            }
        }

        // Get itemsToHide/"active" items
        let re = /^hide_(.+)$/;
        let underscoreRe = /_$/;

        let newItems = {};
        //let active = {}; // this.state.active;
        let active = {
                "eventType_throughput_protocol_tcp_": true,
                "eventType_throughput_protocol_udp_": true,
                "eventType_packet-loss-rate_mainEventType_histogram-owdelay_": true,
                "eventType_packet-loss-rate_mainTestType_throughput_": true,
                "eventType_histogram-owdelay_": true,
                "eventType_histogram-rtt_": true,
                "direction_forward_": true,
                "direction_reverse_": true,
                "eventType_failures_": true,
                "eventType_packet-retransmits_": true,
                "eventType_packet-loss-rate-bidir_": true
        };

        let itemsToHide = {};
        for( var key in hashObj ) {
            // skip anything that doesn't start with hide_
            let res = re.exec( key );
            if ( !res ) {
                continue;
            }

            // get the name, minus "hide_"
            let name = res[1];
            // skip any variables that do not match our list of acceptable names
            if ( ! ( name in showHideAliasesShortToLong ) ) {
                continue;
            }

            let longName = showHideAliasesShortToLong[ name ];
            // longName will be in the form of "key1_value1_key2_value2_" ...
            longName = longName.replace(underscoreRe, "");

            // if 'hidden' is seto to 'false', then 'active' is true (and vice versa)
            if ( hashObj[key] == "false" ) {
                active[longName + "_"] = true;
            } else {
                active[longName + "_"] = false;
            }

            let splitNames = longName.split("_");
            let itemFilter = {};
            for(let i=0; i<splitNames.length; i+=2) {
                let activeKey = splitNames[i];
                let activeValue = splitNames[i+1];
                itemFilter[ activeKey ] = activeValue;
            }
            itemsToHide[ longName + "_" ] = itemFilter;

        }



        // Create the new state object
        const newState = {
            src:    src,
            dst:    dst,
            displaysetsrc:    displaysetsrc,
            displaysetdest:    displaysetdest,
            start:  start,
            end:    end,
            ma_url: ma_urls,
            ma_url_reverse: ma_urls_reverse,
            active: active,
            itemsToHide: itemsToHide,
            summaryWindow: summaryWindow,
            tool: tool,
            agent: agent,
            ipversion: ipversion,
            timeframe: timeframe,
            hashValues: hashObj,
        };

        this.updateURLHash( hashObj );

        HostInfoStore.retrieveHostInfo( src, dst );

        return newState;
    }

});
