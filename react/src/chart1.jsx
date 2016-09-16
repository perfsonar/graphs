import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
import GraphDataStore from "./GraphDataStore";
//import Highlighter from "./highlighter";


import { AreaChart, Brush, Charts, ChartContainer, ChartRow, YAxis, LineChart, ScatterChart, Highlighter, Resizable, Legend } from "react-timeseries-charts";

import { TimeSeries, TimeRange } from "pondjs";

import SIValue from "./SIValue";
import "./chart1.css";
import ChartLayout from "./chartLayout.jsx";
import "../css/graphs.css";
import "../../toolkit/web-ng/root/css/app.css";
import "../css/spinner.css";

let charts;
let chartData;

const text = 'perfSONAR chart';

const typesToChart = [
    {
        name: "throughput",
        label: "Throughput",
        unit: "bps",
    },
    {
        name: "loss",
        esmondName: "packet-loss-rate",
        label: "Packet Loss",
        unit: "fractional",
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
    "packet-loss-rateLatency": "#2b9f78", // green
    "histogram-rtt": "#e5a11c", // yellow
    "histogram-owdelay": "#633", // brown
    "packet-loss-rate": "#cc7dbe", // purple
    "packet-loss-rateThroughput": "#cc7dbe", // purple
    //"packet-loss-rateThroughput": "#f0e54b" // yellos
    throughputUDP: "#d6641e" // vermillion
};

const failureStyle = {
    value: {
        normal: {
            fill: "red",
            opacity: 0.8,
        },
        highlighted: {
            fill: "#a7c4dd",
            opacity: 1.0,
        },
        selected: {
            fill: "orange",
            opacity: 1.0,
        },
        muted: {
            fill: "grey",
            opacity: 0.5
        }
    }
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

function getChartStyle( options ) {
    let style = {};
    style.value = {};
    let color = scheme.tcp;
    let strokeStyle = "";
    let width = 3;
    let opacity = 1;

    switch ( options.protocol ) {
        case "tcp":
            color = scheme.tcp;
            //width = 3;
            opacity = 0.8;
            break;
        case "udp":
            color = scheme.udp;
            //width = 3;
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

    }
    if ( options.direction == "reverse" ) {
        strokeStyle = "4,2";
        width = 3;
    }
    style.value.stroke = color;
    style.value.strokeWidth = width;
    style.value.strokeDasharray = strokeStyle;
    style.value.strokeOpacity = opacity;
    return style;

}

const lineStyles = {
    value: {
        stroke: scheme.udp,
        strokeWidth: 1.5
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
        strokeWidth: 1.5
    }
}

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
        return {
            markdown: text,
            active: {
                throughput: true,
                forward: true,
                reverse: true,
                "loss": true,
                latency: true,
                failures: true
            },
            //src: null,
            //dst: null,
            start: this.props.start,
            end: this.props.end,
            tracker: null,
            chartSeries: null,
            timerange: TimeRange.lastSevenDays(),
            initialTimerange: TimeRange.lastSevenDays(),
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
        };
    },
    handleSelectionChanged(point) {
        this.setState({
            selection: point,
            highlight: point

        });
    },

    handleMouseMove(event, point) {
        let { clientHeight, clientWidth } = this.refs.graphDiv;
        let posX = clientWidth - event.pageX;
        if ( typeof this.refs.tooltip == "undefined" ) {
            return;
        }
        let { toolTipWidth, toolTipHeight } = this.refs.tooltip;
        //let offsetX = toolTipWidth;
        let offsetX = Math.floor( clientWidth * 0.18 );
        if ( posX < 0.25 * clientWidth ) {
            posX += offsetX / 4;
        } else {
            posX -= offsetX;
        }
        this.setState({posX: posX});

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
        let dateFormat = "MM/DD/YYYY HH:mm:ss ZZ";
        let date =  moment( tracker ).format(dateFormat);

        let display = "block";

        if ( tracker != null && typeof charts != "undefined" ) {
            let data = this.getTrackerData();
            if ( data.length == 0 ) {
                //return null;
                display = "none";
            } else {
                display = "block";
            }

            let unique = GraphDataStore.getUniqueValues( {"ipversion": 1} );
            let ipversions = unique.ipversion;
            let filters = {};
            for( let i in ipversions ) {
                for (let h in typesToChart) {
                    let eventType = typesToChart[h];
                    let type = eventType.name;
                    let label = eventType.label;
                    let esmondName = eventType.esmondName || type;
                    let ipversion = ipversions[i];
                    let ipv = "ipv" + ipversion;
                    let filter = { testType: type, ipversion: ipversion };

                    filters[type] = {};
                    filters[type][ipversion] = filter;
                }


            }

            let throughputItems = [];
            let lossItems = [];
            let latencyItems = [];
            for( let i in ipversions ) {
                let ipversion = ipversions[i];
                let throughputData = GraphDataStore.filterData( data, filters.throughput[ipversion], this.state.itemsToHide );
                throughputData.sort(this.compareToolTipData);

                for(let i in throughputData) {
                    let row = throughputData[i];
                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <
                    }
                    throughputItems.push(
                            <li>{dir} <SIValue value={row.value} digits={3} />bits/s ({row.properties.protocol.toUpperCase()})</li>

                            );

                }



                let lossData = GraphDataStore.filterData( data, filters["loss"][ipversion], this.state.itemsToHide );
                lossData.sort(this.compareToolTipData);
                for(let i in lossData) {
                    let row = lossData[i];
                    let dir = "-\u003e"; // Unicode >
                    if ( row.properties.direction == "reverse" ) {
                        dir = "\u003c-"; // Unicode <

                    }
                    let label = "one-way";
                    if ( row.properties.mainEventType == "histogram-rtt" ) {
                        label = "ping";
                    } else if ( row.properties.mainEventType == "throughput" ) {
                        label = "throughput"

                    }
                    lossItems.push(
                            <li>{dir} {row.value.toPrecision(4)}  {"(" + label + ")"} </li>

                            );

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
                    let label = "one-way";
                    if ( row.properties.mainEventType == "histogram-rtt" ) {
                        label = "ping";
                    }
                    latencyItems.push(
                            <li>{dir} {row.value.toPrecision(4)} ms  {"(" + label + ")"} </li>

                            );

                }
            }
            let posX = this.state.posX;
            let toolTipStyle = {
                right: posX + "px"

            };

            return (
            <div className="small-2 columns">
                <div className="sidebar-popover graph-values-popover" display={display} style={toolTipStyle} ref="tooltip">
                                    <span className="graph-values-popover__heading">{date}</span>
                                    <ul className="graph-values-popover__list">
                                        <li className="graph-values-popover__item">
                                            <ul>
                                            <li>Throughput</li>
                                            {throughputItems}
                                            </ul>
                                        </li>
                                        <li className="graph-values-popover__item">
                                            <ul>
                                            <li>Loss</li>
                                            {lossItems}
                                            </ul>
                                        </li>
                                        <li className="graph-values-popover__item">
                                            <ul>
                                            <li>Latency</li>
                                            {latencyItems}
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                </div>
                   );

        } else {
            return null;
        }

    },

    compareToolTipData( a, b ) {
        if (a.sortKey < b.sortKey)
            return -1;
        if (a.sortKey > b.sortKey)
            return 1;
        return 0;
    },

    handleTrackerChanged(trackerVal, selection) {
        this.setState({tracker: trackerVal});
    },

    getTrackerData() {
        let tracker = this.state.tracker;
        let trackerData = [];

        if ( tracker != null && typeof charts != "undefined"  ) {

            for ( let type in charts) {
                let data = charts[type].data;
                if ( data.length == 0 ) {
                    continue;
                }

                for(let i in data) {
                    let row = data[i];
                    let valAtTime = row.values.atTime( tracker );
                    let value;
                    if ( typeof valAtTime != "undefined" ) {
                        value = valAtTime.value();
                    } else {
                        continue;
                    }

                    let eventType = row.properties.eventType;
                    let direction = row.properties.direction;
                    let protocol = row.properties.protocol;

                    let sortKey = eventType + protocol + direction;

                    let out = {
                        properties: row.properties,
                        value: value,
                        sortKey: sortKey
                    };
                    trackerData.push( out );

                }


            }

        }
        return trackerData;

    },


    renderChart() {
        const highlight = this.state.highlight;

        let text = `Speed: - mph, time: -:--`;
        let hintValues = [];
        if (highlight) {
            let highlightText = highlight.event.get("errorText");
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

                    /*
                    itemsToHide = [
                        {
                            eventType: "throughput",
                            protocol: "tcp"
                        }
                    ];
                    */
                    if ( this.props.tool ) {

                    }
                    data = GraphDataStore.getChartData( filter, this.state.itemsToHide );
                    if ( this.state.active[type] && ( data.results.length > 0 ) ) {
                        for(let j in data.results) {
                            let result = data.results[j];
                            let series = result.values;
                            let properties = result.properties;
                            stats.min = GraphDataStore.getMin( data.stats.min, stats.min );
                            stats.max = GraphDataStore.getMax( data.stats.max, stats.max );
                            // TODO: Try changing stats
                            //stats.min = data.stats.min;
                            //stats.max = data.stats.max;

                            // push the charts for the main charts
                            charts[type][ipv].push(
                                    <LineChart key={type + Math.floor( Math.random() )}
                                        axis={"axis" + type} series={series}
                                        style={getChartStyle( properties )} smooth={false} breakLine={true}
                                        min={stats.min}
                                        max={stats.max}
                                        columns={[ "value" ]} />
                                    );
                            //for(let result in data.results ) {
                                charts[type].data.push( result );
                            //}

                            // push the brush charts, if enabled
                            if ( this.state.showBrush === true ) {
                                brushCharts[type][ipv].push(
                                        <LineChart key={"brush" + [type] + Math.floor( Math.random() )}
                                            axis={"brush_axis" + [type]} series={series}
                                            style={getChartStyle( properties )} smooth={false} breakLine={true}
                                            min={stats.min}
                                            max={stats.max}
                                            columns={[ "value" ]} />
                                        );
                                brushCharts[type].stats = stats;
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
                                    hintValues={hintValues}
                                    hintHeight={100}
                                    hintWidth={200}
                                    min={failureData.stats.min}
                                    max={failureData.stats.max}
                                    selection={this.state.selection}
                                    onSelectionChange={this.handleSelectionChanged}
                                    //onMouseNear={this.handleMouseNear}
                                    //onClick={this.handleMouseNear}
                                    highlight={this.state.highlight}
                                />
                            );
                        }

                    }
                }
            }

            // Create chartRows/brushRows

            // create a cache object, mostly so we can avoid displaying
            // latency twice, since it's in typesToChart twice
            let chartRowsShown = {};
            for (let h in typesToChart) {
                let eventType = typesToChart[h];
                let type = eventType.name;
                let label = eventType.label;
                let unit = eventType.unit;
                let esmondName = eventType.esmondName;
                for( var i in ipversions ) {
                    let ipversion = ipversions[i];
                    let ipv = "ipv" + ipversion;

                    if ( chartRowsShown[type + ipv] === true ) {
                        continue;
                    }

                    let chartArr = charts[type][ipv];

                    // push the chartrows for the main charts
                    charts[type].chartRows.push(
                            <ChartRow height={chartRow.height} debug={false}>
                            <YAxis
                                key={"axis" + type}
                                id={"axis" + type}
                                label={label + " (" + ipv + ")"}
                                style={axisLabelStyle}
                                labelOffset={offsets.label}
                                format=".2s"
                                min={charts[type].stats.min}
                                max={charts[type].stats.max}
                                width={80} type="linear" align="left" />
                            {/*
                            <YAxis
                                key={"axis" + type + "failures"}
                                id={"axis" + type + "failures"}
                                label={"Failures (" + ipv + ")"}
                                style={failureLabelStyle}
                                labelOffset={offsets.label}
                                format=".2s"
                                min={0}
                                max={100}
                                width={0} type="linear" align="right" />
                                */}
                            <Charts>
                            {charts[type][ipv]}
                            {/*
                                {charts}
                                <ScatterChart axis="axis2" series={failureSeries} style={{color: "steelblue", opacity: 0.5}} />
                                */}
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
            return ( <div></div> );
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

    render() {

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
        console.log("rendering Loading ... state", this.state.loading);
        if ( this.state.loading ) {
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
        this.setState({ chartSeries: newChartSeries, loading: false } );
        this.forceUpdate();
    },

    componentDidMount: function() {

        let src = this.props.src;
        let dst = this.props.dst;
        let start = this.state.start;
        let end = this.state.end;
        let tool = this.props.tool;
        let params = {
            tool: tool,
        };
        let ma_url = this.props.ma_url || location.origin + "/esmond/perfsonar/archive/";
        this.getDataFromMA(src, dst, start, end, ma_url, params);

    },

    getDataFromMA: function(src, dst, start, end, ma_url, params ) {

        GraphDataStore.subscribe(this.updateChartData);

        console.log("tool", this.props.tool);
        GraphDataStore.getHostPairMetadata( src, dst, start, end, ma_url, params );
    },
    /*
    componentDidUpdate: function() {
        this.getDataFromMA();

    },
    */
    componentWillReceiveProps( nextProps ) {
        // You don't have to do this check first, but it can help prevent an unneeded render
        /*
           if (nextProps.startTime !== this.state.startTime) {
           this.setState({ startTime: nextProps.startTime });
           }
           */
        //console.log("nextProps", nextProps);
        let timerange = new TimeRange([nextProps.start * 1000, nextProps.end * 1000 ]);
        this.setState({itemsToHide: nextProps.itemsToHide});
        if ( nextProps.start != this.state.start
                || nextProps.end != this.state.end ) {
            this.setState({start: nextProps.start, end: nextProps.end, chartSeries: null, timerange: timerange, brushrange: null, initialTimerange: timerange}); 
            this.getDataFromMA(nextProps.src, nextProps.dst, nextProps.start, nextProps.end, nextProps.ma_url);
        } else {
            GraphDataStore.toggleType( nextProps.itemsToHide) ;

        }
    },

    componentWillUnmount: function() {
        this.serverRequest.abort();
        GraphDataStore.unsubscribe( this.updateChartData );
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

    checkEventType: function ( eventType, direction ) {
        return this.state.chartSeries 
            && this.state.chartSeries[ eventType ]
            && ( direction === null || this.state.chartSeries[ eventType ][ direction ] );
    }
});

function getElementOffset(element)
{
    var de = document.documentElement;
    var box = element.getBoundingClientRect();
    var top = box.top + window.pageYOffset - de.clientTop;
    var left = box.left + window.pageXOffset - de.clientLeft;
    return { top: top, left: left };
}

