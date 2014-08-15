require(["dojo/dom", "dojo/on", "dojo/hash", "dojo/io-query", "dojo/domReady!"], _start_widget);

function _start_widget(theDom, theOn, theHash, ioQuery){
    var LS_LIST_URL  = '/serviceTest/graphData.cgi?action=ls_hosts';
    var LS_QUERY_URL = '/serviceTest/graphData.cgi?action=interfaces';

    lookup_ls_information(LS_LIST_URL, LS_QUERY_URL);
    get_dns_information();

    ma_urls = get_ma_urls(ioQuery);

    // ma_urls, sources, dests templated in from graphWidget.tmpl
    var graphWidget = new GraphWidget(theHash, ioQuery, ma_urls, sources, dests);
    graphWidget.getData();
}


function array2param(name, array){	
    var joiner = "&" + name + "=";
    return joiner + array.join(joiner);
}

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
        if (obj.hasOwnProperty(key)){ 
	    return false;
	}
    }

    return true;
}

function get_ma_urls(ioquery){
    // default ma url, pre-encoded
    var ma_urls = ["http://localhost/esmond/perfsonar/archive/"];

    var uri = document.URL;
    if (uri.indexOf('?') > -1) {
	var query = uri.substring(uri.indexOf("?") + 1, uri.length);
	var queryObject = ioquery.queryToObject(query);
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

    return ma_urls;
}

function lookup_ls_information(list_url, query_url){
    d3.json(list_url, function(error, ls_list_data) { 
	    var rows = [];
	    var remaining = ls_list_data.length;
	    
	    for(var ls_index in ls_list_data) {
		var url = ls_list_data[ls_index];
		var ls  = query_url + '&ls_url=' + encodeURI(url) + array2param('source', sources) + array2param('dest', dests);
		
		d3.json(ls, function(ls_error, interface_data) {
			if (ls_error){
			    // should do something with this
			}
			if(!isEmpty(interface_data)) {
			    rows.push(interface_data);
			}
			if (!--remaining){
			    show_host_information(rows);
			}
		    });
	    }

	});
}

function show_host_information(data){
    for(var i in data) {
	var results = data[i];
	
	for (var j in results){
	    row = data[i][j];
	    
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


function get_dns_information(){
    var url = '/serviceTest/graphData.cgi?action=hosts';
    url    += array2param('src', sources);
    url    += array2param('dest', dests); 

    d3.json(url, function(error, hosts) {
	    for (var i = 0; i < hosts.length; i++){
		var source_host = d3.select('#source_host_' + i);
		source_host.html(hosts[i].source_host);

		var source_ip = d3.select('#source_ip_' + i);
		source_ip.html(hosts[i].source_ip);

		var dest_host = d3.select('#dest_host_' + i);
		dest_host.html(hosts[i].dest_host);

		var dest_ip = d3.select('#dest_ip_' + i);
		dest_ip.html(hosts[i].dest_ip);
	    }
	});
}




GraphWidget = function(hash, ioquery, ma_urls, sources, dests){
    this.hash    = hash
    this.ioquery = ioquery;
    this.ma_urls = ma_urls;
    this.sources = sources;
    this.dests   = dests;

    var NOW         = Math.round(new Date().getTime() / 1000);
    var AXIS_SCALE  = 1.1;
    var Y_AXIS_MAX  = 100;

    // set up some constants
    this.CHART_INFO = {
	throughput: {
	    name: 'Throughput',
	    type: 'throughput',
	    unit: 'bps',
	    fieldName: 'throughput',
	    valType: 'avg',
	    color: '#1F77B4',             
	    showByDefault: true,            
	    tickFormat: function(d) { return d3.format('.3s')(d) + 'bps'; }
	},
	latency: {
	    name: 'Latency',
            type: 'latency',
            unit: 'ms',
            fieldName: 'owdelay',
            valType: 'avg',
            color: '#009933', 
            showByDefault: true,
            ticks: 5,
            tickFormat: function(d) { return d3.format('.2f')(d); }
	},
	loss: {
	    name: 'Loss',
            type: 'loss',
            unit: 'percent',
            fieldName: 'loss',
            valType: 'avg',
            color: '#ff0000', 
            showByDefault: true,
            tickFormat: function(d) { return d3.format('.2%')(d); }
	},
	retrans: {
	    name: 'Packet Retransmissions',
	    type: 'retrans',
            unit: 'packets',
            fieldName: 'packet_retransmits',
            valType: 'sum',
            color: '#ff00ff',
            showByDefault: false,
            tickFormat: function(d) { return d; }
	}
    };

    // automatically set up reverse information based on 
    // forward information because we're too lazy to retype
    // all that info
    for(var chart_type in this.CHART_INFO) {
	// current (forward) chart
	var chart_info = this.CHART_INFO[chart_type];

	var reverse_info = {};

	// copy forward items in first
	for(var item in chart_info) {
	    reverse_info[item] = chart_info[item];
	}
	
	// set values that are different in the reverse direction
	reverse_info.name      = 'Reverse ' + reverse_info.name;
	reverse_info.fieldName = reverse_info.fieldName + '_dst_val';
	reverse_info.direction = 'reverse';
	reverse_info.id        = chart_type + '_rev';
	
	// Set values for forward direction
	chart_info.fieldName = chart_info.fieldName + '_src_val';
	chart_info.direction = 'normal';
	chart_info.id        = chart_type;

	this.CHART_INFO[chart_type + '_rev'] = reverse_info;
    }


    this._init = function(){

	// declare variables we're going to use
	this.time_diff      = 0;
	this.summary_window = 0;
	this.start_ts       = 0;
	this.end_ts         = 0;
	this.chartStates    = [];    

	this.loading        = d3.select('#chart #loading');
	
	this.timePeriod     = this.getTimePeriod();
	
	this.base_url = '/serviceTest/graphData.cgi?action=data';
	this.base_url += array2param('url', this.ma_urls);
	this.base_url += array2param('src', this.sources);
	this.base_url += array2param('dest', this.dests);
	
	// set up our navigation links
	this.prevLink = d3.selectAll('.ps-timerange-nav .prev');
	this.nextLink = d3.selectAll('.ps-timerange-nav .next');    
	
	this.prevLink.on("click", function(scope){
		return function(){
		    d3.event.preventDefault(); 
		    scope.setTimeVars();
		    scope.end_ts   -= scope.time_diff;
		    scope.start_ts -= scope.time_diff;
		    scope.getData();
		};
	    }(this));
	
	this.nextLink.on("click", function(scope){
		return function() { 
		    d3.event.preventDefault(); 
		    scope.setTimeVars();
		    scope.end_ts   += scope.time_diff;
		    scope.start_ts += scope.time_diff;
		    scope.getData();
		}
	    }(this));
	
	// hide the "next" link if we're already up to the present
	if (this.end_ts > NOW){
	    this.nextLink.style('display', 'none');
	}

	// take care of initialization of values
	this.setTimeVars(this.timePeriod);
	
	this.end_ts   = Math.round(new Date().getTime() / 1000);
	this.start_ts = this.end_ts - this.time_diff;

	// hook up the timeframe change links
	dojo.query('#ps-all-tests #time-selector a.zoomLink').onclick(function(e){ 
		e.preventDefault();
		var timePeriod = e.currentTarget.name;
		dojo.query('#ps-all-tests #time-selector a.zoomLink').removeClass('active');
		dojo.addClass(e.currentTarget, 'active');
		theHash("timeframe=" + timePeriod);
		this.setTimeVars();
		this.getData();
	    });

    };
	
    this.getTimePeriod = function(){
	return this.ioquery.queryToObject(this.hash()).timeframe || '1w';
    };

    this.setTimeVars = function(){
        var period = this.getTimePeriod();

        if (period == '4h') {
            this.time_diff = 60*60 * 4;
            this.summary_window = 300;
        }
        else if (period == '1d') {
            this.time_diff = 86400;
            this.summary_window = 300;
        }
        else if (period == '3d') {
            this.time_diff = 86400 * 3;
            this.summary_window = 300;
        }
        else if (period == '1w') {
            this.time_diff = 86400*7;
            this.summary_window = 3600;
        }
        else if (period == '1m') {
            this.time_diff = 86400*31;
            this.summary_window = 86400;
        } 
        else if (period == '1y') {
            this.time_diff = 86400*365;
            this.summary_window = 86400;
        }
    };

    this.getData = function(url){	

        var url = this.base_url;
        url    += '&start=' + this.start_ts;
        url    += '&end=' + this.end_ts;
        url    += '&window=' + this.summary_window;

        this.loading.style('display', '');

        d3.json(url, function(scope){
                return function(error, ps_data){
                scope.loading.style('display', 'none');
                scope._handle_data(error, ps_data);	    
                };
                }(this));
    };

    this._update_navigation = function(){
        var timePeriod = this.getTimePeriod();

        dojo.query('#ps-all-tests #time-selector a.zoomLink').removeClass('active');
        dojo.query('#ps-all-tests #time-selector a.zoomLink').forEach(function(node, index, nodelist) {
                if(node.name == timePeriod) {
                dojo.addClass(node, "active");
                }
                });


        this.prevLink.html('<a href="#">Previous ' + timePeriod + '</a>');
        this.nextLink.html('<a href="#">Next ' + timePeriod + '</a>');
    };
    
    this._make_add_reducer = function(param){
        return function(p, v) {                
            ++p.total_count;
            if ( v[param] !== null ) {
                ++p.count;
                p.sum += v[param];
                p.avg = p.sum/p.count;
                p.val = v[param];
                p.isNull = false; 
            } else {
                // Mark p as null, but only if it hasn't already been flagged as not null
                if (!p.isNull) { 
                    p.isNull = true;
                } 
            }
            return p;
        };
    };

    this._make_remove_reducer = function(param){
        return function (p, v) {
            if ( v[param] !== null ) {
                --p.count;
                p.sum -= v[param];
                p.avg = p.sum/p.count;
            } 
            return p;
        };
    };

    this._make_init_reducer = function(param){
        return function() {
            return { count: 0, sum: 0, avg: 0, total_count: 0 };
        }	
    };


    this._get_chart_group = function(chart_info){
        var lineDimension = this.ndx.dimension(function (d) { return new Date( d.ts * 1000); });	

        var group;
        if (chart_info.valType == 'avg') { 
            group = lineDimension.group().reduce(this._make_add_reducer(chart_info.fieldName),
                    this._make_remove_reducer(chart_info.fieldName),
                    this._make_init_reducer(chart_info.fieldName));
        }
        else if (chart_info.valType == 'sum'){
            group = lineDimension.group().reduceSum(function(d) { return d[chart_info.fieldName]; });
        }

        return group;
    };


    this._get_stats = function(chart_info, stats){

        var avgOrder = function(p) { return p.avg; };
        var avgOrderInv = function(p) { return -p.avg; };
        var valOrder = function(p) { return p; };
        var valOrderInv = function(p) { return -p; };

        var group = this._get_chart_group(chart_info);
        var topMin;
        var topMax;
        var min;
        var max;
        var hasValues;

        if (chart_info.valType == 'avg') { 
            topMin = group.order(avgOrderInv).top(1);
            topMax = group.order(avgOrder).top(1);

            if (topMin == undefined || topMax == undefined 
                    || topMin.length == 0 || topMax.length == 0 || topMax[0].value.count == 0 ) {
                hasValues = false;
            } 
            else {
                max =  group.order(avgOrder).top(1)[0].value.avg || 0;
                min =  group.order(avgOrderInv).top(1)[0].value.avg || 0;
                hasValues = true;
            }

        }
        else if (chart_info.valType == 'sum') {
            topMin = group.order(valOrderInv).top(1);
            topMax = group.order(valOrder).top(1);

            if (topMin == undefined || topMax == undefined 
                    || topMin.length == 0 || topMax.length == 0 || isNaN(topMax[0].value) ) {
                hasValues = false;
            }
            else {
                max = group.order(valOrder).top(1)[0].value; 
                min = group.order(valOrderInv).top(1)[0].value;
                hasValues = true;
            }
        }
        chart_info.hasValues = hasValues;
        chart_info.min = min;
        chart_info.max = max;

        //stats[chart_info.fieldName].min = min;
        //stats[chart_info.fieldName].max = max;

        stats[chart_info.fieldName] = hasValues;

        var type = chart_info.type;

        stats[type] = stats[type] || {};

        var current_type_max = stats[type].min || 0;
        var current_type_min = stats[type].max || 0;

        if (min < current_type_min){
            stats[type].min = min;
        }
        if (min > current_type_max){
            stats[type].max = max;
        }

    };

    // clear the existing chart stuff
    this._cleanup = function(){

        if (this.ndx){
            this.ndx.remove();
            this.ndx = null;
        }

        if (this.mainChart){
            this.mainChart.select("svg").remove();
            this.mainChart = null;
        }

        d3.selectAll("#chart").selectAll("svg").remove();
        d3.select('#legend').html('');
    };
    
    // main function to cleanup and put everything on the page
    this._handle_data = function(error, ps_data){
        this._cleanup();

        this._update_navigation();

        this._set_header();

        this.ndx       = crossfilter(ps_data);
        this.mainChart = dc.compositeChart("#ps-all-tests");

        var stats = {};

        // gather all the stats first so that we can create
        // the charts with proper axes
        for (var chart_info in this.CHART_INFO){
            this._get_stats(this.CHART_INFO[chart_info], stats);
        }

        this._create_legend(stats);

        this._draw_charts(stats);
    };

    this._draw_charts = function(stats){
        var charts = [];

        var axes = this._create_axes(stats);

        // stats now knows the min/max for each type
        // and whether a given field has values at all
        for (var chart_info in this.CHART_INFO){
            var chart = this._create_component_chart(this.CHART_INFO[chart_info], stats);
            charts.push(chart);
        }

        this._render_main_chart(charts, axes);

        dc.renderAll();
    };

    this._create_component_chart = function(chart_info, stats){
        var chart = dc.psLineChart(this.mainChart);
        console.log(stats);

        var group = this._get_chart_group(chart_info);
        chart.group(group, chart_info.name);

        var unitMax = chart_info.max;
        var unitMin = chart_info.min;
        chart_info.unitMax = chart_info.max;
        chart_info.unitMin = chart_info.min;
        //var unitMax = stats[chart_info.fieldName].max;
        //var unitMin = stats[chart_info.fieldName].min;
        var type    = chart_info.type;

        var _format_values = function(d, type) {
            if (type == 'throughput') {
                return d3.format('.3s')(d) + 'bps';
            } 
            else if (type == 'latency') {
                return d3.format('.3f')(d) + ' ms';
            } 
            else if (type == 'loss') {
                return d3.format('.3%f')(d);
            } 
            else if (type == 'ts') {
                return d3.time.format('%X %x')(d);
            } 
            else if (type == 'ts_header') {
                return d3.time.format('%c')(d);
            } 
            else {
                return d;
            }
        };


        if (chart_info.valType == 'avg') { 
            chart.valueAccessor(function (d) { return Y_AXIS_MAX * d.value.avg / unitMax; });

            // loss is handled specially
            if (chart_info.type == 'loss') {
                chart.valueAccessor(function(d) { 
                        if (d.value.avg != 0) { 
                        return Y_AXIS_MAX * d.value.avg / unitMax; 
                        } 
                        else {
                        return 0.01; // TODO: fix: hacky -- so we see "0" values
                        }

                        });

            }

            chart_info.title = function(d) { return chart_info.name 
                + ': ' 
                    + _format_values(d.value.avg, type)
                    + "\n" 
                    + _format_values(d.key, 'ts');
            };

        } 
        else if (chart_info.valType == 'sum') {
            chart.valueAccessor(function(d) { return Y_AXIS_MAX * d.value / chart_info.unitMax; }); 
            chart_info.title = function(d) { return chart_info.name
                + ': ' 
                    + _format_values(d.value, type)
                    + "\n" 
                    + _format_values(d.key, 'ts'); 
            };
        }

        if (chart_info.valueAccessor) { chart.valueAccessor(chart_info.valueAccessor) };
        if (chart_info.tickFormat) { chart.yAxis().tickFormat(chart_info.tickFormat); }
        if (chart_info.useRightYAxis) { chart.useRightYAxis(chart_info.useRightYAxis); }

        chart.colors(chart_info.color);
        chart.title(chart_info.title);

        // show dased lines for reverse direct things
        if (chart_info.direction == 'reverse') {
            chart.dashStyle([3, 3]);
        } 

        return chart;
    };

   
    this._create_axes = function(stats){
        var activeObjects = this._get_active_chart_types(stats);

        var axes = []; 
        var unitsAdded = {};

        for(var i in activeObjects) {
            var activeObject = activeObjects[i];
            var axis = {};

            axis.name  = activeObject.name;
            axis.min   = this._get_unit_min(activeObject.unit, stats);
            axis.max   = this._get_unit_max(activeObject.unit, stats);
            //axis.min   = activeObject.min;
            //axis.max   = activeObject.max;
            //axis.min   = activeObject.unitMin;
            //axis.max   = activeObject.unitMax;
            axis.unit  = activeObject.unit;
            axis.color = activeObject.color;

            if (i == 0) {
                activeObject.useRightYAxis = false;
                //activeObject.chart.useRightYAxis(false);
            } else {
                activeObject.useRightYAxis = true;
                //activeObject.chart.useRightYAxis(true);
            }

            // Only add the unit if it's not already in the array
            if (! unitsAdded[activeObject]){
                if (activeObject.tickFormat) {
                    axis.tickFormat = activeObject.tickFormat;
                }
                axes.push(axis);
                unitsAdded[activeObject.unit] = 1;
            }
        }

        return axes;
    };

    this._get_unit_min = function(unit, stats) {
        var activeObjects = this._get_active_chart_types(stats);
        var min = null;
        for(var i in activeObjects) {
            var activeObject = activeObjects[i];
            if (activeObject.unit == unit) {
                if (typeof min === 'undefined' || activeObject.min < min) {
                    min = activeObject.min;
                }
            }
        } 
        return min;
    };

    this._get_unit_max = function(unit, stats) {
        var activeObjects = this._get_active_chart_types(stats);
        var max = null;
        for(var i in activeObjects) {
            var activeObject = activeObjects[i];
            if (activeObject.unit == unit) {
                if (typeof max === 'undefined' || activeObject.max > max) {
                    max = activeObject.max;
                }
            }
        } 
        return max;
    };

    this._render_main_chart = function(charts, axes){
        var container_width  = d3.select("#chart").style("width");
        var container_height = d3.select("#chart").style("height");

        var start_date = new Date(this.start_ts * 1000);
        var end_date = new Date(this.end_ts * 1000);

        var format_min = function(d) { return (d >= 0 ? d : 0);  };

        this.mainChart.width(700)//container_width)
            .height(450)//container_height)
            .brushOn(false)
            .mouseZoomable(true)
            .shareTitle(false)
            .compose(charts)
            .x(d3.time.scale().domain([start_date, end_date])) //.nice())
            .xAxisLabel('Date')
            .y(d3.scale.linear().domain([format_min(axes[0].min), Y_AXIS_MAX * AXIS_SCALE ])) 
            .yAxisLabel(axes[0].name + ' (' + axes[0].unit + ')')
                    .legend(dc.legend().x(40).y(570).itemHeight(13).gap(5).legendWidth(600).horizontal(true).itemWidth(150))

                    .xAxis();

                    //this.mainChart.yAxis().ticks(5);
                    console.log(charts);
                    console.log(axes);
                    //this.mainChart.yAxis().tickFormat(axes[0].tickFormat);
                    this.mainChart.yAxis().tickFormat(this._make_formatter(axes, 0));
                    };

    this._make_formatter = function(axes, index) {
        return function(d) {
            var ret = axes[index].tickFormat( d * axes[index].max / Y_AXIS_MAX );
            return ret;
        }
    }

    this._get_available_chart_types = function() {
	    var sorted = Object.keys(this.CHART_INFO).sort();
                var availableObjects = [];
                for(var i in sorted) {
                    var type_name = sorted[i];
                    var type = this.CHART_INFO[type_name];
	                var field_name = type.fieldName;
                    if (type.hasValues) {
                        availableObjects.push(type);
                    }
                }
                return availableObjects;
            };

    this._get_active_chart_types = function(stats){
        var activeObjects = [];

        // want to keep the legend in the same order
        var sorted = Object.keys(this.CHART_INFO).sort();

        for (var i in sorted){
            var type_name  = sorted[i];
            var type       = this.CHART_INFO[type_name];
            var field_name = type.fieldName;
            //if (stats[field_name]){

                var theType = type.type + (type.direction == 'reverse' ? '_rev' : '');
                var cb = d3.select('#' + theType + "_checkbox");
                if (cb !== null && !cb.empty()) {
                    activeObjects.push(type);
                }
            //}
        }

        return activeObjects;
    };


    // set up the legend including the checkboxes and hover events
    this._create_legend = function(stats){

        var activeObjects = this._get_available_chart_types(stats);

        var parentDiv = d3.select('#legend');
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

        var cbs = d3.selectAll('#legend .dc-legend-item');

        cbs.on("mouseover", function(scope){            
                return function(d, e) { 		
                scope.mainChart.legendHighlight(d); 
                };
                }(this));
        cbs.on("mouseout", function(scope){
                return function(d, e) {
                scope.mainChart.legendReset(d);
                }
                }(this));

        // hook up change events to reload the chart
        for (var i = 0; i < activeObjects.length; i++){
            var activeObject = activeObjects[i];

            var cb = d3.select('#' + activeObject.type + (activeObject.direction == 'reverse' ? '_rev' : '') + "_checkbox");
            cb.on("change", function(scope){
                    return function(){
                    scope._redraw_charts(scope);
                    //scope._draw_charts();
                    }
                    }(this));
        }

    };

    this._redraw_charts = function(scope) {
        //this._get_stats(this.CHART_INFO, stats);
        scope._get_active_chart_types();
        //this._draw_charts();
        scope._render_main_chart(charts, axes);
    };



    /*	var minY;
	var maxY;

	var yNegPadAmt = 0; // RATIO by which to pad negative y axis

	if (minY < 0) {
	    yNegPadAmt = Math.abs(minY / maxY);
	}

	if (maxLoss < 0 && minLoss < 0) { 
	    //yNegPadAmt = yNegPadAmt * -1;
	    //yAxisMax = 100;
	}

    */
    this._set_header = function(){
	var format_ts_header = function(d) { 
	    return d3.time.format('%c')(d);
	}

	var rangeLabel = format_ts_header(new Date(1000 * this.start_ts));
	rangeLabel    += ' -- ';
	rangeLabel    += format_ts_header(new Date(1000 * this.end_ts)); 
	d3.select('.chartTimeRange').html( rangeLabel );
    };


    this._init();
};




/*
    var start_date = new Date (start_ts * 1000);
    var end_date = new Date (end_ts * 1000);


            charts.createReverseCharts = function() {

            }
            charts.createGroups = function() {                
                for(var key in this) {
                    var c = this[key];   // 'c' is the current chart
                    if (isFunction(c)) {
                        continue;
                    }
                    c.chart = dc.psLineChart(parentChart);
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
                    //c.chart.useRightYAxis(true);
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
                    if (c.hasValues) {
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
                        if (typeof this[type + direction] !== 'undefined' && this[type + direction].hasValues) {
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
                var chartOrder = ['throughput', 'latency', 'loss', 'retrans'];
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
                    if (j == 0) {
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

            //if (maxDelay === 0) { maxDelay = 1; }
            minDelay = 0;
            var maxLoss = charts.loss.typeMax;
            var minLoss = charts.loss.typeMin;

            var maxPacketRetrans = charts.retrans.typeMax;
            var minPacketRetrans = charts.retrans.typeMin;

            var activeCharts = charts.getActiveCharts();

            var axes = charts.getAxes();

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

            allTestsChart.width(750)
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
                var minRetransAxis = 0 - (maxPacketRetrans * yNegPadAmt);
                minRetransAxis = 0; // temporarily override ability to have negative values

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


}); // end dojo require function
*/
