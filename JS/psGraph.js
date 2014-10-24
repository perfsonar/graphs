require(["dijit/Dialog", "dijit/form/Button", "dojo/domReady!", "dojox/widget/DialogSimple", "dojo/io-query"], function(Dialog, Button, ready, simple, ioQuery){

    var detailed_threshold = 15;

    var dlg = new dojox.widget.DialogSimple({ 
           title:"perfSONAR Chart", 
           style: "width: 85%; height:85%; max-height:750px",
           }, 
       'chartDialog');

    dlg.connect(dlg, "hide", function(e){
        clear_iframe();
        });
 
    var createDialog = function(source, dest) {
        clear_iframe();
        var iframe = dojo.byId('chart_iframe');
        iframe.src = "/serviceTest/graphWidget.cgi?source="  + source + "&dest="
            + dest + "&url=" + ma_url;

        dlg.show();

    };

    var clear_iframe = function() {
        var iframe = dojo.byId('chart_iframe');
        iframe.src = ''; // Clear the iframe
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
    
    var url = '/serviceTest/graphData.cgi?action=test_list&url=' + ma_url;
    d3.json(url, function(list_error, list_data) {
        var detailed = true;
        if (list_error) { display_error('Error retrieving test data: ' + list_error.statusText); };
        if (list_data.length > detailed_threshold) {
            detailed = false;
            render_test_table(list_error, list_data, detailed);
        } else {
            var url = '/serviceTest/graphData.cgi?action=tests&url=' + ma_url;
            d3.json(url, function(error, ps_data) {
                render_test_table(error, ps_data, detailed);
            });
        }
    });

    function display_error(error_message) {
        var div = d3.selectAll('.psGraphError');
        div.html(error_message);
        d3.select('#summaryTable').style('display', 'none');
        d3.select('#loading').style('display', 'none');
    }
    
    function render_test_table(error, ps_data, detailed) {

                var ndx = crossfilter(ps_data);
                var tableDimension = ndx.dimension(function (d) { return d.source; });
                var dataTable = dc.dataTable(".dc-data-table");
                var now_seconds = new Date() / 1000; // current date in seconds since the epoch

                var inactive_threshold = now_seconds - 86400 * 7; // now minus 7 days
                var order = 'asc';

                dataTable.on("postRender", function(chart){ d3.select('#loading').style('display', 'none'); 
                    order = 'desc';
                    set_sort('source_name');
                        
                        });

                dataTable.renderlet(function(table) {
                    var rows = d3.selectAll('#summaryTable tr.dc-table-row');
                    rows.on('click', function(node) {
                        var src = node.source;
                        var dest = node.destination;
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
                        set_sort('source_name');
                        } );

                destHeader.on('click', function(node){ 
                        set_sort('destination_name');
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
                        if (sort_field == 'source_name') {
                            sourceDiv.classed("desc", true);
                        } else {
                            destDiv.classed("desc", true);
                        }
                    } else {
                        // order is currently desc, change to asc
                        order = 'asc';
                        dataTable.order(d3.ascending);
                        if (sort_field == 'source_name') {
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
                if (detailed) {
                    dataTable.columns([
                            function(d) { return '<span class="psgraph-val">' + format_host(d, 'source') + '</span>'; }, 
                            function(d) { return '<span class="psgraph-val">' + format_host(d, 'destination') + '</span>'; },
                            function(d) { return format_stats(d, 'throughput_src'); }, 
                            function(d) { return format_stats(d, 'throughput_dst'); }, 
                            function(d) { return format_stats(d, 'owdelay_src'); }, 
                            function(d) { return format_stats(d, 'owdelay_dst'); }, 
                            function(d) { return format_stats(d, 'loss_src'); }, 
                            function(d) { return format_stats(d, 'loss_dst'); }
                            ]);
                } else {
                    dataTable.columns([
                        function(d) { return '<span class="psgraph-val">' + format_host_list(d, 'source') + '</span>'; }, 
                        function(d) { return '<span class="psgraph-val">' + format_host_list(d, 'destination') + '</span>'; }
                    ]);
                    d3.selectAll('.detailedOnly').style('display', 'none');
                }


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

                var format_host_list = function(d, type) {
                    var ret = '';
                    if (d[type + '_host']) { 
                       ret += d[type + '_host'];
                    }
                    if (d[type + '_ip'] && d[type + '_ip'] != d[type + '_host']) {
                        ret += ' (' + d[type + '_ip'] + ') ';
                    } else {
                        ret = d[type];
                    }
                    d[type + '_name'] = ret;
                    if (d.last_updated < inactive_threshold) {
                        ret = '<span class="inactive">' + ret + '</span>';
                    }
                    return ret;
                }

                var format_host = function(d, type) {
                    var ret = '';
                    if (d['throughput_' + type + '_host'] !== undefined && d['throughput_' + type + '_host'] !== null) {
                        ret = d['throughput_' + type + '_host'];
                    } else if (d['owdelay_' + type + '_host'] !== undefined && d['owdelay_' + type + '_host'] !== null) {
                        ret = d['owdelay_' + type + '_host'];
                    } else if (d['loss_' + type + '_host'] !== undefined && d['loss_' + type + '_host'] !== null) {
                        ret = d['loss_' + type + '_host']; 
                    }
                    ret += '  (' + d[type]  + ')';
                            d[type + '_name'] = ret;
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

    } // end render_test_table()

    }); // end dojo function
