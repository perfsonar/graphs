import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
//import Highlighter from "./highlighter";

import { Charts, ChartContainer, ChartRow, YAxis, LineChart, Highlighter, Resizable, Legend } from "react-timeseries-charts";

import { TimeSeries, TimeRange } from "pondjs";

const ddosData = require("../data/ddos.json");
console.log("ddosData", ddosData);

const requests = [];
const connections = [];
var throughputValues = [];
var reverseValues = [];

var throughputSeries = null;
var reverseSeries = null;

const text = 'Example ddos chart';

_.each(ddosData, val => {
    const timestamp = new moment(new Date(`2015-04-03 ${val["time PST"]}`));
    const numConnection = val["connections"];
    const httpRequests = val["http requests"];
    requests.push([timestamp.toDate().getTime(), httpRequests]);
    connections.push([timestamp.toDate().getTime(), numConnection]);
});

const connectionsSeries = new TimeSeries({
    name: "connections",
    columns: ["time", "value"],
    points: connections
});

const requestsSeries = new TimeSeries({
    name: "requests",
    columns: ["time", "value"],
    points: requests
});

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
    //connections: "#9467bd"
};

const connectionsStyle = {
    color: scheme.connections,
    width: 1
};

const requestsStyle = {
    color: scheme.requests,
    width: 2
};

export default React.createClass({

    mixins: [Highlighter],

    getInitialState() {
        return {
            markdown: text,
            active: {
                requests: false,
                connections: false,
                throughput: true,
                reverse: true
            }
        };
    },


    renderChart() {
        let charts = [];
        if (this.state.active.requests) {
            charts.push(
                <LineChart key="requests" axis="axis1" series={requestsSeries} style={requestsStyle}/>
            );
        }
        if (this.state.active.connections) {
            charts.push(
                <LineChart key="connections" axis="axis2" series={connectionsSeries} style={connectionsStyle}/>
            );
        }
        if (this.state.active.throughput && throughputSeries) {
            charts.push(
                <LineChart key="throughput" axis="axis2" series={throughputSeries} style={connectionsStyle}/>
            );
        }
        if (this.state.active.reverse && reverseSeries) {
            charts.push(
                <LineChart key="reverse" axis="axis2" series={reverseSeries} style={requestsStyle}/>
            );
        }
        var timerange;
        if (throughputSeries) {
            console.log('throughputSeries is defined');
            timerange = throughputSeries.timerange();
            console.log('throughput timerange', timerange);
        } else if ( reverseSeries ) {
            console.log('reverseSeries is defined');
            timerange = reverseSeries.timerange();
            console.log('reverse timerange', timerange);

        } else {
            timerange = requestsSeries.timerange();
        }
        return (
            <ChartContainer timeRange={timerange}>
                <ChartRow height="300" debug={false}>
                    <YAxis id="axis1" label="Requests" style={{labelColor: scheme.requests}}
                           labelOffset={-10} min={0} max={1000} format=",.0f" width="60" type="linear" />
                    <Charts>
                        {charts}
                    </Charts>
                    <YAxis id="axis2" label="Throughput" style={{labelColor: scheme.connections}}
                           labelOffset={12} min={0} format=",.0f" max={1000000000} width="80" type="linear"/>
                </ChartRow>
            </ChartContainer>
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
                key: "requests",
                label: "Requests",
                disabled: !this.state.active.requests,
                style: {backgroundColor: scheme.requests}
            },{
                key: "connections",
                label: "Connections",
                disabled: !this.state.active.connections,
                style: {backgroundColor: scheme.connections}
            },{
                key: "throughput",
                label: "Throughput",
                disabled: !this.state.active.throughput,
                style: {backgroundColor: scheme.connections}
            },{
                key: "reverse",
                label: "Reverse",
                disabled: !this.state.active.reverse,
                style: {backgroundColor: scheme.requests}
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

                <div className="row">
                    <div className="col-md-12">
                        <Resizable>
                            {this.renderChart()}
                        </Resizable>
                    </div>
                </div>

                <hr/>

            </div>
        );
    },

    componentDidMount: function() {
        var url = 'http://perfsonar-dev.grnoc.iu.edu:8080/esmond/perfsonar/archive/9808c289fc07446e9939330706b896d6/throughput/base';
        //var url = 'http://perfsonar-dev.grnoc.iu.edu:8080/esmond/perfsonar/archive/050056d85a8344bc844e2aeaa472db9b/throughput/base';

        this.serverRequest = $.get(url, function ( data ) {
            console.log('ajax request came back; data', data);
            var values = this.throughputToTimeSeries( data, 'throughput' );
            throughputValues = values.values;
            throughputSeries = values.series;
            console.log('throughput values', throughputValues);
            //this.renderChart();
            this.forceUpdate();
        }.bind(this));

        var url2 = 'http://perfsonar-dev.grnoc.iu.edu:8080/esmond/perfsonar/archive/f1f55c1d158545c29ff8700980948d30/throughput/base';

        this.serverRequest = $.get(url2, function ( data ) {
            console.log('ajax request came back; reverse data', data);
            var values = this.throughputToTimeSeries( data, 'reverse' );
            reverseValues = values.values;
            reverseSeries = values.series;
            console.log('reverse throughput values', reverseValues);
            //this.renderChart();
            this.forceUpdate();
        }.bind(this));
    },


    componentWillUnmount: function() {
        this.serverRequest.abort();
    },

    throughputToTimeSeries: function( inputData, seriesName ) {
        var values = [];
        var series = {};
        _.each(inputData, val => {
            const ts = val["ts"];
            const timestamp = new moment(new Date(ts * 1000)); // 'Date' expects milliseconds
            const value = val["val"];
            values.push([timestamp.toDate().getTime(), value]);
            series = new TimeSeries({
                name: seriesName,
                columns: ["time", "value"],
                points: values
            });
        });
        return ( { values: values, series: series } );
    }
});
