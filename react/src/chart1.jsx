import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
import GraphDataStore from "./GraphDataStore";
import GraphUtilities from "./GraphUtilities";
import d3 from "d3";

import { AreaChart, Brush, Charts, ChartContainer, ChartRow, YAxis, LineChart, ScatterChart, Highlighter, Resizable, Legend, styler } from "react-timeseries-charts";

import { TimeSeries, TimeRange, Event } from "pondjs";

import SIValue from "./SIValue";
import "./chart1.css";
import ChartLayout from "./chartLayout.jsx";
import "../css/graphs.css";
import "../../toolkit/web-ng/root/css/app.css";
import "../css/spinner.css";

let charts;
let chartData;
let tooltip = null;

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
    }
];

const subtypesToChart = [
    {
        name: "failures",
        label: "Failures"
    }
];


const scheme = {
    tcp: "#0076b4", // blue
    udp: "#cc7dbe", // purple
    ipv4: "#e5a11c", // yellow
    ipv6: "#633", // brown
    throughput: "#0076b4", // blue
    throughputTCP: "#0076b4", // blue
    //"packet-retransmits": "#56b4e9", // light blue
    "packet-retransmits": "#cc7dbe", // purple
    "packet-loss-rateLatency": "#2b9f78", // green
    "histogram-rtt": "#e5a11c", // yellow/orange
    "histogram-owdelay": "#633", // brown
    "packet-loss-rate": "#cc7dbe", // purple
    "packet-loss-rateThroughput": "#cc7dbe", // purple
    "packet-loss-ratePing": "#e5801c", // browny orangey
    //"packet-loss-ratePing": "#f0e442", // yellow
    //"packet-loss-rateThroughput": "#f0e54b" // yellos
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

       //console.log("style options", options);
    switch ( options.eventType ) {
        case "throughput":
            if ( options.protocol == "tcp" ) {
                color = scheme.throughputTCP;
            } else {
                color = scheme.throughputUDP;
            }
            //color = scheme.throughput;
            break;
        case "histogram-owdelay":
            // owdelay is always UDP
            color = scheme["histogram-owdelay"];
            break;
        case "histogram-rtt":
            color = scheme["histogram-rtt"];
            break;
        case "packet-loss-rate":
            if ( options.mainEventType == "throughput" ) {
                color = scheme["packet-loss-rateThroughput"];
            } else {
                color = scheme["packet-loss-rateLatency"];
            }

            //color = scheme[options.mainEventType];

            break;
        case "packet-loss-rate-bidir":
            color = scheme["packet-loss-ratePing"];
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
    //console.log("style: " , style );
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
                "packet-retransmits": true,
                "loss-latency": true

            },
            start: this.props.start,
            end: this.props.end,
            summaryWindow: this.props.summaryWindow,
            agent: this.props.agent,
            tracker: null,
            chartSeries: null,
            timerange: timerange,
            initialTimerange: timerange,
            //brushrange: TimeRange.lastDay(),
            //brushrange: TimeRange.lastSevenDays(),
            brushrange: null,
            maxLatency: 1,
            maxThroughput: 1,
            maxLoss: 0.0000000001,
            latencySeries: null,
            itemsToHide: [],
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
        };
    },
    handleSelectionChanged(point) {
        //console.log("selection changed", point);
        this.setState({
            selection: point
            //highlight: point

        });
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
            //return;
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

        //console.log( ' X Position: ' +  x_position
        //    + ' Y Position: ' + y_position );

        return { posX: x_position, posY: y_position };
    },

/*
var elem = document.getElementById('container');
elem.addEventListener('mousemove', onMousemove, false);
*/
    getToolTipPos( ) {



    },

    handleClick(e, f, g) {
        //console.log("handleClick", e, f, g);
        this.setState({
            lockToolTip: !this.state.lockToolTip
    //        highlight: point
        });
        //console.log("this.state.lockToolTip", this.state.lockToolTip, "tooltip", tooltip );
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
        let tz = GraphUtilities.getTimezone( tracker );

        let display = "block";

        if ( this.state.lockToolTip ) {
            //return tooltip;

        }

        // Something here maybe, where we need to make sure "tracker" isn't null when locking the tooltip?
        if ( ( this.state.lockToolTip || tracker != null ) && typeof charts != "undefined" ) {
            let data = this.getTrackerData();
            if ( typeof data == "undefined" ||  data.length == 0 ) {
                //return null;
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
                    filters[type] = {};
                    filters[type][ipversion] = filter;
                    if ( type == "failures" ) {
                        filters[type][ipversion] = eventTypeFilter;
                    } else if ( type == "throughput" ) {
                        filters[type][ipversion] = eventTypeFilter;

                    }

                }


            }

            let throughputItems = [];
            let lossItems = [];
            let latencyItems = [];
            let failureItems = [];

            for( let i in ipversions ) {
                let ipversion = ipversions[i];
                let throughputData = GraphDataStore.filterData( data, filters.throughput[ipversion], this.state.itemsToHide );
                throughputData.sort(this.compareToolTipData);

                for(let i in throughputData) {
                    let row = throughputData[i];
                    let key = row.properties["metadata-key"];
                    let direction = row.properties.direction;
                    let tool = this.getTool( row );

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

                    }

                    let retransLabel = "";
                    if ( ( typeof retransVal != "undefined" ) && retransVal != "" ) {
                        retransLabel += "; retrans: " + retransVal;

                    }

                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <
                    }
                    throughputItems.push(
                            <li>{dir} <SIValue value={row.value} digits={3} />bits/s ({row.properties.protocol.toUpperCase()}){retransLabel}{tool}</li>

                            );

                }

                let lossData = GraphDataStore.filterData( data, filters["loss"][ipversion], this.state.itemsToHide );

                lossData = GraphDataStore.pairSentLost( lossData );

                lossData.sort(this.compareToolTipData);
                for(let i in lossData) {
                    let row = lossData[i];
                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <

                    }
                    let label = "latency";
                    if ( row.properties.mainEventType == "histogram-rtt" ) {
                        label = "ping";
                    } else if ( row.properties.eventType == "packet-count-lost-bidir" ) {
                        label = "ping count";
                    } else if ( row.properties.mainEventType == "throughput" ) {
                        label = "UDP"
                    } else if ( row.properties.mainEventType == "histogram-owdelay" ) {
                        label = "owamp";
                    }

                    let tool = this.getTool( row );

                if ( row.properties.eventType == "packet-loss-rate" 
                     || row.properties.eventType == "packet-loss-rate-bidir" ) {
                    row.value = this._formatToolTipLossValue( row.value, "float" ) + "%";
                    row.lostValue = this._formatToolTipLossValue( row.lostValue, "integer" );
                    row.sentValue = this._formatToolTipLossValue( row.sentValue, "integer" );
                }  else {
                    continue;
                }

                let key = row.properties["metadata-key"];

                    if ( row.lostValue != null
                            && row.sentValue != null ) {
                    lossItems.push(
                            <li>{dir} {row.value} lost ({row.lostValue} of {row.sentValue} packets) {"(" + label + ")"}{tool}</li>
                            );
                    } else {
                        lossItems.push(
                                <li>{dir} {row.value} ({label}){tool}</li>
                                );

                    }

                }

                let latencyData = GraphDataStore.filterData( data, filters["latency"][ipversion], this.state.itemsToHide );
                latencyData.sort(this.compareToolTipData);
                for(let i in latencyData) {
                    let row = latencyData[i];
                    if ( typeof row.value == "undefined" ) {
                        continue;
                    }
                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <

                    }
                    let label = "(owamp)";
                    if ( row.properties.mainEventType == "histogram-rtt" ) {
                        label = "(ping)";
                    }

                    let tool = this.getTool( row );

                    let owampVal = row.value.toFixed(1);
                    if ( Math.abs( owampVal ) < 1 ) {
                        owampVal = row.value.toFixed(2);
                    }
                    if ( Math.abs( owampVal ) < 0.01 ) {
                        owampVal = row.value.toFixed(4);
                    }
                    latencyItems.push(
                            <li>{dir} {owampVal} ms {label}{tool}</li>

                            );

                }

                let failuresData = GraphDataStore.filterData( data, filters["failures"][ipversion], this.state.itemsToHide );
                //failureData.sort(this.compareToolTipData);
                if ( failuresData.length == 0 ) {
                    //failureItems = [];
                } else {
                    for(let i in failuresData) {
                        let row = failuresData[i];
                        let ts = row.ts;
                        let timeslip = 0.005;
                        let duration = this.state.timerange.duration();
                        let range = duration * timeslip;

                        if ( !this.withinTime( ts.getTime(), tracker.getTime(), range ) ) {
                            continue;
                        }

                        // TODO: we'll want to improve performance by filtering out
                        // the mainEventType "undefined" values (which represent trace etc)
                        // from the DATA, rather than display
                        if ( typeof row.properties.mainEventType == "undefined" ) {
                            continue;
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
                        failureItems.push(
                                <li>{dir} [{testType}] {prot}{row.error}</li>
                                );

                    }
                }
            }
            let posX = this.state.posX;
            let toolTipStyle = {
                left: posX + "px"

            };

            let tooltipItems = [];
            if ( throughputItems.length > 0 ) {
                tooltipItems.push(
                                    <li className="graph-values-popover__item">
                                        <ul>
                                            <li>Throughput</li>
                                            {throughputItems}
                                        </ul>
                                    </li>

                        );

            }
            if ( lossItems.length > 0 ) {
                tooltipItems.push(
                                    <li className="graph-values-popover__item">
                                        <ul>
                                            <li>Loss</li>
                                            {lossItems}
                                        </ul>
                                    </li>

                        );

            }
            if ( latencyItems.length > 0 ) {
                tooltipItems.push(
                                    <li className="graph-values-popover__item">
                                        <ul>
                                            <li>Latency</li>
                                            {latencyItems}
                                        </ul>
                                    </li>

                        );

            }

            if ( failureItems.length > 0 ) {
                tooltipItems.push(
                                    <li className="graph-values-popover__item">
                                        <ul>
                                            <li>Test Failures</li>
                                            {failureItems}
                                        </ul>
                                    </li>

                        );

            }

            let trackerTS = Math.floor( tracker / 1000 );
            if ( tooltipItems.length == 0 || ! ( trackerTS >=  this.state.start && trackerTS <= this.state.end  )  ) {
                display = "none";
                return;
            } else {
                //console.log("tooltipItems", tooltipItems);

            }

            let newTooltip =  (
            <div className="small-2 columns">
                    <div className="sidebar-popover graph-values-popover" display={display} style={toolTipStyle} ref="tooltip">
                        <span className="graph-values-popover__heading">{date} {tz}</span>
                        <span className="graph-values-popover__close sidebar-popover__close">
                            <a href="" onClick={this.handleCloseTooltipClick}><i className="fa fa-close"></i></a>
                        </span>
                        <ul className="graph-values-popover__list">
                            {tooltipItems}
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

    _formatToolTipLossValue( value, format ) {
        if ( typeof format == "undefined" ) {
            format = "float";
        }
        if ( typeof value == "undefined" ) {
            return null;
        }

        // Horrible hack; values of 0 are rewritten to 1e-9 since our log scale
        // can't handle zeroes
        if ( value == 1e-9 ) {
            value = 0;
        }  else {
            if ( format == "integer" ) {
                value = Math.floor( value );
            } else if ( format == "percent" ) {
                value = parseFloat( (value * 100).toPrecision(5) );
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
        if ( this.state.lockToolTip ) {
            //this.setState({tracker: this.state.tracker});
            //console.log("handleTrackerChanged locked; trackerVal:", trackerVal, selection);
        } else {
            //console.log("handleTrackerChanged not locked; trackerVal:", trackerVal, selection);
            //if ( trackerVal !== null ) {
                this.setState({tracker: trackerVal});
            //}

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

            for ( let type in charts) {
                let data = charts[type].data;
                if ( data.length == 0 ) {
                    continue;
                }

                for(let i in data) {
                    let row = data[i];
                    if ( typeof( row ) == "undefined" || typeof ( row.values ) == "undefined" ) {
                        continue;

                    }
                    let valAtTime = row.values.atTime( tracker );
                    let value;
                    if ( typeof valAtTime != "undefined" ) {
                        value = valAtTime.value();
                    } else {
                        continue; // TODO: fix this so it actually removes the values?
                    }

                    let eventType = row.properties.eventType;
                    let direction = row.properties.direction;
                    let protocol = row.properties.protocol;

                    if ( typeof protocol == "undefined" ) {
                        protocol = "";
                    }

                    if ( eventType == "packet-retransmits" ) {
                        // retrieve the trans instead of value
                        value = valAtTime.value("retrans");

                    }

                    if ( eventType == "packet-count-lost" && value > 1e-9 ) {
                        //console.log("packet-count-lost value", value);

                    }

                    let sortKey = eventType + protocol + direction;

                    let out = {
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

        }
        //console.log("trackerData", trackerData);
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
        //console.log("highlight", highlight, "selection", this.state.selection, selectionTime );

        let text = `Speed: - mph, time: -:--`;
        let hintValues = [];
        if (selection && selection.event) {
            let highlightText = selection.event.get("errorText");
            hintValues = [{label: "Error", value: highlightText}];
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
        //let self = this;
        if ( ( typeof ipversions ) != "undefined" ) {
            for (let h in typesToChart) {
                let eventType = typesToChart[h];
                let type = eventType.name;
                let label = eventType.label;
                let esmondName = eventType.esmondName || type;
                let stats = {};
                let brushStats = {};

                for( var i in ipversions ) {
                    let ipversion = ipversions[i];
                    let ipv = "ipv" + ipversion;

                    // Get throughput data and build charts
                    if ( ! ( type in charts ) ) {
                        charts[type] = {};
                        charts[type].stats = {};
                    } else {
                        stats = charts[type].stats;
                    }

                    if ( ! ( type in brushCharts) ) {
                        brushCharts[type] = {};
                        //brushCharts[type].stats = {};
                    } else {
                        //brushStats = brushCharts[type].stats;

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
                        //testType: type,
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
                                    //var scaledSeries = GraphDataStore.scaleValues( series, stats.max );
                                    //series = scaledSeries;

                                }

                            }

                            if ( esmondName == "packet-retransmits" ) {
                                charts[type][ipv].push(
                                        <ScatterChart
                                            key={type + "retrans" + Math.floor( Math.random() )}
                                            axis={"axis" + type}
                                            series={series}
                                            style={getChartStyle( properties )} smooth={false} breakLine={true}
                                            radius={4.0}
                                            columns={ [ "value" ] }
                                            //selected={this.state.selection}
                                            //onMouseNear={this.handleMouseNear}
                                            //onClick={this.handleClick}
                                            highlighted={this.state.highlight}
                                        />

                                        );
                            } else {

                                // push the charts for the main charts
                                charts[type][ipv].push(
                                        <LineChart key={type + Math.floor( Math.random() )}
                                        axis={"axis" + type} series={series}
                                        style={getChartStyle( properties )} smooth={false} breakLine={true}
                                        min={0}
                                        //onSelectionChange={this.handleSelectionChanged}
                                        onClick={this.handleClick}
                                        columns={[ "value" ]} />
                                        );

                            }
                        }
                        charts[type].stats = stats;


                    }

                    failureData = GraphDataStore.getChartData( failuresFilter, this.state.itemsToHide );


                    if ( this.state.active["failures"] && ( failureData.results.length > 0 ) ) {
                        for(let j in failureData.results) {
                            let result = failureData.results[j];
                            //var failureSeries = result.failureValues;
                            var failureSeries = result.values;
                            let properties = result.properties;
                            //stats.min = GraphDataStore.getMin( failureData.stats.min, stats.min );
                            //stats.max = GraphDataStore.getMax( failureData.stats.max, stats.max );
                            //stats.min = failureData.stats.min;
                            //stats.max = failureData.stats.max, stats.max;

                            // push the charts for the main charts
                            charts[type][ipv].push(
                                <ScatterChart
                                    key={type + "failures + Math.Floor( Math.random() )"}
                                    axis={"axis" + type}
                                    series={failureSeries}
                                    style={failureStyle}
                                    radius={4.0}
                                    columns={ [ "value" ] }
                                    info={hintValues}
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
                        //testType: subType,
                        ipversion: subipversion
                    };
                    let failureFilter = {
                        //eventType: "failures",
                        eventType: subEsmondName,
                        ipversion: subipversion
                    };

                    data = GraphDataStore.getChartData( failureFilter, this.state.itemsToHide );
                    if ( this.state.active[subType] && ( data.results.length > 0 ) ) {
                        charts[subType].data = data.results;

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
                        //format = ".1f";
                        label += " ms";
                    } else if ( type == "loss" ) {
                        format = ".1f";
                        label += " %";
                        if ( charts[type].stats.max < 10 ) {
                            format = ".2f";
                        }

                    } else if ( type == "throughput" ) {
                        //label += " bps"
                    }

                    // push the chartrows for the main charts
                    charts[type].chartRows.push(
                            <ChartRow height={chartRow.height} debug={false}>
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

        //console.log("charts just created", charts);

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
        console.log("updateChartData");
        let newChartSeries = GraphDataStore.getChartData();
        //this.setState({loading: false, dataloaded: true});

        if ( newChartSeries.results.length == 0 && ( this.state.initialLoading )  ) {
            //this.setState({ initialLoading: false });
            //return;

        }

        //this.setState({ chartSeries: newChartSeries, initialLoading: false, loading: false } );
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

        let summaryWindow = this.props.summaryWindow;

        let params = {
            tool: tool,
            ipversion: ipversion,
            agent: agent
        };
        this.setState({params: params, loading: true, initialLoading: true});
        let ma_url = this.props.ma_url || location.origin + "/esmond/perfsonar/archive/";
        this.getDataFromMA(src, dst, start, end, ma_url, params, summaryWindow);

    },

    getMetaDataFromMA: function() {

    },

    getDataFromMA: function(src, dst, start, end, ma_url, params, summaryWindow ) {
        this.setState({loading: true, dataloaded: false});
        //let ma_url = this.props.ma_url || location.origin + "/esmond/perfsonar/archive/";

        GraphDataStore.subscribe(this.updateChartData);

        GraphDataStore.subscribeError(this.dataError);

        GraphDataStore.subscribeEmpty(this.dataEmpty);

        // If there are no parameters, we haven't filled them in yet so we don't make the call

        if ( typeof params != "undefined" ) {
            GraphDataStore.getHostPairMetadata( src, dst, start, end, ma_url, params, summaryWindow );
        }
    },
    dataError: function() {
        let data = GraphDataStore.getErrorData();
        console.log("dataError", data);
        this.setState({dataError: data, loading: false});

    },
    dataEmpty: function() {
        let data = {};
        data.responseJSON = {};
        data.responseJSON.detail = "No data found in the measurement archive";
        this.setState({dataError: data, loading: false});
        console.log("Handling empty data");

    },
    componentWillReceiveProps( nextProps ) {
        console.log("chart1 nextProps", nextProps);
        let timerange = new TimeRange([nextProps.start * 1000, nextProps.end * 1000 ]);
        this.setState({itemsToHide: nextProps.itemsToHide, initialLoading: false});
        if ( nextProps.start != this.state.start
                || nextProps.end != this.state.end ) {
            this.setState({start: nextProps.start, end: nextProps.end, chartSeries: null, timerange: timerange, brushrange: null, initialTimerange: timerange, summaryWindow: nextProps.summaryWindow , loading: true, dataloaded: false, initialLoading: false, dataError: false, lockToolTip: false});
            this.getDataFromMA(nextProps.src, nextProps.dst, nextProps.start, nextProps.end, nextProps.ma_url, this.state.params, nextProps.summaryWindow);
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
        GraphDataStore.toggleType( options );

        //event.preventDefault();

    },

    _checkSortOrder : function( ary, valName='ts' ) {
        var lastVal = 0;
        _.each( ary, val => {
            if ( val.ts <= lastVal ) {
                console.log('ts is not greater than last ts');

            } else {
                //console.log('ts is greater than last ts');

            }
            lastVal = val.ts;


        });
    },

    getTool( row ) {
        let tool;
        tool = row.properties["tool-name"];

        if ( typeof tool != "undefined" && tool != "") {
            tool = tool.replace(/^pscheduler\//, "");
            tool = " [" +  tool + "]";
        } else {
            tool = "";
        }

        return tool;
    },

    checkEventType: function ( eventType, direction ) {
        return this.state.chartSeries 
            && this.state.chartSeries[ eventType ]
            && ( direction === null || this.state.chartSeries[ eventType ][ direction ] );
    }
});

