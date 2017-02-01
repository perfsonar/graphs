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
    summaryWindow: 3600
    //start: now - 86400*7,
    //end: now,
    //timeframe: "1w",
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
            start: newState.start,
            end: newState.end,
            timeframe: newState.timeframe,
            ma_url: newState.ma_url,
            agent: newState.agent,
            summaryWindow: newState.summaryWindow,
            itemsToHide: {},
            tool: newState.tool,
            ipversion: newState.ipversion,
            hashValues: {},
            active: {
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
            },
        };
    },
    contextTypes: {
        router: React.PropTypes.func
    },
    toggleType: function( options, event ) {
        console.log("toggleType options: ", options); //, "event", event);
        let newItems = this.state.itemsToHide;
        //newItems.push( options );
        let sorted = Object.keys( options ).sort();
        let id = "";
        for(let i in sorted) {
            let key = sorted[i]
            let val = options[key];
            id += key + "_" + val + "_";
        }
        //console.log("id", id);
        if ( id in newItems ) {
            delete newItems[id];
        } else {
            //let newItems = {};
            newItems[id] = options;
        }
        let active = this.state.active;
        active[id] = !active[id];
        this.setState({ active: active, itemsToHide: newItems } );
        //this.setHashVals( newItems );

        //this.setHashVals( this.state.hashValues );
        //this.updateURLHash();
        event.preventDefault();

    },


    getActiveClass: function ( value ) {
        if ( value === true ) {
            return "active";
        } else {
            return "";
        }

    },
    render() {
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
                                        start={this.state.start}
                                        end={this.state.end}
                                        summaryWindow={this.state.summaryWindow}
                                        ma_url={this.state.ma_url}
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
        console.log("chartLayout newTime", newTime);
        this.setState( newTime );
        //if ( !noupdateURL ) {
            this.setHashVals( newTime );
        //}
        //this.forceUpdate();
        this.updateURLHash();
    },

    setHashVals: function( options ) {
        let hashVals = this.state.hashValues;
        for(let key in options) {
            hashVals[key] = options[key];
        }
        console.log("hashVals", hashVals);
        this.setState({hashValues: hashVals});
        this.updateURLHash();

    },
    updateURLHash: function() {
        let hash = "#";
        let hashVals = this.state.hashValues;
        console.log("updateURLHash hashVals", hashVals);
        let arr = [];
        for(let key in hashVals ) {
            let val = encodeURIComponent( hashVals[key] );
            arr.push( key + "=" + val );
        }
        hash += arr.join("&");
        console.log("hash", hash);
        window.location.hash = hash;

    },

    getQueryString: function() {
        var qs = this.props.location.query;

        // get hash values
        let hash = this.props.location.hash;
        console.log( "qs", qs, "hash", hash );
        let hashRe = /^#/;
        hash = hash.replace( hashRe, "");

        let hashPairs = hash.split("&");
        let hashObj = {};
        for(let i in hashPairs ) {
            // parse key=val 
            let row = hashPairs[i].split("=");
            let key = row[0];
            let val = row[1];
            hashObj[key] = val;
        }


        let src = qs.source;
        let dst = qs.dest;
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
            start = hashObj.start || defaults.start;
        } else if ( typeof hashObj.start_ts != "undefined" ) {
            start = hashObj.start_ts || defaults.start;

        }

        if ( typeof hashObj.end != "undefined" ) {
            end = hashObj.end || defaults.end;
        } else if ( typeof hashObj.end_ts != "undefined" ) {
            end = hashObj.end_ts || defaults.end;
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

        let ma_urls = qs.url || location.origin + "/esmond/perfsonar/archive/";
        let localhostRe = /localhost/i;

        if ( !$.isArray( ma_urls ) ) {
            ma_urls = [ ma_urls ];
        }

        if ( !$.isArray( agent ) ) {
            agent = [ agent ];
        }

        for(let i in ma_urls ) {
            let ma_url = ma_urls[i];
            let found = ma_url.match( localhostRe );
            let host = location.host;
            if ( found !== null ) {
                console.log("ma_url", ma_url);

                // replace 'localhost' with the local hostname
                let new_url = ma_url.replace( localhostRe,  host );

                console.log('localhost URL found, rewriting to host', host, "new ma url", new_url);
                ma_urls[i] = new_url;
            }
        }
        const newState = {
            src:    src,
            dst:    dst,
            start:  start,
            end:    end,
            ma_url: ma_urls,
            summaryWindow: summaryWindow,
            tool: tool,
            agent: agent,
            ipversion: ipversion,
            timeframe: timeframe,
            hashValues: hashObj,
        };

        // TODO: allow multiple src/dest pairs ( I think this work, but needs testing)
        HostInfoStore.retrieveHostInfo( src, dst );

        //this.setState(newState);
        //this.forceUpdate();
        return newState;
    }

});
