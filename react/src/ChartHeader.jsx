import React from "react";

import HostInfoStore from "./HostInfoStore";

import InterfaceInfoStore from "./InterfaceInfoStore";

import GraphUtilities from "./GraphUtilities";

import SIValue from "./SIValue";

import "../css/graphs.css";

import DatePicker from 'react-datepicker';

import '../node_modules/react-datepicker/dist/react-datepicker.css';

let EventEmitter = require('events').EventEmitter;

let emitter = new EventEmitter();

let moment = require('moment-timezone');

var $ = require('jquery');

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
        this.setState({pageURL: url});
        return url;
    },

    handleStart(date) {
    this.setState({
      startDate: date
    });
   
  },
	
    handleEnd(date) {
    this.setState({
      endDate: date
    });
  },


    render() {
        let startDate;
	let endDate;
	if(typeof this.state.startDate != "undefined"){
		startDate = this.state.startDate.toDate();
	}
	else{
		startDate = this.state.startDate;
	}
	if(typeof this.state.endDate != "undefined"){
                endDate = this.state.endDate.toDate();
        }
        else{
                endDate = this.state.endDate;
        }
	//let startDate = new Date( this.state.start * 1000 );
        //let endDate = new Date( this.state.end * 1000 );
        let startMoment = moment( startDate );
        let endMoment = moment( endDate );

        let startDateString = "";
        if ( startDate !== null && typeof startDate != "undefined" ) {
            startDateString = startDate.toString();
        } 
        let endDateString = "";
        if ( endDate !== null && typeof endDate != "undefined" ) {
            endDateString = endDate.toString();
        } 

        let startTZ = GraphUtilities.getTimezone( startDateString );
        if ( startTZ == "" ) {
            //console.log("unknown timezone; date: " , startDate.toString() );

        }
        let endTZ = GraphUtilities.getTimezone( endDateString );

        let date = "ddd MM/DD/YYYY";
        let time = "HH:mm:ss";

        return (

    <div>
        <div className="chartTitleBar">
            <span>perfSONAR test results</span> - <a href="http://docs.perfsonar.net/using_graphs.html" target="_blank">documentation</a>
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
                            <div className="medium-3 columns">
                                {this.renderHostList("source", "Source")}
                            </div>

                            {/* GRAPH: Destination */}

                            <div className="medium-3 columns">
                                {this.renderHostList("dest", "Destination")}
                            </div>

                            {/* GRAPH: Reporting range */}

			    <style>
                                        {`.graph-temp {
                                        	display: flex;

                                        }

					.flowflex{
						flex-flow: row wrap;

					}

					.box-range{
                                                flex-shrink:2;
                                         } `}
                             </style>
			    <div className="medium-6 columns">
                                <label className="hostLabel">Report range</label>
                                <br/>
				<div className="graph-temp flowflex">
				<div className="box-range">
				<button id="headerTimePrevious" className="button-quiet button-timechange" onClick={this.handlePageChange.bind(this, "previous")}>
                                <i className="fa fa-arrow-left" aria-hidden="true"></i>
                                </button>
                                {/*
                               <select className="no-margin" name="timeperiod" id="timeperiod" onChange={this.changeTimePeriod} value={this.state.timeframe}>
                                    <option value="1h">1 hour</option>
				    <option value="12h">12 hours</option>
                                    <option value="1d">1 day</option>
                                    <option value="3d">3 days</option>
                                    <option value="1w">1 week</option>
                                    <option value="2w">2 weeks</option>
				    <option value="3w">3 weeks</option>
				    <option value="30d">30 days</option>
                                    <option value="1y">1 year</option>
                                </select>
                                */}
				</div>


				<style>
          				{`.react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list {
            				padding-left: 0;
            				padding-right: 0;
          				}`}
        			</style>
			  	<div className="box-range">
				<DatePicker
  					selected={this.state.startDate}
  					onChange={this.handleStart}
					showTimeSelect
    					placeholderText="From"
					timeFormat="HH:mm"
    					timeIntervals={15}
    					dateFormat="YYYY-MM-DD HH:mm"
    					timeCaption="time"
                        className="qwerty"
				/>
				</div>		
			        <div className="box-range">
				<DatePicker
                                        selected={this.state.endDate}
                                        onChange={this.handleEnd}
                                        showTimeSelect
                                        placeholderText="To"
					timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="YYYY-MM-DD HH:mm"
                                        timeCaption="Time"
                        className="qwerty"
                                />
				</div>

				<div className="box-range">
				<button className="button-quiet button-timechange" onClick={this.changeTimePeriod}>
                               <b> Go </b>
                                </button>
				</div>
				<div className="box-range">
                                <button className="button-quiet button-timechange" onClick={this.handlePageChange.bind(this, "next")}>
                                <i className="fa fa-arrow-right" aria-hidden="true"></i>
                                </button>
				</div>
                                </div>
				<div>

                                <span className="timerange_holder">

				    { (new Date(this.state.start * 1000)).toUTCString() } 
                                    <br />

                                 </span>
                                 <span className="timerange_holder">
                                         to
                                </span>
                                <span className="timerange_holder">

                                    { (new Date(this.state.end * 1000)).toUTCString() }
				    <br />

                                </span>
                                </div>

                            </div>

                        </div> 
				{/* End row */}
                    </div> 
				{/* End overview */}

        {/* End chartHeader */}
        </div>
    </div>
        ); // End render()
    },
    componentWillReceiveProps: function( nextProps ) {
        this.getCurrentURL();

    },

    changeTimePeriod: function( event ) {
        
	let start = Math.round(this.state.startDate.toDate().getTime() / 1000);
        let end = Math.round(this.state.endDate.toDate().getTime() / 1000);
        //this.setState({	start : Math.round(this.state.startDate.toDate().getTime() / 1000) });
	//this.setState({ end : Math.round(this.state.endDate.toDate().getTime() / 1000) }); 
	let now = Math.floor( new Date().getTime() / 1000 );
	let temp;
	let initend = end;
	if( end > now ){
	   	temp = end - now;
		end = now;
	}
	if( start > initend){
		if((start > now) && (initend > now)){
			start = now - temp;
			end = now;
		}
		else{
			start = end;
			end = now;
		}
		
	}
	else if( start > now){
		start = now - temp;
                end = now;
	}		
	let timeDiff = Math.abs(end - start);
	this.state.start = start;
	this.state.end = end;
	this.state.timeframe = timeDiff;
	let summaryWindow; 
	if(timeDiff< 86400){
		summaryWindow = 0;	
	}
	else if((timeDiff >= 86400) && (timeDiff<= 86400*3)){
		summaryWindow = 300;	
	}
	else if((timeDiff > 86400*3) && (timeDiff<= 86400*31)){
                summaryWindow = 3600;
        }
	else{
                summaryWindow = 86400;
        } 
        let half = timeDiff / 2;
	//console.log("\nstart iss "+ (this.state.startDate.toDate().getTime() / 1000));
	//console.log("\nend is "+ end);
	//console.log("\ntemp is "+ temp);
	//console.log("\nnow is "+ now);
	
	let newEnd = end;
	let newStart = start;
	let options = {
            timeframe: timeDiff,//period,
            start: newStart,
            end: newEnd,
            summaryWindow: summaryWindow
        };
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
        //console.log("In handle page change "+ timeVars.timeDiff);
	let diff = timeVars.timeDiff;
        let newStart;
        let newEnd;
        let now = Math.floor( new Date().getTime() / 1000 );
        if ( direction == "next" ) {
            //console.log("time to be "+ this.state.end);
	    newEnd = this.state.end + diff;
            //newEnd = Math.round(this.state.endDate.toDate().getTime() / 1000) + diff;
	    newStart = newEnd - diff;
        } else if ( direction == "previous" ) {
            newEnd = this.state.end - diff;
            //newEnd = Math.round(this.state.endDate.toDate().getTime() / 1000) - diff;
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

        options.start = newStart;
        options.end = newEnd;
        options.timeframe = timeframe;
        options.summaryWindow = summaryWindow;

        this.handleTimerangeChange( options, true );

    },

});
