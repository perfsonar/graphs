import React from "react";
import _ from "underscore";

import Chart1 from "./chart1.jsx";
import ChartHeader from "./ChartHeader";
import HostInfoStore from "./HostInfoStore";
//import GraphDataStore from "./GraphDataStore";

import "../../css/graphs.css";
//import "../../toolkit/web-ng/root/css/app.css"
import "../../toolkit/web-ng/root/js/app.js"

const text = 'perfSONAR chart';

const now = Math.floor( new Date().getTime() / 1000 );

const defaults = {
    start: now - 86400*7,
    end: now,
    timerange: "1w"
};

const scheme = {
    requests: "#2ca02c",
    connections: "#990000"
};

/* copied frmo chart1.jsx
const scheme = {
    tcp: "#0076b4", // blue
    udp: "#cc7dbe", // purple
    ipv4: "#e5a11c", // yellow
    ipv6: "#633", // brown
    throughput: "#0076b4", // blue
    throughputTCP: "#0076b4", // blue
    throughputUDP: "#2b9f78", // green
    "histogram-rtt": "#e5a11c", // yellow
    "histogram-owdelay": "#633", // brown
    "packet-loss-rate": "#cc7dbe" // purple
};
*/

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

/*
 * Colors from mockup
 * blue: #004987
 * purple: #750075
 * orange: #ff8e01
/*
    node: {
        normal: {stroke: "#737373", strokeWidth: 4, fill: "none"},
        highlighted: {stroke: "#b1b1b1", strokeWidth: 4, fill: "#b1b1b1"}
    },
    line: {
        normal: {stroke: "#1f77b4", strokeWidth: 3, fill: "none"},
        highlighted: {stroke: "#4EC1E0",strokeWidth: 4,fill: "none"}
    },
    label: {
        normal: {fill: "#9D9D9D",fontFamily: "verdana, sans-serif",fontSize: 10}
    }
    */
};

/* colors from old graphs
 * #0076b4 blue (throughput)
 * #cc7dbe  purple (loss)
 * #e5a11c yellow (ping)
 */

/* original colors, from the design
const ipv4Color = "#004987"; // blue
const ipv6Color = "#750075"; // purple
const tcpColor = "#ff8e01"; // orange
const udpColor = "#633"; // brown from old graphs
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
            timerange: newState.timerange,
            ma_url: newState.ma_url,
            itemsToHide: {}
        };
    },
    contextTypes: {
        router: React.PropTypes.func
    },
    toggleType: function( options, event ) {
        //console.log("toggleType options: ", options, "event", event);
        let newItems = this.state.itemsToHide;
        //newItems.push( options );
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
        this.setState({ itemsToHide: newItems } );
        //this.forceUpdate();



        //event.preventDefault();


    },


    render() {
        return (

                <div className="graph">
                <ChartHeader 
                    sources={this.state.src}
                    dests={this.state.dst}
                    start={this.state.start}
                    end={this.state.end}
                    timerange={this.state.timerange}
                    updateTimerange={this.handleTimerangeChange}
                    ma_url={this.state.ma_url}
                />

                    {/* GRAPH: Select Data*/}
                    <div className="graph-filters">
                        <div className="graph-filter left">
                            <span className="graph-label">Data:</span>
                            <ul className=" graph-filter__list">
                                <li className="graph-filter__item graph-filter__item tcp-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "throughput", protocol: "tcp"})}>Throughput (TCP)</a>
                                </li>
                                <li className="graph-filter__item graph-filter__item udp-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "throughput", protocol: "udp"})}>Throughput (UDP)</a>
                                </li>
                                {/*
                                <li className="graph-filter__item udp-active">
                                    <a href="#">UDP</a>
                                </li>
                                */}
                                <li className="graph-filter__item graph-filter__item loss-throughput-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "packet-loss-rate", mainTestType: "throughput"})}>Loss (Throughput)</a>
                                </li>
                                <li className="graph-filter__item graph-filter__item loss-latency-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "packet-loss-rate", mainTestType: "latency"})}>Loss (Latency)</a>
                                </li>
                                <li className="graph-filter__item ipv6-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "histogram-owdelay"})}>One-way latency</a>
                                </li>
                                <li className="graph-filter__item ipv4-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {eventType: "histogram-rtt"})}>Ping</a>
                                </li>
                            </ul>
                        </div>

                        <div className="graph-filter right">
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
                                <li className="graph-filter__item graph-filter__item--blue-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {direction: "forward"})}>Forward
                                    <svg width="30" height="4" className="direction-label">
                                          <line x1="0" y1="2" x2="30" y2="2" stroke="#f0e54b" strokeWidth="3" />
                                    </svg>
                                    </a>
                                </li>
                                <li className="graph-filter__item graph-filter__item--blue-active">
                                    <a href="#" onClick={this.toggleType.bind(this, {direction: "reverse"})}>Reverse
                                    <svg width="30" height="4" className="direction-label">
                                          <line x1="0" y1="2" x2="30" y2="2" stroke="#f0e54b" strokeWidth="3" strokeDasharray="4,2" />
                                    </svg>
                                    </a>
                                </li>
                                <li className="graph-filter__item graph-filter__item--blue-active">
                                    <a href="#">Errors</a>
                                </li>
                            </ul>
                        </div>
                    </div>


                    {/* GRAPH: Graph Wrapper */}
                    <div className="graph-wrapper">
                        <header className="graph-header">
                            <div className="row collapse">
                                <div className="small-2 columns">
                                    <span className="sub-heading">Test</span>
                                </div>
                                <div className="small-8 columns">
                                    <span className="sub-heading">Data</span>
                                </div>
                                <div className="small-2 columns">
                                    <span className="sub-heading">Median</span>
                                </div>
                            </div>
                        </header>

                                <div className="graphholder">
                                    <Chart1
                                        src={this.state.src}
                                        dst={this.state.dst}
                                        start={this.state.start}
                                        end={this.state.end}
                                        ma_url={this.state.ma_url}
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
        ChartHeader.unsubscribe("timerangeChange", this.handleTimerangeChange);
    },
    */

    handleTimerangeChange: function( newTime ) {
        this.setState( newTime );
        this.forceUpdate();

    },

    getQueryString: function() {
        var qs = this.props.location.query;
        console.log( "qs", qs );
        let src = qs.source;
        let dst = qs.dest;
        let start = defaults.start;
        let end = defaults.end;
        let timerange = defaults.timerange;
        //let timeRange = this.getTimeVars( defaults.timerange );
        if ( typeof qs.start != "undefined" ) {
            start = qs.start || defaults.start;
        }
        if ( typeof qs.end != "undefined" ) {
            let end = qs.end || defaults.end;
        }

        let ma_url = qs.url || location.origin + "/esmond/perfsonar/archive/";
        let localhostRe = /localhost/i;
        let found = ma_url.match( localhostRe );
        let host = location.host;
        if ( found !== null ) {
            console.log("ma_url", ma_url);
            let new_url = ma_url.replace( localhostRe,  host );

            console.log('localhost URL found, rewriting to host', host, "new ma url", new_url);
            ma_url = new_url;
        }
        const newState = {
            src:    src,
            dst:    dst,
            start:  start,
            end:    end,
            ma_url: ma_url,
            timerange: timerange
        };

        // TODO: allow multiple src/dest pairs ( I think this work, but needs testing)
        HostInfoStore.retrieveHostInfo( src, dst );

        //this.setState(newState);
        //this.forceUpdate();
        return newState;
    }

});
