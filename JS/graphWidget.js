require(["dojo/dom", "dojo/on", "dojo/hash", "dojo/io-query", "dojo/domReady!"], function(theDom, theOn, theHash, ioQuery){
var dst = dest;
var ma_url = '';
var now = Math.round(new Date().getTime() / 1000);

var timePeriod = ioQuery.queryToObject(theHash()).timeframe || '1w';  // get hash
var time_diff = 0;
var summary_window = 0;


var setTimeVars = function (period) {

    if (period == '4h') {
        time_diff = 60*60 * 4;
        summary_window = 300;
    } else if (period == '1d') {
        time_diff = 86400;
        summary_window = 300;
    } else if (period == '3d') {
        time_diff = 86400 * 3;
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

//var ls_list_url = 'http://ps1.es.net:8096/lookup/activehosts.json';
var ls_list_url = '/serviceTest/graphData.cgi?action=ls_hosts';
var ls_query_url = '/serviceTest/graphData.cgi?action=interfaces';

var src_capacity = 'Unknown';
var src_mtu = 'Unknown';
var dest_capacity = 'Unknown';
var dest_mtu = 'Unknown';

// Speed up calls to hasOwnProperty
var hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}

d3.json(ls_list_url, function(error, ls_list_data) { 
        //if (error) return console.warn(error);
        //var data = ls_list_data;
        var srcCapacity = d3.select('#source_capacity');
        var srcMTU = d3.select('#source_mtu');
        var destCapacity = d3.select('#dest_capacity');
        var destMTU = d3.select('#dest_mtu');
        var rows = [];
        var ips = [source, dest];
        //var remaining = ls_list_data.length * ips.length;
        var remaining = ls_list_data.length;
        //for(var j in ips) {
            for(var ls_index in ls_list_data) {
                var url = ls_list_data[ls_index];
                var ls = ls_query_url + '&ls_url=' + encodeURI(url) + '&source=' + source + '&dest=' + dest;
                d3.json(ls, function(ls_error, interface_data) {
                    if (ls_error) {
                    }
                    if(!isEmpty(interface_data)) {
                        //interface_data.ip = ips[j];
                        rows.push(interface_data);
                    }
                    if (!--remaining) combineData();
                });
            }
        //}

        function combineData() {
            for(var i in rows) {
                var row = rows[i];
                if (row.source_mtu) {
                    src_mtu = row.source_mtu;
                    srcMTU.html( src_mtu );
                }
                if (row.dest_mtu) {
                    dest_mtu = row.dest_mtu;
                    destMTU.html( dest_mtu );
                }
                if (row.source_capacity) {
                    src_capacity = row.source_capacity;
                    srcCapacity.html( d3.format('.2s')(src_capacity) );
                }
                if (row.dest_capacity) {
                    dest_capacity = row.dest_capacity;
                    destCapacity.html( d3.format('.2s')(dest_capacity) );
                }
            }
        }

    
});

var ma_url = 'http%3A%2F%2Flocalhost%2Fesmond%2Fperfsonar%2Farchive%2F';
var uri = document.URL;
if (uri.indexOf('?') > -1) {
    var query = uri.substring(uri.indexOf("?") + 1, uri.length);
    var queryObject = ioQuery.queryToObject(query);
    if (queryObject.url) {
        ma_url = queryObject.url;
        // remove #whatever from ma_url, if applicable
        if (ma_url.indexOf('#') > -1) {
            ma_url = ma_url.substring(0, ma_url.indexOf('#'));
        }
    }
} 

var chartStates = [];

var base_url = '/serviceTest/graphData.cgi?url=' + ma_url + '&action=data&src=' + source + '&dest=' + dest;
var url = '/serviceTest/graphData.cgi?url=' + ma_url + '&action=data&src=' + source + '&dest=' + dest + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;

d3.json('/serviceTest/graphData.cgi?src=' + source + '&dest=' + dest +  '&action=hosts', function(error, hosts) {
   //var srcCapacity = d3.select('#source_capacity');
    var source_host = d3.select('#source_host');
    source_host.html(hosts.source_host);
    var dest_host = d3.select('#dest_host');
    dest_host.html(hosts.dest_host);

});


var loading = d3.select('#chart #loading');

drawChart(url);

function drawChart(url) {

    loading.style('display', 'block');


d3.json(url, function(error,ps_data) {
    loading.style('display', 'none');

    var prevLink = d3.selectAll('.ps-timerange-nav .prev');
    prevLink.on("click", function() { 
        d3.event.preventDefault(); 
        end_ts = end_ts - time_diff;
        start_ts = start_ts - time_diff;
        url = '/serviceTest/graphData.cgi?url=' + ma_url + '&action=data&src=' + source + '&dest=' + dest + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
        d3.selectAll("#chart").selectAll("svg").remove();
        drawChart(url);
        if (end_ts < now ) {
            nextLink.style('display', 'block');
        }
    });
    var nextLink = d3.selectAll('.ps-timerange-nav .next');
    prevLink.html('<a href="#">Previous ' + timePeriod + '</a>');
    nextLink.html('<a href="#">Next ' + timePeriod + '</a>');
    nextLink.on("click", function() { 
        d3.event.preventDefault(); 
        end_ts = end_ts + time_diff;
        start_ts = start_ts + time_diff;
        url = '/serviceTest/graphData.cgi?url=' + ma_url + '&action=data&src=' + source + '&dest=' + dest + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
        d3.selectAll("#chart").selectAll("svg").remove();
        drawChart(url);
    });
    if (end_ts >= now ) {
        nextLink.style('display', 'none');
    }

    timePeriod = ioQuery.queryToObject(theHash()).timeframe || '1w';  // get hash
    if (timePeriod != '') {
        dojo.query('#ps-all-tests #time-selector a.zoomLink').removeClass('active');
        dojo.query('#ps-all-tests #time-selector a.zoomLink').forEach(function(node, index, nodelist) {
            if(node.name == timePeriod) {
                dojo.addClass(node, "active");
            }
        });
    }

    var start_date = new Date (start_ts);
    var end_date = new Date (end_ts);

    var allTestsChart = dc.compositeChart("#ps-all-tests");
    var throughputChart = dc.psLineChart(allTestsChart);
    var revThroughputChart = dc.psLineChart(allTestsChart);
    var owdelayChart = dc.psLineChart(allTestsChart);
    var revOwdelayChart = dc.psLineChart(allTestsChart);
    var lossChart = dc.psLineChart(allTestsChart);
    var revLossChart = dc.psLineChart(allTestsChart);
    var packetRetransChart = dc.psLineChart(allTestsChart);
    var revPacketRetransChart = dc.psLineChart(allTestsChart);

    var ndx = crossfilter(ps_data);
    var lineDimension = ndx.dimension(function (d) { return new Date( d.ts * 1000); });

    function make_functions(param) {
        return [
            // Add        
            function(p, v) {                
                if (v[param] !== null) {
                    ++p.count;
                    p.sum += v[param];
                    p.avg = p.sum/p.count;
                    p.isNull = false;
                } else {
                    //p.avg = null;
                    p.isNull = true;
                } 
                return p;
            },

            // Remove
            function (p, v) {
                if (v[param] !== null) {
                    --p.count;
                    p.sum -= v[param];
                    p.avg = p.sum/p.count;
                } 
                return p;
            },

            // Init
            function() {
                return { count: 0, sum: 0, avg: 0 };
            }

        ];
    }

    var throughputGroup = lineDimension.group().reduce.apply(lineDimension, make_functions('throughput_src_val'));
    var revThroughputGroup = lineDimension.group().reduce.apply(lineDimension, make_functions('throughput_dst_val'));
    var owdelayGroup = lineDimension.group().reduce.apply(lineDimension, make_functions('owdelay_src_val'));
    var revOwdelayGroup = lineDimension.group().reduce.apply(lineDimension, make_functions('owdelay_dst_val'));
    var lossGroup = lineDimension.group().reduce.apply(lineDimension, make_functions('loss_src_val'));
    var revLossGroup = lineDimension.group().reduce.apply(lineDimension, make_functions('loss_dst_val'));
    var packetRetransGroup = lineDimension.group().reduceSum(function(d) { return d.packet_retransmits_src_val; } );
    var revPacketRetransGroup = lineDimension.group().reduceSum(function(d) { return d.packet_retransmits_dst_val; } );

    var avgOrder = function(p) { 
        return p.avg; 
    };
    var avgOrderInv = function(p) { 
        return -p.avg; 
    };
    var valOrder = function(p) { return p; };
    

    var format_throughput = function(d) { return d3.format('.3s')(d) + 'bps';  }
    var format_latency = function(d) { return d3.format('.3f')(d) + 'ms';  }
    var format_loss = function(d) { return d3.format('.3%')(d);  }
    var format_ts = function(d) { return d3.time.format('%X %x')(d); }
    var format_ts_header = function(d) { return d3.time.format('%c')(d); }

    var maxThroughput = throughputGroup.order(avgOrder).top(1)[0].value.avg;
    var maxRevThroughput = revThroughputGroup.order(avgOrder).top(1)[0].value.avg;
    var minThroughput = throughputGroup.order(avgOrderInv).top(1)[0].value.avg;
    var minRevThroughput = revThroughputGroup.order(avgOrderInv).top(1)[0].value.avg;
    maxThroughput = (maxThroughput > maxRevThroughput? maxThroughput : maxRevThroughput);
    minThroughput = (minThroughput < minRevThroughput ? minThroughput : minRevThroughput);
    
    var maxDelay = owdelayGroup.order(avgOrder).top(1)[0].value.avg;
    console.log("original maxDelay: " + maxDelay);
    var minDelay = owdelayGroup.order(avgOrderInv).top(1)[0].value.avg;
    var maxRevDelay = revOwdelayGroup.order(avgOrder).top(1)[0].value.avg;
    console.log("original maxRevDelay: " + maxRevDelay);
    var minRevDelay = revOwdelayGroup.order(avgOrderInv).top(1)[0].value.avg;
    maxDelay = (maxDelay > maxRevDelay ? maxDelay : maxRevDelay);
    //if (maxDelay === 0) { maxDelay = 1; }
    minDelay = (minDelay < minRevDelay ? minDelay : minRevDelay);
    minDelay = 0;
    var maxLoss = lossGroup.order(avgOrder).top(1)[0].value.avg; 
    var minLoss = lossGroup.order(avgOrderInv).top(1)[0].value.avg; 
    var maxRevLoss = revLossGroup.order(avgOrder).top(1)[0].value.avg; 
    var minRevLoss = revLossGroup.order(avgOrderInv).top(1)[0].value.avg; 
    maxLoss = (maxLoss > maxRevLoss ? maxLoss: maxRevLoss);
    minLoss = (minLoss < minRevLoss ? minLoss : minRevLoss);
    var maxPacketRetrans = packetRetransGroup.top(1)[0].value; 
    var maxRevPacketRetrans = revPacketRetransGroup.top(1)[0].value; 
    maxPacketRetrans = (maxRevPacketRetrans > maxPacketRetrans ? maxRevPacketRetrans : maxPacketRetrans);
    console.log('maxPacketRetrans: ' + maxPacketRetrans);
    console.log('maxRevPacketRetrans: ' + maxRevPacketRetrans);
    var minY = minDelay;
    var maxY = maxDelay;
    var axisScale = 1.1; // Scale the axes so we have some padding at the top
    var yAxisMax = 100; // All right Y axes will be scaled to max out at this value
    var yNegPadAmt = 0; // RATIO by which to pad negative y axis
    if (minY < 0) { // && maxY != 0) {
        yNegPadAmt = Math.abs(minY / maxY);
    }
    if (maxLoss < 0 && minLoss < 0) { 
        //yNegPadAmt = yNegPadAmt * -1;
        //yAxisMax = 100;
    }
    console.log('yNegPadAmt: ' + yNegPadAmt);

    var setHeader = function() { 
        var rangeLabel = format_ts_header(new Date(1000 * start_ts)) + ' -- ' + format_ts_header(new Date(1000 * end_ts));
        var chartHeader = d3.select('.chartTimeRange').html( rangeLabel );
    };

    setHeader();
    
    throughputChart.dimension(lineDimension)
        .group(throughputGroup, "Throughput")
        .mouseZoomable(true)
        //.renderDataPoints(true)
        //.interpolate('bundle')
        
        //.defined(function(d) { 
        //        return (!isNaN(d.data.value.avg)); 
        //})
        .valueAccessor(function (d) {
            return d.value.avg; 
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

    revThroughputChart.dimension(lineDimension)
        .group(revThroughputGroup, "Reverse Throughput")
        .mouseZoomable(true)
        //.renderDataPoints(true)
        //.interpolate('bundle')
        
        //.defined(function(d) { 
        //        return (!isNaN(d.data.value.avg)); 
        //})
        .valueAccessor(function (d) {
            return d.value.avg; 
        })
        .brushOn(false)     
        .dashStyle([3, 3]) 
        //.renderDataPoints(true) 
        .title(function(d){
            return 'Reverse Throughput: ' + format_throughput(d.value.avg) 
                + "\n" + format_ts(d.key);        
            })
        //.elasticY(true)
        .yAxis().tickFormat(d3.format('.2s'))
        ;
    
    owdelayChart.dimension(lineDimension)
        .group(owdelayGroup, "Latency")
        //.renderDataPoints(true)
         
        .defined(function(d) {
                return (!isNaN(d.data.value.avg));
                //return (d.data.value !== 0);
                })

        .valueAccessor(function (d) {
            return yAxisMax * d.value.avg / maxDelay; 
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

    revOwdelayChart.dimension(lineDimension)
        .group(revOwdelayGroup, "Reverse Latency")
        //.renderDataPoints(true)
         
        .defined(function(d) {
                return (!isNaN(d.data.value.avg));
                //return (d.data.value !== 0);
                })

        .valueAccessor(function (d) {
            return yAxisMax * d.value.avg / maxDelay; 
        })
        //.interpolate('bundle')
        .brushOn(false)        
        .colors("#00ff00")
        .dashStyle([3, 3]) 
        .title(function(d){
            return "Reverse Latency: " + format_latency(d.value.avg) + "\n"
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
        .defined(function(d) {
                return (!d.data.value.isNull);
                })
        .valueAccessor(function(d) {
            if (d.value.avg != 0) { 
                return yAxisMax * d.value.avg / maxLoss; 

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

    revLossChart.dimension(lineDimension)
        .group(revLossGroup, "Reverse Loss")
        .renderDataPoints(true) 
        .mouseZoomable(true)
        .brushOn(false)       
        .defined(function(d) {
                return (!d.data.value.isNull);
                })
        .valueAccessor(function(d) {
            if (d.value.avg != 0) { 
                return yAxisMax * d.value.avg / maxLoss; 

            } else {
                return 0.01; // TODO: fix: hacky -- so we see "0" values
            }
                
        }) 
        .title(function(d){
            return "Reverse Loss: " + format_loss(d.value.avg) + "\n"
                + format_ts(d.key);
            })
        .colors("#FF704D")
        .dashStyle([3, 3]) 
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
                if (isNaN(d.value) || d.value > maxPacketRetrans) {
                    alert("NaN! " +d.value);
                }
            if (maxPacketRetrans !== 0) {
                return yAxisMax * d.value / maxPacketRetrans; 
            } else {
                return 0;
            }
        })
        .defined(function(d) {
                return (!isNaN(d.data.value));
                //return (d.data.value !== 0);
                })
        
        .useRightYAxis(true) 
        .brushOn(false)      
        .title(function(d){
            return 'Retransmitted packets: ' + d.value 
                + "\n" + format_ts(d.key);        
            })
        ;

    revPacketRetransChart.dimension(lineDimension)
        .group(revPacketRetransGroup, "Reverse Packet Retransmissions")
        .mouseZoomable(true)
        .colors("#ff00ff")
        //.renderDataPoints(true)
        //.interpolate('bundle')
        .dashStyle([3, 3])
        .valueAccessor(function (d) {
            if (d.value !== 0) {
                return yAxisMax * d.value / maxPacketRetrans; 
            } else {
                return 0;
            }
        })
        
        .useRightYAxis(true) 
        .brushOn(false)      
        .title(function(d){
            return 'Reverse retransmitted packets: ' + d.value 
                + "\n" + format_ts(d.key);        
            })
        ;

    var allCharts = [throughputChart, revThroughputChart, owdelayChart, revOwdelayChart, lossChart, revLossChart, packetRetransChart, revPacketRetransChart];
    var activeCharts = [throughputChart, revThroughputChart, owdelayChart, revOwdelayChart, lossChart, revLossChart, packetRetransChart, revPacketRetransChart];

        if (yNegPadAmt > 0) { // Temporarily disable
            //yAxisMax = yAxisMax*yNegPadAmt;
        }
        //var minDel = minDelay; // / yNegPadAmt;
        var minDel = minDelay - (maxDelay * yNegPadAmt ); // / yNegPadAmt;
        minDel = 0; //temporarily override the ability to have negative values (it's not ready)
        var maxDel = maxDelay * axisScale;
        console.log("minDel: " + minDel);
        console.log("maxDel: " + maxDel);
        if (maxDel == 0) {
            maxDel = 1;
        }
    var minThroughputAxis = 0;
    //var minThroughputAxis = 0 - yNegPadAmt * maxThroughput;

    allTestsChart.width(750)
        .height(465)
        .brushOn(false)
        .mouseZoomable(true)
        .shareTitle(false)
        .compose(activeCharts)
        .x(d3.time.scale().domain(d3.extent(ps_data, function(d) { return new Date(d.ts * 1000); })))
        .xAxisLabel('Date')
        .y(d3.scale.linear().domain([minThroughputAxis, axis_value( maxThroughput, 1000000000)]))
        //.elasticY(true)
        .yAxisLabel('Throughput')
        .rightYAxisLabel('Latency (ms)')
        .legend(dc.legend().x(40).y(470).itemHeight(13).gap(5).legendWidth(600).horizontal(true).itemWidth(150))
        .rightY(d3.scale.linear().domain([0, yAxisMax * axisScale]).nice())
        //.rightY(d3.scale.linear().domain([minDel, maxDel]).nice())
        //.rightY(d3.scale.linear().domain([0, axis_value(maxDelay)]).nice())
        .xAxis();
    allTestsChart.yAxis().tickFormat(format_throughput);
    if (maxDelay > 0) {
        allTestsChart.rightYAxis().ticks(5)
                     .tickFormat(function(d) { return d3.format()(Math.round(d * maxDelay / yAxisMax)) });
    }
    allTestsChart.margins().left = 90;

    function axis_value(d, defaultValue) {
        if (d !== 0) {
            return d * axisScale;
        } else {
            return defaultValue;
        }
    }

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
        if (ndx !== null && ndx.size() > 0 ) {    
            dc.filterAll();
            ndx.remove();
        }

        d3.selectAll("#chart").selectAll("svg").remove();
        if (allTestsChart !== null) {
            allTestsChart.resetSvg(); 
        }
        allTestsChart = null;
        lineDimension = null;
        ndx = null;
        drawChart(url);
        setHeader();


    };

    dc.renderAll();

    postRenderTasks();

    function postRenderTasks() {

    var svg = allTestsChart.svg(); // d3.select('#chart svg');
          var svgWidth = svg.attr('width');
          var svgHeight = svg.attr('height');
          var origWidth = 750;
          var origHeight = 465;

    svg.attr("height", +svgHeight + 50);
//          svg.attr("viewbox", "0 0 750 465")
//              .attr("width", (+svgWidth + axisWidth) )
//              .attr("height", "100%");

    console.log('maxLoss: ' + maxLoss);
    // Loss axis
    if (maxLoss == 0) {
        maxLoss = 1;
    }
    var minLossAxis = 0 - (maxLoss * yNegPadAmt);
    var minRetransAxis = 0 - (maxPacketRetrans * yNegPadAmt);
    minRetransAxis = 0; // temporarily override ability to have negative values
    console.log('minLoss: ' + minLossAxis);
    console.log('maxLoss: ' + maxLoss);
    // Loss axis
    //var lossAxis = addAxis(minLossAxis, maxLoss, "Loss", function(d) { return d3.format('.2%')(d); }, "#ff0000");
    var lossAxis = addAxis(0, maxLoss, "Loss", function(d) { return d3.format('.2%')(d * axisScale); }, "#ff0000");
    // Packet retransmissions axis
    var retransAxis = addAxis(0, maxPacketRetrans, "Packet Retransmissions", function(d) { return d * axisScale; }, "#ff00ff");

    var svgSel = allTestsChart.svg();
    //var svgSel = d3.select('#chart svg');
    var dcLegendEvents = svgSel.selectAll('.dc-legend-item').on('click', function(e, i) {
        if (chartStates[i] === undefined || chartStates[i] === true) {
            e.chart.defined(function(d) { return false; });
            chartStates[i] = false;
            d3.event.target.style.fill = 'gray';
        } else {
            e.chart.defined(function(d) { return true; });
            chartStates[i] = true;
            d3.event.target.style.fill = 'black';
        }
        
        allTestsChart.render();
        postRenderTasks();
    });

    } // end function postRenderTasks()

      function addAxis(minVal, maxVal, label, axisFormat, color) {
          var axisWidth = 60;
          var y1 = d3.scale.linear().range([412, 0]);
          var yAxisRight = d3.svg.axis().scale(y1)  // This is the new declaration for the 'Right', 'y1'
              //.tickFormat(function(d) { return d3.format('.2%')(d); } )
              .tickFormat(axisFormat)
              .orient("right").ticks(5);           // and includes orientation of the axis to the right.
          yAxisRight.scale(y1);
          // Set a default range, so we don't get a broken axis if there's no data
          if(maxVal == 0) {
              y1.domain([minVal, 1 * axisScale]);
          } else {
              y1.domain([minVal, maxVal * axisScale]);
              //y1.domain([0, maxLoss]);
          }

          var svg = allTestsChart.svg(); // d3.select('#chart svg');
          var svgWidth = svg.attr('width');
          var svgHeight = svg.attr('height');
          var origWidth = 750;
          var origHeight = 465;

          svg.attr("viewbox", "0 0 750 465")
              .attr("width", (+svgWidth + axisWidth) );
              //.attr("height", "100%");

          svg.append("g")             
              .attr("class", "axis yr")    
              .attr("transform", "translate(" + (+svgWidth + 10) + " ,10)")
              .style("fill", color)   
              .call(yAxisRight);  

          var svgLabel = svg.append("text")
              .text(label)
              .attr("class", "yr-label")
              .attr("text-anchor", "middle")
              .attr("width", svgHeight)
              .attr("transform", "translate(" + (+svgWidth + 50) + " , " + origHeight/2 + ") rotate(90)");
        return yAxisRight;
    }

      
}); // end d3.json call
}; // end drawChart() function
}); // end dojo require function
