import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
import PSGraphData from "./PSGraphData";
//import Highlighter from "./highlighter";


import { AreaChart, Brush, Charts, ChartContainer, ChartRow, YAxis, LineChart, ScatterChart, Highlighter, Resizable, Legend } from "react-timeseries-charts";

import { TimeSeries, TimeRange } from "pondjs";

//import "../../toolkit/web-ng/root/css/foundation.min.css";
//import "../../toolkit/web-ng/root/css/font-awesome/css/font-awesome.min.css";
import "./chart1.css";
import ChartLayout from "./chartLayout.jsx";
import "../../css/graphs.css";
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

var failureMessages = [];
failureMessages[1460152800] = 'Generic error message 1';
failureMessages[1460175800] = 'Generic error message 3';

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
    requests: "#0076b4",
    connections: "#0076b4"
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
    height: 150
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
                reverse: true
            },
            //src: null,
            //dst: null,
            //start: null,
            //end: null,
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
            latencySeries: null
        };
    },
    contextTypes: {
        router: React.PropTypes.func
    },

    handleTrackerChanged(trackerVal, selection) {
        //const seconds = Math.floor( trackerVal.getTime() / 1000 );

        this.setState({tracker: trackerVal});
        /*
        if ( failureMessages[ seconds ] ) {
            console.log('failure message: ', failureMessages[ seconds ] );
        }
        */
        //this.setState({selectionType, selection});
        //return pos;
    },

    renderChart() {
        let charts = [];
        let latencyCharts = [];
        let lossCharts = [];
        let chartSeries = this.state.chartSeries;

        if ( this.state.active.throughput && this.checkEventType("throughput", "forward") ) {
            charts.push(
                <LineChart key="throughput" axis="axis2" series={chartSeries.throughput.forward} style={lineStyles} smooth={false} breakLine={true} min="{chartSeries.throughput.forward.min()}" max="{chartSeries.throughput.forward.max()}" columns={[ "value" ]} />
            );
        }
        if ( this.state.active.throughput && this.checkEventType("throughput", "reverse") ) {
            // TODO: fix this to forward instead of reverse
            charts.push(
                <LineChart key="reverseThroughput" axis="axis2" series={chartSeries.throughput.reverse} style={reverseStyles} smooth={false} breakLine={true} min="{chartSeries.throughput.reverse.min()}" max="{chartSeries.throughput.reverse.max()}" />
            );
        }
        if (this.state.active.throughput && this.checkEventType("histogram-owdelay", "forward") ) { // TODO: fix state part
            latencyCharts.push(
                <LineChart key="latency" axis="axis1" series={chartSeries["histogram-owdelay"].forward} style={lineStyles} smooth={false} breakLine={true} min={chartSeries["histogram-owdelay"].forward.min()} max={chartSeries["histogram-owdelay"].forward.max()} />
            );
        }

        if (this.state.active.reverse && this.checkEventType("histogram-owdelay", "reverse") ) { // TODO: fix state part
            latencyCharts.push(
                <LineChart key="reverseLatency" axis="axis1" series={chartSeries["histogram-owdelay"].reverse} style={reverseStyles} smooth={false} breakLine={true} min={chartSeries["histogram-owdelay"].reverse.min()} max={chartSeries["histogram-owdelay"].reverse.max()} />
            );
        }

        if (this.state.active.throughput && this.checkEventType("packet-loss-rate", "forward") ) {
            lossCharts.push(

                <LineChart key="loss" axis="lossAxis" series={chartSeries["packet-loss-rate"].forward} style={lineStyles} smooth={false} breakLine={true} />
                /*
                <ScatterChart key="loss" axis="lossAxis" series={chartSeries["packet-loss-rate"].forward} style={{color: "#2ca02c", opacity: 0.5}} />
                */
            );
        }
        if (this.state.active.reverse && this.checkEventType("packet-loss-rate", "reverse") ) {
            lossCharts.push(

                 <LineChart key="reverseLoss" axis="lossAxis" series={chartSeries["packet-loss-rate"].reverse} style={reverseStyles} smooth={false} breakLine={true} />

                /*
                <ScatterChart key="reverseLoss" axis="lossAxis" series={chartSeries["packet-loss-rate"].reverse} style={{color: "#990000", opacity: 0.5}} />
                */
        );
        }

        var timerange;
        if (throughputSeries) {
            //console.log('throughputSeries is defined');
            timerange = throughputSeries.timerange();
            //console.log('throughput timerange', timerange);
        } else if ( chartSeries && chartSeries.throughput && chartSeries.throughput.reverse ) {
            //console.log('reverseThroughputSeries is defined');
            timerange = chartSeries.throughput.reverse.timerange();
            //console.log('reverse timerange', timerange);

        }
        //this.state.timerange = timerange;
        if ( ! timerange ) {
            return ( <div></div> );
        }
        /*
        if ( this.state.initialTimerange === null ) {
            console.log("initial timerange", timerange);
            this.setState({initialTimerange: timerange});
        }
        */
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
                    >
                    {/* 
                    <div className="row collapse">
                    */}
                        <ChartRow height={chartRow.height} debug={false}>
                        {/*
                <text>Throughput</text>
                        */}
                            <YAxis id="axis2" label="Throughput"  style={axisLabelStyle}
                                labelOffset={offsets.label} min={0} format=".2s"
                                max={chartSeries.throughput.forward.max()}
                                width={80} type="linear" align="left" />
                                <Charts>
                                    {charts}
                                    {/*
                                    <ScatterChart axis="axis2" series={failureSeries} style={{color: "steelblue", opacity: 0.5}} />
                                    */}
                                </Charts>
                        </ChartRow>
                        {/*
                    </div>
                    */}
                    <ChartRow height={chartRow.height} debug={false}>
                        <YAxis id="lossAxis" label="Loss" style={axisLabelStyle}
                                labelOffset={offsets.label} 
                                min={0.000000001} format=",.4f" max={chartSeries["packet-loss-rate"].forward.max()} width="80" type="linear"/>
                        <Charts>
                            {lossCharts}
                        </Charts>
                    </ChartRow>
                    <ChartRow height={chartRow.height} debug={false}>
                        <YAxis id="axis1" label="Latency" style={axisLabelStyle}
                               labelOffset={offsets.label} min={0.000000001} format=",.4f" max={chartSeries["histogram-owdelay"].forward.max()} width="80" type="linear"/>
                        <Charts>
                            {latencyCharts}
                        </Charts>
                    </ChartRow>
                </ChartContainer>
            </Resizable>

                <div className="rowg">
                    <div className="col-md-12" style={brushStyle} id="brushContainer">
                        <Resizable>
                            {this.renderBrush()}
                        </Resizable>
                    </div>
                </div>
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


    renderBrush() {
        // TODO: update not to be hardcoded to reverse
        return (
            <ChartContainer
                timeRange={this.state.initialTimerange}
                trackerPosition={this.state.tracker}
                className="brush">
                <ChartRow height="50" debug={false}>
                    <Brush
                        timeRange={this.state.brushrange}
                        onTimeRangeChanged={this.handleTimeRangeChange}
                        allowSelectionClear={true}
                        />
                    <YAxis
                        id="brushAxis1"
                        label="Throughput"
                        min={0} max={this.state.chartSeries.throughput.forward.max()}
                        width={80} type="linear" format=".1s"/>
                    <Charts>
                        <LineChart
                            key="brushThroughput"
                            axis="brushAxis1"
                            style={lineStyles}
                            columns={["value"]}
                            series={this.state.chartSeries.throughput.forward} />
                        <LineChart
                            key="reverseBrushThroughput"
                            axis="brushAxis1"
                            style={reverseStyles}
                            columns={["value"]}
                            series={this.state.chartSeries.throughput.reverse} />
                    </Charts>
                </ChartRow>
                <ChartRow height="50" debug={false}>
                    <Brush
                        timeRange={this.state.brushrange}
                        onTimeRangeChanged={this.handleTimeRangeChange}
                        allowSelectionClear={true}
                        />
                    <YAxis
                        id="brushAxisLoss"
                        label="Loss"
                        min={0} max={this.state.chartSeries["packet-loss-rate"].forward.max()}
                        width={80} type="linear" format=".1s"/>
                    <Charts>
                        <LineChart
                            key="brushLoss"
                            axis="brushAxisLoss"
                            style={lineStyles}
                            columns={["value"]}
                            series={this.state.chartSeries["packet-loss-rate"].forward} />
                        <LineChart
                            key="reverseBrushLoss"
                            axis="brushAxisLoss"
                            style={reverseStyles}
                            columns={["value"]}
                            series={this.state.chartSeries["packet-loss-rate"].reverse} />
                    </Charts>
                </ChartRow>
                <ChartRow height="50" debug={false}>
                    <Brush
                        timeRange={this.state.brushrange}
                        onTimeRangeChanged={this.handleTimeRangeChange}
                        allowSelectionClear={true}
                        />
                    <YAxis
                        id="brushAxis2"
                        label="Latency"
                        min={0} max={this.state.chartSeries["histogram-owdelay"].forward.max()}
                        width={80} type="linear" format=".1s"/>
                    <Charts>
                        <LineChart
                            key="brushOwdelay"
                            axis="brushAxis2"
                            style={lineStyles}
                            columns={["value"]}
                            series={this.state.chartSeries["histogram-owdelay"].forward} />
                        <LineChart
                            key="reverseBrushOwdelay"
                            axis="brushAxis2"
                            style={reverseStyles}
                            columns={["value"]}
                            series={this.state.chartSeries["histogram-owdelay"].reverse} />
                    </Charts>
                </ChartRow>
            </ChartContainer>
        );
    },

    updateChartData: function() {
        console.log("updating chart data");
        let newChartSeries = PSGraphData.getChartData();
        console.log("new series", newChartSeries);
        this.setState({ chartSeries: newChartSeries } );
        this.forceUpdate();
        //ChartLayout.forceUpdate();
        //ChartLayout.setState({throughputCharts: charts});
    },

    componentDidMount: function() {
        //var { status, page, limit } = this.context.router.getCurrentQuery();
        /*
        if ( ! this.state.timerange ) {
            this.handleTimeRangeChange(null);
        }
        */

        /*
        var qs = this.props.location.query;
        console.log( "qs", qs );
        let src = qs.src;
        let dst = qs.dst;
        let start = qs.start;
        let end = qs.end;
        let ma_url = qs.ma_url || "http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/";
        */

        let src = this.props.src;
        let dst = this.props.dst;
        let start = this.props.start;
        let end = this.props.end;
        let ma_url = this.props.ma_url || "http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/";


        PSGraphData.subscribe(this.updateChartData);

        if ( src === null || dst === null ) {
            //return;
        }

        PSGraphData.getHostPairMetadata( src, dst, start, end, ma_url );


        var values = this.esmondToTimeSeries( failures, 'failures' );
        failureValues = values.values;
        failureSeries = values.series;
        console.log('failure values', failureValues);
        console.log('failure series', failureSeries);
    },

    componentWillUnmount: function() {
        this.serverRequest.abort();
        PSGraphData.unsubscribe( this.updateChartData );
    },

    _checkSortOrder : function( ary, valName='ts' ) {
        var lastVal = 0;
        _.each( ary, val => {
            //console.log('val', val);
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
        /*
         * Shouldn't need this as _checkSortOrder is called above
        var lastTS = 0;
        for (let i=0; i < series.size(); i++) {
            //console.log(series.at(i).toString());
            //console.log('series.at(i)', series.at(i));
            var ts = series.at(i).timestamp().getTime();
            if ( ts > lastTS ) {
                //console.log( 'new ts > last TS', ts, lastTS );

            } else {
                console.log( 'BAD: new ts <= last TS', ts, lastTS );

            }
            lastTS = ts;
        }
        */
        return ( { values: values, series: series } );
    }, 
    checkEventType: function ( eventType, direction ) {
        return this.state.chartSeries 
            && this.state.chartSeries[ eventType ]
            && ( direction === null || this.state.chartSeries[ eventType ][ direction ] );
    }
});
