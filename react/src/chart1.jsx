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
var esmondValues = [];

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

var esmondSeries = null;

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
                requests: true,
                connections: true,
                esmond: true
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
        if (this.state.active.esmond && esmondSeries) {
            charts.push(
                <LineChart key="esmond" axis="axis2" series={esmondSeries} style={connectionsStyle}/>
            );
        }
        var timerange;
        if (esmondSeries) {
            console.log('esmondSeries is defined');
            timerange = esmondSeries.timerange();
            console.log('esmond timerange', timerange);
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
                           labelOffset={12} min={0} format=",.0f" max={100000000} width="80" type="linear"/>
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
            }
        ];
        return (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h3>April 2015 DDoS Attack</h3>
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
        var url = 'http://perfsonar-dev.grnoc.iu.edu:8080/esmond/perfsonar/archive/050056d85a8344bc844e2aeaa472db9b/throughput/base';
        this.serverRequest = $.get(url, function ( data ) {
            console.log('ajax request came back; data', data);
            this.esmondToTimeSeries( data );
            console.log('esmond values', esmondValues);
            //this.renderChart();
            this.forceUpdate();
            /*
            this.setState({
                username: lastGist.owner.login,
                lastGistUrl: lastGist.html_url
            });
            */
        }.bind(this));
    },

    componentWillUnmount: function() {
        this.serverRequest.abort();
    },

    esmondToTimeSeries: function( inputData ) {

        _.each(inputData, val => {
            const ts = val["ts"];
            const timestamp = new moment(new Date(ts * 1000)); // 'Date' expects milliseconds
            const value = val["val"];
            esmondValues.push([timestamp.toDate().getTime(), value]);
            esmondSeries = new TimeSeries({
                name: "esmond",
                columns: ["time", "value"],
                points: esmondValues
            });
        });
    }
});
