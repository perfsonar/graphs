/*var layout = [[
    {'name': 'Source', 'field': 'source'},
    {'name': 'Destination', 'field': 'destination'},
    {'name': 'Type', 'field': 'type'},
    {'name': 'Bidirectional', 'field': 'bidirectional'},
    {'name': 'Protocol', 'field': 'throughput_protocol'},
    {'name': 'Duration', 'field': 'throughput_duration'},
    {'name': '1 Week Average Throughput', 'field': 'throughput_week_average'},
    {'name': '1 Week Minimum Throughput', 'field': 'throughput_week_min'},
    {'name': '1 Week Average Latency', 'field': 'owdelay_week_average'},
    {'name': '1 Week Maximum Latency', 'field': 'owdelay_week_max'},
    {'name': '1 Week Average Loss', 'field': 'loss_week_average'},
    {'name': '1 Week Maximum Loss', 'field': 'loss_week_max'}

]];
*/


var url = 'https://perfsonar-dev.grnoc.iu.edu/serviceTest/graphData.cgi?url=http%3A%2F%2Flbl-pt1.es.net%3A9085%2Fesmond%2Fperfsonar%2Farchive%2F&action=tests';

//d3.json(encodeURI(url), function(error,ps_data) {
d3.json(url, function(error,ps_data) {
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
            alert('Source: ' + src + '; destination: ' + dest);
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
    
    dataTable.width(600)
        .height(400)
        .dimension(tableDimension)
        .group(function(d) { return "perfSONAR Test Result Summary" })
        .size(100)
        .columns([
            function(d) { return '<span class="psgraph-val">' + format_host(d, 'source') + '</span>'; }, 
            function(d) { return '<span class="psgraph-val">' + format_host(d, 'destination') + '</span>'; },
            function(d) { return format_bidirectional(d); },
            function(d) { return format_test_values(d, 'protocol'); },
            function(d) { return format_test_values(d, 'duration'); },
            function(d) { return format_stats(d, 'throughput_src'); }, 
            function(d) { return format_stats(d, 'throughput_dst'); }, 
            function(d) { return format_stats(d, 'owdelay_src'); }, 
            function(d) { return format_stats(d, 'owdelay_dst'); }, 
            function(d) { return format_stats(d, 'loss_src'); }, 
            function(d) { return format_stats(d, 'loss_dst'); }, 
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
            //var divisor = 1000000000; // one billion
            //var divisor = 1073741824; // 2^30
            var divisor = 1; // no division, let d3.format handle this
            if (d[prefix + '_average'] !== null) { avg = d[prefix + '_average'] / divisor };
            if (d[prefix + '_min'] !== null) { min = d[prefix + '_min'] / divisor };
            if (d[prefix + '_max'] !== null) { max = d[prefix + '_max'] / divisor };

        } else if ((/^owdelay_/).test(prefix)) {
            format_str = '.2f';
            //suffix = 'ms';
        } else if ((/^loss_/).test(prefix)) {
            format_str = '.2f';
            //suffix = '%';    
        }

        // Account for the last_update field name not including _src or _dst
        prefix = prefix.replace('_src', '');
        prefix = prefix.replace('_dst', '');

        var data = new Array();
        data[0] = new Object();
        data[0].label = 'avg';
        data[0].value = (avg !== null ? (d3.format(format_str)(avg) + suffix) : 'n/a');
        if (d[prefix+'_last_update'] < inactive_threshold) {
            data[0].inactive = true;
        } else {
            data[0].inactive = false;
        }
        data[1] = new Object();
        data[1].label = 'min';
        data[1].value = (min !== null ? (d3.format(format_str)(min) + suffix) : 'n/a');
        if (d[prefix+'_last_update'] < inactive_threshold) {
            data[1].inactive = true;
        } else {
            data[1].inactive = false;
        }
        data[2] = new Object();
        data[2].label = 'max';
        data[2].value = (max !== null ? (d3.format(format_str)(max) + suffix): 'n/a');
        if (d[prefix+'_last_update'] < inactive_threshold) {
            data[2].inactive = true;
        } else {
            data[2].inactive = false;
        }

        var ret = format_output(data);
        return ret;
    }

    var format_output = function(data) {
        var ret = '';
        var inactive_class = '';
        //if (data[0].inactive) { inactive_class = ' inactive'; }
        ret += '<table class="grid-value' + inactive_class  + '">';
        for(var d in data) {
            inactive_class = '';
            if (data[d].inactive) { inactive_class = ' inactive'; }
            ret += '<tr class="' + inactive_class + '">';
            ret += '<td>' + data[d].label + ':</td><td><span class="psgraph-val">' + data[d].value + '</span></td>';
            ret += '</tr>';
        }
        return ret;
    }

    var format_test_values = function(d, suffix) {
        var ret = '';
        var data = new Array();
        data[0] = new Object();
        data[0].label = 'bwctl';
        data[0].value = d["throughput_" + suffix];
        if (d["throughput_last_update"] < inactive_threshold) {
            data[0].inactive = true;
        } else {
            data[0].inactive = false;
        }
        data[1] = new Object();
        data[1].label = 'owamp';
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
        if (d['throughput_' + type + '_host'] !== null) {
            ret = d['throughput_' + type + '_host'];
        } else if (d['owdelay_' + type + '_host'] !== null) {
            ret = d['owdelay_' + type + '_host'];
        } else if (d['loss_' + type + '_host'] !== null) {
            ret = d['loss_' + type + '_host']; 
        }
        ret += '<br>(' + d[type]  + ')';
        return ret;                                    
    }

    var format_bidirectional = function(d) {
        var ret = '';
        var data = new Array();
        data[0] = new Object();
        data[0].label = 'bwctl';
        data[0].value = format_boolean(d.throughput_bidirectional);
        data[1] = new Object();
        data[1].label = 'owamp';
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
