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
        iframe.src = "graphWidget.cgi?source="  + source + "&dest="
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
    
    var url = 'graphData.cgi?action=test_list&url=' + ma_url;
    d3.json(url, function(list_error, list_data) {
        var detailed = true;
        if (list_error) { display_error('Error retrieving test data: ' + list_error.statusText); };
        if (list_data.length > detailed_threshold) {
            detailed = false;
            render_test_table(list_error, list_data, detailed);
        } else {
            var url = 'graphData.cgi?action=tests&url=' + ma_url;
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
                        var src = node.source_host;
                        var dest = node.destination_host;
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
                    dataTable.sortBy( function(d) { return TestResultUtils.formatHost(d, sort_field, inactive_threshold); } );

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
                            function(d) { return '<span class="psgraph-val">' + TestResultUtils.formatHost(d, 'source', inactive_threshold) + '</span>'; }, 
                            function(d) { return '<span class="psgraph-val">' + TestResultUtils.formatHost(d, 'destination', inactive_threshold) + '</span>'; },
                            function(d) { return TestResultUtils.formatStats(d, 'throughput_src', inactive_threshold); }, 
                            function(d) { return TestResultUtils.formatStats(d, 'throughput_dst', inactive_threshold); }, 
                            function(d) { return TestResultUtils.formatStats(d, 'owdelay_src', inactive_threshold); }, 
                            function(d) { return TestResultUtils.formatStats(d, 'owdelay_dst', inactive_threshold); }, 
                            function(d) { return TestResultUtils.formatStats(d, 'loss_src', inactive_threshold); }, 
                            function(d) { return TestResultUtils.formatStats(d, 'loss_dst', inactive_threshold); }
                            ]);
                } else {
                    dataTable.columns([
                        function(d) { return '<span class="psgraph-val">' + TestResultUtils.formatHost(d, 'source', inactive_threshold) + '</span>'; }, 
                        function(d) { return '<span class="psgraph-val">' + TestResultUtils.formatHost(d, 'destination', inactive_threshold) + '</span>'; }
                    ]);
                    d3.selectAll('.detailedOnly').style('display', 'none');
                }





                            dc.renderAll();

    } // end render_test_table()

    }); // end dojo function
