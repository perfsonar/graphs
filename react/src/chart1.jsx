import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
//import Highlighter from "./highlighter";

//import { BasicCircuit } from "react-network-diagrams";
import { Charts, ChartContainer, ChartRow, YAxis, LineChart, Highlighter, Resizable, Legend } from "react-timeseries-charts";

import { TimeSeries, TimeRange } from "pondjs";

// Imports from the charts library
//import Resizable from "../../src/resizable";
//import Legend from "../../src/legend";

const ddosData = require("../data/ddos.json");

console.log('ddosData', ddosData);

const requests = [];
const connections = [];

const text = 'Example chart';

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

console.log("connectionsSeries", connectionsSeries);
console.log("requestsSeries", requestsSeries);

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
    //connections: "#9467bd"
    connections: "#9467bd"
};

const connectionsStyle = {
    color: scheme.connections,
    width: 1
};

const requestsStyle = {
    color: scheme.requests,
    width: 2
};

const endpointStyle = {
    node: {
        normal: {fill: "none", stroke: "#DBDBDB", strokeWidth: 4}
    },
    label: {
        normal: {fill: "#9D9D9D", fontSize: 10, fontFamily: "verdana, sans-serif"}
    }
};
/*
ReactDOM.render(
<ChartContainer timeRange={connectionsSeries.range()} width={800}>
    <ChartRow height="200">
        <YAxis id="axis1" label="AUD" min={0.5} max={1.5} width="60" type="linear" format="$,.2f"/>
        <Charts>
            <LineChart axis="axis1" key="connections" series={connectionsSeries}/>
            <LineChart axis="axis2" key="requests" series={requestsSeries}/>
        </Charts>
        <YAxis id="axis2" label="Euro" min={0.5} max={1.5} width="80" type="linear" format="$,.2f"/>
    </ChartRow>
</ChartContainer>
);
*/

export default React.createClass({

    mixins: [Highlighter],

    getInitialState() {
        return {
            markdown: text,
            active: {
                requests: true,
                connections: true
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
        return (
            <ChartContainer timeRange={requestsSeries.timerange()}>
                <ChartRow height="300" debug={false}>
                    <YAxis id="axis1" label="Requests" style={{labelColor: scheme.requests}}
                           labelOffset={-10} min={0} max={1000} format=",.0f" width="60" type="linear" />
                    <Charts>
                        {charts}
                    </Charts>
                    <YAxis id="axis2" label="Connections" style={{labelColor: scheme.connections}}
                           labelOffset={12} min={0} format=",.0f" max={10000} width="80" type="linear"/>
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
                style: {backgroundColor: "#2ca02c"}
            },{
                key: "connections",
                label: "Connections",
                disabled: !this.state.active.connections,
                style: {backgroundColor: "#9467bd"}
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
    }
});
