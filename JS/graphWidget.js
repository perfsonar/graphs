require(["dojo/parser", "dijit/registry", "dojo/dom-style", "dojo/dom", "dojo/on", "dojo/hash", "dojo/io-query", "dojo/_base/connect", "dojo/_base/event", "dijit/form/TextBox", "dijit/TooltipDialog", "dijit/popup", "dojo/dom-geometry", "dojo/domReady!"], function(parser, registry, domStyle, dom, on, theHash, ioQuery, connect, event, TextBox, TooltipDialog, popup, domGeom){

var ma_url = '';
var now = Math.round(new Date().getTime() / 1000);

var timePeriod = ioQuery.queryToObject(theHash()).timeframe || '1w';  // get hash
var time_diff = 0;
var summary_window = 0;
var tooltips = [];

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
var end_ts = get_hash_val('end_ts') ||  Math.round(new Date().getTime() / 1000);
var start_ts = get_hash_val('start_ts') ||  end_ts - time_diff;

if (end_ts > now) {
    end_ts = now;
    start_ts = now - time_diff;
}

var ls_list_url = '/perfsonar-graphs/graphData.cgi?action=ls_hosts';
var ls_query_url = '/perfsonar-graphs/graphData.cgi?action=interfaces';

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
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

var share_button = dojo.byId('share_button');
dojo.connect(share_button, 'onclick', function() {
        var share_url = dojo.query('#share_chart_url');
        if (share_url.style('display') == 'none') {
            share_url.style('display', 'block');
        } else {
            share_url.style('display', 'none');
        }
});

dojo.connect(dojo.byId('close_url_button'), 'onclick', function() {
    var share_url = dojo.query('#share_chart_url');
    share_url.style('display', 'none');
});

set_share_url();

function set_share_url() {
    var url = window.location;
    var share_link = dojo.query('#share_chart_link');
    share_link.attr('href', url);
}

function add_to_hash(key, val) {
    var hashObj = ioQuery.queryToObject(theHash());  // get
    hashObj[key] = val;
    theHash(ioQuery.objectToQuery(hashObj));  // set
    set_share_url();
}

function remove_from_hash(key) {
    var hashObj = ioQuery.queryToObject(theHash());  // get
    delete hashObj[key];
    theHash(ioQuery.objectToQuery(hashObj));  // set
    set_share_url();
}

function get_hash_val(key) {
    return ioQuery.queryToObject(theHash())[key];
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

var base_url = '/perfsonar-graphs/graphData.cgi?action=data';
base_url += array2param('url', ma_urls);
base_url += array2param('src', sources);
base_url += array2param('dest', dests);
base_url += array2param('ipversion', ipversions);
base_url += array2param('agent', agents);
base_url += array2param('tool', tools);
base_url += array2param('protocol', protocols);
base_url += array2param('filter', custom_ma_filters);

// do a DNS lookup on the source/dests
d3.json('/perfsonar-graphs/graphData.cgi?action=hosts' + array2param('src', sources) + array2param('dest', dests) + array2param('ipversion', ipversions), function(error, hosts) {
	for (var i = 0; i < hosts.length; i++){
	    var source_host = d3.select('#source_host_' + i);
	    source_host.html(hosts[i].source_host);
	    var source_ip = d3.select('#source_ip_' + i);
        source_ip.html(hosts[i].source_ip);
	    var dest_host = d3.select('#dest_host_' + i);
	    dest_host.html(hosts[i].dest_host);
	    var dest_ip = d3.select('#dest_ip_' + i);
        dest_ip.html(hosts[i].dest_ip);
        var source_ips = hosts[i].source_ip.split(",");
        var dest_ips = hosts[i].dest_ip.split(",");
        var has_traceroute_data = 0;
        for(var s = 0; s < source_ips.length && !has_traceroute_data; s++){
            for(var d = 0; d < dest_ips.length && !has_traceroute_data; d++){
                var tr_url = '/perfsonar-graphs/graphData.cgi?action=has_traceroute_data&url=' + ma_urls[i] 
                    + '&source=' + source_ips[s] + '&dest=' + dest_ips[d];
                has_traceroute_data = get_traceroute_data(tr_url, dest_ip);
            }
        }
	}

});

function get_traceroute_data(url, div) {
        var has_traceroute_data = 0;
        d3.json(url, function(trace_error, trace_data) {
            if (typeof trace_data !== "undefined") {
                if (typeof trace_data.has_traceroute != "undefined" && trace_data.has_traceroute == 1) {
                    var tr_link = div.append('span');
                    tr_link.classed("traceroute", true);
                    var trace_url = '/perfsonar-traceroute-viewer/index.cgi?';
                    trace_url += '&mahost=' + trace_data.ma_url;
                    trace_url += '&stime=yesterday';
                    trace_url += '&etime=now';
                    //trace_url += '&tzselect='; // Commented out (allow default to be used)
                    trace_url += '&epselect=' + trace_data.traceroute_uri;
                    trace_url += '';
                    tr_link.html('[<a href="' + trace_url + '" target="_blank">traceroute</a>]');
                    has_traceroute_data = 1;
                }
            }

        });
        return has_traceroute_data;
}

var loading = d3.select('#chart #loading');
drawChart(base_url + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window);

var zoom_registered = false;
var next_prev_registered = false;

function drawChart(url) {


    loading.style('display', 'block');

    d3.json(url, function(error,ps_data) {

            drawChartSameCall(error, ps_data);

            function drawChartSameCall(error, ps_data) { 
            loading.style('display', 'none');

	    var timePeriod = ioQuery.queryToObject(theHash()).timeframe || '1w';  // get hash

	    var prevLink = d3.selectAll('.ps-timerange-nav .prev');
	    var nextLink = d3.selectAll('.ps-timerange-nav .next');


	    if (! next_prev_registered){
		prevLink.on("click", function() {
			d3.event.preventDefault();
			end_ts = end_ts - time_diff;
			start_ts = start_ts - time_diff;
			add_to_hash('start_ts', start_ts);
			add_to_hash('end_ts', end_ts);
			add_to_hash('timeframe', get_hash_val('timeframe'));
			var new_url = base_url + '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
			cleanupObjects();
			drawChart(new_url);
			if (end_ts < now ) {
			    nextLink.style('display', 'block');
			}
		    });

		nextLink.on("click", function() {
			d3.event.preventDefault();
			end_ts = end_ts + time_diff;
			start_ts = start_ts + time_diff;
			if (end_ts > now) {
			    end_ts = now;
			    start_ts = end_ts - time_diff;
			}
			add_to_hash('start_ts', start_ts);
			add_to_hash('end_ts', end_ts);
			add_to_hash('timeframe', get_hash_val('timeframe'));
			var new_url = base_url +'&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;
			cleanupObjects();
			drawChart(new_url);
                    });
            next_prev_registered = true;
	    }

	    if (end_ts >= now ) {
		    nextLink.style('display', 'none');
	    }

        prevLink.html('<a href="#">Previous ' + timePeriod + '</a>');
        nextLink.html('<a href="#">Next ' + timePeriod + '</a>');

        // Handle zoom events
	    if (! zoom_registered){
            dojo.query('#chart #time-selector a.zoomLink').onclick(function(e){
                e.preventDefault();
                var timePeriod = e.currentTarget.name;
                dojo.query('#chart #time-selector a.zoomLink').removeClass('active');
                dojo.addClass(e.currentTarget, 'active');
                add_to_hash('timeframe', timePeriod);
                remove_from_hash('start_ts');
                remove_from_hash('end_ts');
                remove_from_hash('zoom_start');
                remove_from_hash('zoom_end');
                reloadChart(timePeriod);
            });
        zoom_registered = true;
	    }
            var format_ts_header = function(d) { return d3.time.format('%c')(d); }

            var setHeader = function() {
                var rangeLabel = format_ts_header(new Date(1000 * start_ts)) + ' -- ' + format_ts_header(new Date(1000 * end_ts));
                var chartHeader = d3.select('.chartTimeRange').html( rangeLabel );
            };

            var errorDiv = d3.select('#chartError');
            // No data to plot
            if (typeof ps_data == 'undefined') {
                //cleanupObjects(); 
                errorDiv.html('Error retrieving data from the webservice.');
                d3.select('#legend').html('');
                setHeader();
            } else if ( isEmpty(ps_data) ) {
                errorDiv.html('ERROR: No data to plot for the hosts and time range selected.');
                d3.select('#legend').html('');
                setHeader();

           } else {




        var retransmits_src = {};
        var retransmits_dst = {};
        if (ps_data.packet_retransmits_src) {
            for (var i=0; i < ps_data.packet_retransmits_src.length; i++) {
                var ts = ps_data.packet_retransmits_src[i][0];
                var val = ps_data.packet_retransmits_src[i][1];
                retransmits_src[ts] = val;
            }

        }
        if (ps_data.packet_retransmits_dst) {
            for (var i=0; i < ps_data.packet_retransmits_dst.length; i++) {
                var ts = ps_data.packet_retransmits_dst[i][0];
                var val = ps_data.packet_retransmits_dst[i][1];
                retransmits_dst[ts] = val;
            }

        }

        var error_tool_src = {};
        var error_tool_dst = {};
        if (ps_data.error_tool_src) {
            for (var i=0; i < ps_data.error_tool_src.length; i++) {
                var ts = ps_data.error_tool_src[i][0];
                var val = ps_data.error_tool_src[i][1];
                error_tool_src[ts] = val;
            }
        }
        if (ps_data.error_tool_dst) {
            for (var i=0; i < ps_data.error_tool_dst.length; i++) {
                var ts = ps_data.error_tool_dst[i][0];
                var val = ps_data.error_tool_dst[i][1];
                error_tool_dst[ts] = val;
            }
        }
        if (timePeriod != '') {
            dojo.query('#chart #time-selector a.zoomLink').removeClass('active');
            dojo.query('#chart #time-selector a.zoomLink').forEach(function(node, index, nodelist) {
                    if(node.name == timePeriod) {
                    dojo.addClass(node, "active");
                    }
                    });
        }

            var start_date = new Date (start_ts * 1000);
            var end_date = new Date (end_ts * 1000);

            var allTestsChart = dc.compositeChart("#ps-all-tests");
            var rangeChart    = dc.barChart("#range-chart");

            var ndx = crossfilter(ps_data);
            var lineDimension = ndx.dimension(function (d) { return new Date( d.ts * 1000); });

            function make_functions(field_name) {
                return [
                    // Add
                    function(p, v) {
                        ++p.total_count;
                        if ( v[1] !== null ) {
                            ++p.count;
                            p.sum += v[1];
                            p.avg = p.sum/p.count;
                            p.val = v[1];
                            p.isNull = false; 
                            if (field_name == 'throughput_src_val') {
                                p.retrans = retransmits_src[v[0]] || 0;
                            }
                            if (field_name == 'throughput_dst_val') {
                                p.retrans = retransmits_dst[v[0]] || 0;
                            }
                            if (field_name == 'error_src_val') {
                                p.sum = 1;
                                p.val = 1;
                                p.error_text = v[1];
                                p.avg = 1;
                                p.tool = error_tool_src[v[0]] || '';
                            }
                            if (field_name == 'error_dst_val') {
                                p.sum = 1;
                                p.val = 1;
                                p.error_text = v[1];
                                p.avg = 1;
                                p.tool = error_tool_dst[v[0]] || '';
                            }
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
                        if ( v[1] !== null ) {
                            --p.count;
                            p.sum -= v[1];
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

            var format_ts = function(d) { return d3.time.format('%X %x')(d); }

            var format_values = function(d, type) {
                if (type == 'throughput') {
                    return d3.format('.4s')(d) + 'bps';
                } else if (type == 'latency' || type == 'ping') {
                    return d + ' ms';
                } else if (type == 'loss') {
                    if (d ==0) {
                        return "0";
                    } else {
                        return d3.format('.2e')(d);
                    }
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


            setHeader();

            var charts = {};

            charts.throughput = {};
            charts.throughput.name = 'Throughput';
            charts.throughput.type = 'throughput';
            charts.throughput.unit = 'bps';
            charts.throughput.fieldName = 'throughput';
            charts.throughput.valType = 'avg';
            charts.throughput.color = '#0076b4';
            charts.throughput.showByDefault = true;
            charts.throughput.tickFormat = function(d) { return d3.format('.2s')(d) + 'bps';  };

            // Latency charts
            charts.latency = {};
            charts.latency.name = 'Latency';
            charts.latency.type = 'latency';
            charts.latency.unit = 'ms';
            charts.latency.fieldName = 'owdelay_minimum';
            charts.latency.valType = 'avg';
            charts.latency.color = '#663333';

            charts.latency.showByDefault = true;
            charts.latency.ticks = 5;
            charts.latency.tickFormat = function(d) { 
                var ret = d;
                if (this.max > 5) {
                    ret = Math.ceil(d);
                } else if (this.max > 2) {
                    ret = d3.format('.2f')(ret);
                } else {
                    ret = d3.format('.3f')(ret);
                }
                return ret;
            };

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
            charts.loss.unit = 'fraction';
            charts.loss.fieldName = 'loss';
            charts.loss.valType = 'avg';
            charts.loss.color = '#cc7dbe'; 
            charts.loss.showByDefault = true;
            charts.loss.tickFormat = function(d) { return d3.format('.2e')(d); };

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

            // Error charts

            charts.errors = {};
            charts.errors.name = 'Errors';
            charts.errors.type = 'errors';
            charts.errors.unit = 'errors';
            charts.errors.fieldName = 'error';
            charts.errors.valType = 'value';
            charts.errors.color = '#ff0000';
            charts.errors.showByDefault = true;
            charts.errors.tickFormat = function(d) { return d };
            charts.errors.hide = false;
            charts.errors.chart_type = 'bubble';

            var parentChart = allTestsChart;

            charts.createReverseCharts = function() {
                for(var key in this) {
                    var c = this[key];              // current (forward) chart
                    if (isFunction(c)) {
                        continue;
                    }
                    this[key + '_rev'] = {};
                    var rev = this[key + '_rev'];   // newly created reverse values

                    for(var item in c) {
                        rev[item] = c[item];
                    }

                    // Set values that are different in the reverse direction
                    rev.name = 'Reverse ' + rev.name;
                    rev.tableName = rev.fieldName + '_dst';
                    rev.fieldName = rev.fieldName + '_dst_val';
                    rev.direction = 'reverse';
                    rev.id = key + '_rev';

                    // Set values for forward direction
                    c.tableName = c.fieldName + '_src';
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

                    if (c.chart_type == 'bubble') {
                        c.chart = dc.bubbleChart(parentChart);
                    } else {
                        c.chart = dc.psLineChart(parentChart);
                    }

                    if (!ps_data[c.tableName]) { continue; }
                    c.crossfilter = crossfilter(ps_data[c.tableName]);
                    c.dimension = c.crossfilter.dimension(function (d) { return new Date( d[0] * 1000); });
                    if (c.valType == 'avg') {
                        c.group = c.dimension.group().reduce.apply(c.dimension, make_functions(c.fieldName));
                        var topMin = c.group.order(avgOrderInv).top(1);
                        var topMax = c.group.order(avgOrder).top(1);
                        if (topMax[0].value.count == 0 ||
                                isNaN( topMin[0].value.avg) || isNaN(topMax[0].value.avg) ) {
                            c.hasValues = false;
                        } else {
                            c.max =  c.group.order(avgOrder).top(1)[0].value.avg || 0;
                            c.min =  c.group.order(avgOrderInv).top(1)[0].value.avg || 0;
                            c.hasValues = true;
                        }
                    } else if (c.valType == 'sum') {
                        c.group = c.dimension.group().reduceSum(function(d) { return d[1]; });
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
                    } else if (c.valType == 'value') {
                        c.group = c.dimension.group().reduce.apply(c.dimension, make_functions(c.fieldName));
                        c.hasValues = false;
                        c.min = 0;
                        c.max = 0;
                        if (c.group.size() > 0) {
                            c.hasValues = true;
                            c.max = 1;
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
                    return;
                }
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
                } else if (c.valType == 'value') {
                    // Set value to yAxisMax to display the errors at the top of the chart
                    c.chart.valueAccessor(function(d) { return yAxisMax; });
                    // Leaving the title here commented out in case we want to go back to the native tooltip
                    //c.title = function(d) { return 'Error from ' + d.value.tool + ":\n" + d.value.error_text + "\n" + format_values(d.key, 'ts'); };
                    c.title = function(d) { return ''; };
                    c.chart.renderTitle(false); // we rolled our own tooltips
                    c.chart.radiusValueAccessor(function (d) { return 1.5; });
                    c.chart.MIN_RADIUS = 2;
                    c.chart.label(function (d) { return ''; });
                    // By setting the chart's filter function to empty,
                    // we disable the filter on click default event handling
                    c.chart.filter = function(e) { };
                }
                var type = this[c.type];
                if (c.valueAccessor) { c.chart.valueAccessor(c.valueAccessor) };
                if (c.tickFormat) { c.chart.yAxis().tickFormat(c.tickFormat); }
                c.chart.colors(c.color);
                c.chart.title(c.title);
                if (c.direction == 'reverse' && c.chart_type != 'bubble') {
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
            charts.checkboxCallBack = function(cb) {
                    var hide_name = 'hide_' + cb.id;
                    var checked = this.checked;
                    if (checked == false) {
                        add_to_hash(hide_name, true);
                    } else {
                        remove_from_hash(hide_name);
                    }

                    drawChartSameCall(error, ps_data);

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
                            if (cb !== null && !cb.empty() && typeof cb !== 'undefined') {
                                    cb.on("change", this.checkboxCallBack);
                                if (get_hash_val('hide_' + theType) == 'true') {
                                    cb.property('checked', false);
                                } else {
                                    cb.property('checked', true);
                                }
                            }
                                if (cb !== null && !cb.empty() && typeof cb !== 'undefined') {
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
                var chartOrder = ['throughput', 'latency', 'ping', 'loss', 'retrans', 'errors'];
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
                cb.on("mouseover", function(d, e) { 
                        allTestsChart.legendHighlight(d); 
                        });
                cb.on("mouseout", function(d, e) {
                        allTestsChart.legendReset(d);
                        });
            };

            charts.getRangeValues = function() {
                var activeObjects = this.getActiveObjects();
                var total_values = {};
                for (var i in activeObjects) {
                    values = activeObjects[i].group.all();
                    for (var j in values) {
                        var ts = values[j].key;
                        var value = values[j].value.avg;
                        // normalize value based on max for type
                        var max = Math.abs(activeObjects[i].unitMax);
                        value = value/max;
                        if (value < 0) { value = 0; }
                        if ((total_values[ts] === null || typeof total_values[ts] === "undefined" || value > total_values[ts].value) && !isNaN(value)) {
                            total_values[ts] = {
                                time: ts,
                                value: value
                            };
                        }
                    }
                }
                var keys = Object.keys(total_values);
                var values = keys.map(function(v) { return total_values[v]; });
                return values;
            }

            charts.createCharts();
            var maxThroughput = charts.throughput.typeMax;
            var minThroughput = charts.throughput.typeMin;
            var maxDelay = charts.latency.typeMax;
            var minDelay = charts.latency.typeMin;

            var warning_div = d3.select("#data_warning");
            warning_div.html('');
            var data_warning = '';

            if (charts.latency.min < 0 || charts.latency_rev.min < 0) {
                data_warning += 'Negative latency values found in';

                if (charts.latency.min < 0 && charts.latency_rev.min < 0) {
                    data_warning += ' both directions. '
                } else {
                    if (charts.latency.min < 0) {
                        data_warning += ' the forward direction.';
                    }
                    if (charts.latency_rev.min < 0) {
                        data_warning += ' the reverse direction.';
                    }
                }
                data_warning += " Typically, this occurs when one or both hosts' clocks are out of sync, or the hosts are very close together."
                warning_div.html(data_warning);
                warning_div.style('display', 'block');
            } else {
                warning_div.style('display', 'none');
            }

            minDelay = 0;
            var maxLoss = charts.loss.typeMax;
            var minLoss = charts.loss.typeMin;

            var maxPing = charts.ping.typeMax;
            var minPing = charts.ping.typeMin;

            var activeCharts = charts.getActiveCharts();

            var axes = charts.getAxes();

            var minDel = minDelay - (maxDelay * yNegPadAmt ); 
            minDel = 0; //temporarily override the ability to have negative values (it's not ready)
            var maxDel = maxDelay * axisScale;
            if (maxDel == 0) {
                maxDel = 1;
            }
            var minThroughputAxis = 0;
            var format_min = function(d) { return (d >= 0 ? d : 0);  };

            var errorDiv = d3.select('#chartError');
            // No data to plot
            if (axes.length == 0) {
                cleanupObjects();
                errorDiv.html('ERROR: No data to plot for the hosts and time range selected.');
                d3.select('#legend').html('');
           } else {
                errorDiv.html('');

            var window_width = document.getElementById("chart").clientWidth;
            var chart_width = 700;
            if (window_width > 700) {
                chart_width = window_width - 100;
            }

            allTestsChart.width(chart_width)
                .height(465)
                .shareTitle(false)
		        .brushOn(false)
                .compose(activeCharts)
                .x(d3.time.scale().domain([start_date, end_date]))
                .xAxisLabel('Date')
                .y(d3.scale.linear().domain([format_min(axes[0].min), yAxisMax * axisScale ]).nice())
                .yAxisLabel(axes[0].name + ' (' + axes[0].unit + ')')
		        .rangeChart(rangeChart);

        allTestsChart.yAxis().ticks(5);

        // Add/remove zoom parameters from url
        rangeChart.on("postRedraw", function(chart) {
            var filters = chart.filters() || [];
            if (filters.length == 0) {
                remove_from_hash('zoom_start');
                remove_from_hash('zoom_end');
            } else {
                add_to_hash('zoom_start', +filters[0][0]);
                add_to_hash('zoom_end', +filters[0][1]);
            }
        });

	    var active_objects = charts.getActiveObjects();

        var rangeReducer = function(d) { return d.value; };

        var rangeValues = charts.getRangeValues();
        var range_crossfilter;
        if (typeof range_crossfilter !== 'undefined') {
            range_crossfilter.remove();
        }
        range_crossfilter = crossfilter(rangeValues);
        var rangeDimension = range_crossfilter.dimension(function(d) { return d.time; });
        rangeChart.width(chart_width)
            .height(60)
            .margins({left: 69, top: 0, right: 40, bottom: 10})
            .x(d3.time.scale().domain([start_date, end_date]))
            .dimension(rangeDimension)
            .yAxisLabel("")
            .xAxisLabel("")
            .gap(1)
            .group(rangeDimension.group().reduceSum(rangeReducer), "rangegroup"); 

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
                    .rightYAxis().ticks(5);
                if (axes[1].unit == 'errors') {
                    allTestsChart.rightY(d3.scale.linear().domain([0, yAxisMax * axisScale]))
                        .rightYAxis().ticks(1);

                }
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


            function postRenderTasks() {

                var svg = allTestsChart.svg(); // d3.select('#chart svg');
                var svgWidth = svg.attr('width');
                var svgHeight = svg.attr('height');

                var zoom_start = get_hash_val('zoom_start');
                var zoom_end = get_hash_val('zoom_end');

                function in_zoom_range(val) {
                    return (val/1000 >= start_ts && val/1000 <= end_ts);
                }

                if (zoom_start && zoom_end && in_zoom_range(zoom_start) && in_zoom_range(zoom_end)) {
                    allTestsChart.focus([zoom_start, zoom_end]);
                } else {
                    remove_from_hash('zoom_start');
                    remove_from_hash('zoom_end');
                }

                if (axes.length > 1) {
                    var chartSVG = allTestsChart.svg();
                    chartSVG.selectAll('g.yr g.tick text').style('fill', axes[1].color);
                    chartSVG.selectAll('g.y g.tick text').style('fill', axes[0].color);
                }

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
                var chartSVG = allTestsChart.svg();
                var bubble_selection = chartSVG.selectAll('g.node circle.bubble');

                bubble_selection.each( function (d, i) {
                    var label = '<b>' + format_values(d.key, 'ts') + '</b><br>';
                    label += '<b>Error from ' + d.value.tool + ":</b><br />"
                        + d.value.error_text + "<br>" + format_values(d.key, 'ts');
                    var tooltip = new TooltipDialog({
                        content: label,
                        style: "width: 300px;word-wrap:break-word;",
                        onMouseLeave: function(){
                            popup.close(tooltip);
                        }
                    });
                    tooltips.push(tooltip);
                    on(this, 'mouseover', function(d){
                        var x = domGeom.position(this).x - 4;
                        var y = domGeom.position(this).y + 12;
                        var pop = popup.open({
                            popup: tooltip,
                            x: x,
                            y: y
                        });
                        if (pop.corner == 'TR') {
                            pop.x = pop.x + 21;
                            tooltip._popupWrapper.style.left = pop.x;
                        }

                    });
                    });

            } // end function postRenderTasks()

            function addAxis(minVal, maxVal, label, axisFormat, color) {
                var axisWidth = 60;
                var y1 = d3.scale.linear().range([412, 0]);
                var yAxisRight = d3.svg.axis().scale(y1)  // This is the new declaration for the 'Right', 'y1'
                    .tickFormat(axisFormat)
                    .orient("right").ticks(5);           // and includes orientation of the axis to the right.
                if (endsWith(label, 'Errors')) {
                    yAxisRight.ticks(1);
                }
                yAxisRight.scale(y1);
                // Set a default range, so we don't get a broken axis if there's no data
                if(maxVal == 0) {
                    y1.domain([minVal, 1 * axisScale]);
                } else {
                    y1.domain([minVal, maxVal * axisScale ]);
                }

                var svg = allTestsChart.svg();
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

            postRenderTasks();

        } // end if the axes are not empty




            function reloadChart(timePeriod) {
                var url = base_url;
                summary_window = 3600;
                end_ts = Math.round(new Date().getTime() / 1000);
                setTimeVars(timePeriod);

                start_ts = end_ts - time_diff;

                url += '&start=' + start_ts + '&end=' + end_ts + '&window=' + summary_window;

                cleanupObjects();

                setHeader();
                set_share_url();
                drawChart(url);
                return;
            }


            function cleanupObjects() {
                if (typeof lineDimension != 'undefined' && lineDimension !== null) {
                    lineDimension.dispose();
                    lineDimension = null;
                }
                if (ndx !== null && typeof ndx != 'undefined' && ndx.size() > 0 ) {
                    dc.filterAll();
                    ndx.remove();
                }

                // Clear SVG (similar to the resetSVG method, but don't recreate anything)
                if (allTestsChart !== null && typeof allTestsChart != 'undefined') {
                    allTestsChart.select("svg").remove();
                }
                if (rangeChart !== null && typeof rangeChart != 'undefined') {
                    rangeChart.select("svg").remove();
                }

                // Cleanup tooltips
                for(var i=tooltips.length-1; i>=0; i--) {
                    tooltips[i].destroy();
                    tooltips[i] = null;
                    tooltips.splice(i, 1);
                }


                d3.selectAll("#chart").selectAll("svg").remove();
                d3.selectAll("#range-chart").selectAll("svg").remove();
                d3.selectAll("#ps-all-tests").selectAll("svg").remove();
                d3.select('#legend').html('');

                allTestsChart = null;
                lineDimension = null;
                rangeChart    = null;
                ndx = null;
                charts = null;
                axes = null;
                activeCharts = null;
                active_objects = null;

            }
            } // end  if there is data
    } // end drawSameCall
            }); // end d3.json call
    } // end drawChart() function

    function array2param(name, array) {
        var joiner = "&" + name + "=";
        return joiner + array.join(joiner);
    }

}); // end dojo require function

