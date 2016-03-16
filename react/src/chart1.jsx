import React from "react";
import _ from "underscore";
import moment from "moment";
import Markdown from "react-markdown";
//import Highlighter from "./highlighter";

import { Charts, ChartContainer, ChartRow, YAxis, LineChart, Highlighter, Resizable, Legend } from "react-timeseries-charts";

import { TimeSeries, TimeRange } from "pondjs";

var throughputValues = [];
var reverseValues = [];

var throughputSeries = null;
var reverseSeries = null;

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
                throughput: true,
                reverse: true
            }
        };
    },


    renderChart() {
        let charts = [];
        if (this.state.active.throughput && throughputSeries) {
            charts.push(
                <LineChart key="throughput" axis="axis2" series={throughputSeries} style={connectionsStyle} smooth={false} />
            );
        }
        if (this.state.active.reverse && reverseSeries) {
            charts.push(
                <LineChart key="reverse" axis="axis2" series={reverseSeries} style={requestsStyle} smooth={false} />
            );
        }
        var timerange;
        if (throughputSeries) {
            console.log('throughputSeries is defined');
            timerange = throughputSeries.timerange();
            console.log('throughput timerange', timerange);
        } else if (reverseSeries) {
            console.log('reverseSeries is defined');
            timerange = reverseSeries.timerange();
            console.log('reverse timerange', timerange);

        } 
        if ( ! timerange ) {
            return ( <div></div> );
        }
        return (
            <ChartContainer timeRange={timerange}>
                <ChartRow height="300" debug={false}>
                    <Charts>
                        {charts}
                    </Charts>
                    <YAxis id="axis2" label="Throughput" style={{labelColor: scheme.connections}}
                           labelOffset={20} min={0} format=",.0f" max={1000000000} width="80" type="linear"/>
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
            var values = this.esmondToTimeSeries( data, 'throughput' );
            throughputValues = values.values;
            throughputSeries = values.series;
            console.log('throughput values', throughputValues);
            //this.renderChart();
            this.forceUpdate();
        }.bind(this));

        var url2 = 'http://perfsonar-dev.grnoc.iu.edu:8080/esmond/perfsonar/archive/f1f55c1d158545c29ff8700980948d30/throughput/base';

        this.serverRequest = $.get(url2, function ( data ) {
            console.log('ajax request came back; reverse data', data);
            var values = this.esmondToTimeSeries( data, 'reverse' );
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

    _checkSortOrder : function( ary, valName='ts' ) {
        var lastVal = 0;
        _.each( ary, val => {
            //console.log('val', val);
            if ( val.ts <= lastVal ) {
                console.log('ts is not greater than last ts');

            } else {
                console.log('ts is greater than last ts');

            }
            lastVal = val.ts;


        });
    },

    esmondToTimeSeries: function( inputData, seriesName ) {
        var values = [];
        var series = {};

       /* 
        inputData.sort(function(a, b){
            var a1 = a.ts, b1 = b.ts;
            if(a1== b1) return 0;
            return a1> b1? 1: -1;
        });
        */
        this._checkSortOrder(inputData);

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
        var lastTS = 0;
        for (let i=0; i < series.size(); i++) {
            console.log(series.at(i).toString());
            console.log('series.at(i)', series.at(i));
            var ts = series.at(i).timestamp().getTime();
            if ( ts > lastTS ) {
                console.log( 'new ts > last TS', ts, lastTS );

            } else {
                console.log( 'BAD: new ts <= last TS', ts, lastTS );

            }
            lastTS = ts;
        }
        return ( { values: values, series: series } );
    }
});
