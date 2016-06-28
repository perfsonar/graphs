import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
//import Highlighter from "./highlighter";

import { AreaChart, Brush, Charts, ChartContainer, ChartRow, YAxis, LineChart, ScatterChart, Highlighter, Resizable, Legend } from "react-timeseries-charts";

import { TimeSeries, TimeRange } from "pondjs";

import "./chart1.css";

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

const text = 'Example ddos chart';

const lineStyle = {
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
};

const scheme = {
    requests: "#2ca02c",
    connections: "#990000"
};

const connectionsStyle = {
    color: scheme.connections,
    width: 1
};

const requestsStyle = {
    color: scheme.requests,
    width: 2,
    strokeDasharray: "4,2"
};

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
            tracker: null,
            timerange: TimeRange.lastThirtyDays(),
            initialTimerange: null,
            maxLatency: 1,
            maxThroughput: 1,
            maxLoss: 0.0000000001,
            latencySeries: null 
        };
    },


    handleTrackerChanged(trackerVal, selection) {
        const seconds = Math.floor( trackerVal.getTime() / 1000 );
        //console.log('trackerVal seconds', seconds, 'selection', selection);
        //var pos = this.state.tracker;
        this.setState({tracker: trackerVal});
        if ( failureMessages[ seconds ] ) {
            console.log('failure message: ', failureMessages[ seconds ] );
        }
        //this.setState({selectionType, selection});
        //return pos;
    },

    renderChart() {
        let charts = [];
        let latencyCharts = [];
        let lossCharts = [];
        if (this.state.active.throughput && throughputSeries) {
            charts.push(
                <LineChart key="throughput" axis="axis2" series={throughputSeries} style={connectionsStyle} smooth={false} breakLine={true} min="{throughutSeries.min()" max="{throughputSeries.max()}" />
            );
        }
        if (this.state.active.reverse && reverseThroughputSeries) {
            charts.push(
                <LineChart key="reverse" axis="axis2" series={reverseThroughputSeries} style={requestsStyle} smooth={false} breakLine={true} />
            );
        }
        if (this.state.active.throughput && this.state.latencySeries) { // TODO: fix state part
            latencyCharts.push(
                <LineChart key="latency" axis="axis1" series={this.state.latencySeries} style={connectionsStyle} smooth={false} breakLine={false} min={this.state.latencySeries.min()} max={this.state.latencySeries.max()} onTimeRangeChanged={this.handleTimeRangeChange} />
            );
        }
        if (this.state.active.reverse && reverseLatencySeries) { // TODO: fix state part
            latencyCharts.push(
                <LineChart key="reverseLatency" axis="axis1" series={reverseLatencySeries} style={requestsStyle} smooth={false} breakLine={false} min={reverseLatencySeries.min()} max={reverseLatencySeries.max()} />
            );
        }
        if (this.state.active.throughput && lossSeries) {
            lossCharts.push(
                    /*
                <LineChart key="loss" axis="lossAxis" series={lossSeries} style={connectionsStyle} smooth={false} breakLine={true} />
                */
                <ScatterChart key="loss" axis="lossAxis" series={lossSeries} style={{color: "#2ca02c", opacity: 0.5}} />
            );
        }
        if (this.state.active.reverse && reverseLossSeries) {
            lossCharts.push(
                 <LineChart key="reverseLoss" axis="lossAxis" series={reverseLossSeries} style={requestsStyle} smooth={false} breakLine={true} />
/*
                <ScatterChart key="reverseLoss" axis="lossAxis" series={reverseLossSeries} style={{color: "#2ca02c", opacity: 0.5}} />
                */
            );
        }
        var timerange;
        if (throughputSeries) {
            //console.log('throughputSeries is defined');
            timerange = throughputSeries.timerange();
            //console.log('throughput timerange', timerange);
        } else if (reverseThroughputSeries) {
            //console.log('reverseThroughputSeries is defined');
            timerange = reverseThroughputSeries.timerange();
            //console.log('reverse timerange', timerange);

        } 
        this.timerange = timerange;
        if ( ! timerange ) {
            return ( <div></div> );
        }
        if ( this.state.initialTimerange === null ) {
            console.log("initial timerange", timerange);
            this.setState({initialTimerange: timerange});
        }
        return (
            <div>
                <div className="row">
                    <div className="col-md-12">
                    <Resizable>
            <ChartContainer timeRange={timerange}
                trackerPosition={this.state.tracker}
                //onTrackerChanged={(tracker) => this.handleTrackerChanged({tracker})}
                onTrackerChanged={this.handleTrackerChanged}
                //onTrackerChanged={(tracker) => this.setState({tracker})}
                enablePanZoom={true}
                //onTimeRangeChanged={(timerange) => this.setState({timerange})}
                onTimeRangeChanged={this.handleTimeRangeChange}
                timeRange={this.state.timerange} >
                <ChartRow height="200" debug={false}>
                    <Charts>
                        {charts}
                <ScatterChart axis="axis2" series={failureSeries} style={{color: "steelblue", opacity: 0.5}} /> 
                    </Charts>
                    <YAxis id="axis2" label="Throughput" style={{labelColor: scheme.connections}}
                           labelOffset={20} min={0} format=".2s" max={this.state.maxThroughput} width="80" type="linear"/>
                </ChartRow>
                <ChartRow height="200" debug={false}>
                    <Charts>
                        {lossCharts}
                    </Charts>
                    <YAxis id="lossAxis" label="Loss" style={{labelColor: scheme.connections}}
                           labelOffset={20} min={0.000000001} format=",.4f" max={this.state.maxLoss} width="80" type="log"/>
                </ChartRow>
                <ChartRow height="200" debug={false}>
                    <Charts>
                        {latencyCharts}
                    </Charts>
                    <YAxis id="axis1" label="Latency" style={{labelColor: scheme.connections}}
                           labelOffset={20} min={0.000000001} format=",.4f" max={this.state.maxLatency} width="80" type="linear"/>
                </ChartRow>
            </ChartContainer>
            </Resizable>
                           </div>
                               </div>

                <div className="row">
                    <div className="col-md-12" style={brushStyle}>
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
                    stroke: scheme.connections
                }
            },{
                key: "reverse",
                label: "Reverse",
                disabled: !this.state.active.reverse,
                style: {
                    backgroundColor: scheme.requests,
                    stroke: scheme.requests,
                    strokeDasharray: "4,2"
                }
            }
        ];


        return (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h3>perfSONAR Test Results</h3>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <Legend type="line" categories={legend} onChange={this.handleActiveChange}/>
                    </div>
                </div>

                <hr/>

                {this.renderChart()}

                <hr/>

            </div>
        );
    },

    handleTimeRangeChange(timerange) {
        //if ( timerange.begin().toString() != timerange.end().toString() ) {
            this.setState({timerange});

            /*
        } else {
            this.setState({timerange: this.initialTimerange});
             this.forceUpdate();
        }
        */
    },

    handleBrushCleared(val) {
        this.setState({timerange: this.state.initialTimerange});
        console.log("brush cleared, initial timerange", this.state.initialTimerange);
    },

    renderBrush() {
        return (
            <ChartContainer
                timeRange={throughputSeries.timerange()}
                format="relative"
                trackerPosition={this.state.tracker}>
                <ChartRow height="100" debug={false}>
                    <Brush
                        timeRange={null}
                        //timeRange={this.state.timerange}
                        onTimeRangeChanged={this.handleTimeRangeChange}
                        onBrushCleared={this.handleBrushCleared}
                        />
                    <YAxis
                        id="brushAxis1"
                        label="Throughput"
                        min={0} max={this.state.maxThroughput}
                        width={70} type="linear" format=".1s"/>
                    <Charts>
                        <LineChart
                            key="brushThroughput"
                            axis="brushAxis1"
                            style={{up: ["#DDD"]}}
                            columns={{up: ["throughput"], down: []}}
                            series={throughputSeries} />
                    </Charts>
                </ChartRow>
            </ChartContainer>
        );
    },

    componentDidMount: function() {
        var url = 'http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/9808c289fc07446e9939330706b896d6/throughput/base';
        url += '?time-range=' + 86400 * 30;
        //var url = 'http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/050056d85a8344bc844e2aeaa472db9b/throughput/base';

        this.serverRequest = $.get(url, function ( data ) {
            console.log('ajax request came back; throughput data', Date(), data );
            var values = this.esmondToTimeSeries( data, 'throughput' );
            throughputValues = values.values;
            throughputSeries = values.series;
            console.log('throughput values', Date(), throughputValues);
            //this.renderChart();
            this.forceUpdate();
        }.bind(this));

        var url2 = 'http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/f1f55c1d158545c29ff8700980948d30/throughput/base';
        url2 += '?time-range=' + 86400 * 30;

        this.serverRequest = $.get(url2, function ( data ) {
            console.log('ajax request came back; reverse throughput data', Date(), data);
            var values = this.esmondToTimeSeries( data, 'reverseThroughput' );
            reverseThroughputValues = values.values;
            reverseThroughputSeries = values.series;
            console.log('reverse throughput values', Date(), reverseThroughputValues );
            //this.renderChart();
            this.forceUpdate();
        }.bind(this));

        // http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/c1eb8fb9fd87429bb3bfaf79aca6424b/histogram-owdelay/statistics/3600
        var url3 = 'http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/c1eb8fb9fd87429bb3bfaf79aca6424b/histogram-owdelay/statistics/3600';
        url3 += '?time-range=' + 86400 * 30;

        this.serverRequest = $.get(url3, function ( data ) {
            console.log('ajax request came back; latency data', Date(), data );
            var values = this.esmondToTimeSeries( data, 'latency' );
            latencyValues = values.values;
            this.setState({latencySeries: values.series});
            console.log('latency values', Date(), latencyValues );
            //this.renderChart();
            this.forceUpdate();
        }.bind(this));

        // http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/5a1707536a5143759713adddc5cafa66/histogram-rtt/statistics/3600
        var url4 = 'http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/5a1707536a5143759713adddc5cafa66/histogram-rtt/statistics/3600';
        url4 += '?time-range=' + 86400 * 30;

        this.serverRequest = $.get(url4, function ( data ) {
            console.log('ajax request came back; latency data', Date(), data);
            var values = this.esmondToTimeSeries( data, 'reverseLatency' );
            reverseLatencyValues = values.values;
            reverseLatencySeries = values.series;
            console.log('reverse latency values', Date(), reverseLatencyValues );
            //this.renderChart();
            this.forceUpdate();
        }.bind(this));

        var url5 = 'http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/0121d658a72a4f119a99c5e03bfa674b/packet-loss-rate/base';
        url5 += '?time-range=' + 86400 * 30;
        this.serverRequest = $.get(url5, function ( data ) {
            console.log('ajax request came back; loss data', Date(), data);
            var values = this.esmondToTimeSeries( data, 'loss' );
            lossValues = values.values;
            lossSeries = values.series;
            console.log('loss values', Date(), lossValues );
            //this.renderChart();
            this.forceUpdate();

        }.bind(this));

        var url6 = 'http://perfsonar-dev.grnoc.iu.edu/esmond/perfsonar/archive/0acdc51a787a43c4b2b81c66e9d564da/packet-loss-rate/aggregations/86400';
        url6 += '?time-range=' + 86400 * 30;
        this.serverRequest = $.get(url6, function ( data ) {
            console.log('ajax request came back; reverse loss data', Date(), data);
            var values = this.esmondToTimeSeries( data, 'reverseLoss' );
            reverseLossValues = values.values;
            reverseLossSeries = values.series;
            console.log('reverse loss values', Date(), reverseLossValues );
            //this.renderChart();
            this.forceUpdate();

        }.bind(this));


var values = this.esmondToTimeSeries( failures, 'failures' );
failureValues = values.values;
failureSeries = values.series;
console.log('failure values', failureValues);
console.log('failure series', failureSeries);


    },


    componentWillUnmount: function() {
        this.serverRequest.abort();
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
    }
});