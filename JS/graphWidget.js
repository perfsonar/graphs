require(["dojo/dom", "dojo/on", "dojo/hash", "dojo/io-query"], function(theDom, theOn, theHash, ioQuery){

var src = '';
var dst = '';
var ma_url = '';

var timePeriod = ioQuery.queryToObject(theHash()).timeframe || '';  // get hash
var time_diff = 0;
var summary_window = 0;

var setTimeVars = function (period) {

    if (period == '4h') {
        time_diff = 60*60 * 4;
        summary_window = 300;
    } else if (period == '1d') {
        time_diff = 86400;
        summary_window = 300;
    } else if (period == '1w') {
        time_diff = 86400*7;
        summary_window = 3600;
    } else if (period == '1m') {
        time_diff = 86400*31;
        summary_window = 86400;
    } else if (period == '1y') {
        time_diff = 86400*365;
        summary_window = 86400;
    }

}

setTimeVars(timePeriod);


// getTime() returns ms, divide by 1000 to get seconds
var end_ts = Math.round(new Date().getTime() / 1000);
var start_ts = end_ts - 86400 * 7;
if (time_diff != 0 ) {
    start_ts = end_ts - time_diff;
}

var base_url = 'https://perfsonar-dev.grnoc.iu.edu/serviceTest/graphData.cgi?url=http%3A%2F%2Flbl-pt1.es.net%3A9085%2Fesmond%2Fperfsonar%2Farchive%2F&action=data&src=198.129.254.30&dest=198.124.238.66';
var url = 'https://perfsonar-dev.grnoc.iu.edu/serviceTest/graphData.cgi?url=http%3A%2F%2Flbl-pt1.es.net%3A9085%2Fesmond%2Fperfsonar%2Farchive%2F&action=data&src=198.129.254.30&dest=198.124.238.66&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;

drawChart(url);
function drawChart(url) {

d3.json(url, function(error,ps_data) {

    var start_date = new Date (start_ts);
    var end_date = new Date (end_ts);

    timePeriod = ioQuery.queryToObject(theHash()).timeframe || '';  // get hash
    if (timePeriod != '') {
        dojo.query('#ps-all-tests #time-selector a.zoomLink').removeClass('active');
        dojo.query('#ps-all-tests #time-selector a.zoomLink').forEach(function(node, index, nodelist) {
            if(node.name == timePeriod) {
                dojo.addClass(node, "active");
            }
        });
    }
    var allTestsChart = dc.compositeChart("#ps-all-tests");
    var throughputChart = dc.psLineChart(allTestsChart);
    var owdelayChart = dc.psLineChart(allTestsChart);
    var lossChart = dc.psLineChart(allTestsChart);
    var packetRetransChart = dc.psLineChart(allTestsChart);

    var ndx = crossfilter(ps_data);
    var lineDimension = ndx.dimension(function (d) { return new Date( d.ts * 1000); });
    var delayDimension = ndx.dimension(function (d) { return d.owdelay_src_val; });
    var lossDimension = ndx.dimension(function (d) { return d.loss_src_val; });

    var throughputGroup = lineDimension.group().reduce(
        // Add
        function(p, v) {
            if (v.throughput_src_val !== null) {
                ++p.count;
                p.sum += v.throughput_src_val;
                p.avg = p.sum/p.count;
            }
            return p;
        },

        // Remove
        function (p, v) {
            if (v.throughput_src_val !== null) {
                --p.count;
                p.sum -= v.throughput_src_val;
                p.avg = p.sum/p.count;
            }
            return p;
        },

        // Init
        function() {
            return { count: 0, sum: 0, avg:0 };
        }

    );

    var owdelayGroup = lineDimension.group().reduce(
        // Add
        function(p, v) {
            if (v.owdelay_src_val !== null) {
                ++p.count;
                p.sum += v.owdelay_src_val;
                p.avg = p.sum/p.count;
            } 
            return p;
        },

        // Remove
        function (p, v) {
            if (v.owdelay_src_val !== null) {
                --p.count;
                p.sum -= v.owdelay_src_val;
                p.avg = p.sum/p.count;
            }
            return p;
        },

        // Init
        function() {
            return { count: 0, sum: 0, avg:0 };
        }

    );

    var lossGroup = lineDimension.group().reduce(
        // Add
        function(p, v) {
            if (v.loss_src_val !== null) {
                ++p.count;
                p.sum += v.loss_src_val;
                p.avg = p.sum/p.count;
            } 
            return p;
        },

        // Remove
        function (p, v) {
            if (v.loss_src_val !== null) {
                --p.count;
                p.sum -= v.loss_src_val;
                p.avg = p.sum/p.count;
            }
            return p;
        },

        // Init
        function() {
            return { count: 0, sum: 0, avg:0 };
        }

    );

    var avgOrder = function(p) { 
        return p.avg; 
    };
    var valOrder = function(p) { return p; };
    
    //var packetRetransGroup = lineDimension.group().reduceCount(function(d) { return d.packet_retransmits_src_val; } );
    var packetRetransGroup = lineDimension.group().reduceSum(function(d) { return d.packet_retransmits_src_val; } );

    //var lossGroup = lineDimension.group().reduceSum(function(d) { return d.loss_src_val; });

    var format_throughput = function(d) { return d3.format('.3s')(d) + 'bps';  }
    var format_latency = function(d) { return d3.format('.3f')(d) + 'ms';  }
    var format_loss = function(d) { return d3.format('.3%')(d);  }
    var format_ts = function(d) { return d3.time.format('%X %x')(d); }
    var format_ts_header = function(d) { return d3.time.format('%x %X')(d); }

    var maxThroughput = throughputGroup.order(avgOrder).top(1)[0].value.avg;
    var maxDelay = owdelayGroup.order(avgOrder).top(1)[0].value.avg;
    var maxLoss = lossGroup.order(avgOrder).top(1)[0].value.avg; 
    var maxPacketRetrans = packetRetransGroup.top(1)[0].value; 
    var axisScale = 1.25;

    var setHeader = function() { 
        var rangeLabel = 'From ' + format_ts_header(new Date(1000 * start_ts)) + ' to ' + format_ts_header(new Date(1000 * end_ts));
        var chartHeader = d3.select('#chart .chartHeader .content').html( rangeLabel );
    };

    setHeader();

    throughputChart.dimension(lineDimension)
        .group(throughputGroup, "Throughput")
        .mouseZoomable(true)
        //.renderDataPoints(true)
        //.interpolate('bundle')
        /*
        .defined(function(d) { 
                return (!isNaN(d.data.value.avg)); 
                //return (d.data.value !== 0); 
        })
        */
    
        .valueAccessor(function (d) {
            return d.value.avg; 
/*
            if (d.value !== 0) {
                lastThroughputVal = d.value;
                return d.value;
            } else {
                return lastThroughputVal;
            }
*/
        })
        
        
        .brushOn(false)      
        //.renderDataPoints(true) 
        .title(function(d){
            return 'Throughput: ' + format_throughput(d.value.avg) 
                + "\n" + format_ts(d.key);        
            })
        //.elasticY(true)
        .yAxis().tickFormat(d3.format('.2s'))
        ;

    if (maxThroughput == 0 ) {
        // TODO: fix -- setting default throughput axis doesn't work
        throughputChart.y(d3.scale.linear().domain([0, 1000]))
    }

    owdelayChart.dimension(lineDimension)
        .group(owdelayGroup, "Latency")
        //.renderDataPoints(true)
         
        .defined(function(d) {
                return (!isNaN(d.data.value.avg));
                //return (d.data.value !== 0);
                })

        .valueAccessor(function (d) {
            return d.value.avg; 
        })
        //.interpolate('bundle')
        .brushOn(false)        
        .colors("#00ff00")
        .title(function(d){
            return "Latency: " + format_latency(d.value.avg) + "\n"
                + format_ts(d.key);
             
            })
        //.elasticY(true)
        .useRightYAxis(true)
        .xAxis();

    lossChart.dimension(lineDimension)
        .group(lossGroup, "Loss")
        .renderDataPoints(true) 
        .mouseZoomable(true)
        .brushOn(false)       
        .valueAccessor(function(d) {
            if (d.value.avg != 0) { 
                return d.value.avg * maxDelay / maxLoss; 
            } else {
                return 0.01; // TODO: fix: hacky -- so we see "0" values
            }
                
        }) 
        .title(function(d){
            return "Loss: " + format_loss(d.value.avg) + "\n"
                + format_ts(d.key);
            })
        .colors("#ff0000")
        //.elasticY(true)
        .useRightYAxis(true)                                
        .xAxis();

    packetRetransChart.dimension(lineDimension)
        .group(packetRetransGroup, "Packet Retransmissions")
        .mouseZoomable(true)
        .colors("#ff00ff")
        //.renderDataPoints(true)
        //.interpolate('bundle')
    
        .valueAccessor(function (d) {
            if (d.value !== 0) {
                return d.value * maxDelay / maxPacketRetrans; 
            } else {
                return 0;
            }
        })
        
        .useRightYAxis(true) 
        .brushOn(false)      
        .title(function(d){
            return 'Retransmitted packets: ' + d.value 
                + "\n" + format_ts(d.key);        
            })
        ;

    allTestsChart.width(750)
        .height(465)
        .brushOn(false)
        .mouseZoomable(true)
        .shareTitle(false)
        .compose([throughputChart, owdelayChart, lossChart, packetRetransChart])
        .x(d3.time.scale().domain(d3.extent(ps_data, function(d) { return new Date(d.ts * 1000); })))
        .xAxisLabel('Date')
        .y(d3.scale.linear().domain([0, maxThroughput * axisScale]))
        .yAxisLabel('Throughput')
        .rightYAxisLabel('Latency (ms)')
         .legend(dc.legend().x(400))
         .rightY(d3.scale.linear().domain([0, maxDelay * axisScale]))
        .xAxis();
    allTestsChart.yAxis().tickFormat(format_throughput);
    allTestsChart.margins().left = 90;

    // Handle zoom events
    dojo.query('#ps-all-tests #time-selector a.zoomLink').onclick(function(e){ 
            e.preventDefault();
            var timePeriod = e.currentTarget.name;
            dojo.query('#ps-all-tests #time-selector a.zoomLink').removeClass('active');
            dojo.addClass(e.currentTarget, 'active');
            theHash("timeframe=" + timePeriod);
            reloadChart(timePeriod);
    });

    var reloadChart = function(timePeriod) {
        var url = base_url;
        summary_window = 3600;
        end_ts = Math.round(new Date().getTime() / 1000);
        setTimeVars(timePeriod);
    
        start_ts = end_ts - time_diff;

        url += '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
        if (lineDimension !== null) {
            lineDimension.dispose();
        }
        if (delayDimension !== null) {
            delayDimension.dispose();     
        }   
        if (lossDimension !== null) {
            lossDimension.dispose();
        }
        if (ndx !== null && ndx.size() > 0 ) {    
            dc.filterAll();
            ndx.remove();
        }

        d3.selectAll(".chart").selectAll("svg").remove();
        if (allTestsChart !== null) {
            allTestsChart.resetSvg(); 
        }
        allTestsChart = null;
        lineDimension = null;
        delayDimension = null;
        lossDimension = null;
        ndx = null;
        drawChart(url);
        setHeader();


    };

    dc.renderAll();
    // 3rd y axis
    var y1 = d3.scale.linear().range([412, 0]);
    var yAxisRight = d3.svg.axis().scale(y1)  // This is the new declaration for the 'Right', 'y1'
        .tickFormat(function(d) { return format_loss(d); })
        .orient("right").ticks(5);           // and includes orientation of the axis to the right.
    yAxisRight.scale(y1);
    // Set a default range, so we don't get a broken axis if there's no data
    if(maxLoss == 0) {
        y1.domain([0, 1]);
    } else {
        y1.domain([0, maxLoss * axisScale]);
    }
    
    var svg = allTestsChart.svg(); // d3.select('#chart svg');

    svg.attr("viewbox", "0 0 750 465")
        .attr("width", "810px")
        .attr("height", "100%");

      svg.append("g")             
        .attr("class", "axis yr")    
        .attr("transform", "translate(" + '760' + " ,10)")
        .style("fill", "red")   
        .call(yAxisRight);  

      svg.append("text")
          .text("Loss")
          .attr("class", "yr-label")
          .attr("text-anchor", "end")
          .attr("transform", "translate(" + '800' + " ,225) rotate(90)");
});
}; // end drawChart() function
}); // end dojo require function
