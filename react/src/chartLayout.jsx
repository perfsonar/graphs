import React from "react";
import _ from "underscore";

import Chart1 from "./chart1.jsx";
import ChartHeader from "./ChartHeader";
import HostInfoStore from "./HostInfoStore";

import "../../css/graphs.css";
//import "../../toolkit/web-ng/root/css/app.css"
import "../../toolkit/web-ng/root/js/app.js"

const text = 'perfSONAR chart';


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
            end: newState.end
        };
    },
    contextTypes: {
        router: React.PropTypes.func
    },


    render() {

        return (

                <div className="graph">
                <ChartHeader 
                    sources={this.state.src}
                    dests={this.state.dst}
                />

                    {/* GRAPH: Select Data*/}
                    <div className="graph-filters">
                        <div className="graph-filter left">
                            <span className="graph-label">Data:</span>
                            <ul className=" graph-filter__list">
                                <li className="graph-filter__item graph-filter__item tcp-active">
                                    <a href="#">TCP</a>
                                </li>
                                <li className="graph-filter__item udp-active">
                                    <a href="#">UDP</a>
                                </li>
                                <li className="graph-filter__item ipv4-active">
                                    <a href="#">IPv4</a>
                                </li>
                                <li className="graph-filter__item ipv6-active">
                                    <a href="#">IPv6</a>
                                </li>
                            </ul>
                        </div>

                        <div className="graph-filter right">
                            <a href="#" className="graph-settings"><i className="fa fa-gear"></i></a>
                        </div>

                        <div className="graph-filter right">
                            <ul className=" graph-filter__list">
                                <li className="graph-filter__item graph-filter__item--blue-active">
                                    <a href="#">Forward</a>
                                </li>
                                <li className="graph-filter__item graph-filter__item--blue-active">
                                    <a href="#">Reverse</a>
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
                                    />
                                </div>
                    </div>

                {/* End graph */}
                </div>

        );
    },

    getQueryString: function() {
        var qs = this.props.location.query;
        console.log( "qs", qs );
        let src = qs.src;
        let dst = qs.dst;
        let start = qs.start;
        let end = qs.end;
        let ma_url = qs.ma_url || "http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/";
        const newState = {
            src:    src,
            dst:    dst,
            start:  start,
            end:    end,
            ma_url: ma_url
        };
        console.log("newState", newState);

        // TODO: allow multiple src/dest pairs
        HostInfoStore.retrieveHostInfo( src, dst );

        //this.setState(newState);
        //this.forceUpdate();
        return newState;
    }

});
