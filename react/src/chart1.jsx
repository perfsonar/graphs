import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
import GraphDataStore from "./GraphDataStore";
//import Highlighter from "./highlighter";


import { AreaChart, Brush, Charts, ChartContainer, ChartRow, YAxis, LineChart, ScatterChart, Highlighter, Resizable, Legend } from "react-timeseries-charts";

import { TimeSeries, TimeRange } from "pondjs";

//import "../../toolkit/web-ng/root/css/foundation.min.css";
//import "../../toolkit/web-ng/root/css/font-awesome/css/font-awesome.min.css";
import "./chart1.css";
import ChartLayout from "./chartLayout.jsx";
import "../css/graphs.css";
import "../../toolkit/web-ng/root/css/app.css";

var throughputValues = [];
var reverseThroughputValues = [];

var latencyValues = [];
var reverseLatencyValues = [];

var lossValues = [];
var reverseLossValues = [];

var failures = [];
var row = {};
row.ts = 1460152800; //000;
row.val = 500000000; //'Generic error message 1';
failures.push(row);

row = {};
row.ts = 1460175800; //000;
row.val = 500000000; //'Generic error message 3';
failures.push(row);
row = {};

var failureSeries = null;
var failureValues = null;

var throughputSeries = null;
var reverseThroughputSeries = null;

var latencySeries = null;
var reverseLatencySeries = null;

var lossSeries = null;
var reverseLossSeries = null;

/*
var charts = [];
var latencyCharts = [];
var lossCharts = [];
*/

const text = 'perfSONAR chart';


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
                "packet-loss-rate": true,
                latency: true
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
            showBrush: false
        };
    },
    contextTypes: {
        router: React.PropTypes.func
    },

    handleTrackerChanged(trackerVal, selection) {
        this.setState({tracker: trackerVal});
    },

    renderChart() {

        let typesToChart = [
            {
                name: "throughput",
                label: "Throughput",
            },
            {
                name: "packet-loss-rate",
                label: "Packet Loss",
            },
            {
                name: "latency",
                esmondName: "histogram-owdelay",
                label: "Latency"
            },
            {
                name: "latency",
                esmondName: "histogram-rtt",
                label: "Latency"
            }
            // TODO: improve handling of multiple event types in one row
        ];
        //charts.throughput.charts = [];

        let latencyCharts = [];
        let lossCharts = [];
        let chartSeries = this.state.chartSeries;
        let charts = {};
        let brushCharts = {};

        // start for loop involving unique ipversion values here?
        let unique = GraphDataStore.getUniqueValues( {"ipversion": 1} );
        let ipversions = unique.ipversion;
        //let self = this;
        let data;
        if ( ( typeof ipversions ) != "undefined" ) {
            for (let h in typesToChart) {
                let eventType = typesToChart[h];
                let type = eventType.name;
                let label = eventType.label;
                let esmondName = eventType.esmondName;
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
                        eventType: esmondName || type,
                        ipversion: ipversion,
                        //protocol: "tcp"
                    };
                    /*
                    let itemsToHide = [
                        {
                            eventType: "throughput",
                            protocol: "tcp"
                        }
                    ];
                    */
                    data = GraphDataStore.getChartData( filter, this.state.itemsToHide );
                    if ( this.state.active[type] && ( data.results.length > 0 ) ) {
                        for(let j in data.results) {
                            let result = data.results[j];
                            let series = result.values;
                            let properties = result.properties;
                            stats.min = GraphDataStore.getMin( data.stats.min, stats.min );
                            stats.max = GraphDataStore.getMax( data.stats.max, stats.max );

                            // push the charts for the main charts
                            charts[type][ipv].push(
                                    <LineChart key={[type] + Math.floor( Math.random() )}
                                        axis={"axis" + [type]} series={series}
                                        style={getChartStyle( properties )} smooth={false} breakLine={true}
                                        min={stats.min}
                                        max={stats.max}
                                        columns={[ "value" ]} />
                                    );
                            /*
                            charts[type][ipv].push(
                                    <ScatterChart 
                                        key={[type] + "failures + Math.Floor( Math.random() )"}


                                    axis={"axis" + [type]}  series={series} style={{color: "steelblue", opacity: 0.5}} 
                                    columns={ [ "failures"] }
                                    />
                                    );
                                    */

                            if ( this.state.showBrush === true ) {
                                // push the brush charts
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
                                    label={label + " (" + ipv + ")"}
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

        latencyCharts = []; lossCharts = []; // TODO: remove - debugging only

        var timerange;

        if (chartSeries) {
            timerange = this.state.timerange;
        }

        if ( ! timerange ) {
            return ( <div></div> );
        }

        return (
            <div>
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
                    {charts["packet-loss-rate"].chartRows}
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
                <div>
                {/*
                    <div className="row">
                        <div className="col-md-12">
                            <Legend type="line" categories={legend} onChange={this.handleActiveChange}/>
                        </div>
                    </div>                    

                    <hr/>
                    */}

                    {this.renderChart()}

                    <hr/>

                </div>

            </div>
        );
    },

    handleTimeRangeChange(timerange) {
        //console.log("timerange changed", timerange.begin(), "end", timerange.end());
        //if ( timerange.begin().toString() == timerange.end().toString() ) {
        //    timerange = null;
        //}


        if (timerange) {
            this.setState({timerange, brushrange: timerange});
        } else {
            this.setState({timerange: this.state.initialTimerange, brushrange: null});
        }


       // this.setState({timerange});
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
        this.setState({ chartSeries: newChartSeries } );
        this.forceUpdate();
    },

    componentDidMount: function() {

        let src = this.props.src;
        let dst = this.props.dst;
        let start = this.state.start;
        let end = this.state.end;
        let ma_url = this.props.ma_url || location.origin + "/esmond/perfsonar/archive/";
        this.getDataFromMA(src, dst, start, end, ma_url);

        var values = this.esmondToTimeSeries( failures, 'failures' );
        failureValues = values.values;
        failureSeries = values.series;
        console.log('failure values', failureValues);
        console.log('failure series', failureSeries);
    },

    getDataFromMA: function(src, dst, start, end, ma_url ) {

        GraphDataStore.subscribe(this.updateChartData);

        GraphDataStore.getHostPairMetadata( src, dst, start, end, ma_url );
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
            //GraphDataStore.subscribe(this.updateChartData);

        }
        //this.forceUpdate();
    },

    componentWillUnmount: function() {
        this.serverRequest.abort();
        GraphDataStore.unsubscribe( this.updateChartData );
    },
    handleHiddenItemsChange: function( options ) {
        //this.setState( options );
        //this.forceUpdate();
        //this.props.updateHiddenItems( options );
        this.toggleType( options );
        //emitter.emit("timerangeChange");

    },
    toggleType: function( options, event ) {
        //console.log("toggleType options: ", options); //, "event", event);
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

    esmondToTimeSeries: function( inputData, seriesName ) {
        var values = [];
        var series = {};

        //this._checkSortOrder(inputData); // TODO: review: do we need this?

        var maxThroughput = this.state.maxThroughput;
        var maxLatency = this.state.maxLatency;
        var maxLoss = this.state.maxLoss;

        _.each(inputData, val => {
            const ts = val["ts"];
            const timestamp = new moment(new Date(ts * 1000)); // 'Date' expects milliseconds
            var value = val["val"];
            if ( seriesName == 'latency' || seriesName == 'reverseLatency' ) {
                value = val["val"].minimum;
                maxLatency =  value > maxLatency ? value : maxLatency ;
                //console.log('maxLatency', maxLatency);
                /*(
        const active = this.state.active;
        active[key] = !disabled;
        this.setState({active});
*/

            }
            // TODO: change this section to use else if
            if ( seriesName == 'loss' || seriesName == 'reverseLoss' ) {
                maxLoss =  value > maxLoss ? value : maxLoss ;
            }
            if ( seriesName == 'throughput' || seriesName == 'reverseThroughput' ) {
                maxThroughput =  value > maxThroughput ? value : maxThroughput ;
            }
            if (value <= 0 ) {
                console.log("VALUE IS ZERO OR LESS", Date());
                value = 0.000000001;
            }
            if ( isNaN(value) ) {
                console.log("VALUE IS NaN");
            }
            values.push([timestamp.toDate().getTime(), value]);

        });
        this.setState({maxThroughput: maxThroughput});
        this.setState({maxLatency: maxLatency});
        this.setState({maxLoss: maxLoss});
        console.log('creating series ...', Date());

        series = new TimeSeries({
            name: seriesName,
            columns: ["time", "value"],
            points: values
        });
        return ( { values: values, series: series } );
    }, 
    checkEventType: function ( eventType, direction ) {
        return this.state.chartSeries 
            && this.state.chartSeries[ eventType ]
            && ( direction === null || this.state.chartSeries[ eventType ][ direction ] );
    }
});
