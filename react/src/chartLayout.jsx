import React from "react";
import _ from "underscore";

import "../../css/graphs.css";


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

    //mixins: [Highlighter],

    getInitialState() {
        return {
            title: text,
        };
    },
    contextTypes: {
        router: React.PropTypes.func
    },


    render() {

        return (

                <div className="graph">
                    <div className="overview overview--pad">
                        <div className="row">
                            {/* GRAPH: Source */}
                            <div className="medium-4 columns">
                                <label htmlFor="source">Source:</label>
                                <select className="no-margin" name="source" id="source">
                                    <option>Source One</option>
                                    <option>Source Two</option>
                                    <option>Source Three</option>
                                </select>

                                {/* GRAPH: Source Host Info*/}
                                <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

                                <div className="sidebar-popover sidebar-popover--overview">
                                    <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                                    <h4 className="sidebar-popover__heading">Host inhtmlFormation</h4>
                                    <ul className="sidebar-popover__list">
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">IP:</span>
                                            <span className="sidebar-popover__value">1 GB</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">Capacity:</span>
                                            <span className="sidebar-popover__value">140.182.44.162</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">MTU:</span>
                                            <span className="sidebar-popover__value">2001:18e8:3:10:8000::1</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param"><a href="#">View traceroute graph</a></span>
                                        </li>
                                    </ul>
                                </div>

                            </div>

                            {/* GRAPH: Destination */}
                            <div className="medium-4 columns">
                                <label htmlFor="destination">Destination:</label>
                                <select className="no-margin" name="destination" id="destination">
                                    <option>Destination One</option>
                                    <option>Destination Two</option>
                                    <option>Destination Three</option>
                                </select>

                                {/* GRAPH: Destination Host Ifo*/}
                                <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

                                <div className="sidebar-popover sidebar-popover--overview">
                                    <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                                    <h4 className="sidebar-popover__heading">Host inhtmlFormation</h4>
                                    <ul className="sidebar-popover__list">
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">IP:</span>
                                            <span className="sidebar-popover__value">1 GB</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">Capacity:</span>
                                            <span className="sidebar-popover__value">140.182.44.162</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">MTU:</span>
                                            <span className="sidebar-popover__value">2001:18e8:3:10:8000::1</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param"><a href="#">View traceroute graph</a></span>
                                        </li>
                                    </ul>
                                </div>

                            </div>

                            {/* GRAPH: Reporting range*/}
                            <div className="medium-4 columns">
                                <label>Report range</label>
                                <button className="button-quiet button--full-width">Wed May 4, 2016 - Mon May 16, 2016 <i className="fa fa-calendar"></i></button>
                            </div>
                        </div> {/* End row */}
                    </div> {/* End overview */}

                    {/* GRAPH: Select Data*/}
                    <div className="graph-filters">
                        <div className="graph-filter left">
                            <span className="graph-label">Data:</span>
                            <ul className=" graph-filter__list">
                                <li className="graph-filter__item graph-filter__item--blue-active">
                                    <a href="#">IPV4</a>
                                </li>
                                <li className="graph-filter__item">
                                    <a href="#">IPV6</a>
                                </li>
                                <li className="graph-filter__item">
                                    <a href="#">TCP</a>
                                </li>
                                <li className="graph-filter__item">
                                    <a href="#">UDP</a>
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
                                <li className="graph-filter__item">
                                    <a href="#">Reverse</a>
                                </li>
                                <li className="graph-filter__item">
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

                        <div className="row collapse">
                            <div className="small-2 columns">
                                <div className="graph-module">
                                    <div className="graph-module__cell">
                                        Latency
                                    </div>
                                    <div className="graph-module__cell">Packet Loss</div>
                                    <div className="graph-module__cell">Throughput</div>
                                </div>
                            </div>
                            <div className="small-8 columns">
                                <div className="graph-holder">
                                    The Graph
                                </div>

                            </div>
                            <div className="small-2 columns">
                                <div className="graph-module">
                                    <div className="graph-module__cell graph-module__cell--left">
                                        <span className="graph-module__stat">
                                            <i className="fa fa-arrow-right"></i> <strong>20ms</strong>
                                        </span>
                                        <span className="graph-module__stat">
                                            <i className="fa fa-arrow-left"></i> <strong>20ms</strong>
                                        </span>
                                        <div className="nav-dropdown">
                                            <a href="#" className="graph-module__controls nav-dropdown-toggle">
                                                Interval: 5 mins <i className="fa fa-caret-down"></i>
                                            </a>
                                            <ul className="nav-dropdown-menu">
                                                <li className="nav-dropdown-menu__heading">Set interval</li>
                                                <li><a href="#">5 mins</a></li>
                                                <li><a href="#">10 mins</a></li>
                                                <li><a href="#">30 mins</a></li>
                                                <li><a href="#">1 hour</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="graph-module__cell graph-module__cell--left">
                                        <span className="graph-module__stat">
                                            <i className="fa fa-arrow-right"></i> <strong>20ms</strong>
                                        </span>
                                        <span className="graph-module__stat">
                                            <i className="fa fa-arrow-left"></i> <strong>20ms</strong>
                                        </span>
                                        <div className="nav-dropdown">
                                            <a href="#" className="graph-module__controls nav-dropdown-toggle">
                                                Interval: 5 mins <i className="fa fa-caret-down"></i>
                                            </a>
                                            <ul className="nav-dropdown-menu">
                                                <li className="nav-dropdown-menu__heading">Set interval</li>
                                                <li><a href="#">5 mins</a></li>
                                                <li><a href="#">10 mins</a></li>
                                                <li><a href="#">30 mins</a></li>
                                                <li><a href="#">1 hour</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="graph-module__cell graph-module__cell--left">
                                        <span className="graph-module__stat">
                                            <i className="fa fa-arrow-right"></i> <strong>20ms</strong>
                                        </span>
                                        <span className="graph-module__stat">
                                            <i className="fa fa-arrow-left"></i> <strong>20ms</strong>
                                        </span>
                                        <div className="nav-dropdown">
                                            <a href="#" className="graph-module__controls nav-dropdown-toggle">
                                                Interval: 5 mins <i className="fa fa-caret-down"></i>
                                            </a>
                                            <ul className="nav-dropdown-menu">
                                                <li className="nav-dropdown-menu__heading">Set interval</li>
                                                <li><a href="#">5 mins</a></li>
                                                <li><a href="#">10 mins</a></li>
                                                <li><a href="#">30 mins</a></li>
                                                <li><a href="#">1 hour</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> 
                        {/* end row */}

                        <div className="graph-small">
                            <div className="row collapse">
                                <div className="small-2 columns">
                                    <div className="graph-module graph-module--small">
                                        <div className="graph-module__cell graph-module__cell--small">Latency</div>
                                        <div className="graph-module__cell graph-module__cell--small">Packet Loss</div>
                                        <div className="graph-module__cell graph-module__cell--small">Throughput</div>
                                    </div>
                                </div>
                                <div className="small-10 columns">
                                    <div className="graph-holder graph-holder--small">
                                        The small graph
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                {/* End graph */}
                </div>

        );
    }


});
