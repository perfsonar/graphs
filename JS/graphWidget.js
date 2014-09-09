require(["dojo/dom", "dojo/on", "dojo/hash", "dojo/io-query", "dojo/domReady!"], function(theDom, theOn, theHash, ioQuery){

var ma_url = '';
var now = Math.round(new Date().getTime() / 1000);

var timePeriod = ioQuery.queryToObject(theHash()).timeframe || '1w';  // get hash
var time_diff = 0;
var summary_window = 0;


var setTimeVars = function (period) {

    if (period == '4h') {
        time_diff = 60*60 * 4;
        summary_window = 0;
    } else if (period == '1d') {
        time_diff = 86400;
        summary_window = 0;
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
//var start_ts = end_ts - 86400 * 7;
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
        var rows = [];
        var remaining = ls_list_data.length;
        for(var ls_index in ls_list_data) {
	    var url = ls_list_data[ls_index];
	    var ls = ls_query_url + '&ls_url=' + encodeURI(url) + array2param('source', sources) + array2param('dest', dests);
	    d3.json(ls, function(ls_error, interface_data) {
		    if (ls_error){
			// should do something with this
		    }
		    if(!isEmpty(interface_data)) {
			rows.push(interface_data);
		    }
		    if (!--remaining){
			combineData();
		    }
		});
        }

        function combineData() {   

            for(var i in rows) {
                var results = rows[i];

		for (var j in results){
		    row = rows[i][j];
		
		    for (var k in sources){
			if (sources[k] == row.source_ip){
			    var srcCapacity = d3.select('#source_capacity_' + k);
			    var srcMTU = d3.select('#source_mtu_' + k);
			    
			    if (row.source_mtu) {
				src_mtu = row.source_mtu;
				srcMTU.html( src_mtu );
			    }
			    
			    if (row.source_capacity) {
			    src_capacity = row.source_capacity;
			    srcCapacity.html( d3.format('.2s')(src_capacity) );
			    }
			    
			}
			
			if(dests[k] == row.dest_ip){
			    var destCapacity = d3.select('#dest_capacity_' + k);
			    var destMTU = d3.select('#dest_mtu_' + k);    
			    
			    if (row.dest_mtu) {
				dest_mtu = row.dest_mtu;
				destMTU.html( dest_mtu );
			    }
			    if (row.dest_capacity) {
				dest_capacity = row.dest_capacity;
				destCapacity.html( d3.format('.2s')(dest_capacity) );
			    }			
			}
		    }
		}
	    }
	}   
    });

// default ma url, pre-encoded
var ma_urls = ['http%3A%2F%2Flocalhost%2Fesmond%2Fperfsonar%2Farchive%2F'];

var uri = document.URL;
if (uri.indexOf('?') > -1) {
    var query = uri.substring(uri.indexOf("?") + 1, uri.length);
    var queryObject = ioQuery.queryToObject(query);
    if (queryObject.url) {

        ma_urls = queryObject.url;

	// force it into array form
	if(typeof(ma_urls) != 'object'){
	    ma_urls = [ma_urls];
	}

        // remove #whatever from ma_url, if applicable
	for (var i = 0; i < ma_urls.length; i++){
	    var ma_url = ma_urls[i];   
            if (ma_url.indexOf('#') > -1) {
                ma_urls[i] = ma_url.substring(0, ma_url.indexOf('#'));
            }
	}
    }
} 

var chartStates = [];

var base_url = '/serviceTest/graphData.cgi?action=data';
base_url += array2param('url', ma_urls);
base_url += array2param('src', sources);
base_url += array2param('dest', dests);


// do a DNS lookup on the source/dests
d3.json('/serviceTest/graphData.cgi?action=hosts' + array2param('src', sources) + array2param('dest', dests), function(error, hosts) {
	for (var i = 0; i < hosts.length; i++){
	    var source_host = d3.select('#source_host_' + i);
	    source_host.html(hosts[i].source_host);
	    var source_ip = d3.select('#source_ip_' + i);
        source_ip.html(hosts[i].source_ip);
	    var dest_host = d3.select('#dest_host_' + i);
	    dest_host.html(hosts[i].dest_host);
	    var dest_ip = d3.select('#dest_ip_' + i);
        dest_ip.html(hosts[i].dest_ip);
        var tr_url = '/serviceTest/graphData.cgi?action=has_traceroute_data&url=' + ma_urls[i] 
            + '&source=' + hosts[i].source_ip + '&dest=' + hosts[i].dest_ip;
        get_traceroute_data(tr_url, dest_ip);
	}

});

function get_tr_url(url) { return function() { return url; }; }

function get_traceroute_data(url, div) {
        d3.json(url, function(trace_error, trace_data) {
            if (typeof trace_data !== "undefined") {
                if (typeof trace_data.has_traceroute !== "undefined" && trace_data.has_traceroute == 1) {
                    var tr_link = div.append('span');
                    tr_link.classed("traceroute", true);
                    var trace_url = '/toolkit/gui/psTracerouteViewer/index.cgi?';
                    trace_url += '&mahost=' + trace_data.ma_url;
                    trace_url += '&stime=yesterday';
                    trace_url += '&etime=now';
                    //trace_url += '&tzselect='; // Commented out (allow default to be used)
                    trace_url += '&epselect=' + trace_data.traceroute_uri;
                    trace_url += '';
                    tr_link.html('[<a href="' + trace_url + '" target="_blank">traceroute</a>]');
                }
            }

        });

}


var loading = d3.select('#chart #loading');
drawChart(base_url + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window);



function drawChart(url) {

    loading.style('display', 'block');

    d3.json(url, function(error,ps_data) {

            drawChartSameCall(error, ps_data);

            function drawChartSameCall(error, ps_data) { 
            loading.style('display', 'none');

            timePeriod = ioQuery.queryToObject(theHash()).timeframe || '1w';  // get hash
            var prevLink = d3.selectAll('.ps-timerange-nav .prev');
            prevLink.on("click", function() { 
                d3.event.preventDefault(); 
                end_ts = end_ts - time_diff;
                start_ts = start_ts - time_diff;
                var new_url = base_url + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
                d3.selectAll("#chart").selectAll("svg").remove();
                cleanupObjects();
                drawChart(new_url);
                setHeader();
                if (end_ts < now ) {
		    nextLink.style('display', 'block');
                }
                return;
                });
            var nextLink = d3.selectAll('.ps-timerange-nav .next');
            nextLink.on("click", function() { 
                    d3.event.preventDefault(); 
                    end_ts = end_ts + time_diff;
                    start_ts = start_ts + time_diff;
                    var new_url = base_url +'&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
                    d3.selectAll("#chart").selectAll("svg").remove();
                    cleanupObjects();
                    drawChart(new_url);
                    return;
                    });
            if (end_ts >= now ) {
                nextLink.style('display', 'none');
            }

            prevLink.html('<a href="#">Previous ' + timePeriod + '</a>');
            nextLink.html('<a href="#">Next ' + timePeriod + '</a>');
            if (timePeriod != '') {
                dojo.query('#ps-all-tests #time-selector a.zoomLink').removeClass('active');
                dojo.query('#ps-all-tests #time-selector a.zoomLink').forEach(function(node, index, nodelist) {
                        if(node.name == timePeriod) {
                        dojo.addClass(node, "active");
                        }
                        });
            }

            var start_date = new Date (start_ts * 1000);
            var end_date = new Date (end_ts * 1000);

            var allTestsChart = dc.compositeChart("#ps-all-tests");

            var ndx = crossfilter(ps_data);
            var lineDimension = ndx.dimension(function (d) { return new Date( d.ts * 1000); });

            function make_functions(param) {
                return [
                    // Add        
                    function(p, v) {                
                        ++p.total_count;
                        if ( v[param] !== null ) {
                            ++p.count;
                            p.sum += v[param];
                            p.avg = p.sum/p.count;
                            p.val = v[param];
                            var re = /_src_val$/;
                            if (re.test(param)) {
                                p.retrans = v['packet_retransmits_src_val'] || 0;
                            } else {
                                p.retrans = v['packet_retransmits_dst_val'] || 0;
                            }                             
                            p.isNull = false; 
                        } else {
                            // Mark p as null, but only if it hasn't already been flagged as not null
                            if (!p.isNull) { 
                                p.isNull = true;
                            } 
                        }
                        return p;
                    },

                    // Remove
                    function (p, v) {
                        if ( v[param] !== null ) {
                            --p.count;
                            p.sum -= v[param];
                            p.avg = p.sum/p.count;
                        } 
                        return p;
                    },

                    // Init
                    function() {
                        return { count: 0, sum: 0, avg: 0, total_count: 0, retrans: 0 };
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
                    return d3.format('.2s')(d) + 'bps';
                } else if (type == 'latency' || type == 'ping') {
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
            // Handle zoom events
            dojo.query('#ps-all-tests #time-selector a.zoomLink').onclick(function(e){ 
                    e.preventDefault();
                    var timePeriod = e.currentTarget.name;
                    dojo.query('#ps-all-tests #time-selector a.zoomLink').removeClass('active');
                    dojo.addClass(e.currentTarget, 'active');
                    theHash("timeframe=" + timePeriod);
                    reloadChart(timePeriod);
                });

            var charts = {};

            charts.throughput = {};
            charts.throughput.name = 'Throughput';
            charts.throughput.type = 'throughput';
            charts.throughput.unit = 'bps';
            charts.throughput.fieldName = 'throughput';
            charts.throughput.valType = 'avg';
            charts.throughput.color = '#0076b4'; 
            //charts.throughput.valueAccessor = function(d) { return d.value.avg; };
            charts.throughput.showByDefault = true;
            //charts.throughput.tickFormat = d3.format('.2s');
            charts.throughput.tickFormat = function(d) { return d3.format('.3s')(d) + 'bps';  };

            // Latency charts
            charts.latency = {};
            charts.latency.name = 'Latency';
            charts.latency.type = 'latency';
            charts.latency.unit = 'ms';
            charts.latency.fieldName = 'owdelay_minimum';
            charts.latency.valType = 'avg';
            //charts.latency.color = '#2b9f78'; 
            //charts.latency.color = '#f0e54b'; 
            //charts.latency.color = '#5cb6ea'; 
            charts.latency.color = '#663333'; 

            charts.latency.showByDefault = true;
            charts.latency.ticks = 5;
            charts.latency.tickFormat = function(d) { return d3.format('.2f')(d ) };

            // Ping charts
            charts.ping = {};
            charts.ping.name = 'Ping';
            charts.ping.type = 'ping';
            charts.ping.unit = 'ms';
            charts.ping.fieldName = 'ping_minimum';
            charts.ping.valType = 'avg';
            charts.ping.color = '#e5a11c'; 
            charts.ping.showByDefault = true;
            charts.ping.ticks = 5;
            charts.ping.tickFormat = function(d) { return d3.format('.2f')(d ) };

            // Loss charts 
            charts.loss = {};
            charts.loss.name = 'Loss';
            charts.loss.type = 'loss';
            charts.loss.unit = 'percent';
            charts.loss.fieldName = 'loss';
            charts.loss.valType = 'avg';
            charts.loss.color = '#cc7dbe'; 
            //charts.loss.color = '#5cb6ea'; 
            charts.loss.showByDefault = true;
            charts.loss.tickFormat = function(d) { return d3.format('.2%')(d) };
            /*charts.loss.valueAccessor = function(d) {
                if (d.value.avg != 0) { 
                    return yAxisMax * d.value.avg / maxLoss; 
                } else {
                    return 0.01; // TODO: fix: hacky -- so we see "0" values
                }
            };*/

            // Packet retrans charts 
            
            charts.retrans = {};
            charts.retrans.name = 'Packet Retransmissions';
            charts.retrans.type = 'retrans';
            charts.retrans.unit = 'packets';
            charts.retrans.fieldName = 'packet_retransmits';
            charts.retrans.valType = 'sum';
            charts.retrans.color = '#00ffff'; 
            charts.retrans.showByDefault = false;
            charts.retrans.tickFormat = function(d) { return d };
            charts.retrans.hide = true; 

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
                        var topMin = c.group.order(avgOrderInv).top(1);
                        var topMax = c.group.order(avgOrder).top(1);
                        if (typeof topMin === 'undefined' || typeof topMax === 'undefined' 
                                || topMin.length == 0 || topMax.length == 0 || topMax[0].value.count == 0 ) {
                            c.hasValues = false;
                        } else {
                            c.max =  c.group.order(avgOrder).top(1)[0].value.avg || 0;
                            c.min =  c.group.order(avgOrderInv).top(1)[0].value.avg || 0;
                            c.hasValues = true;
                        }
                    } else if (c.valType == 'sum') {
                        c.group = lineDimension.group().reduceSum(function(d) { return d[c.fieldName]; });
                        var topMin = c.group.order(valOrderInv).top(1);
                        var topMax = c.group.order(valOrder).top(1);
                        if (typeof topMin === 'undefined' || typeof topMax === 'undefined' 
                                || topMin.length == 0 || topMax.length == 0 || isNaN(topMax[0].value) ) {
                            c.hasValues = false;
                        } else {
                            c.max = c.group.order(valOrder).top(1)[0].value; 
                            c.min = c.group.order(valOrderInv).top(1)[0].value;
                            c.hasValues = true;
                        }
                    }
                    var type = this[c.type];
                    // typeMin and typeMax are the min/max values for that type
                    if (typeof type['typeMin'] === "undefined" || c.min < type['typeMin']) {
                        type['typeMin'] = c.min || 0;
                    }
                    if (typeof type['typeMax'] === "undefined" || c.max > type['typeMax']) {
                        type['typeMax'] = c.max || 0;
                    }
                }

                for(var key in this) {
                    var c = this[key];   // 'c' is the current chart
                    if (isFunction(c)) {
                        continue;
                    }
                    c.unitMin = this.getUnitMin(c.unit) || 0;
                    c.unitMax = this.getUnitMax(c.unit) || 0;
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
                    c.chart.valueAccessor(function (d) { return yAxisMax * d.value.avg / c.unitMax; });
                    if (c.type == 'loss') {
                        c.chart.valueAccessor(function(d) { 
                                if (d.value.avg != 0) { 
                                    return yAxisMax * d.value.avg / c.unitMax; 
                                } else {
                                    return 0.01; // TODO: fix: hacky -- so we see "0" values
                                }

                        });

                    }
                    c.title = function(d) { return c.name + ': ' 
                        + format_values(d.value.avg, c.type)
                        + "\n" + format_values(d.key, 'ts'); };
                    if (c.type == 'throughput') {
                        c.title = function(d) { 
                            var ret = c.name + ': '
                            + format_values(d.value.avg, c.type);
                            if (d.value.retrans > 0) {
                                ret += "\nPacket Retransmissions: " + d.value.retrans;
                            }
                            ret += "\n" + format_values(d.key, 'ts'); 
                            return ret;
                        };
                    }
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
            charts.getAvailableObjects = function() {
                var allCharts = this.getAllObjects();
                var theCharts = [];
                for(var i in allCharts) {
                    var c = allCharts[i];
                    if (c.hasValues && !c.hide) {
                        theCharts.push(c);
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
                        if (typeof this[type + direction] !== 'undefined' && this[type + direction].hasValues && !this[type + direction].hide) {
                            var c = this[type + direction];                            
                            var theType = c.type + (c.direction == 'reverse' ? '_rev' : '');
                            var cb = d3.select('#' + theType + "_checkbox");
                            if (cb !== null && !cb.empty()) {
                                cb.on("change", function() { drawChartSameCall(error, ps_data); });
                                if (cb.property('checked') == false) {
                                    continue;
                                } 
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
                var chartOrder = ['throughput', 'latency', 'ping', 'loss', 'retrans'];
                return chartOrder;
            };
            charts.getAxes = function() {                
                var theAxes = []; // Use an array to maintain order
                var unitsAdded = [];
                var activeObjects = this.getActiveObjects();
                var j = 0;                
                for(var i in activeObjects) {
                    var o = activeObjects[i];
                    var thisObj = {};
                    thisObj.name = o.name;
                    thisObj.min = o.unitMin;
                    thisObj.max = o.unitMax;
                    thisObj.unit = o.unit;
                    thisObj.color = o.color;
                    // if this is our first axis, OR if this type has the same unit
                    // as the first axis
                    if (j == 0 || (theAxes[0] && thisObj.unit == theAxes[0].unit)) {
                        o.useRightYAxis = false;
                        o.chart.useRightYAxis(false);
                    } else {
                        o.useRightYAxis = true;
                        o.chart.useRightYAxis(true);
                    }
                    // Only add the unit if it's not already in the array
                    if (unitsAdded.indexOf(o.unit) == -1) {
                        if (o.tickFormat) {
                            thisObj.tickFormat = o.tickFormat;
                        }
                        theAxes.push(thisObj);
                        unitsAdded.push(o.unit);
                        j++;
                    }
                }
                return theAxes;
            };
            charts.getDirectionOrder = function() { return ['', '_rev']; };
            charts.createLegend = function(divId) {
                var activeObjects = this.getAvailableObjects();
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
                //if (cb !== null && !cb.empty()) {
                cb.on("mouseover", function(d, e) { 
                        allTestsChart.legendHighlight(d); 
                        });
                cb.on("mouseout", function(d, e) {
                        allTestsChart.legendReset(d);
                        });
                //}
            };

            charts.createCharts();
            var maxThroughput = charts.throughput.typeMax;
            var minThroughput = charts.throughput.typeMin;
            var maxDelay = charts.latency.typeMax;
            var minDelay = charts.latency.typeMin;

            minDelay = 0;
            var maxLoss = charts.loss.typeMax;
            var minLoss = charts.loss.typeMin;

            var activeCharts = charts.getActiveCharts();

            var axes = charts.getAxes();

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
            //
            var format_min = function(d) { return (d >= 0 ? d : 0);  };

            var errorDiv = d3.select('#chartError');
            // No data to plot
            if (axes.length == 0) {
               cleanupObjects(); 
                errorDiv.html('ERROR: No data to plot for the hosts and time range selected.');
                d3.select('#legend').html('');
            } else {
                errorDiv.html('');

            //allTestsChart.width(750)
            var window_width = document.getElementById("chart").clientWidth;
            var chart_width = 700;
            if (window_width > 700) {
                chart_width = window_width - 100;
            }
            allTestsChart.width(chart_width)
                .height(465)
                .brushOn(false)
                .mouseZoomable(true)
                .shareTitle(false)
                .compose(activeCharts)
                //.dimension(lineDimension)
                .x(d3.time.scale().domain([start_date, end_date])) //.nice())
                //.x(d3.time.scale().domain(d3.extent(ps_data, function(d) { return new Date(d.ts * 1000); }))) //.nice())
                .xAxisLabel('Date')
                //.y(d3.scale.linear().domain([minThroughputAxis, axis_value( maxDelay, 1000)]))
                .y(d3.scale.linear().domain([format_min(axes[0].min), yAxisMax * axisScale ])) 
                .yAxisLabel(axes[0].name + ' (' + axes[0].unit + ')')
                //.yAxisLabel('Throughput')
                //.rightYAxisLabel('Latency (ms)')
                .legend(dc.legend().x(40).y(570).itemHeight(13).gap(5).legendWidth(600).horizontal(true).itemWidth(150))
                .xAxis();
           allTestsChart.yAxis().ticks(5);
           function make_formatter(charts, index) { 
               return function(d) { 
                    var ret = charts.getAxes()[index].tickFormat( d * charts.getAxes()[index].max / yAxisMax );
                    return ret;
               }
            }
           allTestsChart.yAxis().tickFormat(make_formatter(charts, 0));

            function get_axes(axes) {
                return function() { return axes; };
            }

           if (axes.length > 1 ) {
                allTestsChart.rightYAxisLabel(axes[1].name + ' (' + axes[1].unit + ')')
                    .rightY(d3.scale.linear().domain([0, yAxisMax * axisScale]))
                    .rightYAxis().ticks(5)
                allTestsChart.rightYAxis().tickFormat(make_formatter(charts, 1));
           }

            if (maxDelay > 0 && 0) {
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


            dc.renderAll();

            postRenderTasks();

        } // end if the axes are not empty


            function postRenderTasks() {

                var svg = allTestsChart.svg(); // d3.select('#chart svg');
                var svgWidth = svg.attr('width');
                var svgHeight = svg.attr('height');

                if (axes.length > 1) {
                    var chartSVG = allTestsChart.svg();
                    chartSVG.selectAll('g.yr g.tick text').style('fill', axes[1].color);
                    chartSVG.selectAll('g.y g.tick text').style('fill', axes[0].color);
                }

                svg.attr("height", +svgHeight + 50);

                // Loss axis
                if (maxLoss == 0) {
                    maxLoss = 1;
                }
                var minLossAxis = 0 - (maxLoss * yNegPadAmt);

                var additionalAxes = [];

                if (axes.length > 2) {
                    for(var i=2; i<axes.length;i++) {
                        additionalAxes.push(addAxis(0, axes[i].max, axes[i].name, axes[i].tickFormat, axes[i].color));
                    }
                }

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
                    y1.domain([minVal, maxVal * axisScale ]);
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

            //var reloadChart = function(timePeriod) {
            function reloadChart(timePeriod) {
                var url = base_url;
                summary_window = 3600;
                end_ts = Math.round(new Date().getTime() / 1000);
                setTimeVars(timePeriod);

                start_ts = end_ts - time_diff;

                url += '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;

                cleanupObjects();

                drawChart(url);
                setHeader();
                return;
            }

            //var cleanupObjects = function() {
            function cleanupObjects() {
                if (lineDimension !== null) {
                    lineDimension.dispose();
                }
                if (ndx !== null && ndx.size() > 0 ) {    
                    dc.filterAll();
                    ndx.remove();
                }

                // Remove references in dc chart registry
                //dc.deregisterChart(allTestsChart);
                // Clear SVG (similar to the resetSVG method, but don't recreate anything)
                if (allTestsChart !== null) {
                    allTestsChart.select("svg").remove();
                }
                // Remove root reference (probably not needed)
                //allTestsChart.root(null);

                //var svg = allTestsChart.svg();
                //svg.remove();

                d3.selectAll("#chart").selectAll("svg").remove();
                //if (allTestsChart !== null) {
                //    allTestsChart.resetSvg(); 
                //}
                d3.select('#legend').html('');
                allTestsChart = null;
                lineDimension = null;
                ndx = null;
                charts = null;
                axes = null;
                activeCharts = null;

            }

            function isFunction(functionToCheck) {
                var getType = {};
                return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
            }
            } // end drawChartAfterCall()
            }); // end d3.json call
    }; // end drawChart() function

    function array2param(name, array){	
	var joiner = "&" + name + "=";
	return joiner + array.join(joiner);
    }

}); // end dojo require function
