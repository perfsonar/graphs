require(["dijit/Dialog", "dijit/form/Button", "dojo/domReady!", "dojox/widget/DialogSimple", "dojo/io-query"], function(Dialog, Button, ready, simple, ioQuery){

    var dlg = new dojox.widget.DialogSimple({ 
           title:"perfSONAR Charts", 
           executeScripts:true, 
           style: "width: 85%; height:85%",
           href:"/serviceTest/graphWidget.cgi" }, 
       'chartDialog');

 
    var createDialog = function(source, dest) {
        dlg.set('href', "/serviceTest/graphWidget.cgi?source="  + source + "&dest=" + dest + "&url=" + ma_url);
        dlg.show(source, dest);
    };

    var ma_url = 'http%3A%2F%2Flocalhost%2Fesmond%2Fperfsonar%2Farchive%2F';
    var uri = document.URL;
    if (uri.indexOf('?') > -1) {
	var query = uri.substring(uri.indexOf("?") + 1, uri.length);
	var queryObject = ioQuery.queryToObject(query);
	if (queryObject.url) {
	    ma_url = queryObject.url;
	    if (ma_url.indexOf('#') > -1) {
		ma_url = ma_url.substring(0, ma_url.indexOf('#'));
	    }
	}
    } 
    //ma_url = encodeURI(ma_url);
    
    var url = '/serviceTest/graphData.cgi?url=' + ma_url + '&action=tests';
    
    d3.json(url, function(error,ps_data) {

	    if (ps_data == undefined){
		d3.select('#loading').style('display', 'none');
		d3.select("#service_test_error").text("Error loading data from MA.").style('display', '');
		return;
	    }

	    var ndx = crossfilter(ps_data);
	    var tableDimension = ndx.dimension(function (d) { return d.source; });
	    //var dataTable = dc.dataTable("#summaryTable");
	    var dataTable = dc.dataTable(".dc-data-table");
	    var now_seconds = new Date() / 1000; // current date in seconds since the epoch

	    var inactive_threshold = now_seconds - 86400 * 7; // now minus 7 days
	    //alert(inactive_threshold);
	    //var inactive_threshold = 1400084435; // TODO: make this dynamic

	    var order = 'asc';

	    dataTable.on("postRender", function(chart){ d3.select('#loading').style('display', 'none');  });

	    dataTable.renderlet(function(table) {
		    var rows = d3.selectAll('#summaryTable tr.dc-table-row');
		    rows.on('click', function(node) {
			    var src = node.source;
			    var dest = node.destination;
			    //            alert('Source: ' + src + '; destination: ' + dest);
			    createDialog(src, dest);
			});
		});

	    var sourceHeader = d3.select('#sourceHeader');
	    var destHeader = d3.select('#destHeader');
	    var sortHeaders = d3.selectAll('.sortHeader');
	    var sortHeaderDivs = sortHeaders.insert('span');
	    sortHeaderDivs.classed('sort', true);

	    var sourceDiv = d3.select('#sourceHeader span.sort');
	    sourceDiv.classed('asc', true);
	    var destDiv = d3.select('#destHeader span.sort');
    
	    sourceHeader.on('click', function(node){ 
		    set_sort('source');
		} );

	    destHeader.on('click', function(node){ 
		    set_sort('destination');
		} );
    
	    var set_sort = function(sort_field) {
		dataTable.sortBy( function(d) { return format_host(d, sort_field); } );

		// Remove all icon classes
		destDiv.classed("asc", false);
		destDiv.classed("desc", false);
		sourceDiv.classed("asc", false);
		sourceDiv.classed("desc", false);

		if (order == 'asc') {
		    // order is currently asc, change to desc
		    order = 'desc';
		    dataTable.order(d3.descending);
		    if (sort_field == 'source') {
			sourceDiv.classed("desc", true);
		    } else {
			destDiv.classed("desc", true);
		    }
		} else {
		    // order is currently desc, change to asc
		    order = 'asc';
		    dataTable.order(d3.ascending);
		    if (sort_field == 'source') {
			sourceDiv.classed("asc", true);
		    } else {
			destDiv.classed("asc", true);
		    }
		}
		dataTable.redraw();

	    }
    
	    dataTable.width(400)
		.height(400)
		.dimension(tableDimension)
		.group(function(d) { return "perfSONAR Test Result Summary" })
		.size(100)
		.columns([
			  function(d) { return '<span class="psgraph-val">' + format_host(d, 'source') + '</span>'; }, 
			  function(d) { return '<span class="psgraph-val">' + format_host(d, 'destination') + '</span>'; },
			  function(d) { return format_stats(d, 'throughput_src'); }, 
			  function(d) { return format_stats(d, 'throughput_dst'); }, 
			  function(d) { return format_stats(d, 'owdelay_src'); }, 
			  function(d) { return format_stats(d, 'owdelay_dst'); }, 
			  function(d) { return format_stats(d, 'loss_src'); }, 
			  function(d) { return format_stats(d, 'loss_dst'); }
			  ]);

	    var format_stats = function(d, prefix) {
		var format_str = '';
		var suffix = '';
		var avg = null;
		var min = null;
		var max = null;

		avg = d[prefix + '_average'];
		min = d[prefix + '_min'];
		max = d[prefix + '_max'];

		if ((/^throughput_/).test(prefix)) {
		    format_str = '.3s';
		    suffix = 'bps';
		} else if ((/^owdelay_/).test(prefix)) {
		    format_str = '.2f';
		} else if ((/^loss_/).test(prefix)) {
		    format_str = '.2f';
		}

		// Account for the last_update field name not including _src or _dst
		prefix = prefix.replace('_src', '');
		prefix = prefix.replace('_dst', '');

		var data = new Array();

		var inactive;
		var last_update_key = prefix + '_last_update';
		if (d[last_update_key] != null && d[last_update_key] < inactive_threshold) {
		    inactive = true;
		} else {
		    inactive = false;
		}


		data[0] = new Object();

		if (avg !== null && ! isNaN(avg)){
		    var prefix = d3.formatPrefix(avg);
		    data[0].value = prefix.scale(avg).toFixed(2) + " " + prefix.symbol + suffix;
		}
		else {
		    data[0].value = "n/a";
		}

		data[0].inactive = inactive;

		var ret = format_output(data);
		return ret;
	    }

	    var format_output = function(data) {
		var ret = '';
		var inactive_class = '';
		ret += '<table class="grid-value' + inactive_class  + '">';
		for(var d in data) {
		    inactive_class = '';
		    if (data[d].inactive) { 
			inactive_class = ' inactive';
		    }		    
		    ret += '<tr class="' + inactive_class + '">';
		    ret += '<td>' + 
			   '</td><td><span class="psgraph-val">' + 
			   ((data[d].value !== null 
			     && typeof data[d].value !== 'undefined') 
			     ? data[d].value 
			     : 'n/a ') 
 	      		+  '</span></td>';
		    ret += '</tr>';
		}
		ret += "</table>";
		return ret;
	    }

	    var format_test_values = function(d, suffix) {
		var ret = '';
		var data = new Array();
		data[0] = new Object();
		data[0].label = 'throughput';
		data[0].value = d["throughput_" + suffix];
		if (d["throughput_last_update"] < inactive_threshold) {
		    data[0].inactive = true;
		} else {
		    data[0].inactive = false;
		}
		data[1] = new Object();
		data[1].label = 'latency';
		data[1].value = d["owdelay_" + suffix];
		if (d["owdelay_last_update"] < inactive_threshold) {
		    data[1].inactive = true;
		} else {
		    data[1].inactive = false;
		}
		data[2] = new Object();
		data[2].label = 'loss';
		data[2].value = d["loss_" + suffix];
		if (d["loss_last_update"] < inactive_threshold) {
		    data[2].inactive = true;
		} else {
		    data[2].inactive = false;
		}

		ret = format_output(data);

		return ret;
	    }

	    var format_host = function(d, type) {
            var ret = '';
            if (d['throughput_' + type + '_ip']) {
                ret = d['throughput_' + type + '_ip'];
                if (d['throughput_' + type + '_host']) {
                    ret = d['throughput_' + type + '_host'] + ' (' + ret + ')';
                }
            } else if (d['owdelay_' + type + '_ip']) {
		        ret = d['owdelay_' + type + '_ip'];
                if (d['owdelay_' + type + '_host']) {
		            ret = d['owdelay_' + type + '_host'] + ' (' + ret + ')';
                }
		    } else if (d['loss_' + type + '_ip']) {
                ret = d['loss_' + type + '_ip']; 
                if (d['loss_' + type + '_host']) {
		            ret = d['loss_' + type + '_host'] + ' (' + ret + ')';
                }
		    }
		    return ret;                                    
	    }

	    var format_bidirectional = function(d) {
		var ret = '';
		var data = new Array();
		data[0] = new Object();
		data[0].label = 'throughput';
		data[0].value = format_boolean(d.throughput_bidirectional);
		data[1] = new Object();
		data[1].label = 'latency';
		data[1].value = format_boolean(d.owdelay_bidirectional);
		data[2] = new Object();
		data[2].label = 'loss';
		data[2].value = format_boolean(d.loss_bidirectional);
		ret = format_output(data);

		return ret;
	    }

	    var format_boolean = function(val) {
		var ret = '';
		if (val === 1) {
		    ret = 'yes';
		} else {
		    ret = 'no';
		}
		return ret;
	    }

	    dc.renderAll();
	});
    }); // end dojo function
