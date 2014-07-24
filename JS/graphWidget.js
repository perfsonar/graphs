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
        var srcCapacity = d3.select('#source_capacity');
        var srcMTU = d3.select('#source_mtu');
        var destCapacity = d3.select('#dest_capacity');
        var destMTU = d3.select('#dest_mtu');
        var rows = [];
        var ips = [source, dest];
        var remaining = ls_list_data.length;
        for(var ls_index in ls_list_data) {
        var url = ls_list_data[ls_index];
        var ls = ls_query_url + '&ls_url=' + encodeURI(url) + '&source=' + source + '&dest=' + dest;
        d3.json(ls, function(ls_error, interface_data) {
            if (ls_error) {
            }
            if(!isEmpty(interface_data)) {
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

var base_url = '/serviceTest/graphData.cgi?action=data&url=' + ma_url + '&src=' + source + '&dest=' + dest;
var url = '/serviceTest/graphData.cgi?action=data&url=' + ma_url + '&src=' + source + '&dest=' + dest + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;

d3.json('/serviceTest/graphData.cgi?action=hosts&src=' + source + '&dest=' + dest, function(error, hosts) {
    var source_host = d3.select('#source_host');
    var source_content = hosts.source_ip;
    if (hosts.source_host) {
        source_content = hosts.source_host + ' (' + source_content + ')';
    }
    source_host.html(source_content);

    var dest_host = d3.select('#dest_host');
    var dest_content = hosts.dest_ip;
    if (hosts.dest_host) {
        dest_content = hosts.dest_host + ' (' + dest_content + ')';
    }
    dest_host.html(dest_content);

});


var loading = d3.select('#chart #loading');

drawChart(url);

function drawChart(url) {

    loading.style('display', 'block');

    d3.json(url, function(error,ps_data) {

            drawChartSameCall(error, ps_data);

            function drawChartSameCall(error, ps_data) { 
            loading.style('display', 'none');

            var prevLink = d3.selectAll('.ps-timerange-nav .prev');
            prevLink.on("click", function() { 
                d3.event.preventDefault(); 
                end_ts = end_ts - time_diff;
                start_ts = start_ts - time_diff;
                url = '/serviceTest/graphData.cgi?action=data&url=' + ma_url + '&src=' + source + '&dest=' + dest + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
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
                    url = '/serviceTest/graphData.cgi?action=data&url=' + ma_url + '&src=' + source + '&dest=' + dest + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
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


            var avgOrder = function(p) { 
                return p.avg; 
            };
            var avgOrderInv = function(p) { 
                return -p.avg; 
            };
            var valOrder = function(p) { return p; };
            var valOrderInv = function(p) { return -p; };


            var format_throughput = function(d) { return d3.format('.3s')(d) + 'bps';  }
            var format_latency = function(d) { return d3.format('.3f')(d) + 'ms';  }
            var format_loss = function(d) { return d3.format('.3%')(d);  }
            var format_ts = function(d) { return d3.time.format('%X %x')(d); }
            var format_ts_header = function(d) { return d3.time.format('%c')(d); }

            var format_values = function(d, type) {
                if (type == 'throughput') {
                    return d3.format('.3s')(d) + 'bps';
                } else if (type == 'latency') {
                    return d3.format('.3f')(d) + ' ms';
                } else if (type == 'loss') {
                    return d3.format('.3%f')(d);
                } else if (type == 'ts') {
                    return d3.time.format('%X %x')(d);
                } else if (type == 'ts_header') {
                    return d3.time.format('%c')(d);
                } else {
                    return d;
                }
            }


            var minY = minDelay;
            var maxY = maxDelay;
            var axisScale = 1.1; // Scale the axes so we have some padding at the top
            var yAxisMax = 100; // All right Y axes will be scaled to max out at this value
            var yNegPadAmt = 0; // RATIO by which to pad negative y axis
            if (minY < 0) {
                yNegPadAmt = Math.abs(minY / maxY);
            }
            if (maxLoss < 0 && minLoss < 0) { 
                //yNegPadAmt = yNegPadAmt * -1;
                //yAxisMax = 100;
            }

            var setHeader = function() { 
                var rangeLabel = format_ts_header(new Date(1000 * start_ts)) + ' -- ' + format_ts_header(new Date(1000 * end_ts));
                var chartHeader = d3.select('.chartTimeRange').html( rangeLabel );
            };

            setHeader();

            var charts = {};

            charts.throughput = {};
            charts.throughput.name = 'Throughput';
            charts.throughput.type = 'throughput';
            charts.throughput.unit = 'bps';
            charts.throughput.fieldName = 'throughput';
            charts.throughput.valType = 'avg';
            charts.throughput.color = '#1F77B4'; 
            charts.throughput.valueAccessor = function(d) { return d.value.avg; };
            charts.throughput.showByDefault = true;
            charts.throughput.tickFormat = d3.format('.2s');

            // Latency charts
            charts.latency = {};
            charts.latency.name = 'Latency';
            charts.latency.type = 'latency';
            charts.latency.unit = 'ms';
            charts.latency.fieldName = 'owdelay';
            charts.latency.valType = 'avg';
            charts.latency.color = '#00ff00'; 
            charts.latency.showByDefault = true;
            charts.latency.ticks = 5;
            charts.latency.tickFormat = function(d) { return d3.format('.2f')(d * maxDelay / yAxisMax) };


            // Loss charts 
            charts.loss = {};
            charts.loss.name = 'Loss';
            charts.loss.type = 'loss';
            charts.loss.unit = 'percent';
            charts.loss.fieldName = 'loss';
            charts.loss.valType = 'avg';
            charts.loss.color = '#ff0000'; 
            charts.loss.showByDefault = true;
            charts.loss.tickFormat = d3.format('.2s');
            charts.loss.valueAccessor = function(d) {
                if (d.value.avg != 0) { 
                    return yAxisMax * d.value.avg / maxLoss; 
                } else {
                    return 0.01; // TODO: fix: hacky -- so we see "0" values
                }
            };

            // Packet retrans charts 
            charts.retrans = {};
            charts.retrans.name = 'Packet Retransmissions';
            charts.retrans.type = 'retrans';
            charts.retrans.unit = 'packets';
            charts.retrans.fieldName = 'packet_retransmits';
            charts.retrans.valType = 'sum';
            charts.retrans.color = '#ff00ff'; 
            charts.retrans.showByDefault = false;

            var parentChart = allTestsChart;

            charts.createReverseCharts = function() {
                for(var key in this) {
                    var c = this[key];              // current (forward) chart
                    if (isFunction(c)) {
                        continue;
                    }
                    //this[key + '_rev'] = c;
                    this[key + '_rev'] = {};
                    var rev = this[key + '_rev'];   // newly created reverse values

                    for(var item in c) {
                        rev[item] = c[item];
                    }

                    // Set values that are different in the reverse direction
                    rev.name = 'Reverse ' + rev.name;
                    rev.fieldName = rev.fieldName + '_dst_val';
                    rev.direction = 'reverse';
                    rev.id = key + '_rev';
                    //rev.title = 'Reverse ' + rev.title;

                    // Set values for forward direction
                    c.fieldName = c.fieldName + '_src_val';
                    c.direction = 'normal';
                    c.id = key;
                }

            }
            charts.createGroups = function() {                
                for(var key in this) {
                    var c = this[key];   // 'c' is the current chart
                    if (isFunction(c)) {
                        continue;
                    }
                    c.chart = dc.psLineChart(parentChart);
                    if (c.valType == 'avg') { 
                        c.group = lineDimension.group().reduce.apply(lineDimension, make_functions(c.fieldName));
                        c.max =  c.group.order(avgOrder).top(1)[0].value.avg;
                        c.min =  c.group.order(avgOrderInv).top(1)[0].value.avg;
                    } else if (c.valType == 'sum') {
                        c.group = lineDimension.group().reduceSum(function(d) { return d[c.fieldName]; });
                        c.max = c.group.top(1)[0].value; 
                        c.min = c.group.order(valOrderInv).top(1)[0].value;
                    }
                    var type = this[c.type];
                    // typeMin and typeMax are the min/max values for that type
                    if (typeof type['typeMin'] === "undefined" || c.min < type['typeMin']) {
                        type['typeMin'] = c.min || 0;
                    }
                    if (typeof type['typeMax'] === "undefined" || c.max > type['typeMax']) {
                        type['typeMax'] = c.max || 1;
                    }
                }

                for(var key in this) {
                    var c = this[key];   // 'c' is the current chart
                    if (isFunction(c)) {
                        continue;
                    }
                    c.unitMin = this.getUnitMin(c.unit);
                    c.unitMax = this.getUnitMax(c.unit);
                }
            };
            charts.getUnitMin = function(unit) {
                var min = null;
                for(var key in this) {
                    var c = this[key];   // 'c' is the current chart
                    if (isFunction(c)) {
                        continue;
                    }
                    if (c.unit == unit) {
                        if (typeof min === 'undefined' || c.min < min) {
                            min = c.min;
                        }
                    }
                } 
                return min;
            };
            charts.getUnitMax = function(unit) {
                var max = null;
                for(var key in this) {
                    var c = this[key];   // 'c' is the current chart
                    if (isFunction(c)) {
                        continue;
                    }
                    if (c.unit == unit) {
                        if (typeof max === 'undefined' || c.max > max) {
                            max = c.max;
                        }
                    }
                } 
                return max;
            };

            charts.createCharts = function() {
                this.createReverseCharts();
                this.createGroups();
                for(var key in this) {
                    var c = this[key];   // 'c' is the current chart
                    this.createChart(c);
                }
                this.createLegend('#legend'); 
                return this;
            };
            charts.createChart = function(currentChart) {
                var c = currentChart;
                if (isFunction(c)) {
                    //continue;
                    return;
                }
                c.chart = dc.psLineChart(parentChart);
                // The groups were created above, but we have to add them here
                c.chart.group(c.group, c.name);
                if (c.valType == 'avg') { 
                    c.chart.valueAccessor(function (d) {
                            return yAxisMax * d.value.avg / c.unitMax; 
                            });
                    c.title = function(d) { return c.name + ': ' + format_values(d.value.avg, c.type)
                        + "\n" + format_values(d.key, 'ts'); };
                } else if (c.valType == 'sum') {
                    c.chart.valueAccessor(function(d) { return yAxisMax * d.value / c.unitMax; }); 
                    c.title = function(d) { return c.name + ': ' + format_values(d.value, c.type)
                        + "\n" + format_values(d.key, 'ts'); };
                }
                var type = this[c.type];
                if (c.valueAccessor) { c.chart.valueAccessor(c.valueAccessor) };
                if (c.tickFormat) { c.chart.yAxis().tickFormat(c.tickFormat); }
                c.chart.colors(c.color);
                c.chart.title(c.title);
                if (c.direction == 'reverse') {
                    c.chart.dashStyle([3, 3]);
                    c.dashstyle = [3, 3];
                } 
                if (c.type != 'throughput') {
                    c.chart.useRightYAxis(true);

                }
            }; 
            charts.getAllObjects = function() {
                var theCharts = [];
                var typeOrder = this.getChartOrder();
                var directionOrder = this.getDirectionOrder();
                for(var typeIndex in typeOrder) {
                    var type = typeOrder[typeIndex];
                    for(var directionIndex in directionOrder) {
                        var direction = directionOrder[directionIndex];
                        if (typeof this[type + direction] !== 'undefined') {
                            if (isFunction(this[type + direction])) { 
                                continue;
                            }
                            theCharts.push(this[type + direction]);
                        }

                    }
                }
                return theCharts;
            };
            charts.getActiveObjects = function() {
                var allCharts = this.getAllObjects();
                var theCharts = [];
                var typeOrder = this.getChartOrder();
                var directionOrder = this.getDirectionOrder();
                for(var typeIndex in typeOrder) {
                    var type = typeOrder[typeIndex];
                    for(var directionIndex in directionOrder) {
                        var direction = directionOrder[directionIndex];
                        if (typeof this[type + direction] !== 'undefined') {
                            var c = this[type + direction];
                            var theType = c.type + (c.direction == 'reverse' ? '_rev' : '');
                            var cb = d3.select('#' + theType + "_checkbox");
                            cb.on("change", function() { drawChartSameCall(error, ps_data); });
                            if (cb && cb.property('checked') == false) {
                                continue;
                            } 

                            theCharts.push(c);
                        }

                    }
                }
                return theCharts;
            };
            charts.getActiveCharts = function() {
                var activeObjects = this.getActiveObjects();
                var theCharts = [];
                for(var key in activeObjects) {
                    theCharts.push(activeObjects[key].chart);
                }
                return theCharts;
            }
            charts.getChartOrder = function() {
                var chartOrder = ['throughput', 'latency', 'loss', 'retrans'];
                return chartOrder;
            };
            charts.getDirectionOrder = function() { return ['', '_rev']; };
            charts.createLegend = function(divId) {
                var activeObjects = this.getAllObjects();
                var parentDiv = d3.select(divId);
                var dataDiv = parentDiv.selectAll('div');
                dataDivElements = dataDiv.data(activeObjects).enter().append('div');
                dataDivElements.attr('class', 'dc-legend-item');
                var cbElements = dataDivElements.data(activeObjects).append('input')
                    .attr('type', 'checkbox')
                    .attr('id', function(d) { return d.id + '_checkbox'; })
                    .property('checked', function(d) { return d.showByDefault; });
                var cbIcons = dataDivElements.data(activeObjects).append('span')
                    .classed('legend-line', true)
                    .classed('reverse', function(d) { return d.direction == 'reverse'; })
                    .style('border-color', function(d) { return d.color; });
                var cbTitles = dataDivElements.data(activeObjects).append('text')
                    .text(function(c) { return c.name; });

                var cb = d3.selectAll(divId + ' .dc-legend-item');
                cb.on("mouseover", function(d, e) { 
                        allTestsChart.legendHighlight(d); 
                        });
                cb.on("mouseout", function(d, e) {
                        allTestsChart.legendReset(d);
                        });
            };

            charts.createCharts();
            var maxThroughput = charts.throughput.typeMax;
            var minThroughput = charts.throughput.typeMin;
            var maxDelay = charts.latency.typeMax;
            var minDelay = charts.latency.typeMin;

            //if (maxDelay === 0) { maxDelay = 1; }
            minDelay = 0;
            var maxLoss = charts.loss.typeMax;
            var minLoss = charts.loss.typeMin;

            var maxPacketRetrans = charts.retrans.typeMax;
            var minPacketRetrans = charts.retrans.typeMin;

            var activeCharts = charts.getActiveCharts();
            //console.log(activeCharts);

            if (yNegPadAmt > 0) { // Temporarily disable
                //yAxisMax = yAxisMax*yNegPadAmt;
            }
            //var minDel = minDelay; // / yNegPadAmt;
            var minDel = minDelay - (maxDelay * yNegPadAmt ); // / yNegPadAmt;
            minDel = 0; //temporarily override the ability to have negative values (it's not ready)
            var maxDel = maxDelay * axisScale;
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
                .legend(dc.legend().x(40).y(570).itemHeight(13).gap(5).legendWidth(600).horizontal(true).itemWidth(150))
                .rightY(d3.scale.linear().domain([0, yAxisMax * axisScale]).nice())
                //.rightY(d3.scale.linear().domain([minDel, maxDel]).nice())
                //.rightY(d3.scale.linear().domain([0, axis_value(maxDelay)]).nice())
                .xAxis();
            allTestsChart.yAxis().tickFormat(format_throughput);
            if (maxDelay > 0) {
                allTestsChart.rightYAxis().ticks(5)
                    .tickFormat(function(d) { return d3.format('.2f')(d * maxDelay / yAxisMax) });
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

                svg.attr("height", +svgHeight + 50);

                // Loss axis
                if (maxLoss == 0) {
                    maxLoss = 1;
                }
                var minLossAxis = 0 - (maxLoss * yNegPadAmt);
                var minRetransAxis = 0 - (maxPacketRetrans * yNegPadAmt);
                minRetransAxis = 0; // temporarily override ability to have negative values
                // Loss axis
                //var lossAxis = addAxis(minLossAxis, maxLoss, "Loss", function(d) { return d3.format('.2%')(d); }, "#ff0000");
                var lossAxis = addAxis(0, maxLoss, "Loss", function(d) { return d3.format('.2%')(d * axisScale); }, "#ff0000");
                // Packet retransmissions axis
                var retransAxis = addAxis(0, maxPacketRetrans, "Packet Retransmissions", function(d) { return d * axisScale; }, "#ff00ff");

                var svgSel = allTestsChart.svg();
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

            function isFunction(functionToCheck) {
                var getType = {};
                return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
            }
            } // end drawChartAfterCall()
            }); // end d3.json call
    }; // end drawChart() function
}); // end dojo require function
