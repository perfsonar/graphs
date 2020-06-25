import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
import GraphDataStore from "./GraphDataStore";
import GraphUtilities from "./GraphUtilities";

import { AreaChart, Brush, Baseline, Charts, ChartContainer, ChartRow, YAxis, LineChart, ScatterChart, Highlighter, Resizable, Legend, styler } from "react-timeseries-charts";

import { TimeSeries, TimeRange, Event } from "pondjs";
import { Pipeline } from "pondjs";

import SIValue from "./SIValue";
import "./chart1.css";
import ChartLayout from "./chartLayout.jsx";
import "../css/graphs.css";
import "../../toolkit/web-ng/root/css/app.css";
import "../css/spinner.css";

let charts;
let chartData;
let tooltip = null;
let trackerValues = {};

const text = 'perfSONAR chart';

const typesToChart = [
    {
        name: "throughput",
        esmondName: "throughput",
        label: "Throughput",
        unit: "bps",
    },
    {
        name: "loss",
        esmondName: "packet-count-sent",
        label: "Packet Loss",
        unit: "packet",
    },
    {
        name: "loss",
        esmondName: "packet-count-lost",
        label: "Packet Loss",
        unit: "packet",
    },
    {
        name: "loss",
        esmondName: "packet-count-lost-bidir",
        label: "Packet Loss",
        unit: "packet",
    },
    {
        name: "loss",
        esmondName: "packet-loss-rate",
        label: "Packet Loss %",
        unit: "fractional",
    },
    {
        name: "loss",
        esmondName: "packet-loss-rate-bidir",
        label: "Packet Loss",
        unit: "fractional",
    },
    {
        name: "throughput",
        esmondName: "packet-retransmits",
        label: "Retransmits",
        unit: "packet",
    },
    {
        name: "latency",
        esmondName: "histogram-owdelay",
        label: "Latency",
        unit: "ms",
    },
    {
        name: "latency",
        esmondName: "histogram-rtt",
        label: "Latency",
        unit: "ms",
    },
    {
        name: "response",
        esmondName: "pscheduler-raw",
        label: "Response Time",
        unit: "seconds",
    }
];
const subtypesToChart = [
    {
        name: "failures",
        label: "Failures"
    }
];

const baselineStyle = {
    line: {
        stroke: "steelblue",
        strokeWidth: 1,
        opacity: 0.4,
        strokeDasharray: "none"
    },
    label: {
        fill: "steelblue"
    }
};

const baselineStyleLite = {
    line: {
        stroke: "steelblue",
        strokeWidth: 1,
        opacity: 0.5
    },
    label: {
        fill: "steelblue"
    }
};


const scheme = {
    tcp: "#0076b4", // blue
    udp: "#cc7dbe", // purple
    ipv4: "#e5a11c", // yellow
    ipv6: "#633", // brown
    throughput: "#0076b4", // blue
    throughputTCP: "#0076b4", // blue
    "packet-retransmits": "#cc7dbe", // purple
    "packet-loss-rateLatency": "#2b9f78", // green
    "histogram-rtt": "#e5a11c", // yellow/orange
    "histogram-owdelay": "#633", // brown
    "pscheduler-raw-dns": "#cc7dbe", // purple
    "pscheduler-raw-http": "#2b9f78", // green
    "packet-loss-rate": "#cc7dbe", // purple
    "packet-loss-rateThroughput": "#cc7dbe", // purple
    //"packet-loss-ratePing": "yellow", // bright orange
    "packet-loss-ratePing": "#e5801c", // browny orangey
    throughputUDP: "#d6641e" // vermillion
};

const failureStyle = function(column, event) {
    return {
        normal: {
            fill: "red",
            opacity: 0.8,
        },
        highlighted: {
            fill: "#a7c4dd",
            opacity: 1.0,
            cursor: "crosshair",
        },
        selected: {
            fill: "orange",
            opacity: 1.0,
        },
        muted: {
            fill: "grey",
            opacity: 0.5
        }
    };
};

const infoStyle = {
    line: { stroke: "#999", cursor: "crosshair", pointerEvents: "none" },
    box: { fill: "white", opacity: 0.90, stroke: "#999", pointerEvents: "none" }
};

const connectionsStyle = {
    color: scheme.tcp,
    strokeWidth: 1
};

const requestsStyle = {
    stroke: "#990000",
    strokeWidth: 2,
    strokeDasharray: "4,2"
};

const chartStyles = {
    tcp: {
        color: scheme.tcp
    },
    udp: {
        color: scheme.tcp

    }

};

function getChartStyle( options, column ) {
    if ( typeof column == "undefined" ) {
        column = "value";
    }
    let color = scheme.tcp;
    let strokeStyle = "";
    let width = 3;
    let opacity = 1;
    let fill = "none";

    switch ( options.protocol ) {
        case "tcp":
            color = scheme.tcp;
            opacity = 0.8;
            break;
        default:
            color = scheme.udp;
            opacity = 0.8;
            break;
    }

    switch ( options.eventType ) {
        case "throughput":
            if ( options.protocol == "tcp" ) {
                color = scheme.throughputTCP;
            } else {
                color = scheme.throughputUDP;
            }
            break;
        case "histogram-owdelay":
            // owdelay is always UDP
            color = scheme["histogram-owdelay"];
            break;
        case "histogram-rtt":
            color = scheme["histogram-rtt"];
            break;
		case "pscheduler-raw":
			if ( options["pscheduler-test-type"] == "http" ) {
                color = scheme["pscheduler-raw-http"];
            } else {
                color = scheme["pscheduler-raw-dns"];
            }
            break;
        case "packet-loss-rate":
            if ( options.mainEventType == "throughput" ) {
                color = scheme["packet-loss-rateThroughput"];
            } else {
                color = scheme["packet-loss-rateLatency"];
            }
            break;
        case "packet-loss-rate-bidir":
            color = scheme["packet-loss-ratePing"];
            opacity = 0.95;
            width = 2;
            break;
        case "packet-retransmits":
            color = scheme["packet-retransmits"];
            opacity = 0.9;
            fill = "#cc7dbe";
            width = 0;
            break;

    }
    if ( options.direction == "reverse" && options.eventType != "packet-retransmits" ) {
        strokeStyle = "4,2";
        width = 3;
    }
    let style = {};
    style[column] = {
        normal: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle, fill: fill },
            highlighted: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle },
            selected: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle },
            muted: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle }
    };
    return style;

}

const lineStyles = {
    value: {
        stroke: scheme.udp,
        strokeWidth: 1.5
    }
};

const reverseStyles = {
    value: {
        stroke: scheme.connections,
        strokeDasharray: "4,2",
        strokeWidth: 1.5
    }
}

const trans = 'translate("-50px", "-80px")';

const axisLabelStyle = {
    labelColor: "black",
    labelFont: "\"Open Sans\", \"Helvetica Neue\", \"Helvetica\", Arial, sans-serif",
    labelSize: "14",
    labelOffset: 5,
    labelWeight: 200
}

const failureLabelStyle = {
    display: "none",
    visibility: "hidden",
    opacity: 0
}

const offsets = {
    label: 60
}

const chartRow = {
    height: 150,
    brushHeight: 50
}

const brushStyle = {
    boxShadow: "inset 0px 2px 5px -2px rgba(189, 189, 189, 0.75)",
    background: "#FEFEFE",
    paddingTop: 10
};

export default React.createClass({

    mixins: [Highlighter],

    getInitialState() {
        let startDate = new Date( this.props.start * 1000 );
        let endDate = new Date( this.props.end * 1000 );
        let startMoment = moment( startDate );
        let endMoment = moment( endDate );
        let timerange = new TimeRange(startMoment, endMoment);

       return {
            markdown: text,
            active: {
                throughput: true,
                forward: true,
                reverse: true,
                loss: true,
                latency: true,
                failures: true,
				response: true,
                "packet-retransmits": true,
                "loss-latency": true,
 				"response-dns": true,
                "response-http": true

            },
            start: this.props.start,
            end: this.props.end,
            summaryWindow: this.props.summaryWindow,
            agent: this.props.agent,
            tracker: null,
            chartSeries: null,
            timerange: timerange,
            initialTimerange: timerange,
            brushrange: null,
            maxLatency: 1,
            maxThroughput: 1,
            maxLoss: 0.0000000001,
            latencySeries: null,
            itemsToHide: {},
            showBrush: false,
            // Highlighting
            hover: null,
            highlight: null,
            selection: null,
            loading: true,
            params: undefined,
            dataloaded: false,
            initialLoading: true,
            lockToolTip: false,
            toolTipWidth: null,
	    ttCollapse: {
                throughput: false,
                loss: false,
                latency: false,
                failures: false,
                response: false

            },
            showHoverDots: false,
            showHoverTime: null,
            //trackerValues: {}
        };
    },
    
    handleSelectionChanged(point) {
        this.setState({
            selection: point
        });
    },

    toggleTT( event, testType ) {
        if ( !event ) {
            return;

        }
        event.preventDefault();
        $("li.graph-values-popover__item li." + testType + "-val").toggle();

        let ttCollapse = this.state.ttCollapse;

        let collapsed = ttCollapse[ testType ];

        ttCollapse[ testType ] = !collapsed;

        this.setState( { ttCollapse: ttCollapse });


    },

    getTTItemClass( testType ) {
        let ttCollapse = this.state.ttCollapse;
        let ret = testType + "-val";
        if ( ttCollapse[ testType ] ) {
            return ret + " hidden";
        } else {
            return ret;

        }

    },
    getTTIconClass( testType ) {
        let ttCollapse = this.state.ttCollapse;
        if ( ttCollapse[ testType ] ) {
            return "fa-plus-square-o";
        } else {
            return "fa-minus-square-o";

        }

    },

    handleMouseEnter(event, point) {
        this.setState({showHoverDots: true});

    },

    handleMouseLeave(event, point) {
        if ( !this.state.lockToolTip ) {
            this.setState({showHoverDots: false});
        }

    },

    handleMouseMove(event, point) {
        if ( this.state.lockToolTip ) {
            return;

        }
        let { clientHeight, clientWidth } = this.refs.graphDiv;
        let pos = this.getMousePos( event );
        let posX = pos.posX;
        let toolTipWidth;

        if ( typeof this.refs.tooltip == "undefined" ) {
            toolTipWidth = this.state.toolTipWidth;
        } else {
            toolTipWidth = this.refs.tooltip.clientWidth;
        }
        if ( typeof toolTipWidth == "undefined" || toolTipWidth === null ) {
            toolTipWidth = clientWidth * 0.23;
        }
        let offsetX = 25;
        //console.log("clientWidth", clientWidth, "toolTipWidth", toolTipWidth);
        if ( posX < 0.66 * clientWidth ) {
            posX += offsetX;
        } else {
            posX -= (offsetX + toolTipWidth + 25);
        }

        this.setState({posX: posX, toolTipWidth: toolTipWidth});

    },

    getMousePos(e) {
        var m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0,
        obj = this;
        //get mouse position on document crossbrowser
        if (!e){e = window.event;}
        if (e.pageX || e.pageY){
            m_posx = e.pageX;
            m_posy = e.pageY;
        } else if (e.clientX || e.clientY){
            m_posx = e.clientX + document.body.scrollLeft
                + document.documentElement.scrollLeft;
            m_posy = e.clientY + document.body.scrollTop
                + document.documentElement.scrollTop;
        }
        //get parent element position in document
        if (obj.offsetParent){
            do {
                e_posx += obj.offsetLeft;
                e_posy += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        // mouse position minus elm position is mouseposition relative to element:
        var x_position = m_posx-e_posx;
        var y_position = m_posy-e_posy;

        return { posX: x_position, posY: y_position };
    },

    getToolTipPos( ) {



    },

    handleClick(e, f, g) {
        this.setState({
            lockToolTip: !this.state.lockToolTip
        });
    },

    handleMouseNear(point) {
        this.setState({
            highlight: point
        });
    },

    contextTypes: {
        router: React.PropTypes.func
    },

    renderToolTip() {
        let tracker = this.state.tracker;
        let dateFormat = "MM/DD/YYYY HH:mm:ss";
        let date =  moment( tracker ).format(dateFormat);
        let trackerString = "";
        if ( tracker !== null && typeof tracker != "undefined" ) {
            trackerString = tracker.toString();
        }
        let tz = GraphUtilities.getTimezone( trackerString );

        let display = "block";

        // Retrieve chart data for the tooltip

        let tooltipItems = {};
        tooltipItems["throughput"] = [];
        tooltipItems["latency"] = [];
        tooltipItems["loss"] = [];
        tooltipItems["response"] = [];
        tooltipItems["failures"] = [];

	    if ( ( this.state.lockToolTip || tracker != null ) && typeof charts != "undefined" ) {
            let data = this.getTrackerData();
            if ( typeof data == "undefined" ||  data.length == 0 ) {
                display = "none";
            } else {
                display = "block";
            }

            if ( this.state.lockToolTip ) {
                display = "block";
            }

            let unique = GraphDataStore.getUniqueValues( {"ipversion": 1} );
            let ipversions = unique.ipversion;
            let filters = {};
            const tooltipTypes = typesToChart.concat( subtypesToChart );

	         // Build the filters

            for( let i in ipversions ) {
                for (let h in tooltipTypes) {
                    let eventType = tooltipTypes[h];
                    let type = eventType.name;
                    let label = eventType.label;
                    let esmondName = eventType.esmondName || type;
                    let ipversion = ipversions[i];
                    let ipv = "ipv" + ipversion;

                    let filter = { testType: type, ipversion: ipversion };
                    let eventTypeFilter = { eventType: type, ipversion: ipversion };
                    if ( typeof filters[type] == "undefined" ) {
                        filters[type] = {};
                    }
                    filters[type][ipversion] = filter;
                    if ( type == "failures" ) {
                        filters[type][ipversion] = eventTypeFilter;
                    } else if ( type == "throughput" ) {
                        filters[type][ipversion] = eventTypeFilter;

                    }

                }


            }



            for( let k in ipversions ) {
                let failureItems = [];
                let throughputItems = [];
                let lossItems = [];
                let latencyItems = [];
 				let responseItems = [];

                let ipversion = ipversions[k];
                let ipv = "ipv" + ipversion;


                // We need to use a different list of items to hide for failures, because
                // normally we query on "eventType" but for this we need to check
                // "mainEventType" (since "failures" is the "eventType" and 
                // "mainEventType might be "throughput" or "latency" etc.)
                let failureItemsToHide = [];
                let eventTypeRe = /^eventType/;

                for( let key in this.state.itemsToHide ) {
                    let row = this.state.itemsToHide[ key ];
                    let newObj = {};
                    let newKey = key;
                    if ( newKey ) {
                        for( let subkey in row ) {
                            let val = row[ subkey ];
                            let newSubkey = subkey;
                            if ( newSubkey ) {
                                newObj[ newSubkey ] = val;
                            }


                        }

                        failureItemsToHide.push( newObj );
                    }

                }

                let filter = filters["failures"][ipversion];
                let failuresData = GraphDataStore.filterData( data, filters["failures"][ipversion], this.state.itemsToHide );
                //failureData.sort(this.compareToolTipData);
                if ( failuresData.length == 0 ) {
                    //failureItems = [];
                } else {
                    FAILUREDATA:
                    for(let i in failuresData) {
                        let row = failuresData[i];
                        let ts = row.ts;
                        let tool = this.getTool( row );
                        let timeslip = 0.008;
                        let duration = this.state.timerange.duration();
                        let range = duration * timeslip;

                        if ( ( typeof ts == "undefined"  ) || !this.withinTime( ts.getTime(), tracker.getTime(), range ) ) {
                            continue;
                        }

                        // TODO: we'll want to improve performance by filtering out
                        // the mainEventType "undefined" values (which represent trace etc)
                        // from the DATA, rather than display
                        if ( typeof row.properties.mainEventType == "undefined" ) {
                            continue;
                        }
						
                        let hide = false;
                        FAILUREITEMS:
                        for( let j in failureItemsToHide ) {
                            let item = failureItemsToHide[j];
                            hide = true;
                            for( let criterion in item ) {
                                if ( criterion == "eventType" ) {
                                    if ( row.properties.mainEventType == item[ criterion ] 
                                           && item[ criterion ] != "packet-loss-rate" ) {
                                        hide = hide && true;
                                    } else {
                                        hide = false;
                                        continue;
                                    }
                                } else {
                                    if ( row.properties[criterion] == item[ criterion ] ) {
                                        hide = hide && true;
                                    } else {
                                        hide = false;
                                        continue;

                                    }

                                }


                            }
                            if ( hide ) {
                                continue FAILUREDATA;

                            }

                        }

                        let dir = "-\u003e"; // Unicode >
                        if ( row.properties.direction == "reverse" ) {
                            dir = "\u003c-"; // Unicode <
                        }
                        let prot = "";
                        if ( typeof row.properties.protocol != "undefined" ) {
                            prot = row.properties.protocol.toUpperCase();
                            prot += " ";
                        }
                        let testType = row.properties.mainTestType;
                        if ( !hide ) {
                            failureItems.push(
                                <li className={this.getTTItemClass("failures")}>{dir} [{testType}] {prot}{row.error} {tool}</li>
                            );
                        }

                    }
                }

                // GET THROUGHPUT DATA
                let throughputData = GraphDataStore.filterData( data, filters.throughput[ipversion], this.state.itemsToHide );
                throughputData.sort(this.compareToolTipData);

                for(let i in throughputData) {
                    let row = throughputData[i];
                    let key = row.properties["metadata-key"];
                    let direction = row.properties.direction;
                    let tool = this.getTool( row );
                    let protocol = this.getProtocol( row );

		    		//get test params
		    		let bwParallel = this.getTestParam(row, "bw-parallel-streams");
		    		let bwTarget = this.getTestParam(row, "bw-target-bandwidth");                    
		    		let ipTransport = this.getTestParam(row, "ip-transport-protocol");
		    		let timeDuration = this.getTestParam(row, "time-duration");

		    		// get retrans values
                    let retransFilter = {
                        eventType: "packet-retransmits",
                        ipversion: ipversion,
                        "metadata-key": key,
                        direction: direction

                    };
                    let retransData = GraphDataStore.filterData( data, retransFilter, this.state.itemsToHide );

                    let retransVal = "";
                    if ( retransData.length > 0 ) {
                        retransVal = retransData[0].value;
                    } else {
                        retransVal = "";

                    }

                    let retransLabel = "";
                    if ( ( typeof retransVal ) != "undefined" && retransVal != "" && retransVal != null ) {
                        retransLabel += "; retrans: " + retransVal;

                    } else {
                        retransVal = "";
                        retransLabel = "";

                    }

                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <
                    }
                    throughputItems.push(
                            <li className={this.getTTItemClass("throughput")}>{dir} <SIValue value={this._formatZero( row.value )} digits={2} />bits/s{protocol}{retransLabel}{tool}</li>

                            );

		    		if(this.props.showParams){
		    	
						if (bwParallel != ""){
							throughputItems.push(
                            	<li className={this.getTTItemClass("throughput")}> &nbsp;&nbsp;&nbsp;&nbsp;bw-parallel-streams: {bwParallel}</li>
                            	);	
		    			}
			
		    			if (bwTarget != ""){
                        	throughputItems.push(
                            	<li className={this.getTTItemClass("throughput")}> &nbsp;&nbsp;&nbsp;&nbsp;bw-target-bandwidth: {bwTarget} bits/s</li>
                            	);
                    	}
		    
		    			if (timeDuration != ""){
                        	throughputItems.push(
                            	<li className={this.getTTItemClass("throughput")}> &nbsp;&nbsp;&nbsp;&nbsp;time-duration: {timeDuration} s</li>
                            	);
                    	}

		    			if (ipTransport != ""){
                        	throughputItems.push(
                            	<li className={this.getTTItemClass("throughput")}> &nbsp;&nbsp;&nbsp;&nbsp;ip-transport-protocol: {ipTransport}</li>
                            	);
                    	}
		    		}
                }

                // GET LOSS DATA
                let lossData = GraphDataStore.filterData( data, filters["loss"][ipversion], this.state.itemsToHide );

                lossData = GraphDataStore.pairSentLost( lossData );

                lossData.sort(this.compareToolTipData);
                for(let i in lossData) {
                    let row = lossData[i];
                    if ( typeof row == "undefined" ||  typeof row.value == "undefined" ) {
                        continue;
                    }
                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <

                    }
                    let label = "latency";
                    if ( row.properties.mainEventType == "histogram-rtt" ) {
                        label = "rtt";
                    } else if ( row.properties.eventType == "packet-count-lost-bidir" ) {
                        label = "ping count";
                    } else if ( row.properties.mainEventType == "throughput" ) {
                        label = "UDP";
                    } else if ( row.properties.mainEventType == "histogram-owdelay" ) {
                        label = "one way";
                    }

                    let tool = this.getTool( row );
                    let value = row.value;

                if ( row.properties.eventType == "packet-loss-rate" 
                     || row.properties.eventType == "packet-loss-rate-bidir" ) {
                    value = this._formatToolTipLossValue( value, "floatshort" );
                    row.lostValue = this._formatToolTipLossValue( row.lostValue, "integer" );
                    row.sentValue = this._formatToolTipLossValue( row.sentValue, "integer" );
                }  else {
                    continue;
                }

                let key = row.properties["metadata-key"];

                    if ( row.lostValue != null
                            && row.sentValue != null ) {
                    lossItems.push(
                            <li className={this.getTTItemClass("loss")}>{dir} {value}% lost ({row.lostValue} of {row.sentValue} packets) {"(" + label + ")"}{tool}</li>
                            );
                    } else {
                        lossItems.push(
                                <li className={this.getTTItemClass("loss")}>{dir} {value}% ({label}){tool}</li>
                                );

                    }

                }

   			    // GET RESPONSE DATA
                let respData = GraphDataStore.filterData( data, filters["response"][ipversion], this.state.itemsToHide );

                respData.sort(this.compareToolTipData);

                for(let i in respData) {
                    let row = respData[i];


                    if ( typeof row == "undefined" ||  typeof row.value == "undefined" ) {
                        continue;
                    }
                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <

                    }
                    let label = "Response";
                    if ( row.properties.eventType == "pscheduler-raw" && row.properties["pscheduler-test-type"] == "dns") {
                        label = "Dns";
                    } else if ( row.properties.eventType == "pscheduler-raw" && row.properties["pscheduler-test-type"] == "http") {
                        label = "Http";
                    }

					let tool = this.getTool( row );
                    let value = row.value;
  
                    let key = row.properties["metadata-key"];
         
                      responseItems.push(
                                <li className={this.getTTItemClass("response")}>{dir} {value} time taken in Secs.  ({label}) {tool}</li>
                                );

                }


				// GET LATANCY DATA
                let latencyData = GraphDataStore.filterData( data, filters["latency"][ipversion], this.state.itemsToHide );
                latencyData.sort(this.compareToolTipData);
                for(let i in latencyData) {
                    let latRow = latencyData[i];
                    if ( ( typeof latRow == "undefined" ) || ( typeof latRow.value == "undefined" ) ) {
                        continue;
                    }
                    let dir = "-\u003e"; // Unicode >
                    if ( latRow.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <

                    }
                    let label = "(one way)";
                    if ( latRow.properties.mainEventType == "histogram-rtt" ) {
                        label = "(rtt)";
                    }

                    let tool = this.getTool( latRow );

		    //get test parameters
		    let sampleSize = this.getTestParam(latRow, "sample-size");
                    let ipPacket = this.getTestParam(latRow, "ip-packet-padding");
                    let timeProbe = this.getTestParam(latRow, "time-probe-interval");
                    let sampleBucket = this.getTestParam(latRow, "sample-bucket-width");
		    let ipTransport = this.getTestParam(latRow, "ip-transport-protocol");
                    let timeDuration = this.getTestParam(latRow, "time-duration");
			
                    let owampVal = latRow.value.toFixed(1);
                    if ( Math.abs( owampVal ) < 1 ) {
                        owampVal = latRow.value.toFixed(2);
                    }
                    if ( Math.abs( owampVal ) < 0.01 ) {
                        owampVal = latRow.value.toFixed(4);
                    }
                    latencyItems.push(
                            <li className={this.getTTItemClass("latency")}>{dir} {owampVal} ms {label}{tool}</li>

                            );
		    if(this.props.showParams){
		    	if(sampleSize != ""){
				latencyItems.push(
					<li className={this.getTTItemClass("latency")}> &nbsp;&nbsp;&nbsp;&nbsp;sample-size: {sampleSize} bytes</li>
				);
		    	}
		    
		    	if(ipPacket != ""){
                        	latencyItems.push(
                                	<li className={this.getTTItemClass("latency")}>&nbsp;&nbsp;&nbsp;&nbsp;ip-packet-padding: {ipPacket} bytes</li>
                        	);
                    	}
        	        	
		    	if(timeProbe != ""){
                        	latencyItems.push(
                                	<li className={this.getTTItemClass("latency")}>&nbsp;&nbsp;&nbsp;&nbsp;time-probe-interval: {timeProbe} s</li>
                        	);
                    	}
			
		    	if(sampleBucket != ""){
                        	latencyItems.push(
                                	<li className={this.getTTItemClass("latency")}>&nbsp;&nbsp;&nbsp;&nbsp;sample-bucket-width: {sampleBucket} s</li>
                        	);
                    	}

		    	if(ipTransport != ""){
                        	latencyItems.push(
                                	<li className={this.getTTItemClass("latency")}>&nbsp;&nbsp;&nbsp;&nbsp;ip-transport-protocol: {ipTransport}</li>
                        	);
                    	}

		    	if(timeDuration != ""){
                        	latencyItems.push(
                                	<li className={this.getTTItemClass("latency")}>&nbsp;&nbsp;&nbsp;&nbsp;time-duration: {timeDuration} s</li>
                        	);
                    	}
		    }
		    
                }

        var showT = true;
		if(this.props.showTpt == null){
			showT = true;
		}
		else{
			showT = this.props.showTpt;
		} 
		if ( (throughputItems.length > 0) && (showT) ) {
                    tooltipItems["throughput"].push(
                                    <li className="graph-values-popover__item">
                                        <ul>
                                            <li><h6><a href="#" onClick={(event) => this.toggleTT(event, "throughput") }>
                                                <i className={"fa " + this.getTTIconClass("throughput")} aria-hidden="true"></i>
                                                Throughput - {ipv}</a></h6></li>
                                            {throughputItems}
                                        </ul>
                                    </li>

                    );

                }

		var showP = true;
                if(this.props.showPac == null){
                        showP = true;
                }
                else{
                        showP = this.props.showPac;
                }
                if ( (lossItems.length > 0) && (showP)) {
                    tooltipItems["loss"].push(
                                        <li className="graph-values-popover__item">
                                            <ul>
                                                <li><h6><a href="#" onClick={(event) => this.toggleTT(event, "loss") }>
                                                    <i className={"fa " + this.getTTIconClass("loss")} aria-hidden="true"></i>
                                                    Loss - {ipv}</a></h6></li>
                                                {lossItems}
                                            </ul>
                                        </li>

                            );

                }

		var showR = true;
                if(this.props.showRes == null){
                        showR = true;
                }
                else{
                        showR = this.props.showRes;
                }
                if ( (responseItems.length > 0) && (showR)) {
                    tooltipItems["response"].push(
                                        <li className="graph-values-popover__item">
                                            <ul>
                                                <li><h6><a href="#" onClick={(event) => this.toggleTT(event, "response") }>
                                                    <i className={"fa " + this.getTTIconClass("response")} aria-hidden="true"></i>
                                                    Response - {ipv}</a></h6></li>
                                                {responseItems}
                                            </ul>
                                        </li>

                            );

                }

		var showL = true;
                if(this.props.showLat == null){
                        showL = true;
                }
                else{
                        showL = this.props.showLat;
                }
                if ( (latencyItems.length > 0) && (showL)) {
                    tooltipItems["latency"].push(
                                        <li className="graph-values-popover__item">
                                            <ul>
                                                <li><h6><a href="#" onClick={(event) => this.toggleTT(event, "latency") }>
                                                    <i className={"fa " + this.getTTIconClass("latency")} aria-hidden="true"></i>
                                                    Latency - {ipv}</a></h6></li>
                                                {latencyItems}
                                            </ul>
                                        </li>

                            );

                }

                if ( failureItems.length > 0 ) {
                    tooltipItems["failures"].push(
                                        <li className="graph-values-popover__item">
                                            <ul>
                                                <li><h6><a href="#" onClick={(event) => this.toggleTT(event, "failures") }>
                                                    <i className={"fa " + this.getTTIconClass("failures")} aria-hidden="true"></i>
                                                    Test Failures - {ipv}</a></h6></li>
                                                {failureItems}
                                            </ul>
                                        </li>

                            );

                }
            }


            let allItems = tooltipItems["throughput"].concat( 
                    tooltipItems["loss"],
                    tooltipItems["latency"],
 					tooltipItems["response"],
                    tooltipItems["failures"]);

            let trackerTS = Math.floor( tracker / 1000 );
            if ( allItems.length == 0 || ! ( trackerTS >=  this.state.start && trackerTS <= this.state.end  )  ) {
                display = "none";
                return;
            } else {

            }
            let posX = this.state.posX;
            let toolTipStyle = {
                left: posX + "px"
            };

            let newTooltip =  (
            <div className="small-2 columns">
                    <div className="sidebar-popover graph-values-popover" display={display} style={toolTipStyle} ref="tooltip">
                        <span className="graph-values-popover__heading">{date} {tz}</span>
                        <span className="graph-values-popover__close sidebar-popover__close">
                            <a href="" onClick={this.handleCloseTooltipClick}><i className="fa fa-close"></i></a>
                        </span>
                        <ul className="graph-values-popover__list">
                            {allItems}
                        </ul>
                    </div>
                </div>
                   );
            tooltip = newTooltip;
            return tooltip;

        } else {
	
            return null;
        }

    },

    _formatZero ( value ) {
        if ( value == 1e-9 ) {
            return 0;
        }
        return value;

    },

    _formatToolTipLossValue( value, format ) {
        if ( typeof format == "undefined" ) {
            format = "float";
        }
        if ( typeof value == "undefined" ) {
            return null;
        }

        // Horrible hack; values of 0 are rewritten to 1e-9 since our log scale
        // can't handle zeroes
        value = this._formatZero( value );
        if ( value > 0 ) {
            if ( format == "integer" ) {
                value = Math.floor( value );
            } else if ( format == "percent" ) {
                value = parseFloat( (value * 100).toPrecision(4) );
            } else if ( format == "floatshort" ) {
                value = parseFloat( value.toPrecision(4) );
            } else {
                value = parseFloat( value.toPrecision(6) );

            }
        }
        value = this._removeExp( value );
        return value;
    },

    _removeExp( val ) {
        val += "";
        if ( ( val ).includes("e") ) {
            var arr = val.split('e');
            var precision = Math.abs(arr[1]);
            var num = arr[0].split('.');
            precision += num[1].length;

            val = (+val).toFixed(precision);
        }

        return val;

    },

    compareToolTipData( a, b ) {
        a = a.sortKey;
        b = b.sortKey;
        // Hack to show ping loss after owamp loss
        a = a.replace(/-bidir/, "z-bidir");
        b = b.replace(/-bidir/, "z-bidir");
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    },

    handleTrackerChanged(trackerVal, selection) {
        if ( !this.state.lockToolTip ) {
            this.setState({tracker: trackerVal});
        }
        if ( trackerVal !== null ) {
            this.setState({showHoverDots: true});
        } else {
            //this.setState({showHoverDots: false});

        }
    },

    withinTime( ts1, ts2, range ) {
        if ( Math.abs( ts1 - ts2 ) < range ) {
            return true;
        } else {
            return false;
        }

    },

    getTrackerData() {
        let tracker = this.state.tracker;
        let trackerData = [];

        if ( tracker != null && typeof charts != "undefined" ) {

            trackerValues = {};

            for ( let type in charts) {
                let data = charts[type].data;
                if ( data.length == 0 ) {
                    continue;
                }
                trackerValues[type] = {};

                for(let i in data) {
                    let row = data[i];
                    if ( typeof( row ) == "undefined" || 
                         typeof ( row.values ) == "undefined" || 
                         typeof( row.values.range() ) == "undefined" || 
                         typeof( row.values.range().begin() ) == "undefined" 
                       ) {

                           continue;
                    }

	                let range = row.values.range();
                    let begin = +range.begin();
                    let end = +range.end();
                    let slip = 0.05 * ( end - begin );
                    // begin doesn't seem to need the slip, since it snaps left
                    //begin = begin - slip;
                    end = end + slip;
                    if ( ( row.properties.eventType != "failures" ) &&
                         ( row.properties.eventType != "packet-retransmits" ) &&
                         ( begin > +tracker || end < +tracker ) ) {
                        continue;
                    }

                    let valAtTime = row.values.atTime( tracker );
                    let value;
                    if ( typeof valAtTime != "undefined" ) {
                        value = valAtTime.value();
                    } else {
                        //continue;
                        value = 0;
                    }

                    let eventType = row.properties.eventType;
                    let direction = row.properties.direction;
                    let protocol = row.properties.protocol;

                   if ( typeof protocol == "undefined" ) {
                        protocol = "";
                    }

                    let time = valAtTime.timestamp();
                    if ( eventType == "packet-retransmits" ) {
                        // retrieve the trans instead of value
                        value = valAtTime.value("retrans");
                        if ( Math.abs( time - tracker ) > slip / 2 ) {
                            continue;
                        }

                    }

                    let sortKey = eventType + protocol + direction;


                    let ipv = "ipv" + row.properties.ipversion;
                    sortKey += "tracker";
                    let name = type + ipv + "tracker";
                    //let time = +tracker;
                    if ( typeof trackerValues[type][ipv] == "undefined" ) {
                        trackerValues[type][ipv] = [];
                    }
                    let td = {
                            name: name,
                            columns: ["time", "value"],
                            points: [[time, +value]]
                    };
                    let timeseries =  new TimeSeries ( td );
                    let out = {
                        properties: row.properties,
                        data: timeseries,
                        sortKey: sortKey
                    };

                    if ( row.properties.eventType != "packet-retransmits" ) {
                        trackerValues[type][ipv].push( out );
                    }

                    out = {
                        properties: row.properties,
                        value: value,
                        sortKey: sortKey
                    };

                    let error = undefined;
                    if ( row.properties.eventType == "failures" ) {
                        error = valAtTime.value( "errorText" );
                        let errorObj;
                        if ( typeof error != "undefined" ) {
                            out.error = error;
                            out.ts = valAtTime.timestamp();
                        } else {
                            // TODO: fix what happens when the error is undefined
                            //delete out.error;
                        }
                   }

                    trackerData.push( out );

                }


            }

            //trackerData = trackerValues;

        } else {
            //this.setState({showHoverDots: false});

        }

        return trackerData;

    },


    renderChart() {


        if ( this.state.initialLoading ) {
            return null;
        }

        const highlight = this.state.highlight;

        const selection = this.state.selection;
        let selectionTime = "";
        if ( typeof selection != "undefined" && selection !== null && typeof selection.event != "undefined"  ) {
            selectionTime = selection.event.timestampAsUTCString();
        }

        let chartSeries = this.state.chartSeries;
        charts = {};
        let brushCharts = {};
        chartData = {};


        let data;
        let failureData;

        // start for loop involving unique ipversion values here?
        let unique = GraphDataStore.getUniqueValues( {"ipversion": 1} );
        let ipversions = unique.ipversion;
        if ( ( typeof ipversions ) != "undefined" ) {
            for (let h in typesToChart) {
                let eventType = typesToChart[h];
                var type = eventType.name;
                let label = eventType.label;
                let esmondName = eventType.esmondName || type;
                let stats = {};
                let brushStats = {};

              for( var i in ipversions ) {
                    var ipversion = ipversions[i];
                    var ipv = "ipv" + ipversion;

                    // Get throughput data and build charts
                    if ( ! ( type in charts ) ) {
                        charts[type] = {};
                        charts[type].stats = {};
                    } else {
                        stats = charts[type].stats;
                    }

                    if ( ! ( type in brushCharts) ) {
                        brushCharts[type] = {};
                    }

                    // for now, we'll reuse 'stats' for brushCharts as well since they 
                    // should be the same
                    brushStats = stats;

                    charts[type].chartRows = [];
                    if ( typeof charts[type].data == "undefined" ) {
                        charts[type].data = [];
                    }
                    brushCharts[type].chartRows = [];

                    // Initialize ipv and axes for main charts
                    if ( ! ( ipv in charts[type] ) ) {
                        charts[type][ipv] = [];
                    }
                    if ( ! ( "axes" in charts[type][ipv] ) )  {
                        charts[type][ipv].axes = [];
                    }

                    // Initialize ipv and axes for brush charts
                    if ( ! ( ipv in brushCharts[type] ) ) {
                        brushCharts[type][ipv] = [];
                    }
                    if ( ! ( "axes" in brushCharts[type][ipv] ) )  {
                        brushCharts[type][ipv].axes = [];
                    }

                    let filter = {
                        eventType: esmondName,
                        ipversion: ipversion
                    };

                    let failuresFilter = {
                        eventType: "failures",
                        mainEventType: esmondName,
                        ipversion: ipversion
                    };

                    data = GraphDataStore.getChartData( filter, this.state.itemsToHide );

                    let eventTypeStats = GraphDataStore.eventTypeStats;

                    if ( this.state.active[type] && ( data.results.length > 0 ) ) {
                        for(let j in data.results) {
                            let result = data.results[j];
                            let series = result.values;
                            let properties = result.properties;
                            let key = properties["metadata-key"];
                            let ipversion = properties.ipversion;
                            let direction = properties.direction;

                    // get retrans values
                    let retransFilter = {
                        eventType: "packet-retransmits",
                        ipversion: ipversion,
                        "metadata-key": key,
                        direction: direction

                    };

                    charts[type].data.push( result );

                    // skip packet-count-lost and packet-count-sent
                            if ( esmondName != "packet-count-sent"
                                    && esmondName != "packet-count-lost"
                                    && esmondName != "packet-count-lost-bidir"
                                    && esmondName != "packet-retransmits"
                                    ) {

                                stats.min = GraphDataStore.getMin( data.stats.min, stats.min );
                                stats.max = GraphDataStore.getMax( data.stats.max, stats.max );

                            } else {
                                if ( esmondName != "packet-retransmits" ) {
                                    continue;
                                } else {
                                    if ( (typeof stats.max == "undefined") 
                                            && (typeof eventTypeStats["packet-retransmits"].max != "undefined" ) ) {
                                        stats.max = eventTypeStats["packet-retransmits"].max;
                                        if ( stats.max = 1e-9 ) {
                                            stats.max = 0.1;
                                        }
                                        stats.min = 1e-9;
                                    }

                                }

                            }

 					// end of skip packet-count-lost and packet-count-sent

					// if packet-retransmits    
                            if ( esmondName == "packet-retransmits" ) {

                                charts[type][ipv].push(
                                        <ScatterChart
                                            key={type + "retrans" + Math.floor( Math.random() )}
                                            axis={"axis" + type}
                                            series={series}
                                            style={getChartStyle( properties )} smooth={false} breakLine={true}
                                            radius={4.0}
					    		columns={ [ "value" ] }
                                            highlighted={this.state.highlight}
                                        />

                                        );
             		// end if packet-retransmits - will not do else condition             
							} else {

                    // push all but packat-retransmits to charts for the main charts

                                // push the charts for the main charts
                                charts[type][ipv].push(
                                        <LineChart key={type + Math.floor( Math.random() )}
                                        axis={"axis" + type} series={series}
                                        style={getChartStyle( properties )} smooth={false} breakLine={true}
                                        min={0}
                                        onClick={this.handleClick}
                                        columns={[ "value" ]} />
                                        );

                                // Push additional layers to circle selected points

                                if ( this.state.showHoverDots ) {
                                    let hideDotTypes = [
                                        "packet-count-sent",
                                        "packet-count-lost",
                                        "packet-count-sent-bidir",
                                        "packet-count-lost-bidir"
                                    ];
                                    if ( typeof trackerValues[type] != "undefined" 
                                            && typeof trackerValues[type][ipv] != "undefined" ) {
                                        TRACKERVALUES:
                                        for(var d in trackerValues[type][ipv]) {
                                            if (typeof trackerValues[type][ipv] == "undefined" 
                                                    || esmondName != trackerValues[type][ipv][d].properties.eventType ) {
                                                continue;

                                            }

                                            if ( _.contains( hideDotTypes, trackerValues[type][ipv][d].properties.eventType ) ) {
                                                    continue TRACKERVALUES;

                                            }

                                            let trackerSeries = trackerValues[type][ipv][d].data;

                                            charts[type][ipv].push(
                                                    <ScatterChart
                                                    key={type + "hover" + Math.floor( Math.random() )}
                                                    axis={"axis" + type}
                                                    series={trackerSeries}
                                                    style={getChartStyle( properties )}
                                                    radius={4.0}
                                                    columns={ [ "value" ] }
                                                    />
                                                    );
                                            }
                                        }

                                    }

                            }
                        }
                        charts[type].stats = stats;


                    }

                    failureData = GraphDataStore.getChartData( failuresFilter, this.state.itemsToHide );


                    if ( this.state.active["failures"] && ( failureData.results.length > 0 ) ) {
                        for(let j in failureData.results) {
                            let result = failureData.results[j];
                            var failureSeries = result.values;
                            let properties = result.properties;
                            var scaledSeries = GraphDataStore.scaleValues( failureSeries, stats.max );
                            failureSeries = scaledSeries;

                            // push the charts for the main charts
                            charts[type][ipv].push(
                                <ScatterChart
                                    key={type + "failures + Math.Floor( Math.random() )"}
                                    axis={"axis" + type}
                                    series={failureSeries}
                                    style={failureStyle}
                                    radius={4.0}
                                    columns={ [ "value" ] }
                                    infoHeight={100}
                                    infoWidth={200}
                                    //infoStyle={infoStyle}
                                    min={failureData.stats.min}
                                    max={failureData.stats.max}
                                    //onSelectionChange={this.handleSelectionChanged}
                                    selected={this.state.selection}
                                    //onMouseNear={this.handleMouseNear}
                                    //onClick={this.handleClick}
                                    highlighted={this.state.highlight}
                                />
                            );
                        }

                    }
                }
            }

            for (let g in subtypesToChart) {

                let subEventType = subtypesToChart[g];
                let subType = subEventType.name;
                let subLabel = subEventType.label;
                let subEsmondName = subEventType.esmondName || subType;

                for( var k in ipversions ) {
                    let subipversion = ipversions[k];
                    let subipv = "ipv" + subipversion;

                    // Get subtype data and DON'T build additional charts
                    if ( ! ( subType in charts ) ) {
                        charts[subType] = {};
                    } 

                    if ( typeof charts[subType].data == "undefined" ) {
                        charts[subType].data = [];
                    }

                    // Initialize subipv and axes for main charts
                    if ( ! ( subipv in charts[subType] ) ) {
                        charts[subType][subipv] = [];
                    }


                    let filter = {
                        eventType: subEsmondName,
                        ipversion: subipversion
                    };
                    let failureFilter = {
                        eventType: subEsmondName,
                        ipversion: subipversion
                    };

                    data = GraphDataStore.getChartData( failureFilter, this.state.itemsToHide );
                    if ( this.state.active[subType] && ( data.results.length > 0 ) ) {
                        charts[subType].data = charts[subType].data.concat( data.results );

                    }
                }
            }

            // Create chartRows/brushRows

            // create a cache object, mostly so we can avoid displaying
            // latency twice, since it's in typesToChart twice
            var chartRowsShown = {};
            for (var m in typesToChart) {
                var eventType = typesToChart[m];
                var type = eventType.name;
                var label = eventType.label;
                var unit = eventType.unit;
                var esmondName = eventType.esmondName;
                for( var i in ipversions ) {
                    var ipversion = ipversions[i];
                    var ipv = "ipv" + ipversion;

                    if ( chartRowsShown[type + ipv] === true ) {
                        continue;
                    }

                    var chartArr = charts[type][ipv];

                    var format = ".2s";

                    var max = charts[type].stats.max;

                    if ( type == "latency" ) {
                        label += " ms";
                    } else if ( type == "loss" ) {
                        format = ".1f";
                        label += " %";
                        if ( max == 0 || max == 1e-9 ) {
                            max = 0.05;

                        }
                        if ( charts[type].stats.max < 10 ) {
                            format = ".2f";
                        }

                    }
		
		    var visibleType = true;

			if(type == "latency"){
				visibleType = this.props.showLat;
			}
			else if(type == "loss"){
				visibleType = this.props.showPac;
			}
  			else if(type == "tpt"){  
			visibleType =  this.props.showTpt;
			}
			else{
				visibleType = this.props.showRes;
			}	
			
			charts[type].chartRows.push(
                           <ChartRow height={chartRow.height} debug={false} visible={visibleType}>
                                <YAxis
                                    key={"axis" + type}
                                    id={"axis" + type}
                                    label={label + " (" + ipv + ")"}
                                    style={axisLabelStyle}
                                    labelOffset={offsets.label}
                                    className="yaxis-label"
                                    format={format}
                                    min={0}
                                    max={max}
                                    width={80} type="linear" align="left" />
                                <Charts>
                                {charts[type][ipv]}
                                <Baseline axis={"axis" + type} style={baselineStyle} value={max} position="right"/>
                                </Charts>
                           </ChartRow>
		            );

                    if ( this.state.showBrush === true ) {
                        // push the chartrows for the brush charts
                        brushCharts[type].chartRows.push(
                            <ChartRow
                                    height={chartRow.brushHeight}
                                    debug={false}
                                    key={"brush" + type}
                            >
                                <Brush
                                    timeRange={this.state.brushrange}
                                    onTimeRangeChanged={this.handleTimeRangeChange}
                                    allowSelectionClear={true}
                                />
                                <YAxis 
                                    key={"brush_axis" + type}
                                    id={"brush_axis" + type}
                                    label={label + " " + unit + " (" + ipv + ")"}
                                    style={axisLabelStyle}
                                    labelOffset={offsets.label}
                                    format=".2s"
                                    min={brushCharts[type].stats.min}
                                    max={brushCharts[type].stats.max}
                                    width={80} type="linear" align="left" />
                                    <Charts>
                                        {brushCharts[type][ipv]}
                                    </Charts>
                            </ChartRow>
                        );

                    }
                    chartRowsShown[type + ipv] = true;


                }
            }
        }

        var timerange;

        if (chartSeries) {
            timerange = this.state.timerange;
        }

        if ( ! timerange ) {
            return null; // ( <div>Error: No timerange specified.</div> );
        }

        if ( Object.keys( charts ) == 0 ) {
            if ( !this.state.loading && !this.state.initialLoading && this.state.dataloaded ) {
                return ( <div>No data found for this time range.</div> );

            } else { 
                return ( <div></div> );
            }
        } 

        return (
            <div
                onMouseMove={this.handleMouseMove}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                ref="graphDiv"
            >
                <Resizable>
                    <ChartContainer
                        timeRange={this.state.timerange}
                        trackerPosition={this.state.tracker}
                        onTrackerChanged={this.handleTrackerChanged}
                        enablePanZoom={true}
                        onTimeRangeChanged={this.handleTimeRangeChange}
                        onBackgroundClick={this.handleClick}
                        minTime={this.state.initialTimerange.begin()}
                        maxTime={this.state.initialTimerange.end()}
                        minDuration={10 * 60 * 1000}
                        id="mainChartContainer"
                    >
         			{charts.throughput.chartRows}
                    {charts["loss"].chartRows}
                    {charts["latency"].chartRows}
 					{charts["response"].chartRows}
                </ChartContainer>
            </Resizable>

            {this.renderBrush( brushCharts )}
            </div>
        );

    },

    handleActiveChange(key, disabled) {
        const active = this.state.active;
        active[key] = !disabled;
        this.setState({active});
    },

    renderError() {
        const data = this.state.dataError;
        let msg;
        if ( typeof data.responseJSON != "undefined" && data.responseJSON.detail != "undefined" ) {
            msg = data.responseJSON.detail;
        } else if ( typeof data.responseText != "undefined" ) {
            msg = data.responseText;
        } else {
            msg = "An unknown error occurred";

        }
        return (
                <div>
                <h3>Error loading data</h3>
                    <span className="alert-small-failure">
                        <i className="fa fa-exclamation-triangle"></i>
                         <b>Error retrieving data</b>
                         <p>{msg}</p>
                    </span>
                </div>
               );

    },


    render() {
        if ( this.state.dataError ) {
            return this.renderError();
        }

        const legend = [
            {
                key: "throughput",
                label: "Forward",
                disabled: !this.state.active.throughput,
                style: {
                    backgroundColor: scheme.connections,
                    stroke: scheme.requests
                }
            },{
                key: "reverse",
                label: "Reverse",
                disabled: !this.state.active.reverse,
                style: {
                    backgroundColor: scheme.requests,
                    stroke: scheme.connections,
                    strokeDasharray: "4,2"
                }
            }
        ];


        return (
		
            <div>
                {this.renderLoading()}
                {this.renderToolTip()}
                {this.renderChart()}
            </div>

        );
    },

    renderLoading() {
        let display = "none";
        if ( this.state.loading || this.state.initialLoading || !this.state.dataloaded ) {
            display = "block";
            return (
                <div id="loading" display={display}>
                    <div id="circularG">
                        <div id="circularG_1" className="circularG">
                        </div>
                        <div id="circularG_2" className="circularG">
                        </div>
                        <div id="circularG_3" className="circularG">
                        </div>
                        <div id="circularG_4" className="circularG">
                        </div>
                        <div id="circularG_5" className="circularG">
                        </div>
                        <div id="circularG_6" className="circularG">
                        </div>
                        <div id="circularG_7" className="circularG">
                        </div>
                        <div id="circularG_8" className="circularG">
                        </div>
                    </div> 
                    <h4>Loading ...</h4>
                </div>

                );
        } else {
            return null;
        }

    },

    handleTimeRangeChange(timerange) {
        if (timerange) {
            this.setState({timerange, brushrange: timerange});
        } else {
            this.setState({timerange: this.state.initialTimerange, brushrange: null});
        }
    },
   
    handleCloseTooltipClick( event ) {
        event.preventDefault();
        this.setState({ lockToolTip: false, tracker: null });

    },

    renderBrush( brushCharts ) {
        if ( this.state.showBrush === false ) {
            return( <div></div> );

        }
        return (
                <div className="rowg">
                    <div className="col-md-12" style={brushStyle} id="brushContainer">
                        <Resizable>

                <ChartContainer
                    timeRange={this.state.initialTimerange}
                    trackerPosition={this.state.tracker}
                    className="brush"
                >
                    {brushCharts.throughput.chartRows}
                    {brushCharts["packet-loss-rate"].chartRows}
                    {brushCharts["latency"].chartRows}
                </ChartContainer>

                        </Resizable>
                    </div>
                </div>
               );
    },

    updateChartData: function() {
        let newChartSeries = GraphDataStore.getChartData();

        if ( this.state.initialLoading ) {
            this.setState({ chartSeries: newChartSeries, initialLoading: false, loading: true } );
        } else if ( this.state.loading && newChartSeries.results.length == 0 )  {
            this.setState({ chartSeries: newChartSeries, loading: false, dataloaded: false, dataError: false } );
        } 
        else {
            this.setState( {dataloaded: true, chartSeries: newChartSeries, loading: false} );

        }
    },

    componentDidMount: function() {

        let src = this.props.src;
        let dst = this.props.dst;
        let start = this.state.start;
        let end = this.state.end;
        let tool = this.props.tool;
        let ipversion = this.props.ipversion;
        let agent = this.props.agent;
        let displaysetsrc = this.props.displaysetsrc;
        let displaysetdest = this.props.displaysetdest;
	let summaryWindow = this.props.summaryWindow;

        let params = {
            tool: tool,
            ipversion: ipversion,
            agent: agent
        };
        this.setState({params: params, loading: true, initialLoading: true});
        let ma_url = this.props.ma_url || location.origin + "/esmond/perfsonar/archive/";
        let ma_url_reverse = this.props.ma_url_reverse || ma_url;
        this.getDataFromMA(src, dst, displaysetsrc, displaysetdest, start, end, ma_url, ma_url_reverse, params, summaryWindow);

    },

    getMetaDataFromMA: function() {

    },

    getDataFromMA: function(src, dst, displaysetsrc, displaysetdest, start, end, ma_url, ma_url_reverse, params, summaryWindow ) {
        this.setState({loading: true, dataloaded: false});

        GraphDataStore.subscribe(this.updateChartData);

        GraphDataStore.subscribeError(this.dataError);

        GraphDataStore.subscribeEmpty(this.dataEmpty);

        // If there are no parameters, we haven't filled them in yet so we don't make the call
        if ( typeof params != "undefined" ) {
            GraphDataStore.getHostPairMetadata( src, dst, displaysetsrc, displaysetdest, start, end, ma_url, ma_url_reverse, params, summaryWindow );
        }
    },
    dataError: function() {
        let data = GraphDataStore.getErrorData();
        console.log("Request failed, status code:", data.status, data.responseText, data.statusText);
        this.setState({dataError: data, loading: false});

    },
    dataEmpty: function() {
        let data = {};
        data.responseJSON = {};
        data.responseJSON.detail = "No data found in the measurement archive";
        this.setState({dataError: data, loading: false});
        //console.log("Handling empty data");

    },
    componentWillReceiveProps( nextProps ) {
        let timerange = new TimeRange([nextProps.start * 1000, nextProps.end * 1000 ]);
        this.setState({itemsToHide: nextProps.itemsToHide, initialLoading: false});
        if ( nextProps.start != this.state.start || nextProps.end != this.state.end ) {
            let displaysetsrc = this.props.displaysetsrc;
            let displaysetdest = this.props.displaysetdest;
            this.setState({start: nextProps.start, end: nextProps.end, chartSeries: null, timerange: timerange, brushrange: null, initialTimerange: timerange, summaryWindow: nextProps.summaryWindow , loading: true, dataloaded: false, initialLoading: false, dataError: false, lockToolTip: false});
            this.getDataFromMA(nextProps.src, nextProps.dst, displaysetsrc, displaysetdest, nextProps.start, nextProps.end, nextProps.ma_url, nextProps.ma_url_reverse, this.state.params, nextProps.summaryWindow);
        } else {
            GraphDataStore.toggleType( nextProps.itemsToHide) ;

        }
    },

    componentWillUnmount: function() {
        this.serverRequest.abort();
        GraphDataStore.unsubscribe( this.updateChartData );
        GraphDataStore.unsubscribeError(this.dataError);
        GraphDataStore.unsubscribeEmpty(this.dataEmpty);
    },
    handleHiddenItemsChange: function( options ) {
        this.toggleType( options );

    },
    toggleType: function( options, event ) {
        //event.preventDefault();
        GraphDataStore.toggleType( options );

    },

    getTool( row ) {
        let tool;
        tool = row.properties["tool-name"];

        if ( typeof tool != "undefined" && tool != "") {
            tool = tool.replace(/^pscheduler\//, "");

            // We don't include the tool if it's "ping" because this is redundant
            // with the test type
            if ( tool == "ping" ) {
                return "";
            }

            tool = " [" +  tool + "]";
        } else {
            tool = "";
        }

        return tool;
    },

    getTestParam( row, test ) {
        let testParam;
	testParam = row.properties[test];

        if ( typeof testParam == "undefined" || testParam == "" ) {
            testParam = "";
        }

        return testParam;
    },


    getProtocol( row ) {
        let protocol = "";

        if ( typeof row != "undefined" && typeof row.properties.protocol != "undefined" ) {
            protocol = " (" + row.properties.protocol.toUpperCase() + ")";
        }

        return protocol;
    },

    checkEventType: function ( eventType, direction ) {
        return this.state.chartSeries 
            && this.state.chartSeries[ eventType ]
            && ( direction === null || this.state.chartSeries[ eventType ][ direction ] );
    }
});

