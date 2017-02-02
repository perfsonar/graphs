import React from "react";

import HostInfoStore from "./HostInfoStore";

import InterfaceInfoStore from "./InterfaceInfoStore";

import GraphUtilities from "./GraphUtilities";

import SIValue from "./SIValue";

import "../css/graphs.css";

let EventEmitter = require('events').EventEmitter;

let emitter = new EventEmitter();

let moment = require('moment-timezone');

export default React.createClass({
    hostInfo: [],
    getInitialState() {
        return {
            showHostSelectors: false,
            start: this.props.start,
            end: this.props.end,
            timeframe: this.props.timeframe,
            summaryWindow: 3600,
            interfaceInfo: null,
            traceInfo: [],
            pageURL: window.location.href
        };
    },
    getTime() {
        let obj = {
            "start": this.state.start,
            "end": this.state.end,
            "timeframe": this.state.timeframe
        };
        return obj;


    },
    getCurrentURL() {
        let url = window.location.href;
        console.log("Current page URL", url);
        this.setState({pageURL: url});
        return url;

    },
    render() {
        let startDate = new Date( this.state.start * 1000 );
        let endDate = new Date( this.state.end * 1000 );
        let startMoment = moment( startDate );
        let endMoment = moment( endDate );

        let startTZ = GraphUtilities.getTimezone( startDate );
        let endTZ = GraphUtilities.getTimezone( endDate );

        let date = "ddd MM/DD/YYYY";
        let time = "HH:mm:ss";

        return (

    <div>
        <div className="chartTitleBar">
            <span>perfSONAR test results</span>
            <span className="chartShareLinkContainer">
                <a href={this.state.pageURL} target="_blank">
                    <i className="fa fa-share-square-o" aria-hidden="true"></i> Share/open in new window
                </a>
            </span>
        </div>

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
                               <select className="no-margin" name="timeperiod" id="timeperiod" onChange={this.changeTimePeriod} value={this.state.timeframe}>
                                    <option value="1d">1 day</option>
                                    <option value="3d">3 days</option>
                                    <option value="1w">1 week</option>
                                    <option value="1m">1 month</option>
                                    <option value="1y">1 year</option>

                                </select>
                                <button className="button-quiet button-timechange" onClick={this.handlePageChange.bind(this, "next")}>
                                <i className="fa fa-arrow-right" aria-hidden="true"></i>
                                </button>
                                <div>
                                <span className="timerange_holder">
                                    { startMoment.format( date )}
                                    <br />
                                    { startMoment.format( time )} {startTZ}
                                 </span>
                                 <span className="timerange_holder">
                                         to
                                </span>
                                <span className="timerange_holder">
                                    { endMoment.format( date )}
                                    <br />
                                    { endMoment.format( time ) } {endTZ}
                                </span> 
                                </div>

                            </div>
                        </div> {/* End row */}
                    </div> {/* End overview */}

        {/* End chartHeader */}
        </div>
    </div>
        ); // End render()
    },
    componentWillReceiveProps: function( nextProps ) {
        this.getCurrentURL();

    },
    changeTimePeriod: function( event ) {
        let period = event.target.value;
        let vars = GraphUtilities.getTimeVars(period);
        let timeDiff = vars.timeDiff;
        let summaryWindow = vars.summaryWindow;
        let half = timeDiff / 2;
        let start = this.state.start;
        let end = this.state.end;
        let middle = ( start + end ) / 2;
        let now = Math.floor( new Date().getTime() / 1000 );
        //let newEnd = Math.floor( new Date().getTime() / 1000 );
        let newEnd = middle + half;
        if ( newEnd > now ) {
            newEnd = now;
        }

        // If newEnd is greater than now minus timeDiff, set newEnd to now
        // because in this case we are "close enought" to "now" that we
        // should go to current time
        if ( newEnd > now - timeDiff ) {
            newEnd = now;
        }


        let newStart = newEnd - timeDiff;

        let options = {
            timeframe: period,
            start: newStart,
            end: newEnd,
            summaryWindow: summaryWindow
        };
        console.log("options", options);
        this.handleTimerangeChange( options );
    },
    getTraceURL: function(i) {
        // URL from old graphs
        //
        let trace_data = this.state.traceInfo[i];
        if ( typeof trace_data == "undefined" ) {
            return;
        }
        let trace_url = '/perfsonar-traceroute-viewer/index.cgi?';
                    trace_url += 'mahost=' + trace_data.ma_url;
                    trace_url += '&stime=yesterday';
                    trace_url += '&etime=now';
                    //trace_url += '&tzselect='; // Commented out (allow default to be used)
                    trace_url += '&epselect=' + trace_data.traceroute_uri;
        return trace_url;
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
                            <div key={"detailedInfo"+label+i}>{this.showDetailedHostInfo( row[type + "_ip" ], i )}</div>
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
    showDetailedHostInfo: function( host, i ) {
        let trace = this.state.traceInfo;
        let display = "hiddenTrace";
        let traceURL = this.getTraceURL( i );
        if ( i in trace && traceURL != "" ) {
            if ( trace[i].has_traceroute == 1 ) {
                display = "blockTrace";
            }

        }
        let details = InterfaceInfoStore.getInterfaceDetails( host );
        let addresses = [];
        if ( $.isArray( details.addresses ) ) {
            for(var i in details.addresses) {
                let address = details.addresses[i];
                addresses.push(<div>{address}</div>);

            }

        } else {
            addresses.push( details.addresses );

        }
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
                        <span className="sidebar-popover__value">{addresses}</span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">Capacity:</span>
                        <span className="sidebar-popover__value"><SIValue value={details.capacity} /></span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">MTU:</span>
                        <span className="sidebar-popover__value">{details.mtu}</span>
                    </li>
                    <li className={"sidebar-popover__item " + display}>
                        <span className="sidebar-popover__param"><a href={traceURL} target="_blank">View traceroute graph</a></span>
                    </li>
                </ul>
            </div>
        </div>
        );

    },
    componentDidMount: function() {
        this.setInitialTime();
        HostInfoStore.subscribe(this.updateChartHeader);
        HostInfoStore.subscribeTrace(this.updateTrace);
        HostInfoStore.retrieveTracerouteData( this.props.sources, this.props.dests, this.props.ma_url );
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
        HostInfoStore.unsubscribeTrace( this.updateTrace );
        InterfaceInfoStore.unsubscribe( this.updateChartHeader );
    },
    updateTrace: function() {
        let traceInfo = HostInfoStore.getTraceInfo();
        this.setState({traceInfo: traceInfo});
    },
    updateChartHeader: function() {
        let hostInfo = HostInfoStore.getHostInfoData();
        this.hostInfo = hostInfo;
        this.forceUpdate();

    },
    handlePageChange: function( direction ) {
        let timeVars = GraphUtilities.getTimeVars( this.state.timeframe );
        let diff = timeVars.timeDiff;
        let newStart;
        let newEnd;
        let now = Math.floor( new Date().getTime() / 1000 );
        if ( direction == "next" ) {
            newEnd = this.state.end + diff;
            newStart = newEnd - diff;
        } else if ( direction == "previous" ) {
            newEnd = this.state.end - diff;
            newStart = newEnd - diff;
        }
        if ( newStart >= now || newEnd >= now ) {
            newEnd = now;
            newStart = now - diff;
        }
        let timeframe = this.state.timeframe;
        this.handleTimerangeChange({"start": newStart, "end": newEnd, timeframe: timeframe});

    },
    handleTimerangeChange: function( options, noupdateURL ) {
        if ( ! "timeframe" in options ) {
            options.timeframe = this.state.timeframe;
        }
        this.setState( options );
        this.props.updateTimerange( options, noupdateURL );
        emitter.emit("timerangeChange");
        this.forceUpdate();

    },
    subscribe: function( callback ) {
        emitter.on("timerangeChange", callback);
    },
    unsubscribe: function( callback ) {
        emitter.off("timerangeChange", callback);
    },

    setInitialTime: function() {
        let options = {};

        let timeframe = this.state.timeframe || "1w";
        let timeVars = GraphUtilities.getTimeVars( timeframe );
        let diff = timeVars.timeDiff;
        let summaryWindow = timeVars.summaryWindow;

        let now = Math.floor( new Date().getTime() / 1000 );
        let newEnd = now;
        let newStart =  newEnd - diff;

        if ( typeof this.props.start != "undefined" ) {
            newStart = this.props.start;
        }
        if ( typeof this.props.end != "undefined" ) {
            newEnd = this.props.end;
        }

        //console.log("setting initial time; state: ", this.state);

        options.start = newStart;
        options.end = newEnd;
        options.timeframe = timeframe;
        options.summaryWindow = summaryWindow;

        this.handleTimerangeChange( options, true );

    },

});
