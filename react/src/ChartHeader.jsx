import React from "react";

import HostInfoStore from "./HostInfoStore";

import InterfaceInfoStore from "./InterfaceInfoStore";

import SIValue from "./SIValue";

import "../../css/graphs.css";

let EventEmitter = require('events').EventEmitter;

let emitter = new EventEmitter();

// TODO: add traceroute calls/links

export default React.createClass({
    hostInfo: [],
    getInitialState() {
        return {
            showHostSelectors: false,
            //sources: [],
            //dests: [],
            start: this.props.start,
            end: this.props.end,
            timerange: this.props.timerange,
            interfaceInfo: null
        };
    },
    getTime() {
        let obj = {
            "start": this.state.start,
            "end": this.state.end,
            "timerange": this.state.timerange
        };
        return obj;


    },
    render() {
        let startDate = new Date( this.state.start * 1000 ).toUTCString();
        let endDate = new Date( this.state.end * 1000 ).toUTCString();
        return (

        <div className="chartHeader">
                    <div className="overview overview--pad">
                        <div className="row">
                            {/* GRAPH: Source */}
                            <div className="medium-4 columns">
                                {this.renderHostList("source", "Source")}
                            </div>

                            {/* GRAPH: Destination */}

                            <div className="medium-4 columns">
                                {this.renderHostList("dest", "Destination")}
                            </div>

                            {/* GRAPH: Reporting range */}
                            <div className="medium-4 columns">
                                <label className="hostLabel">Report range</label>
                                <button id="headerTimePrevious" className="button-quiet button-timechange" onClick={this.handlePageChange.bind(this, "previous")}>
                                <i className="fa fa-arrow-left" aria-hidden="true"></i>
                                </button>
                                <button id="headerTimeNext" className="button-quiet button-reportrange">
                                {startDate} - <br /> {endDate} <i className="fa fa-calendar"></i>
                                </button>
                                <button className="button-quiet button-timechange" onClick={this.handlePageChange.bind(this, "next")}>
                                <i className="fa fa-arrow-right" aria-hidden="true"></i>
                                </button>
                                <div>timerange: {this.props.timerange}</div>
                            </div>
                        </div> {/* End row */}
                    </div> {/* End overview */}

        {/* End chartHeader */}
        </div>
        ); // End render()
    },
    renderHostList: function( type, label ) {
        if ( this.state.showHostSelectors ) {
            return (
                <div>
                                <label htmlFor="source">Source:</label>
                                <select className="no-margin" name="source" id="source">
                                    <option>Source One</option>
                                    <option>Source Two</option>
                                    <option>Source Three</option>
                                </select>
                </div>
               );
        } else {
            let hostInfo = this.hostInfo;
            let hosts = [];
            if ( hostInfo.length > 0 ) {
                for( var i in hostInfo ) {
                    let row = hostInfo[i];
                    hosts.push( 
                            <div className="hostname" key={"hostname"+label+i}>{row[ type + "_host"]}</div>,
                            <div className="address" key={"ip"+label+i}>{row[ type + "_ip"]}</div>,
                            <div key={"detailedInfo"+label+i}>{this.showDetailedHostInfo( row[type + "_ip" ] )}</div>
                            );

                }
            } else {
                hosts.push( <div className="hostname" key={"nohostname"+label}></div>, <div className="address" key={"noaddress"+label}></div> );
            }
            if ( hostInfo.length > 1 ) {
                label += "s";
            }
            return (
                    <div>
                                    <div className="hostLabel" key={"hostLabel"+label}>{label}</div>
                                    {hosts}
                    </div>
                   );
        }
    },
    showDetailedHostInfo: function( host ) {
        let details = InterfaceInfoStore.getInterfaceDetails( host );
            {/* GRAPH: Detailed Host Info*/}
            return (
        <div>
            <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

            <div className="sidebar-popover sidebar-popover--overview">
                <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                <h4 className="sidebar-popover__heading">Host details</h4>
                <ul className="sidebar-popover__list">
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">Addresses:</span>
                        <span className="sidebar-popover__value">{details.addresses}</span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">Capacity:</span>
                        <span className="sidebar-popover__value"><SIValue value={details.capacity} /></span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">MTU:</span>
                        <span className="sidebar-popover__value">{details.mtu}</span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param"><a href="#">View traceroute graph</a></span>
                    </li>
                </ul>
            </div>
        </div>
        );

    },
    componentDidMount: function() {
            HostInfoStore.subscribe(this.updateChartHeader);
            InterfaceInfoStore.subscribe( this.handleInterfaceData );
            InterfaceInfoStore.retrieveInterfaceInfo( this.props.sources, this.props.dests );

    },
    handleInterfaceData: function() {
        let interfaceInfo = InterfaceInfoStore.getInterfaceInfo();
        this.setState({ interfaceInfo: interfaceInfo });

        this.updateChartHeader();

    },
    componentWillUnmount: function() {
        //this.serverRequest.abort();
        HostInfoStore.unsubscribe( this.updateChartHeader );
        InterfaceInfoStore.unsubscribe( this.updateChartHeader );
    },
    updateChartHeader: function() {
        let hostInfo = HostInfoStore.getHostInfoData();
        this.hostInfo = hostInfo;
        this.forceUpdate();

    },
    handlePageChange: function( direction ) {
        console.log("handleTimerangeChange direction: ", direction);
        let timeVars = this.getTimeVars( this.state.timerange );
        let diff = timeVars.timeDiff;
        let newStart;
        let newEnd;
        let now = Math.floor( new Date().getTime() / 1000 );
        if ( direction == "next" ) {
            newStart = this.state.start + diff;
            newEnd = this.state.end + diff;
        } else if ( direction == "previous" ) {
            newStart = this.state.start - diff;
            newEnd = this.state.end - diff;
        }
        if ( newStart >= now || newEnd >= now ) {
            newEnd = now;
            newStart = this.state.start - diff;
        }
        console.log("start", this.state.start, "end", this.state.end);
        console.log("newStart", newStart, "newEnd", newEnd);
        this.handleTimerangeChange({"start": newStart, "end": newEnd});

    },
    handleTimerangeChange: function( options ) {
        this.setState( options );
        this.forceUpdate();
        this.props.updateTimerange( options );
        emitter.emit("timerangeChange");

    },
    subscribe: function( callback ) {
        emitter.on("timerangeChange", callback);
    },
    unsubscribe: function( callback ) {
        emitter.off("timerangeChange", callback);
    },

    getTimeVars: function (period) {
        let timeDiff;
        let summaryWindow;
        if (period == '4h') {
            timeDiff = 60*60 * 4;
            summaryWindow = 0;
        } else if (period == '1d') {
            timeDiff = 86400;
            summaryWindow = 0;
        } else if (period == '3d') {
            timeDiff = 86400 * 3;
            summaryWindow = 300;
        } else if (period == '1w') {
            timeDiff = 86400*7;
            summaryWindow = 3600;
        } else if (period == '1m') {
            timeDiff = 86400*31;
            summaryWindow = 86400;
        } else if (period == '1y') {
            timeDiff = 86400*365;
            summaryWindow = 86400;
        }
        let timeRange = {
            timeDiff: timeDiff,
            summaryWindow: summaryWindow,
            timePeriod: period

        };
        return timeRange;

    },


});
