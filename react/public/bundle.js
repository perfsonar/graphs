webpackJsonp([0,3],{

/***/ 0:
/*!**********************!*\
  !*** ./src/main.jsx ***!
  \**********************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(/*! babel-polyfill */ 1);
	
	var _react = __webpack_require__(/*! react */ 297);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactDom = __webpack_require__(/*! react-dom */ 453);
	
	var _reactRouter = __webpack_require__(/*! react-router */ 454);
	
	var _chart = __webpack_require__(/*! ./chart1 */ 501);
	
	var _chart2 = _interopRequireDefault(_chart);
	
	var _chartLayout = __webpack_require__(/*! ./chartLayout */ 903);
	
	var _chartLayout2 = _interopRequireDefault(_chartLayout);
	
	var _createBrowserHistory = __webpack_require__(/*! history/lib/createBrowserHistory */ 983);
	
	var _createBrowserHistory2 = _interopRequireDefault(_createBrowserHistory);
	
	var _useStandardScroll = __webpack_require__(/*! scroll-behavior/lib/useStandardScroll */ 984);
	
	var _useStandardScroll2 = _interopRequireDefault(_useStandardScroll);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	//import "core-js/es6/object";
	//import "core-js/es6/map";
	//import "core-js/es6/weak-map";
	//import "core-js/fn/symbol";
	//import "es6-symbol/implement";
	
	var history = (0, _useStandardScroll2.default)(_createBrowserHistory2.default)(); /**
	                                                                                   *  Copyright (c) 2015, The Regents of the University of California,
	                                                                                   *  through Lawrence Berkeley National Laboratory (subject to receipt
	                                                                                   *  of any required approvals from the U.S. Dept. of Energy).
	                                                                                   *  All rights reserved.
	                                                                                   *
	                                                                                   *  This source code is licensed under the BSD-style license found in the
	                                                                                   *  LICENSE file in the root directory of this source tree.
	                                                                                   */
	
	/* eslint max-len:0 */
	
	(0, _reactDom.render)(_react2.default.createElement(
	    _reactRouter.Router,
	    { history: history },
	    _react2.default.createElement(_reactRouter.Route, { path: "/", component: _chartLayout2.default }),
	    _react2.default.createElement(_reactRouter.Route, { path: "/perfsonar-graphs/", component: _chartLayout2.default })
	), document.getElementById("content"));

/***/ }),

/***/ 501:
/*!************************!*\
  !*** ./src/chart1.jsx ***!
  \************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _react = __webpack_require__(/*! react */ 297);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _underscore = __webpack_require__(/*! underscore */ 502);
	
	var _underscore2 = _interopRequireDefault(_underscore);
	
	var _moment = __webpack_require__(/*! moment */ 503);
	
	var _moment2 = _interopRequireDefault(_moment);
	
	var _reactMarkdown = __webpack_require__(/*! react-markdown */ 621);
	
	var _reactMarkdown2 = _interopRequireDefault(_reactMarkdown);
	
	var _GraphDataStore = __webpack_require__(/*! ./GraphDataStore */ 643);
	
	var _GraphDataStore2 = _interopRequireDefault(_GraphDataStore);
	
	var _GraphUtilities = __webpack_require__(/*! ./shared/GraphUtilities */ 804);
	
	var _GraphUtilities2 = _interopRequireDefault(_GraphUtilities);
	
	var _d = __webpack_require__(/*! d3 */ 808);
	
	var _d2 = _interopRequireDefault(_d);
	
	var _reactTimeseriesCharts = __webpack_require__(/*! react-timeseries-charts */ 809);
	
	var _pondjs = __webpack_require__(/*! pondjs */ 644);
	
	var _SIValue = __webpack_require__(/*! ./SIValue */ 898);
	
	var _SIValue2 = _interopRequireDefault(_SIValue);
	
	__webpack_require__(/*! ./chart1.css */ 899);
	
	var _chartLayout = __webpack_require__(/*! ./chartLayout.jsx */ 903);
	
	var _chartLayout2 = _interopRequireDefault(_chartLayout);
	
	__webpack_require__(/*! ../css/graphs.css */ 973);
	
	__webpack_require__(/*! ../../toolkit/web-ng/root/css/app.css */ 979);
	
	__webpack_require__(/*! ../css/spinner.css */ 981);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var charts = void 0;
	var chartData = void 0;
	var tooltip = null;
	var trackerValues = {};
	
	var text = 'perfSONAR chart';
	
	var typesToChart = [{
	    name: "throughput",
	    esmondName: "throughput",
	    label: "Throughput",
	    unit: "bps"
	}, {
	    name: "loss",
	    esmondName: "packet-count-sent",
	    label: "Packet Loss",
	    unit: "packet"
	}, {
	    name: "loss",
	    esmondName: "packet-count-lost",
	    label: "Packet Loss",
	    unit: "packet"
	}, {
	    name: "loss",
	    esmondName: "packet-count-lost-bidir",
	    label: "Packet Loss",
	    unit: "packet"
	}, {
	    name: "loss",
	    esmondName: "packet-loss-rate",
	    label: "Packet Loss %",
	    unit: "fractional"
	}, {
	    name: "loss",
	    esmondName: "packet-loss-rate-bidir",
	    label: "Packet Loss",
	    unit: "fractional"
	}, {
	    name: "throughput",
	    esmondName: "packet-retransmits",
	    label: "Retransmits",
	    unit: "packet"
	}, {
	    name: "latency",
	    esmondName: "histogram-owdelay",
	    label: "Latency",
	    unit: "ms"
	}, {
	    name: "latency",
	    esmondName: "histogram-rtt",
	    label: "Latency",
	    unit: "ms"
	}];
	
	var subtypesToChart = [{
	    name: "failures",
	    label: "Failures"
	}];
	
	var scheme = {
	    tcp: "#0076b4", // blue
	    udp: "#cc7dbe", // purple
	    ipv4: "#e5a11c", // yellow
	    ipv6: "#633", // brown
	    throughput: "#0076b4", // blue
	    throughputTCP: "#0076b4", // blue
	    "packet-retransmits": "#cc7dbe", // purple
	    "packet-loss-rateLatency": "#2b9f78", // green
	    "histogram-rtt": "#e5a11c", // yellow/orange
	    "histogram-owdelay": "#633", // brown
	    "packet-loss-rate": "#cc7dbe", // purple
	    "packet-loss-rateThroughput": "#cc7dbe", // purple
	    //"packet-loss-ratePing": "yellow", // bright orange
	    "packet-loss-ratePing": "#e5801c", // browny orangey
	    throughputUDP: "#d6641e" // vermillion
	};
	
	var failureStyle = function failureStyle(column, event) {
	    return {
	        normal: {
	            fill: "red",
	            opacity: 0.8
	        },
	        highlighted: {
	            fill: "#a7c4dd",
	            opacity: 1.0,
	            cursor: "crosshair"
	        },
	        selected: {
	            fill: "orange",
	            opacity: 1.0
	        },
	        muted: {
	            fill: "grey",
	            opacity: 0.5
	        }
	    };
	};
	
	var infoStyle = {
	    line: { stroke: "#999", cursor: "crosshair", pointerEvents: "none" },
	    box: { fill: "white", opacity: 0.90, stroke: "#999", pointerEvents: "none" }
	};
	
	var connectionsStyle = {
	    color: scheme.tcp,
	    strokeWidth: 1
	};
	
	var requestsStyle = {
	    stroke: "#990000",
	    strokeWidth: 2,
	    strokeDasharray: "4,2"
	};
	
	var chartStyles = {
	    tcp: {
	        color: scheme.tcp
	    },
	    udp: {
	        color: scheme.tcp
	
	    }
	
	};
	
	function getChartStyle(options, column) {
	    if (typeof column == "undefined") {
	        column = "value";
	    }
	    var color = scheme.tcp;
	    var strokeStyle = "";
	    var width = 3;
	    var opacity = 1;
	    var fill = "none";
	
	    switch (options.protocol) {
	        case "tcp":
	            color = scheme.tcp;
	            opacity = 0.8;
	            break;
	        default:
	            color = scheme.udp;
	            opacity = 0.8;
	            break;
	    }
	
	    switch (options.eventType) {
	        case "throughput":
	            if (options.protocol == "tcp") {
	                color = scheme.throughputTCP;
	            } else {
	                color = scheme.throughputUDP;
	            }
	            break;
	        case "histogram-owdelay":
	            // owdelay is always UDP
	            color = scheme["histogram-owdelay"];
	            break;
	        case "histogram-rtt":
	            color = scheme["histogram-rtt"];
	            break;
	        case "packet-loss-rate":
	            if (options.mainEventType == "throughput") {
	                color = scheme["packet-loss-rateThroughput"];
	            } else {
	                color = scheme["packet-loss-rateLatency"];
	            }
	            break;
	        case "packet-loss-rate-bidir":
	            color = scheme["packet-loss-ratePing"];
	            opacity = 0.95;
	            width = 2;
	            break;
	        case "packet-retransmits":
	            color = scheme["packet-retransmits"];
	            opacity = 0.9;
	            fill = "#cc7dbe";
	            width = 0;
	            break;
	
	    }
	    if (options.direction == "reverse" && options.eventType != "packet-retransmits") {
	        strokeStyle = "4,2";
	        width = 3;
	    }
	    var style = {};
	    style[column] = {
	        normal: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle, fill: fill },
	        highlighted: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle },
	        selected: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle },
	        muted: { stroke: color, strokeWidth: width, opacity: opacity, strokeDasharray: strokeStyle }
	    };
	    return style;
	}
	
	var lineStyles = {
	    value: {
	        stroke: scheme.udp,
	        strokeWidth: 1.5
	    }
	};
	
	var reverseStyles = {
	    value: {
	        stroke: scheme.connections,
	        strokeDasharray: "4,2",
	        strokeWidth: 1.5
	    }
	};
	
	var trans = 'translate("-50px", "-80px")';
	
	var axisLabelStyle = {
	    labelColor: "black",
	    labelFont: "\"Open Sans\", \"Helvetica Neue\", \"Helvetica\", Arial, sans-serif",
	    labelSize: "14",
	    labelOffset: 5,
	    labelWeight: 200
	};
	
	var failureLabelStyle = {
	    display: "none",
	    visibility: "hidden",
	    opacity: 0
	};
	
	var offsets = {
	    label: 60
	};
	
	var chartRow = {
	    height: 150,
	    brushHeight: 50
	};
	
	var brushStyle = {
	    boxShadow: "inset 0px 2px 5px -2px rgba(189, 189, 189, 0.75)",
	    background: "#FEFEFE",
	    paddingTop: 10
	};
	
	exports.default = _react2.default.createClass({
	    displayName: "chart1",
	
	
	    mixins: [_reactTimeseriesCharts.Highlighter],
	
	    getInitialState: function getInitialState() {
	        var startDate = new Date(this.props.start * 1000);
	        var endDate = new Date(this.props.end * 1000);
	        var startMoment = (0, _moment2.default)(startDate);
	        var endMoment = (0, _moment2.default)(endDate);
	        var timerange = new _pondjs.TimeRange(startMoment, endMoment);
	
	        return {
	            markdown: text,
	            active: {
	                throughput: true,
	                forward: true,
	                reverse: true,
	                loss: true,
	                latency: true,
	                failures: true,
	                "packet-retransmits": true,
	                "loss-latency": true
	
	            },
	            start: this.props.start,
	            end: this.props.end,
	            summaryWindow: this.props.summaryWindow,
	            agent: this.props.agent,
	            tracker: null,
	            chartSeries: null,
	            timerange: timerange,
	            initialTimerange: timerange,
	            brushrange: null,
	            maxLatency: 1,
	            maxThroughput: 1,
	            maxLoss: 0.0000000001,
	            latencySeries: null,
	            itemsToHide: {},
	            showBrush: false,
	            // Highlighting
	            hover: null,
	            highlight: null,
	            selection: null,
	            loading: true,
	            params: undefined,
	            dataloaded: false,
	            initialLoading: true,
	            lockToolTip: false,
	            toolTipWidth: null,
	            ttCollapse: {
	                throughput: false,
	                loss: false,
	                latency: false,
	                failures: false
	
	            },
	            showHoverDots: false,
	            showHoverTime: null
	            //trackerValues: {}
	        };
	    },
	    handleSelectionChanged: function handleSelectionChanged(point) {
	        this.setState({
	            selection: point
	        });
	    },
	    toggleTT: function toggleTT(event, testType) {
	        if (!event) {
	            return;
	        }
	        event.preventDefault();
	        $("li.graph-values-popover__item li." + testType + "-val").toggle();
	
	        var ttCollapse = this.state.ttCollapse;
	
	        var collapsed = ttCollapse[testType];
	
	        ttCollapse[testType] = !collapsed;
	
	        this.setState({ ttCollapse: ttCollapse });
	    },
	    getTTItemClass: function getTTItemClass(testType) {
	        var ttCollapse = this.state.ttCollapse;
	        var ret = testType + "-val";
	        if (ttCollapse[testType]) {
	            return ret + " hidden";
	        } else {
	            return ret;
	        }
	    },
	    getTTIconClass: function getTTIconClass(testType) {
	        var ttCollapse = this.state.ttCollapse;
	        if (ttCollapse[testType]) {
	            return "fa-plus-square-o";
	        } else {
	            return "fa-minus-square-o";
	        }
	    },
	    handleMouseEnter: function handleMouseEnter(event, point) {
	        this.setState({ showHoverDots: true });
	    },
	    handleMouseLeave: function handleMouseLeave(event, point) {
	        if (!this.state.lockToolTip) {
	            this.setState({ showHoverDots: false });
	        }
	    },
	    handleMouseMove: function handleMouseMove(event, point) {
	        if (this.state.lockToolTip) {
	            return;
	        }
	        var _refs$graphDiv = this.refs.graphDiv,
	            clientHeight = _refs$graphDiv.clientHeight,
	            clientWidth = _refs$graphDiv.clientWidth;
	
	        var pos = this.getMousePos(event);
	        var posX = pos.posX;
	        var toolTipWidth = void 0;
	
	        if (typeof this.refs.tooltip == "undefined") {
	            toolTipWidth = this.state.toolTipWidth;
	        } else {
	            toolTipWidth = this.refs.tooltip.clientWidth;
	        }
	        if (typeof toolTipWidth == "undefined" || toolTipWidth === null) {
	            toolTipWidth = clientWidth * 0.23;
	        }
	        var offsetX = 25;
	        //console.log("clientWidth", clientWidth, "toolTipWidth", toolTipWidth);
	        if (posX < 0.66 * clientWidth) {
	            posX += offsetX;
	        } else {
	            posX -= offsetX + toolTipWidth + 25;
	        }
	
	        this.setState({ posX: posX, toolTipWidth: toolTipWidth });
	    },
	    getMousePos: function getMousePos(e) {
	        var m_posx = 0,
	            m_posy = 0,
	            e_posx = 0,
	            e_posy = 0,
	            obj = this;
	        //get mouse position on document crossbrowser
	        if (!e) {
	            e = window.event;
	        }
	        if (e.pageX || e.pageY) {
	            m_posx = e.pageX;
	            m_posy = e.pageY;
	        } else if (e.clientX || e.clientY) {
	            m_posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	            m_posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	        }
	        //get parent element position in document
	        if (obj.offsetParent) {
	            do {
	                e_posx += obj.offsetLeft;
	                e_posy += obj.offsetTop;
	            } while (obj = obj.offsetParent);
	        }
	        // mouse position minus elm position is mouseposition relative to element:
	        var x_position = m_posx - e_posx;
	        var y_position = m_posy - e_posy;
	
	        return { posX: x_position, posY: y_position };
	    },
	    getToolTipPos: function getToolTipPos() {},
	    handleClick: function handleClick(e, f, g) {
	        this.setState({
	            lockToolTip: !this.state.lockToolTip
	        });
	    },
	    handleMouseNear: function handleMouseNear(point) {
	        this.setState({
	            highlight: point
	        });
	    },
	
	
	    contextTypes: {
	        router: _react2.default.PropTypes.func
	    },
	
	    renderToolTip: function renderToolTip() {
	        var _this = this;
	
	        var tracker = this.state.tracker;
	        var dateFormat = "MM/DD/YYYY HH:mm:ss";
	        var date = (0, _moment2.default)(tracker).format(dateFormat);
	        var trackerString = "";
	        if (tracker !== null && typeof tracker != "undefined") {
	            trackerString = tracker.toString();
	        }
	        var tz = _GraphUtilities2.default.getTimezone(trackerString);
	
	        var display = "block";
	
	        // Retrieve chart data for the tooltip
	
	        var tooltipItems = {};
	        tooltipItems["throughput"] = [];
	        tooltipItems["latency"] = [];
	        tooltipItems["loss"] = [];
	        tooltipItems["failures"] = [];
	
	        if ((this.state.lockToolTip || tracker != null) && typeof charts != "undefined") {
	            var data = this.getTrackerData();
	            if (typeof data == "undefined" || data.length == 0) {
	                display = "none";
	            } else {
	                display = "block";
	            }
	
	            if (this.state.lockToolTip) {
	                display = "block";
	            }
	
	            var unique = _GraphDataStore2.default.getUniqueValues({ "ipversion": 1 });
	            var ipversions = unique.ipversion;
	            var filters = {};
	            var tooltipTypes = typesToChart.concat(subtypesToChart);
	
	            // Build the filters
	
	            for (var i in ipversions) {
	                for (var h in tooltipTypes) {
	                    var eventType = tooltipTypes[h];
	                    var type = eventType.name;
	                    var label = eventType.label;
	                    var esmondName = eventType.esmondName || type;
	                    var ipversion = ipversions[i];
	                    var ipv = "ipv" + ipversion;
	
	                    var filter = { testType: type, ipversion: ipversion };
	                    var eventTypeFilter = { eventType: type, ipversion: ipversion };
	                    if (typeof filters[type] == "undefined") {
	                        filters[type] = {};
	                    }
	                    filters[type][ipversion] = filter;
	                    if (type == "failures") {
	                        filters[type][ipversion] = eventTypeFilter;
	                    } else if (type == "throughput") {
	                        filters[type][ipversion] = eventTypeFilter;
	                    }
	                }
	            }
	
	            for (var k in ipversions) {
	                var failureItems = [];
	                var throughputItems = [];
	                var lossItems = [];
	                var latencyItems = [];
	
	                var _ipversion = ipversions[k];
	                var _ipv = "ipv" + _ipversion;
	
	                // We need to use a different list of items to hide for failures, because
	                // normally we query on "eventType" but for this we need to check
	                // "mainEventType" (since "failures" is the "eventType" and 
	                // "mainEventType might be "throughput" or "latency" etc.)
	                var failureItemsToHide = [];
	                var eventTypeRe = /^eventType/;
	
	                for (var key in this.state.itemsToHide) {
	                    var row = this.state.itemsToHide[key];
	                    var newObj = {};
	                    var newKey = key;
	                    if (newKey) {
	                        for (var subkey in row) {
	                            var val = row[subkey];
	                            var newSubkey = subkey;
	                            if (newSubkey) {
	                                newObj[newSubkey] = val;
	                            }
	                        }
	
	                        failureItemsToHide.push(newObj);
	                    }
	                }
	
	                var _filter = filters["failures"][_ipversion];
	                var failuresData = _GraphDataStore2.default.filterData(data, filters["failures"][_ipversion], this.state.itemsToHide);
	                //failureData.sort(this.compareToolTipData);
	                if (failuresData.length == 0) {
	                    //failureItems = [];
	                } else {
	                    FAILUREDATA: for (var _i in failuresData) {
	                        var _row = failuresData[_i];
	                        var ts = _row.ts;
	                        var tool = this.getTool(_row);
	                        var timeslip = 0.008;
	                        var duration = this.state.timerange.duration();
	                        var range = duration * timeslip;
	
	                        if (typeof ts == "undefined" || !this.withinTime(ts.getTime(), tracker.getTime(), range)) {
	                            continue;
	                        }
	
	                        // TODO: we'll want to improve performance by filtering out
	                        // the mainEventType "undefined" values (which represent trace etc)
	                        // from the DATA, rather than display
	                        if (typeof _row.properties.mainEventType == "undefined") {
	                            continue;
	                        }
	
	                        var hide = false;
	                        FAILUREITEMS: for (var j in failureItemsToHide) {
	                            var item = failureItemsToHide[j];
	                            hide = true;
	                            for (var criterion in item) {
	                                if (criterion == "eventType") {
	                                    if (_row.properties.mainEventType == item[criterion] && item[criterion] != "packet-loss-rate") {
	                                        hide = hide && true;
	                                    } else {
	                                        hide = false;
	                                        continue;
	                                    }
	                                } else {
	                                    if (_row.properties[criterion] == item[criterion]) {
	                                        hide = hide && true;
	                                    } else {
	                                        hide = false;
	                                        continue;
	                                    }
	                                }
	                            }
	                            if (hide) {
	                                continue FAILUREDATA;
	                            }
	                        }
	
	                        var dir = "->"; // Unicode >
	                        if (_row.properties.direction == "reverse") {
	                            dir = "<-"; // Unicode <
	                        }
	                        var prot = "";
	                        if (typeof _row.properties.protocol != "undefined") {
	                            prot = _row.properties.protocol.toUpperCase();
	                            prot += " ";
	                        }
	                        var testType = _row.properties.mainTestType;
	                        if (!hide) {
	                            failureItems.push(_react2.default.createElement(
	                                "li",
	                                { className: this.getTTItemClass("failures") },
	                                dir,
	                                " [",
	                                testType,
	                                "] ",
	                                prot,
	                                _row.error,
	                                " ",
	                                tool
	                            ));
	                        }
	                    }
	                }
	
	                // GET THROUGHPUT DATA
	                var throughputData = _GraphDataStore2.default.filterData(data, filters.throughput[_ipversion], this.state.itemsToHide);
	                throughputData.sort(this.compareToolTipData);
	
	                for (var _i2 in throughputData) {
	                    var _row2 = throughputData[_i2];
	                    var _key = _row2.properties["metadata-key"];
	                    var direction = _row2.properties.direction;
	                    var _tool = this.getTool(_row2);
	                    var protocol = this.getProtocol(_row2);
	
	                    // get retrans values
	                    var retransFilter = {
	                        eventType: "packet-retransmits",
	                        ipversion: _ipversion,
	                        "metadata-key": _key,
	                        direction: direction
	
	                    };
	                    var retransData = _GraphDataStore2.default.filterData(data, retransFilter, this.state.itemsToHide);
	
	                    var retransVal = "";
	                    if (retransData.length > 0) {
	                        retransVal = retransData[0].value;
	                    } else {
	                        retransVal = "";
	                    }
	
	                    var retransLabel = "";
	                    if (typeof retransVal != "undefined" && retransVal != "" && retransVal != null) {
	                        retransLabel += "; retrans: " + retransVal;
	                    } else {
	                        retransVal = "";
	                        retransLabel = "";
	                    }
	
	                    var _dir = "->"; // Unicode >
	                    if (_row2.properties.direction == "reverse") {
	                        _dir = "<-"; // Unicode <
	                    }
	                    throughputItems.push(_react2.default.createElement(
	                        "li",
	                        { className: this.getTTItemClass("throughput") },
	                        _dir,
	                        " ",
	                        _react2.default.createElement(_SIValue2.default, { value: this._formatZero(_row2.value), digits: 3 }),
	                        "bits/s",
	                        protocol,
	                        retransLabel,
	                        _tool
	                    ));
	                }
	
	                // GET LOSS DATA
	                var lossData = _GraphDataStore2.default.filterData(data, filters["loss"][_ipversion], this.state.itemsToHide);
	
	                lossData = _GraphDataStore2.default.pairSentLost(lossData);
	
	                lossData.sort(this.compareToolTipData);
	                for (var _i3 in lossData) {
	                    var _row3 = lossData[_i3];
	                    if (typeof _row3 == "undefined" || typeof _row3.value == "undefined") {
	                        continue;
	                    }
	                    var _dir2 = "->"; // Unicode >
	                    if (_row3.properties.direction == "reverse") {
	                        _dir2 = "<-"; // Unicode <
	                    }
	                    var _label = "latency";
	                    if (_row3.properties.mainEventType == "histogram-rtt") {
	                        _label = "ping";
	                    } else if (_row3.properties.eventType == "packet-count-lost-bidir") {
	                        _label = "ping count";
	                    } else if (_row3.properties.mainEventType == "throughput") {
	                        _label = "UDP";
	                    } else if (_row3.properties.mainEventType == "histogram-owdelay") {
	                        _label = "owamp";
	                    }
	
	                    var _tool2 = this.getTool(_row3);
	                    var value = _row3.value;
	
	                    if (_row3.properties.eventType == "packet-loss-rate" || _row3.properties.eventType == "packet-loss-rate-bidir") {
	                        value = this._formatToolTipLossValue(value, "float");
	                        _row3.lostValue = this._formatToolTipLossValue(_row3.lostValue, "integer");
	                        _row3.sentValue = this._formatToolTipLossValue(_row3.sentValue, "integer");
	                    } else {
	                        continue;
	                    }
	
	                    var _key2 = _row3.properties["metadata-key"];
	
	                    if (_row3.lostValue != null && _row3.sentValue != null) {
	                        lossItems.push(_react2.default.createElement(
	                            "li",
	                            { className: this.getTTItemClass("loss") },
	                            _dir2,
	                            " ",
	                            value,
	                            "% lost (",
	                            _row3.lostValue,
	                            " of ",
	                            _row3.sentValue,
	                            " packets) ",
	                            "(" + _label + ")",
	                            _tool2
	                        ));
	                    } else {
	                        lossItems.push(_react2.default.createElement(
	                            "li",
	                            { className: this.getTTItemClass("loss") },
	                            _dir2,
	                            " ",
	                            value,
	                            "% (",
	                            _label,
	                            ")",
	                            _tool2
	                        ));
	                    }
	                }
	
	                var latencyData = _GraphDataStore2.default.filterData(data, filters["latency"][_ipversion], this.state.itemsToHide);
	                latencyData.sort(this.compareToolTipData);
	                for (var _i4 in latencyData) {
	                    var latRow = latencyData[_i4];
	                    if (typeof latRow == "undefined" || typeof latRow.value == "undefined") {
	                        continue;
	                    }
	                    var _dir3 = "->"; // Unicode >
	                    if (latRow.properties.direction == "reverse") {
	                        _dir3 = "<-"; // Unicode <
	                    }
	                    var _label2 = "(owamp)";
	                    if (latRow.properties.mainEventType == "histogram-rtt") {
	                        _label2 = "(ping)";
	                    }
	
	                    var _tool3 = this.getTool(latRow);
	
	                    var owampVal = latRow.value.toFixed(1);
	                    if (Math.abs(owampVal) < 1) {
	                        owampVal = latRow.value.toFixed(2);
	                    }
	                    if (Math.abs(owampVal) < 0.01) {
	                        owampVal = latRow.value.toFixed(4);
	                    }
	                    latencyItems.push(_react2.default.createElement(
	                        "li",
	                        { className: this.getTTItemClass("latency") },
	                        _dir3,
	                        " ",
	                        owampVal,
	                        " ms ",
	                        _label2,
	                        _tool3
	                    ));
	                }
	
	                if (throughputItems.length > 0) {
	                    tooltipItems["throughput"].push(_react2.default.createElement(
	                        "li",
	                        { className: "graph-values-popover__item" },
	                        _react2.default.createElement(
	                            "ul",
	                            null,
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "h6",
	                                    null,
	                                    _react2.default.createElement(
	                                        "a",
	                                        { href: "#", onClick: function onClick(event) {
	                                                return _this.toggleTT(event, "throughput");
	                                            } },
	                                        _react2.default.createElement("i", { className: "fa " + this.getTTIconClass("throughput"), "aria-hidden": "true" }),
	                                        "Throughput - ",
	                                        _ipv
	                                    )
	                                )
	                            ),
	                            throughputItems
	                        )
	                    ));
	                }
	                if (lossItems.length > 0) {
	                    tooltipItems["loss"].push(_react2.default.createElement(
	                        "li",
	                        { className: "graph-values-popover__item" },
	                        _react2.default.createElement(
	                            "ul",
	                            null,
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "h6",
	                                    null,
	                                    _react2.default.createElement(
	                                        "a",
	                                        { href: "#", onClick: function onClick(event) {
	                                                return _this.toggleTT(event, "loss");
	                                            } },
	                                        _react2.default.createElement("i", { className: "fa " + this.getTTIconClass("loss"), "aria-hidden": "true" }),
	                                        "Loss - ",
	                                        _ipv
	                                    )
	                                )
	                            ),
	                            lossItems
	                        )
	                    ));
	                }
	                if (latencyItems.length > 0) {
	                    tooltipItems["latency"].push(_react2.default.createElement(
	                        "li",
	                        { className: "graph-values-popover__item" },
	                        _react2.default.createElement(
	                            "ul",
	                            null,
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "h6",
	                                    null,
	                                    _react2.default.createElement(
	                                        "a",
	                                        { href: "#", onClick: function onClick(event) {
	                                                return _this.toggleTT(event, "latency");
	                                            } },
	                                        _react2.default.createElement("i", { className: "fa " + this.getTTIconClass("latency"), "aria-hidden": "true" }),
	                                        "Latency - ",
	                                        _ipv
	                                    )
	                                )
	                            ),
	                            latencyItems
	                        )
	                    ));
	                }
	
	                if (failureItems.length > 0) {
	                    tooltipItems["failures"].push(_react2.default.createElement(
	                        "li",
	                        { className: "graph-values-popover__item" },
	                        _react2.default.createElement(
	                            "ul",
	                            null,
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "h6",
	                                    null,
	                                    _react2.default.createElement(
	                                        "a",
	                                        { href: "#", onClick: function onClick(event) {
	                                                return _this.toggleTT(event, "failures");
	                                            } },
	                                        _react2.default.createElement("i", { className: "fa " + this.getTTIconClass("failures"), "aria-hidden": "true" }),
	                                        "Test Failures - ",
	                                        _ipv
	                                    )
	                                )
	                            ),
	                            failureItems
	                        )
	                    ));
	                }
	            }
	
	            var allItems = tooltipItems["throughput"].concat(tooltipItems["loss"], tooltipItems["latency"], tooltipItems["failures"]);
	
	            var trackerTS = Math.floor(tracker / 1000);
	            if (allItems.length == 0 || !(trackerTS >= this.state.start && trackerTS <= this.state.end)) {
	                display = "none";
	                return;
	            } else {}
	            var posX = this.state.posX;
	            var toolTipStyle = {
	                left: posX + "px"
	            };
	
	            var newTooltip = _react2.default.createElement(
	                "div",
	                { className: "small-2 columns" },
	                _react2.default.createElement(
	                    "div",
	                    { className: "sidebar-popover graph-values-popover", display: display, style: toolTipStyle, ref: "tooltip" },
	                    _react2.default.createElement(
	                        "span",
	                        { className: "graph-values-popover__heading" },
	                        date,
	                        " ",
	                        tz
	                    ),
	                    _react2.default.createElement(
	                        "span",
	                        { className: "graph-values-popover__close sidebar-popover__close" },
	                        _react2.default.createElement(
	                            "a",
	                            { href: "", onClick: this.handleCloseTooltipClick },
	                            _react2.default.createElement("i", { className: "fa fa-close" })
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "ul",
	                        { className: "graph-values-popover__list" },
	                        allItems
	                    )
	                )
	            );
	            tooltip = newTooltip;
	            return tooltip;
	        } else {
	            return null;
	        }
	    },
	    _formatZero: function _formatZero(value) {
	        if (value == 1e-9) {
	            return 0;
	        }
	        return value;
	    },
	    _formatToolTipLossValue: function _formatToolTipLossValue(value, format) {
	        if (typeof format == "undefined") {
	            format = "float";
	        }
	        if (typeof value == "undefined") {
	            return null;
	        }
	
	        // Horrible hack; values of 0 are rewritten to 1e-9 since our log scale
	        // can't handle zeroes
	        value = this._formatZero(value);
	        if (value > 0) {
	            if (format == "integer") {
	                value = Math.floor(value);
	            } else if (format == "percent") {
	                value = parseFloat((value * 100).toPrecision(5));
	            } else {
	                value = parseFloat(value.toPrecision(6));
	            }
	        }
	        value = this._removeExp(value);
	        return value;
	    },
	    _removeExp: function _removeExp(val) {
	        val += "";
	        if (val.includes("e")) {
	            var arr = val.split('e');
	            var precision = Math.abs(arr[1]);
	            var num = arr[0].split('.');
	            precision += num[1].length;
	
	            val = (+val).toFixed(precision);
	        }
	
	        return val;
	    },
	    compareToolTipData: function compareToolTipData(a, b) {
	        a = a.sortKey;
	        b = b.sortKey;
	        // Hack to show ping loss after owamp loss
	        a = a.replace(/-bidir/, "z-bidir");
	        b = b.replace(/-bidir/, "z-bidir");
	        if (a < b) return -1;
	        if (a > b) return 1;
	        return 0;
	    },
	    handleTrackerChanged: function handleTrackerChanged(trackerVal, selection) {
	        if (!this.state.lockToolTip) {
	            this.setState({ tracker: trackerVal });
	        }
	        if (trackerVal !== null) {
	            this.setState({ showHoverDots: true });
	        } else {
	            //this.setState({showHoverDots: false});
	
	        }
	    },
	    withinTime: function withinTime(ts1, ts2, range) {
	        if (Math.abs(ts1 - ts2) < range) {
	            return true;
	        } else {
	            return false;
	        }
	    },
	    getTrackerData: function getTrackerData() {
	        var tracker = this.state.tracker;
	        var trackerData = [];
	
	        if (tracker != null && typeof charts != "undefined") {
	
	            trackerValues = {};
	
	            for (var type in charts) {
	                var data = charts[type].data;
	                if (data.length == 0) {
	                    continue;
	                }
	                trackerValues[type] = {};
	
	                for (var i in data) {
	                    var row = data[i];
	                    if (typeof row == "undefined" || typeof row.values == "undefined" || typeof row.values.range() == "undefined" || typeof row.values.range().begin() == "undefined") {
	
	                        continue;
	                    }
	
	                    var range = row.values.range();
	                    var begin = +range.begin();
	                    var end = +range.end();
	                    var slip = 0.05 * (end - begin);
	                    // begin doesn't seem to need the slip, since it snaps left
	                    //begin = begin - slip;
	                    end = end + slip;
	                    if (row.properties.eventType != "failures" && row.properties.eventType != "packet-retransmits" && (begin > +tracker || end < +tracker)) {
	                        continue;
	                    }
	
	                    var valAtTime = row.values.atTime(tracker);
	                    var value = void 0;
	                    if (typeof valAtTime != "undefined") {
	                        value = valAtTime.value();
	                    } else {
	                        //continue;
	                        value = 0;
	                    }
	
	                    var eventType = row.properties.eventType;
	                    var direction = row.properties.direction;
	                    var protocol = row.properties.protocol;
	
	                    if (typeof protocol == "undefined") {
	                        protocol = "";
	                    }
	
	                    var time = valAtTime.timestamp();
	                    if (eventType == "packet-retransmits") {
	                        // retrieve the trans instead of value
	                        value = valAtTime.value("retrans");
	                        if (Math.abs(time - tracker) > slip / 2) {
	                            continue;
	                        }
	                    }
	
	                    var sortKey = eventType + protocol + direction;
	
	                    var ipv = "ipv" + row.properties.ipversion;
	                    sortKey += "tracker";
	                    var name = type + ipv + "tracker";
	                    //let time = +tracker;
	                    if (typeof trackerValues[type][ipv] == "undefined") {
	                        trackerValues[type][ipv] = [];
	                    }
	                    var td = {
	                        name: name,
	                        columns: ["time", "value"],
	                        points: [[time, +value]]
	                    };
	                    var timeseries = new _pondjs.TimeSeries(td);
	                    var out = {
	                        properties: row.properties,
	                        data: timeseries,
	                        sortKey: sortKey
	                    };
	
	                    if (row.properties.eventType != "packet-retransmits") {
	                        trackerValues[type][ipv].push(out);
	                    }
	
	                    out = {
	                        properties: row.properties,
	                        value: value,
	                        sortKey: sortKey
	                    };
	
	                    var error = undefined;
	                    if (row.properties.eventType == "failures") {
	                        error = valAtTime.value("errorText");
	                        var errorObj = void 0;
	                        if (typeof error != "undefined") {
	                            out.error = error;
	                            out.ts = valAtTime.timestamp();
	                        } else {
	                            // TODO: fix what happens when the error is undefined
	                            //delete out.error;
	                        }
	                    }
	
	                    trackerData.push(out);
	                }
	            }
	
	            //trackerData = trackerValues;
	        } else {
	                //this.setState({showHoverDots: false});
	
	            }
	
	        return trackerData;
	    },
	    renderChart: function renderChart() {
	
	        if (this.state.initialLoading) {
	            return null;
	        }
	
	        var highlight = this.state.highlight;
	
	        var selection = this.state.selection;
	        var selectionTime = "";
	        if (typeof selection != "undefined" && selection !== null && typeof selection.event != "undefined") {
	            selectionTime = selection.event.timestampAsUTCString();
	        }
	
	        var chartSeries = this.state.chartSeries;
	        charts = {};
	        var brushCharts = {};
	        chartData = {};
	
	        var data = void 0;
	        var failureData = void 0;
	
	        // start for loop involving unique ipversion values here?
	        var unique = _GraphDataStore2.default.getUniqueValues({ "ipversion": 1 });
	        var ipversions = unique.ipversion;
	        if (typeof ipversions != "undefined") {
	            for (var h in typesToChart) {
	                var _eventType = typesToChart[h];
	                var type = _eventType.name;
	                var _label3 = _eventType.label;
	                var _esmondName = _eventType.esmondName || type;
	                var stats = {};
	                var brushStats = {};
	
	                for (var i in ipversions) {
	                    var ipversion = ipversions[i];
	                    var ipv = "ipv" + ipversion;
	
	                    // Get throughput data and build charts
	                    if (!(type in charts)) {
	                        charts[type] = {};
	                        charts[type].stats = {};
	                    } else {
	                        stats = charts[type].stats;
	                    }
	
	                    if (!(type in brushCharts)) {
	                        brushCharts[type] = {};
	                    }
	
	                    // for now, we'll reuse 'stats' for brushCharts as well since they 
	                    // should be the same
	                    brushStats = stats;
	
	                    charts[type].chartRows = [];
	                    if (typeof charts[type].data == "undefined") {
	                        charts[type].data = [];
	                    }
	                    brushCharts[type].chartRows = [];
	
	                    // Initialize ipv and axes for main charts
	                    if (!(ipv in charts[type])) {
	                        charts[type][ipv] = [];
	                    }
	                    if (!("axes" in charts[type][ipv])) {
	                        charts[type][ipv].axes = [];
	                    }
	
	                    // Initialize ipv and axes for brush charts
	                    if (!(ipv in brushCharts[type])) {
	                        brushCharts[type][ipv] = [];
	                    }
	                    if (!("axes" in brushCharts[type][ipv])) {
	                        brushCharts[type][ipv].axes = [];
	                    }
	
	                    var filter = {
	                        eventType: _esmondName,
	                        ipversion: ipversion
	                    };
	
	                    var failuresFilter = {
	                        eventType: "failures",
	                        mainEventType: _esmondName,
	                        ipversion: ipversion
	                    };
	
	                    data = _GraphDataStore2.default.getChartData(filter, this.state.itemsToHide);
	                    var eventTypeStats = _GraphDataStore2.default.eventTypeStats;
	
	                    if (this.state.active[type] && data.results.length > 0) {
	                        for (var j in data.results) {
	                            var result = data.results[j];
	                            var series = result.values;
	                            var properties = result.properties;
	                            var key = properties["metadata-key"];
	                            var _ipversion2 = properties.ipversion;
	                            var direction = properties.direction;
	
	                            // get retrans values
	                            var retransFilter = {
	                                eventType: "packet-retransmits",
	                                ipversion: _ipversion2,
	                                "metadata-key": key,
	                                direction: direction
	
	                            };
	
	                            charts[type].data.push(result);
	
	                            // skip packet-count-lost and packet-count-sent
	                            if (_esmondName != "packet-count-sent" && _esmondName != "packet-count-lost" && _esmondName != "packet-count-lost-bidir" && _esmondName != "packet-retransmits") {
	
	                                stats.min = _GraphDataStore2.default.getMin(data.stats.min, stats.min);
	                                stats.max = _GraphDataStore2.default.getMax(data.stats.max, stats.max);
	                            } else {
	                                if (_esmondName != "packet-retransmits") {
	                                    continue;
	                                } else {
	                                    if (typeof stats.max == "undefined" && typeof eventTypeStats["packet-retransmits"].max != "undefined") {
	                                        stats.max = eventTypeStats["packet-retransmits"].max;
	                                        if (stats.max = 1e-9) {
	                                            stats.max = 0.1;
	                                        }
	                                        stats.min = 1e-9;
	                                    }
	                                }
	                            }
	
	                            if (_esmondName == "packet-retransmits") {
	
	                                charts[type][ipv].push(_react2.default.createElement(_reactTimeseriesCharts.ScatterChart, {
	                                    key: type + "retrans" + Math.floor(Math.random()),
	                                    axis: "axis" + type,
	                                    series: series,
	                                    style: getChartStyle(properties), smooth: false, breakLine: true,
	                                    radius: 4.0,
	                                    columns: ["value"],
	                                    highlighted: this.state.highlight
	                                }));
	                            } else {
	
	                                // push the charts for the main charts
	                                charts[type][ipv].push(_react2.default.createElement(_reactTimeseriesCharts.LineChart, { key: type + Math.floor(Math.random()),
	                                    axis: "axis" + type, series: series,
	                                    style: getChartStyle(properties), smooth: false, breakLine: true,
	                                    min: 0,
	                                    onClick: this.handleClick,
	                                    columns: ["value"] }));
	
	                                // Push additional layers to circle selected points
	
	                                if (this.state.showHoverDots) {
	                                    var hideDotTypes = ["packet-count-sent", "packet-count-lost", "packet-count-sent-bidir", "packet-count-lost-bidir"];
	                                    if (typeof trackerValues[type] != "undefined" && typeof trackerValues[type][ipv] != "undefined") {
	                                        TRACKERVALUES: for (var d in trackerValues[type][ipv]) {
	                                            if (typeof trackerValues[type][ipv] == "undefined" || _esmondName != trackerValues[type][ipv][d].properties.eventType) {
	                                                continue;
	                                            }
	
	                                            if (_underscore2.default.contains(hideDotTypes, trackerValues[type][ipv][d].properties.eventType)) {
	                                                continue TRACKERVALUES;
	                                            }
	
	                                            var trackerSeries = trackerValues[type][ipv][d].data;
	
	                                            charts[type][ipv].push(_react2.default.createElement(_reactTimeseriesCharts.ScatterChart, {
	                                                key: type + "hover" + Math.floor(Math.random()),
	                                                axis: "axis" + type,
	                                                series: trackerSeries,
	                                                style: getChartStyle(properties),
	                                                radius: 4.0,
	                                                columns: ["value"]
	                                            }));
	                                        }
	                                    }
	                                }
	                            }
	                        }
	                        charts[type].stats = stats;
	                    }
	
	                    failureData = _GraphDataStore2.default.getChartData(failuresFilter, this.state.itemsToHide);
	
	                    if (this.state.active["failures"] && failureData.results.length > 0) {
	                        for (var _j in failureData.results) {
	                            var _result = failureData.results[_j];
	                            var failureSeries = _result.values;
	                            var _properties = _result.properties;
	                            var scaledSeries = _GraphDataStore2.default.scaleValues(failureSeries, stats.max);
	                            failureSeries = scaledSeries;
	
	                            // push the charts for the main charts
	                            charts[type][ipv].push(_react2.default.createElement(_reactTimeseriesCharts.ScatterChart, {
	                                key: type + "failures + Math.Floor( Math.random() )",
	                                axis: "axis" + type,
	                                series: failureSeries,
	                                style: failureStyle,
	                                radius: 4.0,
	                                columns: ["value"],
	                                infoHeight: 100,
	                                infoWidth: 200
	                                //infoStyle={infoStyle}
	                                , min: failureData.stats.min,
	                                max: failureData.stats.max
	                                //onSelectionChange={this.handleSelectionChanged}
	                                , selected: this.state.selection
	                                //onMouseNear={this.handleMouseNear}
	                                //onClick={this.handleClick}
	                                , highlighted: this.state.highlight
	                            }));
	                        }
	                    }
	                }
	            }
	
	            for (var g in subtypesToChart) {
	
	                var subEventType = subtypesToChart[g];
	                var subType = subEventType.name;
	                var subLabel = subEventType.label;
	                var subEsmondName = subEventType.esmondName || subType;
	
	                for (var k in ipversions) {
	                    var subipversion = ipversions[k];
	                    var subipv = "ipv" + subipversion;
	
	                    // Get subtype data and DON'T build additional charts
	                    if (!(subType in charts)) {
	                        charts[subType] = {};
	                    }
	
	                    if (typeof charts[subType].data == "undefined") {
	                        charts[subType].data = [];
	                    }
	
	                    // Initialize subipv and axes for main charts
	                    if (!(subipv in charts[subType])) {
	                        charts[subType][subipv] = [];
	                    }
	
	                    var _filter2 = {
	                        eventType: subEsmondName,
	                        ipversion: subipversion
	                    };
	                    var failureFilter = {
	                        eventType: subEsmondName,
	                        ipversion: subipversion
	                    };
	
	                    data = _GraphDataStore2.default.getChartData(failureFilter, this.state.itemsToHide);
	                    if (this.state.active[subType] && data.results.length > 0) {
	                        charts[subType].data = charts[subType].data.concat(data.results);
	                    }
	                }
	            }
	
	            // Create chartRows/brushRows
	
	            // create a cache object, mostly so we can avoid displaying
	            // latency twice, since it's in typesToChart twice
	            var chartRowsShown = {};
	            for (var m in typesToChart) {
	                var eventType = typesToChart[m];
	                var type = eventType.name;
	                var label = eventType.label;
	                var unit = eventType.unit;
	                var esmondName = eventType.esmondName;
	                for (var i in ipversions) {
	                    var ipversion = ipversions[i];
	                    var ipv = "ipv" + ipversion;
	
	                    if (chartRowsShown[type + ipv] === true) {
	                        continue;
	                    }
	
	                    var chartArr = charts[type][ipv];
	
	                    var format = ".2s";
	
	                    var max = charts[type].stats.max;
	
	                    if (type == "latency") {
	                        label += " ms";
	                    } else if (type == "loss") {
	                        format = ".1f";
	                        label += " %";
	                        if (max == 0 || max == 1e-9) {
	                            max = 0.05;
	                        }
	                        if (charts[type].stats.max < 10) {
	                            format = ".2f";
	                        }
	                    }
	
	                    // push the chartrows for the main charts
	                    charts[type].chartRows.push(_react2.default.createElement(
	                        _reactTimeseriesCharts.ChartRow,
	                        { height: chartRow.height, debug: false },
	                        _react2.default.createElement(_reactTimeseriesCharts.YAxis, {
	                            key: "axis" + type,
	                            id: "axis" + type,
	                            label: label + " (" + ipv + ")",
	                            style: axisLabelStyle,
	                            labelOffset: offsets.label,
	                            className: "yaxis-label",
	                            format: format,
	                            min: 0,
	                            max: max,
	                            width: 80, type: "linear", align: "left" }),
	                        _react2.default.createElement(
	                            _reactTimeseriesCharts.Charts,
	                            null,
	                            charts[type][ipv]
	                        )
	                    ));
	
	                    if (this.state.showBrush === true) {
	                        // push the chartrows for the brush charts
	                        brushCharts[type].chartRows.push(_react2.default.createElement(
	                            _reactTimeseriesCharts.ChartRow,
	                            {
	                                height: chartRow.brushHeight,
	                                debug: false,
	                                key: "brush" + type
	                            },
	                            _react2.default.createElement(_reactTimeseriesCharts.Brush, {
	                                timeRange: this.state.brushrange,
	                                onTimeRangeChanged: this.handleTimeRangeChange,
	                                allowSelectionClear: true
	                            }),
	                            _react2.default.createElement(_reactTimeseriesCharts.YAxis, {
	                                key: "brush_axis" + type,
	                                id: "brush_axis" + type,
	                                label: label + " " + unit + " (" + ipv + ")",
	                                style: axisLabelStyle,
	                                labelOffset: offsets.label,
	                                format: ".2s",
	                                min: brushCharts[type].stats.min,
	                                max: brushCharts[type].stats.max,
	                                width: 80, type: "linear", align: "left" }),
	                            _react2.default.createElement(
	                                _reactTimeseriesCharts.Charts,
	                                null,
	                                brushCharts[type][ipv]
	                            )
	                        ));
	                    }
	                    chartRowsShown[type + ipv] = true;
	                }
	            }
	        }
	
	        var timerange;
	
	        if (chartSeries) {
	            timerange = this.state.timerange;
	        }
	
	        if (!timerange) {
	            return null; // ( <div>Error: No timerange specified.</div> );
	        }
	
	        if (Object.keys(charts) == 0) {
	            if (!this.state.loading && !this.state.initialLoading && this.state.dataloaded) {
	                return _react2.default.createElement(
	                    "div",
	                    null,
	                    "No data found for this time range."
	                );
	            } else {
	                return _react2.default.createElement("div", null);
	            }
	        }
	
	        return _react2.default.createElement(
	            "div",
	            {
	                onMouseMove: this.handleMouseMove,
	                onMouseEnter: this.handleMouseEnter,
	                onMouseLeave: this.handleMouseLeave,
	                ref: "graphDiv"
	            },
	            _react2.default.createElement(
	                _reactTimeseriesCharts.Resizable,
	                null,
	                _react2.default.createElement(
	                    _reactTimeseriesCharts.ChartContainer,
	                    {
	                        timeRange: this.state.timerange,
	                        trackerPosition: this.state.tracker,
	                        onTrackerChanged: this.handleTrackerChanged,
	                        enablePanZoom: true,
	                        onTimeRangeChanged: this.handleTimeRangeChange,
	                        onBackgroundClick: this.handleClick,
	                        minTime: this.state.initialTimerange.begin(),
	                        maxTime: this.state.initialTimerange.end(),
	                        minDuration: 10 * 60 * 1000,
	                        id: "mainChartContainer"
	                    },
	                    charts.throughput.chartRows,
	                    charts["loss"].chartRows,
	                    charts["latency"].chartRows
	                )
	            ),
	            this.renderBrush(brushCharts)
	        );
	    },
	    handleActiveChange: function handleActiveChange(key, disabled) {
	        var active = this.state.active;
	        active[key] = !disabled;
	        this.setState({ active: active });
	    },
	    renderError: function renderError() {
	        var data = this.state.dataError;
	        var msg = void 0;
	        if (typeof data.responseJSON != "undefined" && data.responseJSON.detail != "undefined") {
	            msg = data.responseJSON.detail;
	        } else if (typeof data.responseText != "undefined") {
	            msg = data.responseText;
	        } else {
	            msg = "An unknown error occurred";
	        }
	        return _react2.default.createElement(
	            "div",
	            null,
	            _react2.default.createElement(
	                "h3",
	                null,
	                "Error loading data"
	            ),
	            _react2.default.createElement(
	                "span",
	                { className: "alert-small-failure" },
	                _react2.default.createElement("i", { className: "fa fa-exclamation-triangle" }),
	                _react2.default.createElement(
	                    "b",
	                    null,
	                    "Error retrieving data"
	                ),
	                _react2.default.createElement(
	                    "p",
	                    null,
	                    msg
	                )
	            )
	        );
	    },
	    render: function render() {
	        if (this.state.dataError) {
	            return this.renderError();
	        }
	
	        var legend = [{
	            key: "throughput",
	            label: "Forward",
	            disabled: !this.state.active.throughput,
	            style: {
	                backgroundColor: scheme.connections,
	                stroke: scheme.requests
	            }
	        }, {
	            key: "reverse",
	            label: "Reverse",
	            disabled: !this.state.active.reverse,
	            style: {
	                backgroundColor: scheme.requests,
	                stroke: scheme.connections,
	                strokeDasharray: "4,2"
	            }
	        }];
	
	        return _react2.default.createElement(
	            "div",
	            null,
	            this.renderLoading(),
	            this.renderToolTip(),
	            this.renderChart()
	        );
	    },
	    renderLoading: function renderLoading() {
	        var display = "none";
	        if (this.state.loading || this.state.initialLoading || !this.state.dataloaded) {
	            display = "block";
	            return _react2.default.createElement(
	                "div",
	                { id: "loading", display: display },
	                _react2.default.createElement(
	                    "div",
	                    { id: "circularG" },
	                    _react2.default.createElement("div", { id: "circularG_1", className: "circularG" }),
	                    _react2.default.createElement("div", { id: "circularG_2", className: "circularG" }),
	                    _react2.default.createElement("div", { id: "circularG_3", className: "circularG" }),
	                    _react2.default.createElement("div", { id: "circularG_4", className: "circularG" }),
	                    _react2.default.createElement("div", { id: "circularG_5", className: "circularG" }),
	                    _react2.default.createElement("div", { id: "circularG_6", className: "circularG" }),
	                    _react2.default.createElement("div", { id: "circularG_7", className: "circularG" }),
	                    _react2.default.createElement("div", { id: "circularG_8", className: "circularG" })
	                ),
	                _react2.default.createElement(
	                    "h4",
	                    null,
	                    "Loading ..."
	                )
	            );
	        } else {
	            return null;
	        }
	    },
	    handleTimeRangeChange: function handleTimeRangeChange(timerange) {
	        if (timerange) {
	            this.setState({ timerange: timerange, brushrange: timerange });
	        } else {
	            this.setState({ timerange: this.state.initialTimerange, brushrange: null });
	        }
	    },
	    handleCloseTooltipClick: function handleCloseTooltipClick(event) {
	        event.preventDefault();
	        this.setState({ lockToolTip: false, tracker: null });
	    },
	    renderBrush: function renderBrush(brushCharts) {
	        if (this.state.showBrush === false) {
	            return _react2.default.createElement("div", null);
	        }
	        return _react2.default.createElement(
	            "div",
	            { className: "rowg" },
	            _react2.default.createElement(
	                "div",
	                { className: "col-md-12", style: brushStyle, id: "brushContainer" },
	                _react2.default.createElement(
	                    _reactTimeseriesCharts.Resizable,
	                    null,
	                    _react2.default.createElement(
	                        _reactTimeseriesCharts.ChartContainer,
	                        {
	                            timeRange: this.state.initialTimerange,
	                            trackerPosition: this.state.tracker,
	                            className: "brush"
	                        },
	                        brushCharts.throughput.chartRows,
	                        brushCharts["packet-loss-rate"].chartRows,
	                        brushCharts["latency"].chartRows
	                    )
	                )
	            )
	        );
	    },
	
	
	    updateChartData: function updateChartData() {
	        var newChartSeries = _GraphDataStore2.default.getChartData();
	
	        if (this.state.initialLoading) {
	            this.setState({ chartSeries: newChartSeries, initialLoading: false, loading: true });
	        } else if (this.state.loading && newChartSeries.results.length == 0) {
	            this.setState({ chartSeries: newChartSeries, loading: false, dataloaded: false, dataError: false });
	        } else {
	            this.setState({ dataloaded: true, chartSeries: newChartSeries, loading: false });
	        }
	    },
	
	    componentDidMount: function componentDidMount() {
	
	        var src = this.props.src;
	        var dst = this.props.dst;
	        var start = this.state.start;
	        var end = this.state.end;
	        var tool = this.props.tool;
	        var ipversion = this.props.ipversion;
	        var agent = this.props.agent;
	
	        var summaryWindow = this.props.summaryWindow;
	
	        var params = {
	            tool: tool,
	            ipversion: ipversion,
	            agent: agent
	        };
	        this.setState({ params: params, loading: true, initialLoading: true });
	        var ma_url = this.props.ma_url || location.origin + "/esmond/perfsonar/archive/";
	        this.getDataFromMA(src, dst, start, end, ma_url, params, summaryWindow);
	    },
	
	    getMetaDataFromMA: function getMetaDataFromMA() {},
	
	    getDataFromMA: function getDataFromMA(src, dst, start, end, ma_url, params, summaryWindow) {
	        this.setState({ loading: true, dataloaded: false });
	
	        _GraphDataStore2.default.subscribe(this.updateChartData);
	
	        _GraphDataStore2.default.subscribeError(this.dataError);
	
	        _GraphDataStore2.default.subscribeEmpty(this.dataEmpty);
	
	        // If there are no parameters, we haven't filled them in yet so we don't make the call
	
	        if (typeof params != "undefined") {
	            _GraphDataStore2.default.getHostPairMetadata(src, dst, start, end, ma_url, params, summaryWindow);
	        }
	    },
	    dataError: function dataError() {
	        var data = _GraphDataStore2.default.getErrorData();
	        console.log("dataError", data);
	        this.setState({ dataError: data, loading: false });
	    },
	    dataEmpty: function dataEmpty() {
	        var data = {};
	        data.responseJSON = {};
	        data.responseJSON.detail = "No data found in the measurement archive";
	        this.setState({ dataError: data, loading: false });
	        console.log("Handling empty data");
	    },
	    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	        var timerange = new _pondjs.TimeRange([nextProps.start * 1000, nextProps.end * 1000]);
	        this.setState({ itemsToHide: nextProps.itemsToHide, initialLoading: false });
	        if (nextProps.start != this.state.start || nextProps.end != this.state.end) {
	            this.setState({ start: nextProps.start, end: nextProps.end, chartSeries: null, timerange: timerange, brushrange: null, initialTimerange: timerange, summaryWindow: nextProps.summaryWindow, loading: true, dataloaded: false, initialLoading: false, dataError: false, lockToolTip: false });
	            this.getDataFromMA(nextProps.src, nextProps.dst, nextProps.start, nextProps.end, nextProps.ma_url, this.state.params, nextProps.summaryWindow);
	        } else {
	            _GraphDataStore2.default.toggleType(nextProps.itemsToHide);
	        }
	    },
	
	
	    componentWillUnmount: function componentWillUnmount() {
	        this.serverRequest.abort();
	        _GraphDataStore2.default.unsubscribe(this.updateChartData);
	        _GraphDataStore2.default.unsubscribeError(this.dataError);
	        _GraphDataStore2.default.unsubscribeEmpty(this.dataEmpty);
	    },
	    handleHiddenItemsChange: function handleHiddenItemsChange(options) {
	        this.toggleType(options);
	    },
	    toggleType: function toggleType(options, event) {
	        //event.preventDefault();
	        _GraphDataStore2.default.toggleType(options);
	    },
	
	    getTool: function getTool(row) {
	        var tool = void 0;
	        tool = row.properties["tool-name"];
	
	        if (typeof tool != "undefined" && tool != "") {
	            tool = tool.replace(/^pscheduler\//, "");
	
	            // We don't include the tool if it's "ping" because this is redundant
	            // with the test type
	            if (tool == "ping") {
	                return "";
	            }
	
	            tool = " [" + tool + "]";
	        } else {
	            tool = "";
	        }
	
	        return tool;
	    },
	    getProtocol: function getProtocol(row) {
	        var protocol = "";
	
	        if (typeof row != "undefined" && typeof row.properties.protocol != "undefined") {
	            protocol = " (" + row.properties.protocol.toUpperCase() + ")";
	        }
	
	        return protocol;
	    },
	
	
	    checkEventType: function checkEventType(eventType, direction) {
	        return this.state.chartSeries && this.state.chartSeries[eventType] && (direction === null || this.state.chartSeries[eventType][direction]);
	    }
	});

/***/ }),

/***/ 505:
/*!**********************************!*\
  !*** ./~/moment/locale ^\.\/.*$ ***!
  \**********************************/
/***/ (function(module, exports, __webpack_require__) {

	var map = {
		"./af": 506,
		"./af.js": 506,
		"./ar": 507,
		"./ar-dz": 508,
		"./ar-dz.js": 508,
		"./ar-kw": 509,
		"./ar-kw.js": 509,
		"./ar-ly": 510,
		"./ar-ly.js": 510,
		"./ar-ma": 511,
		"./ar-ma.js": 511,
		"./ar-sa": 512,
		"./ar-sa.js": 512,
		"./ar-tn": 513,
		"./ar-tn.js": 513,
		"./ar.js": 507,
		"./az": 514,
		"./az.js": 514,
		"./be": 515,
		"./be.js": 515,
		"./bg": 516,
		"./bg.js": 516,
		"./bn": 517,
		"./bn.js": 517,
		"./bo": 518,
		"./bo.js": 518,
		"./br": 519,
		"./br.js": 519,
		"./bs": 520,
		"./bs.js": 520,
		"./ca": 521,
		"./ca.js": 521,
		"./cs": 522,
		"./cs.js": 522,
		"./cv": 523,
		"./cv.js": 523,
		"./cy": 524,
		"./cy.js": 524,
		"./da": 525,
		"./da.js": 525,
		"./de": 526,
		"./de-at": 527,
		"./de-at.js": 527,
		"./de-ch": 528,
		"./de-ch.js": 528,
		"./de.js": 526,
		"./dv": 529,
		"./dv.js": 529,
		"./el": 530,
		"./el.js": 530,
		"./en-au": 531,
		"./en-au.js": 531,
		"./en-ca": 532,
		"./en-ca.js": 532,
		"./en-gb": 533,
		"./en-gb.js": 533,
		"./en-ie": 534,
		"./en-ie.js": 534,
		"./en-nz": 535,
		"./en-nz.js": 535,
		"./eo": 536,
		"./eo.js": 536,
		"./es": 537,
		"./es-do": 538,
		"./es-do.js": 538,
		"./es.js": 537,
		"./et": 539,
		"./et.js": 539,
		"./eu": 540,
		"./eu.js": 540,
		"./fa": 541,
		"./fa.js": 541,
		"./fi": 542,
		"./fi.js": 542,
		"./fo": 543,
		"./fo.js": 543,
		"./fr": 544,
		"./fr-ca": 545,
		"./fr-ca.js": 545,
		"./fr-ch": 546,
		"./fr-ch.js": 546,
		"./fr.js": 544,
		"./fy": 547,
		"./fy.js": 547,
		"./gd": 548,
		"./gd.js": 548,
		"./gl": 549,
		"./gl.js": 549,
		"./gom-latn": 550,
		"./gom-latn.js": 550,
		"./he": 551,
		"./he.js": 551,
		"./hi": 552,
		"./hi.js": 552,
		"./hr": 553,
		"./hr.js": 553,
		"./hu": 554,
		"./hu.js": 554,
		"./hy-am": 555,
		"./hy-am.js": 555,
		"./id": 556,
		"./id.js": 556,
		"./is": 557,
		"./is.js": 557,
		"./it": 558,
		"./it.js": 558,
		"./ja": 559,
		"./ja.js": 559,
		"./jv": 560,
		"./jv.js": 560,
		"./ka": 561,
		"./ka.js": 561,
		"./kk": 562,
		"./kk.js": 562,
		"./km": 563,
		"./km.js": 563,
		"./kn": 564,
		"./kn.js": 564,
		"./ko": 565,
		"./ko.js": 565,
		"./ky": 566,
		"./ky.js": 566,
		"./lb": 567,
		"./lb.js": 567,
		"./lo": 568,
		"./lo.js": 568,
		"./lt": 569,
		"./lt.js": 569,
		"./lv": 570,
		"./lv.js": 570,
		"./me": 571,
		"./me.js": 571,
		"./mi": 572,
		"./mi.js": 572,
		"./mk": 573,
		"./mk.js": 573,
		"./ml": 574,
		"./ml.js": 574,
		"./mr": 575,
		"./mr.js": 575,
		"./ms": 576,
		"./ms-my": 577,
		"./ms-my.js": 577,
		"./ms.js": 576,
		"./my": 578,
		"./my.js": 578,
		"./nb": 579,
		"./nb.js": 579,
		"./ne": 580,
		"./ne.js": 580,
		"./nl": 581,
		"./nl-be": 582,
		"./nl-be.js": 582,
		"./nl.js": 581,
		"./nn": 583,
		"./nn.js": 583,
		"./pa-in": 584,
		"./pa-in.js": 584,
		"./pl": 585,
		"./pl.js": 585,
		"./pt": 586,
		"./pt-br": 587,
		"./pt-br.js": 587,
		"./pt.js": 586,
		"./ro": 588,
		"./ro.js": 588,
		"./ru": 589,
		"./ru.js": 589,
		"./sd": 590,
		"./sd.js": 590,
		"./se": 591,
		"./se.js": 591,
		"./si": 592,
		"./si.js": 592,
		"./sk": 593,
		"./sk.js": 593,
		"./sl": 594,
		"./sl.js": 594,
		"./sq": 595,
		"./sq.js": 595,
		"./sr": 596,
		"./sr-cyrl": 597,
		"./sr-cyrl.js": 597,
		"./sr.js": 596,
		"./ss": 598,
		"./ss.js": 598,
		"./sv": 599,
		"./sv.js": 599,
		"./sw": 600,
		"./sw.js": 600,
		"./ta": 601,
		"./ta.js": 601,
		"./te": 602,
		"./te.js": 602,
		"./tet": 603,
		"./tet.js": 603,
		"./th": 604,
		"./th.js": 604,
		"./tl-ph": 605,
		"./tl-ph.js": 605,
		"./tlh": 606,
		"./tlh.js": 606,
		"./tr": 607,
		"./tr.js": 607,
		"./tzl": 608,
		"./tzl.js": 608,
		"./tzm": 609,
		"./tzm-latn": 610,
		"./tzm-latn.js": 610,
		"./tzm.js": 609,
		"./uk": 611,
		"./uk.js": 611,
		"./ur": 612,
		"./ur.js": 612,
		"./uz": 613,
		"./uz-latn": 614,
		"./uz-latn.js": 614,
		"./uz.js": 613,
		"./vi": 615,
		"./vi.js": 615,
		"./x-pseudo": 616,
		"./x-pseudo.js": 616,
		"./yo": 617,
		"./yo.js": 617,
		"./zh-cn": 618,
		"./zh-cn.js": 618,
		"./zh-hk": 619,
		"./zh-hk.js": 619,
		"./zh-tw": 620,
		"./zh-tw.js": 620
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 505;


/***/ }),

/***/ 643:
/*!*******************************!*\
  !*** ./src/GraphDataStore.js ***!
  \*******************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var _moment = __webpack_require__(/*! moment */ 503);
	
	var _moment2 = _interopRequireDefault(_moment);
	
	var _pondjs = __webpack_require__(/*! pondjs */ 644);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var ipaddr = __webpack_require__(/*! ipaddr.js */ 802);
	
	var EventEmitter = __webpack_require__(/*! events */ 803).EventEmitter;
	
	var emitter = new EventEmitter();
	
	var reqCount = 0;
	var dataReqCount = 0;
	var completedReqs = 0;
	var completedDataReqs = 0;
	
	var startTime = Date.now();
	var start = void 0; // = Math.floor( Date.now() - 7 * 86400 / 1000 );
	var end = void 0; // = Math.ceil( Date.now() / 1000 );
	
	var chartMetadata = [];
	var chartData = [];
	var maURLs = [];
	
	var metadataURLs = {};
	var dataURLs = {};
	
	var proxyURL = '/perfsonar-graphs/cgi-bin/graphData.cgi?action=ma_data&url=';
	
	var lossTypes = ['packet-loss-rate', 'packet-count-lost', 'packet-count-sent', 'packet-count-lost-bidir', 'packet-loss-rate-bidir'];
	
	module.exports = {
	
	    maURL: null,
	
	    initVars: function initVars() {
	        chartMetadata = [];
	        chartData = [];
	        maURLs = [];
	        metadataURLs = {};
	        dataURLs = {};
	        reqCount = 0;
	        dataReqCount = 0;
	        completedReqs = 0;
	        completedDataReqs = 0;
	        this.useProxy = false;
	        this.summaryWindow = 3600;
	        this.eventTypeStats = {};
	
	        this.eventTypes = ['throughput', 'histogram-owdelay', 'packet-loss-rate', 'packet-loss-rate-bidir', 'packet-count-lost', 'packet-count-sent', 'packet-count-lost-bidir', 'packet-retransmits', 'histogram-rtt', 'failures'];
	        this.dataFilters = [];
	        this.itemsToHide = [];
	        this.errorData = null;
	    },
	
	    getHostPairMetadata: function getHostPairMetadata(sources, dests, startInput, endInput, ma_url, params, summaryWindow) {
	        var _this = this;
	
	        start = startInput;
	        end = endInput;
	
	        this.initVars();
	
	        this.summaryWindow = summaryWindow;
	
	        if (!$.isArray(sources)) {
	            sources = [sources];
	        }
	        if (!$.isArray(dests)) {
	            dests = [dests];
	        }
	
	        if (!$.isArray(ma_url)) {
	            ma_url = [ma_url];
	        }
	
	        maURLs = ma_url;
	
	        if (!end) {
	            //end = Math.ceil( Date.now() / 1000 ); 
	        }
	
	        if (!start) {
	            //start = Math.floor( end - 86400 * 7 ); // TODO: 7 days a good default?
	        }
	
	        var _loop = function _loop(i) {
	            var directions = [[sources[i], dests[i]], [dests[i], sources[i]]];
	            var direction = ["forward", "reverse"];
	
	            var _loop2 = function _loop2(j) {
	                var src = directions[j][0];
	                var dst = directions[j][1];
	
	                var url = ma_url[i] + "?source=" + src + "&destination=" + dst;
	
	                if (params !== null && typeof params != "undefined") {
	                    for (var name in params) {
	                        var val = params[name];
	                        if (typeof val == "undefined") {
	                            continue;
	                        }
	                        if (!$.isArray(val)) {
	                            val = [val];
	                        }
	                        if (name == "tool") {
	                            for (var _j in val) {
	                                url += "&tool-name=" + val[i];
	                            }
	                        } else if (name == "ipversion") {
	                            if (val[i] == 4) {
	                                url += "&dns-match-rule=only-v4";
	                            } else if (val[i] == 6) {
	                                url += "&dns-match-rule=only-v6";
	                            } else {
	                                //console.log("INVALID IPVERSION " . val[i], "src", src);
	
	                            }
	                        } else if (name == "agent") {
	                            if (typeof val[i] != "undefined") {
	                                url += "&measurement-agent=" + val[i];
	                            }
	                        }
	                    }
	                }
	
	                //url += "&time-start=" + start + "&time-end=" + end; //TODO: add this back?
	
	                url = _this.getMAURL(url);
	
	                // Make sure we don't retrieve the same URL twice
	
	                if (metadataURLs[url]) {
	                    return "continue";
	                } else {
	                    metadataURLs[url] = 1;
	                }
	
	                _this.serverRequest = $.get(url, function (data) {
	                    this.handleMetadataResponse(data, direction[j], ma_url[i]);
	                }.bind(_this)).fail(function (data) {
	                    // if we get an error, try the cgi instead 
	                    // and set a new flag, useProxy  and make
	                    // all requests through the proxy CGI
	                    if (data.status == 404) {
	                        this.useProxy = true;
	                        url = this.getMAURL(url);
	                        this.serverRequest = $.get(url, function (data) {
	                            this.handleMetadataResponse(data, direction[j], ma_url[i]);
	                        }.bind(this)).fail(function (data) {
	                            this.handleMetadataError(data);
	                        }.bind(this));
	                    } else {
	                        this.handleMetadataError(data);
	                    }
	                }.bind(_this));
	
	                reqCount++;
	            };
	
	            for (var j in directions) {
	                var _ret2 = _loop2(j);
	
	                if (_ret2 === "continue") continue;
	            }
	        };
	
	        for (var i in sources) {
	            _loop(i);
	        }
	    },
	    getMAURL: function getMAURL(url) {
	
	        var proxy = this.parseUrl(proxyURL);
	
	        if (this.useProxy) {
	            url = encodeURIComponent(url);
	            url = proxyURL + url;
	        }
	        var urlObj = this.parseUrl(url);
	        url = urlObj.origin + urlObj.pathname + urlObj.search;
	        return url;
	    },
	
	    handleMetadataError: function handleMetadataError(data) {
	        this.errorData = data;
	        emitter.emit("error");
	    },
	    getErrorData: function getErrorData() {
	        return this.errorData;
	    },
	    handleMetadataResponse: function handleMetadataResponse(data, direction, maURL) {
	        //data.label = label;
	        for (var i in data) {
	            data[i].direction = direction;
	        }
	        $.merge(chartMetadata, data);
	        completedReqs++;
	        if (completedReqs == reqCount) {
	            var endTime = Date.now();
	            var duration = (endTime - startTime) / 1000;
	            //console.log("COMPLETED ALL", reqCount, " REQUESTS in", duration);
	            completedReqs = 0;
	            reqCount = 0;
	            if (chartMetadata.length == 0) {
	                emitter.emit("empty");
	                return;
	            }
	            data = this.filterEventTypes(chartMetadata);
	            data = this.getData(chartMetadata, maURL);
	            //console.log("chartMetadata", chartMetadata);
	        } else {
	                //console.log("completed " + completedReqs + " requests out of " + reqCount );
	
	            }
	    },
	    filterEventTypes: function filterEventTypes(data, eventTypesParam) {
	        //let eventTypes = this.getEventTypes( eventTypesParam );
	        var eventTypes = this.getEventTypes();
	
	        var tests = $.map(data, function (test, i) {
	            var matchingEventTypes = $.map(test['event-types'], function (eventType, j) {
	                var ret = $.inArray(eventType['event-type'], eventTypes);
	                if (ret >= 0) {
	                    return eventType;
	                } else {
	                    return null;
	                }
	            });
	            if (matchingEventTypes.length > 0) {
	                // use i to extract the test? return the test?
	                //test['event-types'] = matchingEventTypes;
	                test['event-types'] = [];
	                test['event-types'] = $.extend(true, [], matchingEventTypes);
	                return test;
	            } else {
	                return null;
	            }
	        });
	
	        return tests;
	    },
	    getEventTypes: function getEventTypes(eventTypesParam) {
	        var eventTypes = eventTypesParam || this.eventTypes;
	        for (var i in eventTypes) {
	            eventTypes.push(eventTypes[i] + "-reverse");
	        }
	        return eventTypes;
	    },
	    parseUrl: function () {
	        return function (url) {
	            var a = document.createElement('a');
	            a.href = url;
	
	            // Work around a couple issues:
	            // - don't show the port if it's 80 or 443 (Chrome didn''t do this, but IE did)
	            // - don't append a port if the port is an empty string ""
	            var port = "";
	            if (typeof a.port != "undefined") {
	                if (a.port != "80" && a.port != "443" && a.port != "") {
	                    port = ":" + a.port;
	                }
	            }
	
	            var host = a.host;
	            var ret = {
	                host: a.host,
	                hostname: a.hostname,
	                pathname: a.pathname,
	                port: a.port,
	                protocol: a.protocol,
	                search: a.search,
	                hash: a.hash,
	                origin: a.protocol + "//" + a.hostname + port
	            };
	            return ret;
	        };
	    }(),
	    getData: function getData(metaData, maURL) {
	        var _this2 = this;
	
	        var summaryWindow = this.summaryWindow;
	        var defaultSummaryType = "aggregation"; // TODO: allow other aggregate types
	        var multipleTypes = ["histogram-rtt", "histogram-owdelay"];
	
	        dataReqCount = 0;
	        for (var i in metaData) {
	            var datum = metaData[i];
	            var _direction = datum.direction;
	
	            var _loop3 = function _loop3(j) {
	                var eventTypeObj = datum["event-types"][j];
	                var eventType = eventTypeObj["event-type"];
	                var summaries = eventTypeObj["summaries"];
	                var summaryType = defaultSummaryType;
	
	                var source = datum.source;
	
	                var addr = ipaddr.parse(source);
	
	                var url = _this2.parseUrl(maURL).origin + datum.uri;
	
	                var ipversion = void 0;
	                if (ipaddr.isValid(source)) {
	                    ipversion = addr.kind(source).substring(3);
	                } else {
	                    //console.log("invalid IP address");
	
	                }
	
	                var uri = null;
	                var dataUrl = null;
	
	                if ($.inArray(eventType, multipleTypes) >= 0) {
	                    summaryType = "statistics";
	                    that = _this2;
	
	                    var win = $.grep(summaries, function (summary, k) {
	                        return summary["summary-type"] == summaryType && summary["summary-window"] == that.summaryWindow;
	                    });
	                    if (win.length > 1) {
	                        console.log("WEIRD: multiple summary windows found. This should not happen.");
	                    } else if (win.length == 1) {
	                        uri = win[0].uri;
	                        dataUrl = win[0].url;
	                    } else {
	                        //console.log("no summary windows found");
	                        if (eventType == "histogram-rtt") {
	                            if (that.summaryWindow == "300") {
	                                var _win = $.grep(summaries, function (summary, k) {
	                                    return summary["summary-type"] == summaryType && summary["summary-window"] == "0";
	                                });
	                                if (_win.length > 0) {
	                                    uri = _win[0].uri;
	                                }
	                            } else if (that.summaryWindow == "0") {
	                                uri = null;
	                            }
	                        }
	                    }
	                } else {
	                    summaryType = "aggregation";
	                    that = _this2;
	
	                    var _win2 = $.grep(summaries, function (summary, k) {
	                        return summary["summary-type"] == summaryType && summary["summary-window"] == that.summaryWindow;
	                    });
	
	                    // TODO: add ability to use aggregates
	                    // HERE NOW!
	
	                    // TODO: allow lower summary windows
	                    if (_win2.length > 1) {
	                        //console.log("WEIRD: multiple summary windows found. This should not happen.", win);
	                    } else if (_win2.length == 1) {
	                        uri = _win2[0].uri;
	                        dataUrl = _win2[0].url;
	                    } else {
	                        //console.log("no summary windows found", summaryWindow, eventType, win);
	                    }
	                }
	
	                if (uri === null) {
	                    uri = eventTypeObj["base-uri"];
	                }
	                uri += "?time-start=" + start + "&time-end=" + end;
	                dataUrl += "?time-start=" + start + "&time-end=" + end;
	                //let url = baseURL + uri;
	                //let url = dataUrl;
	                url += uri;
	
	                // If using CORS proxy
	                if (_this2.useProxy) {
	                    url = encodeURIComponent(url);
	                    url = proxyURL + url;
	                }
	
	                // Make sure we don't retrieve the same URL twice
	                if (dataURLs[url]) {
	                    //continue;
	
	                } else {
	                    dataURLs[url] = 1;
	                }
	                var row = pruneDatum(datum);
	                row.protocol = datum["ip-transport-protocol"];
	                row.ipversion = ipversion;
	
	                dataReqCount++;
	
	                _this2.serverRequest = $.get(url, function (data) {
	                    this.handleDataResponse(data, eventType, row);
	                }.bind(_this2)).fail(function (data) {
	                    console.log("get data failed; skipping this collection");
	                    this.handleDataResponse(null);
	                }.bind(_this2));
	            };
	
	            for (var j in datum["event-types"]) {
	                var that;
	                var that;
	
	                _loop3(j);
	            }
	        }
	    },
	    handleDataResponse: function handleDataResponse(data, eventType, datum) {
	        if (data !== null) {
	            var _direction2 = datum.direction;
	            var protocol = datum.protocol;
	            var _row = datum;
	            _row.eventType = eventType;
	            _row.data = data;
	            if (data.length > 0) {
	                chartData.push(_row);
	            }
	        }
	        completedDataReqs++;
	        if (completedDataReqs >= dataReqCount) {
	            var endTime = Date.now();
	            var duration = (endTime - startTime) / 1000;
	            //console.log("COMPLETED ALL DATA ", dataReqCount, " REQUESTS in", duration);
	
	            // TODO: change this so it creates the esmond time series upon completion of each request, rather than after all requests has completed
	
	            chartData = this.esmondToTimeSeries(chartData);
	
	            endTime = Date.now();
	            duration = (endTime - startTime) / 1000;
	            //console.log("COMPLETED CREATING TIMESERIES in " , duration);
	            //console.log("chartData: ", chartData);
	
	            var self = this;
	
	            if (chartData.length > 0) {
	                emitter.emit("get");
	            } else {
	                emitter.emit("empty");
	            }
	
	            completedDataReqs = 0;
	            dataReqCount = 0;
	        } else {
	            //console.log("handled " + completedDataReqs + " out of " + dataReqCount + " data requests");
	
	        }
	    },
	
	    toggleType: function toggleType(options) {
	        options = this.pruneItemsToHide(options);
	        this.itemsToHide = options;
	        emitter.emit("get");
	    },
	
	    pruneItemsToHide: function pruneItemsToHide(options) {
	        var oldOptions = options;
	        options = [];
	        for (var id in oldOptions) {
	            options.push(oldOptions[id]);
	        }
	        return options;
	    },
	
	    filterData: function filterData(data, filters, itemsToHide) {
	        if (typeof data == "undefined" || typeof filters == "undefined") {}
	        //return [];
	
	        //console.log("filterz", filters);
	        //console.log("itemzToHide", itemsToHide);
	        /*
	                         for(let f in data ) {
	                            if ( data[f].properties.eventType == "failures" ) {
	                                console.log("found failures!", data[f]);
	        
	                            }
	        
	                        }
	        */
	        var results = $.grep(data, function (e, i) {
	            var found = true;
	
	            if (e.properties.eventType == "failures") {
	                //console.log("found failures!", e, "ipversion", e.properties.ipversion);
	
	            }
	
	            for (var key in filters) {
	                var val = filters[key];
	
	                if (key in e.properties && e.properties[key] == val) {
	                    found = found && true;
	                } else {
	                    return false;
	                }
	            }
	            return found;
	        });
	
	        var filteredResults = void 0;
	        // Filter out items in the itemsToHide array
	        if (typeof itemsToHide != "undefined" && Object.keys(itemsToHide).length > 0) {
	            filteredResults = $.grep(results, function (e, i) {
	                var show = false;
	                for (var j in itemsToHide) {
	                    var found = 0;
	                    var item = itemsToHide[j];
	                    for (var key in item) {
	                        var val = item[key];
	                        var f = filters;
	                        if (filters.eventType == "failures"
	                        //&& e.properties.mainEventType == filters.mainEventType
	                        ) {
	
	                                // hide failures if failures are hidden
	                                if (key == "eventType" && val == "failures") {
	                                    return false;
	                                }
	
	                                // if we're looking at eventType, we really
	                                // need to look at mainEventType
	                                if (key == "eventType" && e.properties.mainTestType == "latency") {
	                                    key = "mainEventType";
	                                }
	                                if (key in e.properties && e.properties[key] == val) {
	                                    //show  = false || show;
	                                    found++;
	                                    return false;
	                                } else {
	                                    show = true;;
	                                }
	                                //return false;
	                            } else if (key in e.properties && e.properties[key] == val) {
	                            show = false || show;
	                            found++;
	                        } else {
	                            show = true;
	                            //return false;
	                        }
	                    }
	                    show = found < Object.keys(item).length;
	                    if (found >= Object.keys(item).length) {
	                        return false;
	                    }
	                }
	                return show;
	            });
	        } else {
	            filteredResults = results;
	        }
	
	        return filteredResults;
	    },
	
	    getChartData: function getChartData(filters, itemsToHide) {
	        itemsToHide = this.pruneItemsToHide(itemsToHide);
	        var data = chartData;
	        var results = this.filterData(data, filters, itemsToHide);
	        var min = void 0;
	        var max = void 0;
	
	        var self = this;
	        $.each(results, function (i, val) {
	            var values = val.values;
	            if (typeof values == "undefined") {
	                return true;
	            }
	            var valmin = values.min();
	            var valmax = values.max();
	
	            min = self.getMin(min, valmin);
	            max = self.getMax(max, valmax);
	        });
	        var stats = {
	            min: min,
	            max: max
	        };
	
	        return {
	            stats: stats,
	            results: results
	        };
	    },
	    getMin: function getMin(val1, val2) {
	        // Get the min of the provided values
	        var min = void 0;
	        if (!isNaN(Math.min(val1, val2))) {
	            min = Math.min(val1, val2);
	        } else if (!isNaN(val1)) {
	            min = val1;
	        } else if (!isNaN(val2)) {
	            min = val2;
	        }
	        return min;
	    },
	    getMax: function getMax(val1, val2) {
	        // Get the max of the provided values
	        var max = void 0;
	        if (!isNaN(Math.max(val1, val2))) {
	            max = Math.max(val1, val2);
	        } else if (!isNaN(val1)) {
	            max = val1;
	        } else if (!isNaN(val2)) {
	            max = val2;
	        }
	        return max;
	    },
	    getUniqueValues: function getUniqueValues(fields) {
	        var data = chartData;
	        var self = {};
	        self.data = data;
	        var unique = {};
	        $.each(data, function (index, datum) {
	            $.each(fields, function (field) {
	                var dat = self.data;
	                var val = datum.properties[field];
	                if (!(field in unique)) {
	                    unique[field] = {};
	                    unique[field][val] = 1;
	                }
	                unique[field][val] = 1;
	            });
	        });
	        $.each(unique, function (key, val) {
	            unique[key] = Object.keys(val);
	        });
	        return unique;
	    },
	    getMainEventType: function getMainEventType(eventTypes) {
	        var mainTypes = {
	            "throughput": 1,
	            "histogram-owdelay": 1,
	            "histogram-rtt": 1
	        };
	        for (var i in eventTypes) {
	            var type = eventTypes[i]["event-type"];
	            if (type in mainTypes) {
	                return type;
	            }
	        }
	        return;
	    },
	    esmondToTimeSeries: function esmondToTimeSeries(inputData) {
	        var outputData = {};
	        var output = [];
	        var self = this;
	        if (typeof inputData == "undefined" || inputData.length == 0) {
	            return [];
	        }
	
	        // loop through non-failures first, find maxes
	        // then do failures and scale values
	        $.each(inputData, function (index, datum) {
	            var max = void 0;
	            var min = void 0;
	            if ($.isEmptyObject(datum) || !$.isPlainObject(datum) || typeof datum == "undefined") {
	                return true;
	            }
	            var eventType = datum.eventType;
	            var direction = datum.direction;
	            var protocol = datum.protocol;
	            if (eventType == "failures") {
	                return true;
	            }
	            if (!(eventType in outputData)) {
	                outputData[eventType] = {};
	            } else {
	                if (typeof outputData[eventType].min != "undefined") {
	                    min = outputData[eventType].min;
	                }
	                if (typeof outputData[eventType].max != "undefined") {
	                    max = outputData[eventType].max;
	                }
	            }
	            var mainEventType = self.getMainEventType(datum["event-types"]);
	
	            var values = [];
	            var failureValues = [];
	            var series = {};
	            var failureSeries = {};
	
	            var testType = void 0;
	            var mainTestType = void 0;
	
	            testType = self.eventTypeToTestType(eventType);
	            if (typeof testType == "undefined") {
	                return true;
	            }
	            mainTestType = self.eventTypeToTestType(mainEventType);
	
	            if (typeof datum == "undefined" || typeof datum.data == "undefined" || datum.data.length == 0) {
	                return true;
	            }
	
	            $.each(datum.data, function (valIndex, val) {
	                var ts = val["ts"];
	                var timestamp = new _moment2.default(new Date(ts * 1000)); // 'Date' expects milliseconds
	                var failureValue = null;
	                var value = val["val"];
	                if (eventType == 'histogram-owdelay') {
	                    value = val["val"].minimum;
	                } else if (eventType == 'histogram-rtt') {
	                    value = val["val"].minimum;
	                } else if (eventType == 'packet-count-lost') {
	                    if (val["val"] > 0) {}
	                } else if (eventType == 'packet-count-sent') {} else if (eventType == 'packet-retransmits') {} else if (eventType == "packet-loss-rate" || eventType == "packet-loss-rate-bidir") {
	                    // convert to %
	                    value *= 100;
	                }
	
	                if (value <= 0 && eventType != "histogram-owdelay") {
	                    //console.log("VALUE IS ZERO OR LESS", Date());
	                    value = 0.000000001;
	                }
	                if (eventType == "failures") {
	                    // handle failures, which are supposed to be NaN
	                    failureValue = value;
	                } else if (isNaN(value)) {
	                    //console.log("VALUE IS NaN", eventType);
	                }
	                if (failureValue != null) {
	                    var failureObj = {
	                        errorText: failureValue.error,
	                        value: 95,
	                        type: "error"
	                    };
	                    var errorEvent = new _pondjs.Event(timestamp, failureObj);
	                    failureValues.push(errorEvent);
	                } else {
	                    values.push([timestamp.toDate().getTime(), value]);
	                }
	                if (typeof min == "undefined") {
	                    min = value;
	                } else if (value < min) {
	                    min = value;
	                }
	                if (typeof max == "undefined") {
	                    max = value;
	                } else if (value > max) {
	                    max = value;
	                }
	            });
	
	            series = new _pondjs.TimeSeries({
	                name: eventType + "." + direction,
	                columns: ["time", "value"],
	                points: values
	            });
	
	            var ipversion = datum.ipversion;
	
	            outputData[eventType].max = max;
	            outputData[eventType].min = min;
	
	            var row = {};
	
	            row.properties = pruneDatum(datum);
	            row.properties.eventType = eventType;
	            row.properties.mainEventType = mainEventType;
	            row.properties.testType = testType;
	            row.properties.mainTestType = mainTestType;
	            row.values = series;
	            output.push(row);
	        });
	
	        this.eventTypeStats = outputData;
	
	        // Create retransmit series
	        output = this.pairRetrans(output);
	
	        // Create failure series
	
	        $.each(inputData, function (index, datum) {
	            var eventType = datum.eventType;
	            var direction = datum.direction;
	            var protocol = datum.protocol;
	            if (eventType != "failures") {
	                return true;
	            }
	            var mainEventType = self.getMainEventType(datum["event-types"]);
	
	            var min = 0;
	            var max = void 0;
	            if (typeof mainEventType != "undefined" && mainEventType in outputData && "max" in outputData[mainEventType]) {
	                max = outputData[mainEventType].max;
	            }
	            if (isNaN(max)) {
	                max = 1;
	            }
	            //datum.mainEventType = mainEventType;
	
	            var failureValues = [];
	            var failureSeries = {};
	
	            var testType = void 0;
	            var mainTestType = void 0;
	
	            testType = self.eventTypeToTestType(eventType);
	            mainTestType = self.eventTypeToTestType(mainEventType);
	            $.each(datum.data, function (valIndex, val) {
	                var ts = val["ts"];
	                var timestamp = new _moment2.default(new Date(ts * 1000)); // 'Date' expects milliseconds
	                var failureValue = null;
	                var value = val["val"];
	                if (eventType == "failures") {
	                    failureValue = value;
	                }
	                if (failureValue != null) {
	                    var failureObj = {
	                        errorText: failureValue.error,
	                        value: 0.9 * max,
	                        type: "error"
	                    };
	                    var errorEvent = new _pondjs.Event(timestamp, failureObj);
	                    failureValues.push(errorEvent);
	                }
	            });
	            failureSeries = new _pondjs.TimeSeries({
	                name: eventType + "." + direction + ".failures",
	                events: failureValues
	            });
	            var row = {};
	
	            row.properties = pruneDatum(datum);
	            row.properties.min = min;
	            row.properties.max = max;
	            row.properties.eventType = eventType;
	            row.properties.mainEventType = mainEventType;
	            row.properties.testType = testType;
	            row.properties.mainTestType = mainTestType;
	            row.values = failureSeries;
	            output.push(row);
	        });
	        return output;
	    },
	    scaleValues: function scaleValues(series, maxVal) {
	        var seriesMax = series.max();
	        if (typeof maxVal == "undefined") {
	            maxVal = seriesMax;
	        }
	        var scaled = series.map(function (e) {
	            var time = e.timestamp();
	            var value = e.value();
	            if (maxVal == 0 || seriesMax == 0 || value == 1e-9) {
	                value = 1e-9;
	            } else {
	                value = e.value() * maxVal / seriesMax;
	            }
	            var newEvent = new _pondjs.Event(time, { "value": value });
	            return newEvent;
	        });
	        return scaled;
	    },
	    eventTypeToTestType: function eventTypeToTestType(eventType) {
	        var testType = void 0;
	        if (eventType == "histogram-owdelay" || eventType == "histogram-rtt") {
	            testType = "latency";
	        } else if (eventType == "throughput" || eventType == "packet-retransmits") {
	            testType = "throughput";
	        } else if (lossTypes.indexOf(eventType) > -1) {
	            testType = "loss";
	        }
	        return testType;
	    },
	    pairRetrans: function pairRetrans(data) {
	        var _this3 = this;
	
	        var retransFilter = { eventType: "packet-retransmits" };
	        var retransData = this.filterData(data, retransFilter, []);
	        var tputFilter = { eventType: "throughput", "ip-transport-protocol": "tcp" };
	        var tputData = this.filterData(data, tputFilter);
	        var newSeries = [];
	
	        var deleteIndices = [];
	
	        var _loop4 = function _loop4() {
	            var row = retransData[i];
	            var eventType = row.properties.eventType;
	            var key = row.properties["metadata-key"];
	            var direction = row.properties["direction"];
	
	            // If this is throughput, add the value of the
	            // corresponding retrans type 
	            var self = _this3;
	            self.row = row;
	            self.key = key;
	            self.direction = direction;
	
	            var indices = $.map(data, function (row, index) {
	                if (eventType == "packet-retransmits") {
	                    var tpItem = data[index];
	
	                    // If the value has the same "metadata-key", it's from the same test
	
	                    if (tpItem.properties["metadata-key"] == self.key && tpItem.properties["direction"] == self.direction) {
	                        if (tpItem.properties.eventType == "throughput") {
	
	                            // handle the throughput/retrans values
	                            var newEvents = [];
	                            var newEventsTT = [];
	                            var _iteratorNormalCompletion = true;
	                            var _didIteratorError = false;
	                            var _iteratorError = undefined;
	
	                            try {
	                                for (var _iterator = self.row.values.events()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                                    var reEvent = _step.value;
	
	                                    if (typeof reEvent == "undefined" || reEvent === null) {
	                                        return null;
	                                    }
	
	                                    var retransVal = reEvent.value();
	
	                                    if (retransVal < 1) {
	                                        continue;
	                                    }
	
	                                    var tputVal = tpItem.values.atTime(reEvent.timestamp()).value();
	
	                                    var eventValues = {
	                                        value: tputVal
	                                    };
	                                    if (retransVal >= 1) {
	                                        eventValues.retrans = retransVal;
	                                    }
	                                    var newEvent = new _pondjs.Event(reEvent.timestamp(), eventValues);
	                                    newEvents.push(newEvent);
	                                }
	                            } catch (err) {
	                                _didIteratorError = true;
	                                _iteratorError = err;
	                            } finally {
	                                try {
	                                    if (!_iteratorNormalCompletion && _iterator.return) {
	                                        _iterator.return();
	                                    }
	                                } finally {
	                                    if (_didIteratorError) {
	                                        throw _iteratorError;
	                                    }
	                                }
	                            }
	
	                            var series = new _pondjs.TimeSeries({
	                                name: "Retransmits",
	                                events: newEvents
	                            });
	                            var newRow = {};
	                            newRow.properties = self.row.properties;
	                            newRow.values = series;
	                            newSeries.push(newRow);
	                        } else if (eventType == "packet-retransmits") {
	                            return index;
	                        }
	                    }
	                }
	            });
	            deleteIndices = deleteIndices.concat(indices);
	        };
	
	        for (var i in retransData) {
	            _loop4();
	        }
	
	        // Delete the original test results with "packet-retransmits"
	
	        var reducedData = $.map(data, function (item, index) {
	            if (deleteIndices.indexOf(index) > -1) {
	                return null;
	            } else {
	                return item;
	            }
	        });
	
	        data = reducedData.concat(newSeries);
	
	        return data;
	    },
	    pairSentLost: function pairSentLost(data) {
	        var deleteIndices = [];
	
	        var _loop5 = function _loop5() {
	            var row = data[i];
	            var eventType = row.properties.eventType;
	            var key = row.properties["metadata-key"];
	
	            // If this is packet-count-sent, add the value to the
	            // corresponding packet-count-lost type and delete this
	
	            if (eventType == "packet-loss-rate" || eventType == "packet-loss-rate-bidir") {
	                var indices = $.map(data, function (item, index) {
	                    // If the value has the same "metadata-key", it's from the same test
	                    if (item.properties["metadata-key"] == key) {
	                        if (item.properties.eventType == "packet-count-sent") {
	                            row.sentValue = data[index].value;
	                            return index;
	                        } else if (item.properties.eventType == "packet-count-lost") {
	                            row.lostValue = data[index].value;
	                            return index;
	                        } else if (item.properties.eventType == "packet-count-lost-bidir") {
	                            row.lostValue = data[index].value;
	                            return index;
	                        }
	                    }
	                });
	
	                deleteIndices = deleteIndices.concat(indices);
	            }
	        };
	
	        for (var i in data) {
	            _loop5();
	        }
	
	        // Delete the values with "packet-count-sent"
	        data = $.map(data, function (item, index) {
	            if (deleteIndices.indexOf(index) > -1) {
	                return null;
	            } else {
	                return item;
	            }
	        });
	
	        return data;
	    },
	    subscribe: function subscribe(callback) {
	        emitter.on("get", callback);
	    },
	    unsubscribe: function unsubscribe(callback) {
	        emitter.off("get", callback);
	    },
	    subscribeError: function subscribeError(callback) {
	        emitter.on("error", callback);
	    },
	    unsubscribeError: function unsubscribeError(callback) {
	        emitter.off("error", callback);
	    },
	    subscribeEmpty: function subscribeEmpty(callback) {
	        emitter.on("empty", callback);
	    },
	    unsubscribeEmpty: function unsubscribeEmpty(callback) {
	        emitter.off("empty", callback);
	    },
	    render: function render() {}
	
	};
	
	var pruneDatum = function pruneDatum(oldDatum) {
	    var datum = {};
	    for (var i in oldDatum) {
	        if (i != "data") {
	            datum[i] = oldDatum[i];
	        }
	    }
	    return datum;
	};

/***/ }),

/***/ 804:
/*!**************************************!*\
  !*** ./src/shared/GraphUtilities.js ***!
  \**************************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var _momentTimezone = __webpack_require__(/*! moment-timezone */ 805);
	
	var _momentTimezone2 = _interopRequireDefault(_momentTimezone);
	
	var _pondjs = __webpack_require__(/*! pondjs */ 644);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	module.exports = {
	    getTimezone: function getTimezone(date) {
	        var tz = void 0;
	        var tzRe = /\(([^)]+)\)/;
	        var out = void 0;
	        var offset = void 0;
	
	        if (typeof date == "undefined" || date == null) {
	            return;
	        } else if (date == "Invalid Date") {
	            tz = "";
	            out = "";
	        } else {
	            tz = tzRe.exec(date);
	            if (typeof tz == "undefined" || tz === null) {
	                // timezone is unknown
	                return "";
	            } else {
	                tz = tz[1];
	                var dateObj = new Date(date);
	                var dateMoment = (0, _momentTimezone2.default)(dateObj);
	                offset = dateMoment.utcOffset() / 60;
	                if (typeof offset != "undefined" && offset >= 0) {
	                    offset = "+" + offset;
	                }
	            }
	        }
	
	        out = " (GMT" + offset + ")";
	        return out;
	    },
	
	    getTimeVars: function getTimeVars(period) {
	        var timeDiff = void 0;
	        var summaryWindow = void 0;
	        if (period == '4h') {
	            timeDiff = 60 * 60 * 4;
	            summaryWindow = 0;
	        } else if (period == '12h') {
	            timeDiff = 60 * 60 * 12;
	            summaryWindow = 0;
	        } else if (period == '1d') {
	            timeDiff = 86400;
	            summaryWindow = 300;
	        } else if (period == '3d') {
	            timeDiff = 86400 * 3;
	            summaryWindow = 300;
	        } else if (period == '1w') {
	            timeDiff = 86400 * 7;
	            summaryWindow = 3600;
	        } else if (period == '1m') {
	            timeDiff = 86400 * 31;
	            summaryWindow = 3600;
	        } else if (period == '1y') {
	            timeDiff = 86400 * 365;
	            summaryWindow = 86400;
	        }
	        var timeRange = {
	            timeDiff: timeDiff,
	            summaryWindow: summaryWindow,
	            timeframe: period
	        };
	        return timeRange;
	    },
	
	    // Returns the UNIQUE values of an array
	    unique: function unique(arr) {
	        var i,
	            len = arr.length,
	            out = [],
	            obj = {};
	
	        for (i = 0; i < len; i++) {
	            obj[arr[i]] = 0;
	        }
	        out = Object.keys(obj);
	        return out;
	    },
	
	    formatBool: function formatBool(input, unknownText) {
	        var out = void 0;
	        if (input === true || input === 1 || input == "1") {
	            out = "Yes";
	        } else if (input === false || input === 0 || input == "0") {
	            out = "No";
	        }
	        out = this.formatUnknown(out, unknownText);
	        return out;
	    },
	
	    formatSItoSI: function formatSItoSI(value, Y) {
	        console.log("value", value);
	        var out = value;
	        var re = /^(\d+\.?\d*)\s?([KMGT])(\w*)/;
	        var results = value.match(re);
	        if (results !== null) {
	            var values = {};
	            values.K = 1024;
	            values.M = 1024 * 1024;
	            values.G = 1024 * 1024 * 1024;
	            console.log("values", values);
	            console.log("value, re, results", value, re, results);
	
	            out = results[1];
	
	            if (results[2].toUpperCase() in values) {
	                var X = results[2];
	                out = out * values[results[2]];
	                // convert to Y
	                out = out / values[Y];
	                out = Math.round(out * 10) / 10;
	                out += " " + Y + results[3];
	            };
	        }
	        console.log("outvalue", out);
	
	        return out;
	    },
	
	    formatUnknown: function formatUnknown(str, unknownText) {
	        if (typeof unknownText == "undefined" || unknownText === null) {
	            unknownText = "unknown";
	        }
	        if (typeof str == "undefined" || str === null || str == "") {
	            return unknownText;
	        } else {
	            return str;
	        }
	    }
	
	};

/***/ }),

/***/ 898:
/*!*************************!*\
  !*** ./src/SIValue.jsx ***!
  \*************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _react = __webpack_require__(/*! react */ 297);
	
	var _react2 = _interopRequireDefault(_react);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = _react2.default.createClass({
	    displayName: 'SIValue',
	    render: function render() {
	        return _react2.default.createElement(
	            'span',
	            null,
	            this.formatValue()
	        );
	    },
	    formatValue: function formatValue() {
	        var value = this.props.value;
	        var digits = this.props.digits || 1;
	        if (isNaN(value)) {
	            return value;
	        }
	        var iec = this.props.iec || false;
	        var si = !iec;
	        var suffix = this.props.unit || '';
	        var thresh = si ? 1000 : 1024;
	        if (Math.abs(value) < thresh) {
	            return value + ' ';
	        }
	        var units = si ? ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'] : ['Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'];
	        var u = -1;
	        do {
	            value /= thresh;
	            ++u;
	        } while (Math.abs(value) >= thresh && u < units.length - 1);
	        return value.toFixed(digits) + ' ' + units[u] + suffix;
	    }
	});

/***/ }),

/***/ 899:
/*!************************!*\
  !*** ./src/chart1.css ***!
  \************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../~/css-loader!./chart1.css */ 900);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../~/style-loader/addStyles.js */ 902)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../node_modules/css-loader/index.js!./chart1.css", function() {
				var newContent = require("!!../node_modules/css-loader/index.js!./chart1.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),

/***/ 900:
/*!***************************************!*\
  !*** ./~/css-loader!./src/chart1.css ***!
  \***************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ./~/css-loader/cssToString.js */ 901)();
	exports.push([module.id, "rect.extent {\n    fill: steelblue;\n    opacity: 0.25;\n}\n#graphContainer { \n    padding: 0 1em;\n}\n#brushContainer .yaxis > .tick {\n    display: none;\n}\n\n#brushContainer .yaxis > .tick:first-child {\n    display: block;\n}\n\n#brushContainer .yaxis > .tick:last-of-type {\n    display: block;\n}\n\n.yaxis text.yaxis-label, .yaxis > text {\n    text-anchor: middle;\n    transform: rotate(-90deg) \n        translate(-75px, -80px);\n    font-size:14px;\n}\n\n#brushContainer .yaxis text.yaxis-label {\n    transform: rotate(0deg) \n        translate(-10px, 9px);\n    font-size:10px;\n}\n\n#graphContainer .overview {\n    padding:0.5em 0.5em 0.5em 1em;\n}\n\n.overview--pad {\n    padding:2em 0;\n}\n\nbody {\n    padding: 0;\n}\n\n#graphContainer .button-reportrange {\n    \n    margin:0 0.7em 0 0.7em; \n    padding:0 0.7em 0 0.7em;\n}\n\n#graphContainer .button-timechange {\n    min-width:37px;\n\n}\n\n", ""]);

/***/ }),

/***/ 903:
/*!*****************************!*\
  !*** ./src/chartLayout.jsx ***!
  \*****************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _react = __webpack_require__(/*! react */ 297);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _underscore = __webpack_require__(/*! underscore */ 502);
	
	var _underscore2 = _interopRequireDefault(_underscore);
	
	var _chart = __webpack_require__(/*! ./chart1.jsx */ 501);
	
	var _chart2 = _interopRequireDefault(_chart);
	
	var _ChartHeader = __webpack_require__(/*! ./ChartHeader */ 904);
	
	var _ChartHeader2 = _interopRequireDefault(_ChartHeader);
	
	var _HostInfoStore = __webpack_require__(/*! ./shared/HostInfoStore */ 975);
	
	var _HostInfoStore2 = _interopRequireDefault(_HostInfoStore);
	
	var _GraphUtilities = __webpack_require__(/*! ./shared/GraphUtilities */ 804);
	
	var _GraphUtilities2 = _interopRequireDefault(_GraphUtilities);
	
	__webpack_require__(/*! ../css/graphs.css */ 973);
	
	__webpack_require__(/*! ../../toolkit/web-ng/root/js/app.js */ 978);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	//import GraphDataStore from "./GraphDataStore";
	
	var text = 'perfSONAR chart';
	//import "../../toolkit/web-ng/root/css/app.css"
	
	
	var now = Math.floor(new Date().getTime() / 1000);
	
	var defaults = {
	    summaryWindow: 3600,
	    start: now - 86400 * 7,
	    end: now,
	    timeframe: "1w"
	};
	
	var scheme = {
	    requests: "#2ca02c",
	    connections: "#990000"
	};
	
	var connectionsStyle = {
	    color: scheme.requests,
	    strokeWidth: 1
	};
	
	var requestsStyle = {
	    stroke: "#990000",
	    strokeWidth: 2,
	    strokeDasharray: "4,2"
	};
	
	var lineStyles = {
	    value: {
	        stroke: scheme.requests,
	        strokeWidth: 1
	    }
	};
	
	/*
	 * Colors from mockup
	 * blue: #004987
	 * purple: #750075
	 * orange: #ff8e01
	*/
	
	// Colors from old graphs
	var tcpColor = "#0076b4"; // blue
	var udpColor = "#cc7dbe"; // purple
	var ipv4Color = "#e5a11c"; // yellow
	var ipv6Color = "#633"; // brown from old graphs
	
	var ipv4Style = {
	    color: ipv4Color
	};
	
	var reverseStyles = {
	    value: {
	        stroke: scheme.connections,
	        strokeDasharray: "4,2",
	        strokeWidth: 1
	    }
	};
	
	var axisLabelStyle = {
	    labelColor: "black"
	    //labelOffset: -15
	    //labelWeight: 100,
	    //labelSize: 12
	};
	
	var offsets = {
	    label: -15
	};
	
	var chartRow = {
	    height: 150
	};
	
	var brushStyle = {
	    boxShadow: "inset 0px 2px 5px -2px rgba(189, 189, 189, 0.75)",
	    background: "#FEFEFE",
	    paddingTop: 10
	};
	
	// These aliases allow us to use shorter strings in the URL to indicate values
	// which are hidden. 
	// This hash lets us map from Long to Short aliases, for example to take the full show/hide
	// string and turn it into a short alias to put in the URL
	var showHideAliasesLongToShort = {
	    "eventType_throughput_protocol_tcp_": "throughput_tcp",
	    "eventType_throughput_protocol_udp_": "throughput_udp",
	    "eventType_packet-loss-rate_mainEventType_histogram-owdelay_": "loss_owdelay",
	    "eventType_packet-loss-rate_mainTestType_throughput_": "loss_throughput",
	    "eventType_histogram-owdelay_": "latency_owdelay",
	    "eventType_histogram-rtt_": "latency_ping",
	    "direction_forward_": "forward",
	    "direction_reverse_": "reverse",
	    "eventType_failures_": "failures",
	    "eventType_packet-retransmits_": "retrans",
	    "eventType_packet-loss-rate-bidir_": "loss_ping"
	};
	
	// This hash lets us map from Short to Long aliases, for example
	// to take a value from the URL and derive the longer value
	var showHideAliasesShortToLong = {};
	for (var key in showHideAliasesLongToShort) {
	    var val = showHideAliasesLongToShort[key];
	    showHideAliasesShortToLong[val] = key;
	}
	
	exports.default = _react2.default.createClass({
	    displayName: "ChartLayout",
	
	    colors: {
	        tcp: "#0076b4", // blue
	        udp: "#cc7dbe", // purple
	        ipv4: "#e5a11c", // yellow
	        ipv6: "#633" // brown from old graphs
	
	    },
	
	    getColors: function getColors() {
	        return this.colors;
	    },
	
	
	    //mixins: [Highlighter],
	
	    getInitialState: function getInitialState() {
	        var newState = this.getQueryString();
	        return {
	            title: text,
	            src: newState.src,
	            dst: newState.dst,
	            start: newState.start,
	            end: newState.end,
	            timeframe: newState.timeframe,
	            ma_url: newState.ma_url,
	            agent: newState.agent,
	            summaryWindow: newState.summaryWindow,
	            itemsToHide: newState.itemsToHide,
	            tool: newState.tool,
	            ipversion: newState.ipversion,
	            hashValues: newState.hashValues,
	            active: newState.active
	        };
	    },
	
	    contextTypes: {
	        router: _react2.default.PropTypes.func
	    },
	    toggleType: function toggleType(options, event) {
	        var newItems = this.state.itemsToHide;
	        var sorted = Object.keys(options).sort();
	        var id = "";
	        for (var i in sorted) {
	            var _key = sorted[i];
	            var _val = options[_key];
	            id += _key + "_" + _val + "_";
	        }
	        if (id in newItems) {
	            delete newItems[id];
	        } else {
	            //let newItems = {};
	            newItems[id] = options;
	        }
	        var active = this.state.active;
	        active[id] = !active[id];
	        this.setState({ active: active, itemsToHide: newItems });
	
	        var activeHash = this.state.hashValues;
	        for (var _key2 in active) {
	            var show = active[_key2];
	            var shortKey = showHideAliasesLongToShort[_key2];
	            if (!show) {
	                activeHash["hide_" + shortKey] = !active[_key2];
	            } else {
	                delete activeHash["hide_" + shortKey];
	            }
	        }
	        this.setState({ hashValues: activeHash });
	        this.setHashVals(activeHash);
	        //this.setHashVals( newItems );
	
	        //this.setHashVals( this.state.hashValues );
	        //this.updateURLHash();
	        event.preventDefault();
	
	        return false;
	    },
	
	    getActiveClass: function getActiveClass(value) {
	        if (value === true) {
	            return "active";
	        } else {
	            return "";
	        }
	    },
	    render: function render() {
	        if (typeof this.state.src == "undefined" || typeof this.state.dst == "undefined" || typeof this.state.start == "undefined" || typeof this.state.end == "undefined" || typeof this.state.timeframe == "undefined" || typeof this.state.ma_url == "undefined") {
	            return _react2.default.createElement("div", null);
	        }
	        return _react2.default.createElement(
	            "div",
	            { className: "graph" },
	            _react2.default.createElement(_ChartHeader2.default, {
	                sources: this.state.src,
	                dests: this.state.dst,
	                start: this.state.start,
	                end: this.state.end,
	                timeframe: this.state.timeframe,
	                updateTimerange: this.handleTimerangeChange,
	                ma_url: this.state.ma_url
	            }),
	            _react2.default.createElement(
	                "div",
	                { className: "graph-filters" },
	                _react2.default.createElement(
	                    "div",
	                    { className: "graph-filter left" },
	                    _react2.default.createElement(
	                        "ul",
	                        { className: " graph-filter__list" },
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item throughput-tcp " + this.getActiveClass(this.state.active["eventType_throughput_protocol_tcp_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "throughput", protocol: "tcp" }) },
	                                "Tput (TCP)"
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item udp " + this.getActiveClass(this.state.active["eventType_throughput_protocol_udp_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "throughput", protocol: "udp" }) },
	                                "Tput (UDP)"
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item loss-throughput " + this.getActiveClass(this.state.active["eventType_packet-loss-rate_mainTestType_throughput_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "packet-loss-rate", mainTestType: "throughput" }) },
	                                "Loss (UDP)"
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item loss-latency " + this.getActiveClass(this.state.active["eventType_packet-loss-rate_mainEventType_histogram-owdelay_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "packet-loss-rate", mainEventType: "histogram-owdelay" }) },
	                                "Loss (owamp)"
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item loss-ping " + this.getActiveClass(this.state.active["eventType_packet-loss-rate-bidir_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "packet-loss-rate-bidir" }) },
	                                "Loss (ping)"
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item packet-retransmits " + this.getActiveClass(this.state.active["eventType_packet-retransmits_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "packet-retransmits" }) },
	                                "Retrans",
	                                _react2.default.createElement(
	                                    "svg",
	                                    { width: "10", height: "10", className: "direction-label" },
	                                    _react2.default.createElement("circle", { cx: "5", cy: "5", r: "4", fill: "#cc7dbe" })
	                                )
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item ipv6 " + this.getActiveClass(this.state.active["eventType_histogram-owdelay_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "histogram-owdelay" }) },
	                                "Latency"
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item ipv4 " + this.getActiveClass(this.state.active["eventType_histogram-rtt_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { eventType: "histogram-rtt" }) },
	                                "Latency (ping)"
	                            )
	                        )
	                    )
	                ),
	                _react2.default.createElement(
	                    "div",
	                    { className: "graph-filter right hidden" },
	                    _react2.default.createElement(
	                        "a",
	                        { href: "#", className: "graph-settings sidebar-popover-toggle js-sidebar-popover-toggle" },
	                        _react2.default.createElement("i", { className: "fa fa-gear" })
	                    ),
	                    _react2.default.createElement(
	                        "div",
	                        { className: "sidebar-popover options-popover" },
	                        _react2.default.createElement(
	                            "a",
	                            { className: "sidebar-popover__close js-sidebar-popover-close" },
	                            "Close \xA0",
	                            _react2.default.createElement("i", { className: "fa fa-close" })
	                        ),
	                        _react2.default.createElement(
	                            "h4",
	                            { className: "options-popover__heading" },
	                            "Advanced Graph Options"
	                        ),
	                        _react2.default.createElement(
	                            "ul",
	                            { className: "options-popover__list" },
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "strong",
	                                    null,
	                                    "Scale/Smoothing"
	                                )
	                            ),
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "ul",
	                                    { className: "options-popover__row" },
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        "Latency"
	                                    ),
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        " ",
	                                        _react2.default.createElement("input", { type: "checkbox", name: "latency-log", id: "latency-log" }),
	                                        _react2.default.createElement(
	                                            "label",
	                                            { htmlFor: "latency-log" },
	                                            "apply logarithmic scale"
	                                        ),
	                                        " "
	                                    ),
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        " ",
	                                        _react2.default.createElement("input", { type: "checkbox", name: "latency-interp", id: "latency-interp" }),
	                                        _react2.default.createElement(
	                                            "label",
	                                            { htmlFor: "latency-interp" },
	                                            "interpolate between intervals"
	                                        ),
	                                        " "
	                                    )
	                                )
	                            ),
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "ul",
	                                    { className: "options-popover__row" },
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        "Loss "
	                                    ),
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        " ",
	                                        _react2.default.createElement("input", { type: "checkbox", name: "loss-log", id: "loss-log" }),
	                                        _react2.default.createElement(
	                                            "label",
	                                            { htmlFor: "loss-log" },
	                                            "apply logarithmic scale"
	                                        ),
	                                        " "
	                                    ),
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        " ",
	                                        _react2.default.createElement("input", { type: "checkbox", name: "loss-interp", id: "loss-interp" }),
	                                        _react2.default.createElement(
	                                            "label",
	                                            { htmlFor: "loss-interp" },
	                                            "interpolate between intervals"
	                                        ),
	                                        " "
	                                    )
	                                )
	                            ),
	                            _react2.default.createElement(
	                                "li",
	                                null,
	                                _react2.default.createElement(
	                                    "ul",
	                                    { className: "options-popover__row" },
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        "Throughput"
	                                    ),
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        " ",
	                                        _react2.default.createElement("input", { type: "checkbox", name: "thruput-log", id: "thruput-log" }),
	                                        _react2.default.createElement(
	                                            "label",
	                                            { htmlFor: "thruput-log" },
	                                            "apply logarithmic scale"
	                                        ),
	                                        " "
	                                    ),
	                                    _react2.default.createElement(
	                                        "li",
	                                        null,
	                                        " ",
	                                        _react2.default.createElement("input", { type: "checkbox", name: "thruput-interp", id: "thruput-interp" }),
	                                        _react2.default.createElement(
	                                            "label",
	                                            { htmlFor: "thruput-interp" },
	                                            "interpolate between intervals"
	                                        ),
	                                        " "
	                                    )
	                                )
	                            )
	                        )
	                    )
	                ),
	                _react2.default.createElement(
	                    "div",
	                    { className: "graph-filter right" },
	                    _react2.default.createElement(
	                        "ul",
	                        { className: " graph-filter__list" },
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item--forward " + this.getActiveClass(this.state.active["direction_forward_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { direction: "forward" }) },
	                                "Forward",
	                                _react2.default.createElement(
	                                    "svg",
	                                    { width: "18", height: "4", className: "direction-label" },
	                                    _react2.default.createElement("line", { x1: "0", y1: "2", x2: "18", y2: "2", stroke: "white", strokeWidth: "3" })
	                                )
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item--reverse " + this.getActiveClass(this.state.active["direction_reverse_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { direction: "reverse" }) },
	                                "Reverse",
	                                _react2.default.createElement(
	                                    "svg",
	                                    { width: "18", height: "4", className: "direction-label" },
	                                    _react2.default.createElement("line", { x1: "0", y1: "2", x2: "18", y2: "2", stroke: "white", strokeWidth: "3", strokeDasharray: "4,2" })
	                                )
	                            )
	                        ),
	                        _react2.default.createElement(
	                            "li",
	                            { className: "graph-filter__item graph-filter__item--failures " + this.getActiveClass(this.state.active["eventType_failures_"]) },
	                            _react2.default.createElement(
	                                "a",
	                                { href: "#", onClick: this.toggleType.bind(this, { "eventType": "failures" }) },
	                                "Failures",
	                                _react2.default.createElement(
	                                    "svg",
	                                    { width: "10", height: "10", className: "direction-label" },
	                                    _react2.default.createElement("circle", { cx: "5", cy: "5", r: "4", fill: "red" })
	                                )
	                            )
	                        )
	                    )
	                )
	            ),
	            _react2.default.createElement(
	                "div",
	                { className: "graph-wrapper" },
	                _react2.default.createElement(
	                    "div",
	                    { className: "graphholder" },
	                    _react2.default.createElement(_chart2.default, {
	                        src: this.state.src,
	                        dst: this.state.dst,
	                        start: this.state.start,
	                        end: this.state.end,
	                        summaryWindow: this.state.summaryWindow,
	                        ma_url: this.state.ma_url,
	                        agent: this.state.agent,
	                        tool: this.state.tool,
	                        ipversion: this.state.ipversion,
	                        updateHiddenItems: this.handleHiddenItemsChange,
	                        itemsToHide: this.state.itemsToHide,
	                        ref: "chart1"
	                    })
	                )
	            )
	        );
	    },
	
	
	    componentDidMount: function componentDidMount() {
	        //HostInfoStore.retrieveTracerouteData( this.props.sources, this.props.dests, this.props.ma_url );
	        if ($.isArray(this.state.src)) {
	            document.title = "pS results between " + this.state.src.join(", ") + " and " + this.state.dst.join(", ");
	        } else {
	            document.title = "pS results between " + this.state.src + " and " + this.state.dst;
	        }
	    },
	    /*
	        componentWillUnmount: function() {
	            ChartHeader.unsubscribe("timeframeChange", this.handleTimerangeChange);
	        },
	        */
	
	    handleTimerangeChange: function handleTimerangeChange(newTime, noupdateURL) {
	        var timeVars = _GraphUtilities2.default.getTimeVars(newTime.timeframe);
	        var timeDiff = timeVars.timeDiff;
	        var oldStart = this.state.start;
	        var oldEnd = this.state.end;
	        var oldDiff = oldEnd - oldStart;
	
	        var now = Math.floor(new Date().getTime() / 1000);
	
	        if (now - newTime.end < oldDiff / 2) {
	            newTime.end = now;
	            newTime.start = newTime.end - timeDiff;
	        }
	
	        this.setState(newTime);
	        this.setHashVals(newTime);
	    },
	
	    setHashVals: function setHashVals(options) {
	        var hashVals = this.state.hashValues;
	        for (var _key3 in options) {
	            hashVals[_key3] = options[_key3];
	        }
	        this.setState({ hashValues: hashVals });
	        this.updateURLHash();
	    },
	    updateURLHash: function updateURLHash(vals) {
	        var hash = "#";
	        var hashVals = void 0;
	        if (typeof vals == "undefined") {
	            hashVals = this.state.hashValues;
	        } else {
	            hashVals = vals;
	        }
	        var arr = [];
	        for (var _key4 in hashVals) {
	            var _val2 = encodeURIComponent(hashVals[_key4]);
	            arr.push(_key4 + "=" + _val2);
	        }
	        hash += arr.join("&");
	        window.location.hash = hash;
	    },
	
	    getQueryString: function getQueryString() {
	        var qs = this.props.location.query;
	
	        // get hash values
	        var hash = this.props.location.hash;
	        var hashRe = /^#/;
	        hash = hash.replace(hashRe, "");
	
	        var hashPairs = hash.split("&");
	        var hashObj = {};
	        for (var i in hashPairs) {
	            // parse key=val 
	            var row = hashPairs[i].split("=");
	            var _key5 = row[0];
	            var _val3 = row[1];
	            if (typeof _val3 == "undefined") {
	                continue;
	            }
	            hashObj[_key5] = _val3;
	        }
	
	        var src = qs.source;
	        var dst = qs.dest;
	        var start = defaults.start;
	        var end = defaults.end;
	        var timeframe = defaults.timeframe;
	        var tool = qs.tool;
	        var agent = qs.agent || [];
	        var summaryWindow = qs.summaryWindow;
	
	        var ipversion = void 0;
	        //let timeRange = this.getTimeVars( defaults.timeframe );
	        //
	        if ("timeframe" in hashObj && hashObj.timeframe != "") {
	            timeframe = hashObj.timeframe;
	        }
	
	        var timeVars = _GraphUtilities2.default.getTimeVars(timeframe);
	
	        if (typeof hashObj.start != "undefined") {
	            start = hashObj.start;
	        } else if (typeof hashObj.start_ts != "undefined") {
	            start = hashObj.start_ts;
	        }
	
	        if (typeof hashObj.end != "undefined") {
	            end = hashObj.end;
	        } else if (typeof hashObj.end_ts != "undefined") {
	            end = hashObj.end_ts;
	        }
	
	        if (typeof qs.ipversion != "undefined") {
	            ipversion = qs.ipversion;
	        }
	
	        if (typeof hashObj.summaryWindow != "undefined") {
	            summaryWindow = hashObj.summaryWindow;
	        }
	
	        if (typeof summaryWindow == "undefined") {
	            //summaryWindow = 3600;
	            summaryWindow = timeVars.summaryWindow;
	        }
	
	        hashObj.start = start;
	        hashObj.end = end;
	        hashObj.summaryWindow = summaryWindow;
	
	        var ma_urls = qs.url || location.origin + "/esmond/perfsonar/archive/";
	        var localhostRe = /localhost/i;
	
	        if (!$.isArray(ma_urls)) {
	            ma_urls = [ma_urls];
	        }
	
	        if (!$.isArray(agent)) {
	            agent = [agent];
	        }
	
	        // Get MA URLs
	        for (var _i in ma_urls) {
	            var ma_url = ma_urls[_i];
	            var found = ma_url.match(localhostRe);
	            var host = location.host;
	            if (found !== null) {
	
	                // replace 'localhost' with the local hostname
	                var new_url = ma_url.replace(localhostRe, host);
	
	                ma_urls[_i] = new_url;
	            }
	        }
	
	        // Get itemsToHide/"active" items
	        var re = /^hide_(.+)$/;
	        var underscoreRe = /_$/;
	
	        var newItems = {};
	        //let active = {}; // this.state.active;
	        var active = {
	            "eventType_throughput_protocol_tcp_": true,
	            "eventType_throughput_protocol_udp_": true,
	            "eventType_packet-loss-rate_mainEventType_histogram-owdelay_": true,
	            "eventType_packet-loss-rate_mainTestType_throughput_": true,
	            "eventType_histogram-owdelay_": true,
	            "eventType_histogram-rtt_": true,
	            "direction_forward_": true,
	            "direction_reverse_": true,
	            "eventType_failures_": true,
	            "eventType_packet-retransmits_": true,
	            "eventType_packet-loss-rate-bidir_": true
	        };
	
	        var itemsToHide = {};
	        for (var key in hashObj) {
	            // skip anything that doesn't start with hide_
	            var res = re.exec(key);
	            if (!res) {
	                continue;
	            }
	
	            // get the name, minus "hide_"
	            var name = res[1];
	            // skip any variables that do not match our list of acceptable names
	            if (!(name in showHideAliasesShortToLong)) {
	                continue;
	            }
	
	            var longName = showHideAliasesShortToLong[name];
	            // longName will be in the form of "key1_value1_key2_value2_" ...
	            longName = longName.replace(underscoreRe, "");
	
	            // if 'hidden' is seto to 'false', then 'active' is true (and vice versa)
	            if (hashObj[key] == "false") {
	                active[longName + "_"] = true;
	            } else {
	                active[longName + "_"] = false;
	            }
	
	            var splitNames = longName.split("_");
	            var itemFilter = {};
	            for (var _i2 = 0; _i2 < splitNames.length; _i2 += 2) {
	                var activeKey = splitNames[_i2];
	                var activeValue = splitNames[_i2 + 1];
	                itemFilter[activeKey] = activeValue;
	            }
	            itemsToHide[longName + "_"] = itemFilter;
	        }
	
	        // Create the new state object
	        var newState = {
	            src: src,
	            dst: dst,
	            start: start,
	            end: end,
	            ma_url: ma_urls,
	            active: active,
	            itemsToHide: itemsToHide,
	            summaryWindow: summaryWindow,
	            tool: tool,
	            agent: agent,
	            ipversion: ipversion,
	            timeframe: timeframe,
	            hashValues: hashObj
	        };
	
	        this.updateURLHash(hashObj);
	
	        _HostInfoStore2.default.retrieveHostInfo(src, dst);
	
	        return newState;
	    }
	
	});

/***/ }),

/***/ 904:
/*!*****************************!*\
  !*** ./src/ChartHeader.jsx ***!
  \*****************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _react = __webpack_require__(/*! react */ 297);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _LSCacheStore = __webpack_require__(/*! ../js-shared/lib/DataStores/LSCacheStore */ 905);
	
	var _LSCacheStore2 = _interopRequireDefault(_LSCacheStore);
	
	var _HostInfoStore = __webpack_require__(/*! ../../js-shared/lib/DataStores/HostInfoStore */ 970);
	
	var _HostInfoStore2 = _interopRequireDefault(_HostInfoStore);
	
	var _InterfaceInfoStore = __webpack_require__(/*! ../../js-shared/lib/DataStores/InterfaceInfoStore */ 971);
	
	var _InterfaceInfoStore2 = _interopRequireDefault(_InterfaceInfoStore);
	
	var _GraphUtilities = __webpack_require__(/*! ../../js-shared/lib/Utils/GraphUtilities */ 972);
	
	var _GraphUtilities2 = _interopRequireDefault(_GraphUtilities);
	
	var _SIValue = __webpack_require__(/*! ./SIValue */ 898);
	
	var _SIValue2 = _interopRequireDefault(_SIValue);
	
	__webpack_require__(/*! ../css/graphs.css */ 973);
	
	var _underscore = __webpack_require__(/*! underscore */ 502);
	
	var _underscore2 = _interopRequireDefault(_underscore);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var EventEmitter = __webpack_require__(/*! events */ 803).EventEmitter;
	
	var emitter = new EventEmitter();
	
	var moment = __webpack_require__(/*! moment-timezone */ 805);
	
	exports.default = _react2.default.createClass({
	    displayName: "ChartHeader",
	
	    hostInfo: [],
	    sources: null,
	    dests: null,
	    getInitialState: function getInitialState() {
	        return {
	            showHostSelectors: false,
	            start: this.props.start,
	            end: this.props.end,
	            timeframe: this.props.timeframe,
	            summaryWindow: 3600,
	            interfaceInfo: {},
	            traceInfo: [],
	            hostLSInfo: [],
	            hostLSInfoObj: {},
	            pageURL: window.location.href
	        };
	    },
	    getTime: function getTime() {
	        var obj = {
	            "start": this.state.start,
	            "end": this.state.end,
	            "timeframe": this.state.timeframe
	        };
	        return obj;
	    },
	    getCurrentURL: function getCurrentURL() {
	        var url = window.location.href;
	        this.setState({ pageURL: url });
	        return url;
	    },
	    render: function render() {
	        var startDate = new Date(this.state.start * 1000);
	        var endDate = new Date(this.state.end * 1000);
	        var startMoment = moment(startDate);
	        var endMoment = moment(endDate);
	
	        var startDateString = "";
	        if (startDate !== null && typeof startDate != "undefined") {
	            startDateString = startDate.toString();
	        }
	        var endDateString = "";
	        if (endDate !== null && typeof endDate != "undefined") {
	            endDateString = endDate.toString();
	        }
	
	        var startTZ = _GraphUtilities2.default.getTimezone(startDateString);
	        if (startTZ == "") {
	            //console.log("unknown timezone; date: " , startDate.toString() );
	
	        }
	        var endTZ = _GraphUtilities2.default.getTimezone(endDateString);
	
	        var date = "ddd MM/DD/YYYY";
	        var time = "HH:mm:ss";
	
	        return _react2.default.createElement(
	            "div",
	            null,
	            _react2.default.createElement(
	                "div",
	                { className: "chartTitleBar" },
	                _react2.default.createElement(
	                    "span",
	                    null,
	                    "perfSONAR test results"
	                ),
	                _react2.default.createElement(
	                    "span",
	                    { className: "chartShareLinkContainer" },
	                    _react2.default.createElement(
	                        "a",
	                        { href: this.state.pageURL, target: "_blank" },
	                        _react2.default.createElement("i", { className: "fa fa-share-square-o", "aria-hidden": "true" }),
	                        " Share/open in new window"
	                    )
	                )
	            ),
	            _react2.default.createElement(
	                "div",
	                { className: "chartHeader" },
	                _react2.default.createElement(
	                    "div",
	                    { className: "overview overview--pad" },
	                    _react2.default.createElement(
	                        "div",
	                        { className: "row" },
	                        _react2.default.createElement(
	                            "div",
	                            { className: "medium-4 columns" },
	                            this.renderHostList("source", "Source")
	                        ),
	                        _react2.default.createElement(
	                            "div",
	                            { className: "medium-4 columns" },
	                            this.renderHostList("dest", "Destination")
	                        ),
	                        _react2.default.createElement(
	                            "div",
	                            { className: "medium-4 columns" },
	                            _react2.default.createElement(
	                                "label",
	                                { className: "hostLabel" },
	                                "Report range"
	                            ),
	                            _react2.default.createElement(
	                                "button",
	                                { id: "headerTimePrevious", className: "button-quiet button-timechange", onClick: this.handlePageChange.bind(this, "previous") },
	                                _react2.default.createElement("i", { className: "fa fa-arrow-left", "aria-hidden": "true" })
	                            ),
	                            _react2.default.createElement(
	                                "select",
	                                { className: "no-margin", name: "timeperiod", id: "timeperiod", onChange: this.changeTimePeriod, value: this.state.timeframe },
	                                _react2.default.createElement(
	                                    "option",
	                                    { value: "12h" },
	                                    "12 hours"
	                                ),
	                                _react2.default.createElement(
	                                    "option",
	                                    { value: "1d" },
	                                    "1 day"
	                                ),
	                                _react2.default.createElement(
	                                    "option",
	                                    { value: "3d" },
	                                    "3 days"
	                                ),
	                                _react2.default.createElement(
	                                    "option",
	                                    { value: "1w" },
	                                    "1 week"
	                                ),
	                                _react2.default.createElement(
	                                    "option",
	                                    { value: "1m" },
	                                    "1 month"
	                                ),
	                                _react2.default.createElement(
	                                    "option",
	                                    { value: "1y" },
	                                    "1 year"
	                                )
	                            ),
	                            _react2.default.createElement(
	                                "button",
	                                { className: "button-quiet button-timechange", onClick: this.handlePageChange.bind(this, "next") },
	                                _react2.default.createElement("i", { className: "fa fa-arrow-right", "aria-hidden": "true" })
	                            ),
	                            _react2.default.createElement(
	                                "div",
	                                null,
	                                _react2.default.createElement(
	                                    "span",
	                                    { className: "timerange_holder" },
	                                    startMoment.format(date),
	                                    _react2.default.createElement("br", null),
	                                    startMoment.format(time),
	                                    " ",
	                                    startTZ
	                                ),
	                                _react2.default.createElement(
	                                    "span",
	                                    { className: "timerange_holder" },
	                                    "to"
	                                ),
	                                _react2.default.createElement(
	                                    "span",
	                                    { className: "timerange_holder" },
	                                    endMoment.format(date),
	                                    _react2.default.createElement("br", null),
	                                    endMoment.format(time),
	                                    " ",
	                                    endTZ
	                                )
	                            )
	                        )
	                    ),
	                    " "
	                ),
	                " "
	            )
	        ); // End render()
	    },
	
	    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	        this.getCurrentURL();
	    },
	    changeTimePeriod: function changeTimePeriod(event) {
	        var period = event.target.value;
	        var vars = _GraphUtilities2.default.getTimeVars(period);
	        var timeDiff = vars.timeDiff;
	        var summaryWindow = vars.summaryWindow;
	        var half = timeDiff / 2;
	        var start = this.state.start;
	        var end = this.state.end;
	        var middle = (start + end) / 2;
	        var now = Math.floor(new Date().getTime() / 1000);
	        //let newEnd = Math.floor( new Date().getTime() / 1000 );
	        var newEnd = middle + half;
	        if (newEnd > now) {
	            newEnd = now;
	        }
	
	        // If newEnd is greater than now minus timeDiff, set newEnd to now
	        // because in this case we are "close enought" to "now" that we
	        // should go to current time
	        if (newEnd > now - timeDiff) {
	            newEnd = now;
	        }
	
	        var newStart = newEnd - timeDiff;
	
	        var options = {
	            timeframe: period,
	            start: newStart,
	            end: newEnd,
	            summaryWindow: summaryWindow
	        };
	        this.handleTimerangeChange(options);
	    },
	    getTraceURL: function getTraceURL(i) {
	        // URL from old graphs
	        //
	        var trace_data = this.state.traceInfo[i];
	        if (typeof trace_data == "undefined") {
	            return;
	        }
	        var trace_url = '/perfsonar-traceroute-viewer/index.cgi?';
	        trace_url += 'mahost=' + trace_data.ma_url;
	        trace_url += '&stime=yesterday';
	        trace_url += '&etime=now';
	        //trace_url += '&tzselect='; // Commented out (allow default to be used)
	        trace_url += '&epselect=' + trace_data.traceroute_uri;
	        return trace_url;
	    },
	    renderHostList: function renderHostList(type, label) {
	        if (this.state.showHostSelectors) {
	            return _react2.default.createElement(
	                "div",
	                null,
	                _react2.default.createElement(
	                    "label",
	                    { htmlFor: "source" },
	                    "Source:"
	                ),
	                _react2.default.createElement(
	                    "select",
	                    { className: "no-margin", name: "source", id: "source" },
	                    _react2.default.createElement(
	                        "option",
	                        null,
	                        "Source One"
	                    ),
	                    _react2.default.createElement(
	                        "option",
	                        null,
	                        "Source Two"
	                    ),
	                    _react2.default.createElement(
	                        "option",
	                        null,
	                        "Source Three"
	                    )
	                )
	            );
	        } else {
	            var hostInfo = this.hostInfo;
	            var interfaceInfo = this.state.interfaceInfo || {};
	            var hosts = [];
	            if (hostInfo.length > 0 || Object.keys(interfaceInfo).length > 0) {
	                for (var i in hostInfo) {
	                    var row = hostInfo[i];
	                    hosts.push(_react2.default.createElement(
	                        "div",
	                        { className: "hostname", key: "hostname" + label + i },
	                        row[type + "_host"]
	                    ), _react2.default.createElement(
	                        "div",
	                        { className: "address", key: "ip" + label + i },
	                        row[type + "_ip"]
	                    ), _react2.default.createElement(
	                        "div",
	                        { key: "detailedInfo" + label + i },
	                        this.showDetailedHostInfo(row[type + "_ip"].split(",")[0], i)
	                    ));
	                }
	            } else {
	                hosts.push(_react2.default.createElement("div", { className: "hostname", key: "nohostname" + label }), _react2.default.createElement("div", { className: "address", key: "noaddress" + label }));
	            }
	            if (hostInfo.length > 1) {
	                label += "s";
	            }
	            return _react2.default.createElement(
	                "div",
	                null,
	                _react2.default.createElement(
	                    "div",
	                    { className: "hostLabel", key: "hostLabel" + label },
	                    label
	                ),
	                hosts
	            );
	        }
	    },
	
	    // "host" is actually an IP
	    showDetailedHostInfo: function showDetailedHostInfo(host, i) {
	        var trace = this.state.traceInfo;
	        var display = "hiddenTrace";
	        var traceURL = this.getTraceURL(i);
	        if (i in trace && traceURL != "") {
	            if (trace[i].has_traceroute == 1) {
	                display = "blockTrace";
	            }
	        }
	        //
	        //let details = InterfaceInfoStore.getInterfaceDetails( host );
	        var details = this.state.interfaceInfo[host];
	
	        console.log("interface details", details);
	        if (typeof details == "undefined" || details === null) {
	            return [];
	        }
	        var addresses = [];
	        var interfaces = [];
	        if (_underscore2.default.isArray(details["interface-addresses"])) {
	            for (var i in details["interface-addresses"]) {
	                var address = details["interface-addresses"][i];
	                addresses.push(_react2.default.createElement(
	                    "div",
	                    null,
	                    address
	                ));
	                var intf = details["interface-name"][i];
	                interfaces.push(_react2.default.createElement(
	                    "div",
	                    null,
	                    intf
	                ));
	            }
	        }
	
	        var uuid = details["client-uuid"][0];
	        var hostDetails = void 0;
	        var hostObj = this.state.hostLSInfoObj;
	        if (uuid in hostObj) {
	            hostDetails = hostObj[uuid];
	            console.log("hostDetails", hostDetails);
	        }
	        var hostDetailsLayout = this.showHostLSDetails(hostDetails);
	        {/* GRAPH: Detailed Host Info*/}
	        return _react2.default.createElement(
	            "div",
	            null,
	            _react2.default.createElement(
	                "a",
	                { className: "js-sidebar-popover-toggle", href: "#" },
	                "Host info ",
	                _react2.default.createElement("i", { className: "fa fa-angle-down" })
	            ),
	            _react2.default.createElement(
	                "div",
	                { className: "sidebar-popover sidebar-popover--overview" },
	                _react2.default.createElement(
	                    "a",
	                    { className: "sidebar-popover__close js-sidebar-popover-close" },
	                    "Close \xA0",
	                    _react2.default.createElement("i", { className: "fa fa-close" })
	                ),
	                _react2.default.createElement(
	                    "h4",
	                    { className: "sidebar-popover__heading" },
	                    "Interface details"
	                ),
	                _react2.default.createElement(
	                    "ul",
	                    { className: "sidebar-popover__list" },
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "Interface:"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            _GraphUtilities2.default.formatUnknown(interfaces)
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "Addresses:"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            _GraphUtilities2.default.formatUnknown(addresses)
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "Capacity:"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            _react2.default.createElement(_SIValue2.default, { value: details["interface-capacity"] })
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "MTU:"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            _GraphUtilities2.default.formatUnknown(details["interface-mtu"])
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item " + display },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            _react2.default.createElement(
	                                "a",
	                                { href: traceURL, target: "_blank" },
	                                "View traceroute graph"
	                            )
	                        )
	                    )
	                ),
	                hostDetailsLayout
	            )
	        );
	    },
	    showHostLSDetails: function showHostLSDetails(hostDetails) {
	        var hasHostDetails = true;
	        if (typeof hostDetails == "undefined") {
	            hasHostDetails = false;
	        }
	
	        if (!hasHostDetails) {
	            return _react2.default.createElement(
	                "div",
	                null,
	                _react2.default.createElement(
	                    "h4",
	                    { className: "sidebar-popover__heading" },
	                    "Host details"
	                ),
	                _react2.default.createElement(
	                    "div",
	                    null,
	                    "No host details were found in the lookup service for this host."
	                )
	            );
	        } else {
	
	            return _react2.default.createElement(
	                "div",
	                null,
	                _react2.default.createElement(
	                    "h4",
	                    { className: "sidebar-popover__heading" },
	                    "Host details"
	                ),
	                _react2.default.createElement(
	                    "ul",
	                    { className: "sidebar-popover__list" },
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "OS:"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            hostDetails["host-os-name"] + " " + hostDetails["host-os-version"]
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "VM:"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            _GraphUtilities2.default.formatBool(hostDetails["host-vm"])
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "pS Bundle and Version:"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            hostDetails["pshost-bundle"] + " " + hostDetails["pshost-bundle-version"]
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "CPU Speed (cores)"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            _GraphUtilities2.default.formatSItoSI(hostDetails["host-hardware-processorspeed"][0], "G") + " (" + hostDetails["host-hardware-processorcore"][0] + ")"
	                        )
	                    ),
	                    _react2.default.createElement(
	                        "li",
	                        { className: "sidebar-popover__item" },
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__param" },
	                            "RAM"
	                        ),
	                        _react2.default.createElement(
	                            "span",
	                            { className: "sidebar-popover__value" },
	                            _GraphUtilities2.default.formatSItoSI(hostDetails["host-hardware-memory"][0], "G")
	                        )
	                    )
	                )
	            );
	        }
	    },
	    componentDidMount: function componentDidMount() {
	        this.setInitialTime();
	        _HostInfoStore2.default.subscribe(this.updateChartHeader);
	        _HostInfoStore2.default.subscribeTrace(this.updateTrace);
	        _HostInfoStore2.default.retrieveTracerouteData(this.props.sources, this.props.dests, this.props.ma_url);
	        _InterfaceInfoStore2.default.subscribe(this.handleInterfaceData);
	
	        console.log("sources/dests props", this.props.sources, this.props.dests);
	        this.sources = this.props.sources;
	        this.dests = this.props.dests;
	    },
	    handleInterfaceData: function handleInterfaceData() {
	        var interfaceInfo = _InterfaceInfoStore2.default.getInterfaceInfo();
	        console.log("handle interface data interfaceInfo", interfaceInfo);
	
	        var uuidObj = {};
	        for (var i in interfaceInfo) {
	            var row = interfaceInfo[i];
	            uuidObj[row["client-uuid"]] = true;
	        }
	        var uuids = Object.keys(uuidObj);
	
	        console.log("uuids!", uuids);
	
	        var callback = function () {
	            this.handleHostLSData(uuids);
	        }.bind(this);
	        //let message = "hostInfoLS";
	
	        _HostInfoStore2.default.subscribeLSInfo(callback);
	        _HostInfoStore2.default.retrieveHostLSInfo(uuids);
	
	        this.setState({ interfaceInfo: interfaceInfo });
	
	        this.updateChartHeader();
	    },
	    handleHostLSData: function handleHostLSData() {
	        var hostLSInfo = _HostInfoStore2.default.getHostLSInfo();
	        var obj = {};
	        for (var i in hostLSInfo.hits.hits) {
	            var row = hostLSInfo.hits.hits[i]._source;
	            var uuid = row["client-uuid"];
	            obj[uuid] = row;
	        }
	        console.log("hostLSInfo", hostLSInfo);
	        console.log("hostLSInfoObj", obj);
	        this.setState({ hostLSInfo: hostLSInfo, hostLSInfoObj: obj });
	    },
	    componentWillUnmount: function componentWillUnmount() {
	        //this.serverRequest.abort();
	        _HostInfoStore2.default.unsubscribe(this.updateChartHeader);
	        _HostInfoStore2.default.unsubscribeTrace(this.updateTrace);
	        _InterfaceInfoStore2.default.unsubscribe(this.updateChartHeader);
	    },
	    updateTrace: function updateTrace() {
	        var traceInfo = _HostInfoStore2.default.getTraceInfo();
	        this.setState({ traceInfo: traceInfo });
	    },
	    updateChartHeader: function updateChartHeader() {
	        var hostInfo = _HostInfoStore2.default.getHostInfoData();
	        var interfaceInfo = _InterfaceInfoStore2.default.getInterfaceInfo();
	        this.hostInfo = hostInfo;
	        //this.interfaceInfo = interfaceInfo;
	        //this.setState({ interfaceInfo: interfaceInfo });
	        var source_ips = [];
	        var dest_ips = [];
	        for (var i in hostInfo) {
	            source_ips.push(hostInfo[i].source_ip.split(",")[0]);
	            dest_ips.push(hostInfo[i].dest_ip.split(",")[0]);
	        }
	        console.log("this.sources/this.dests", this.sources, this.dests);
	        console.log("sources/dest IPs", source_ips, dest_ips);
	        var callback = function callback() {
	            _InterfaceInfoStore2.default.retrieveInterfaceInfo(source_ips, dest_ips);
	        };
	        _LSCacheStore2.default.subscribeLSCaches(callback);
	
	        this.forceUpdate();
	    },
	    handlePageChange: function handlePageChange(direction) {
	        var timeVars = _GraphUtilities2.default.getTimeVars(this.state.timeframe);
	        var diff = timeVars.timeDiff;
	        var newStart = void 0;
	        var newEnd = void 0;
	        var now = Math.floor(new Date().getTime() / 1000);
	        if (direction == "next") {
	            newEnd = this.state.end + diff;
	            newStart = newEnd - diff;
	        } else if (direction == "previous") {
	            newEnd = this.state.end - diff;
	            newStart = newEnd - diff;
	        }
	        if (newStart >= now || newEnd >= now) {
	            newEnd = now;
	            newStart = now - diff;
	        }
	        var timeframe = this.state.timeframe;
	        this.handleTimerangeChange({ "start": newStart, "end": newEnd, timeframe: timeframe });
	    },
	    handleTimerangeChange: function handleTimerangeChange(options, noupdateURL) {
	        if (!"timeframe" in options) {
	            options.timeframe = this.state.timeframe;
	        }
	        this.setState(options);
	        this.props.updateTimerange(options, noupdateURL);
	        emitter.emit("timerangeChange");
	        this.forceUpdate();
	    },
	    subscribe: function subscribe(callback) {
	        emitter.on("timerangeChange", callback);
	    },
	    unsubscribe: function unsubscribe(callback) {
	        emitter.off("timerangeChange", callback);
	    },
	
	    setInitialTime: function setInitialTime() {
	        var options = {};
	
	        var timeframe = this.state.timeframe || "1w";
	        var timeVars = _GraphUtilities2.default.getTimeVars(timeframe);
	        var diff = timeVars.timeDiff;
	        var summaryWindow = timeVars.summaryWindow;
	
	        var now = Math.floor(new Date().getTime() / 1000);
	        var newEnd = now;
	        var newStart = newEnd - diff;
	
	        if (typeof this.props.start != "undefined") {
	            newStart = this.props.start;
	        }
	        if (typeof this.props.end != "undefined") {
	            newEnd = this.props.end;
	        }
	
	        options.start = newStart;
	        options.end = newEnd;
	        options.timeframe = timeframe;
	        options.summaryWindow = summaryWindow;
	
	        this.handleTimerangeChange(options, true);
	    }
	
	});

/***/ }),

/***/ 953:
/*!**********************!*\
  !*** util (ignored) ***!
  \**********************/
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),

/***/ 970:
/*!****************************************************!*\
  !*** ../js-shared/lib/DataStores/HostInfoStore.js ***!
  \****************************************************/
/***/ (function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(/*! events */ 803).EventEmitter;
	
	var emitter = new EventEmitter();
	
	import _ from "underscore";
	
	import LSCacheStore from "./LSCacheStore.js";
	
	module.exports = {
	
	    /* Expects an object of hosts like this (keys must be src, dst (can be multiple -- number of sources and dests must match) ): 
	     * {
	     *   src: "1.2.3.4,"
	     *   dst: "2.3.4.5",
	     * }
	     * returns host info as
	     * { 
	     *   src_ip: "1.2.3.4", 
	     *   src_host: "hostname.domain"
	     *   ...
	     *  }
	     */
	    hostInfo: [],
	    hostLSInfo: [],
	    tracerouteReqs: 0,
	    tracerouteReqsCompleted: 0,
	    tracerouteInfo: [],
	    serverURLBase: "",
	
	    retrieveTracerouteData: function (sources, dests, ma_url) {
	        let baseUrl = "cgi-bin/graphData.cgi?action=has_traceroute_data";
	        baseUrl += "&url=" + ma_url;
	        if (!_.isArray(sources)) {
	            sources = [sources];
	        }
	        if (!_.isArray(dests)) {
	            dests = [dests];
	        }
	        for (let i in sources) {
	            let src = sources[i];
	            let dst = dests[i];
	
	            let url = baseUrl + "&source=" + src;
	            url += "&dest=" + dst;
	
	            this.tracerouteReqs = sources.length;
	
	            this.serverRequest = $.get(url, function (data) {
	                this.handleTracerouteResponse(data, i);
	            }.bind(this));
	        }
	    },
	    _getURL(relative_url) {
	        return this.serverURLBase + relative_url;
	    },
	    retrieveHostLSInfo: function (hostUUIDs) {
	        if (!Array.isArray(hostUUIDs)) {
	            hostUUIDs = [hostUUIDs];
	        }
	
	        let query = {
	            "query": {
	                "constant_score": {
	                    "filter": {
	                        "bool": {
	                            "must": [{ "match": { "type": "host" } }, { "terms": { "client-uuid": hostUUIDs } }]
	                        }
	                    }
	                }
	            },
	
	            "sort": [{ "expires": { "order": "desc" } }]
	
	        };
	        console.log("hostinfo query", query);
	
	        let message = "hostInfoLS";
	        LSCacheStore.subscribeTag(this.handleHostLSInfoResponse.bind(this), message);
	        LSCacheStore.queryLSCache(query, message);
	    },
	    retrieveHostInfo: function (source_input, dest_input, callback) {
	        let url = this._getURL("cgi-bin/graphData.cgi?action=hosts");
	
	        let sources;
	        let dests;
	        if (Array.isArray(source_input)) {
	            sources = source_input;
	        } else {
	            sources = [source_input];
	        }
	        if (Array.isArray(dest_input)) {
	            dests = dest_input;
	        } else {
	            dests = [dest_input];
	        }
	        for (let i = 0; i < sources.length; i++) {
	            url += "&src=" + sources[i];
	            url += "&dest=" + dests[i];
	        }
	        this.serverRequest = $.get(url, function (data) {
	            console.log("hostInfo data", data);
	            this.handleHostInfoResponse(data);
	        }.bind(this));
	
	        if (typeof this.serverRequest != "undefined ") {
	
	            this.serverRequest.fail(function (jqXHR) {
	                var responseText = jqXHR.responseText;
	                var statusText = jqXHR.statusText;
	                var errorThrown = jqXHR.status;
	
	                var errorObj = {
	                    errorStatus: "error",
	                    responseText: responseText,
	                    statusText: statusText,
	                    errorThrown: errorThrown
	                };
	
	                if (_.isFunction(callback)) {
	                    callback(errorObj);
	                }
	
	                emitter.emit("error");
	            }.bind(this));
	        }
	        //console.log( this.serverRequest.error() );
	    },
	    getHostInfoData: function () {
	        return this.hostInfo;
	    },
	    getHostLSInfo: function () {
	        return this.hostLSInfo;
	    },
	    handleHostInfoResponse: function (data) {
	        this.hostInfo = data;
	        emitter.emit("get");
	    },
	    handleHostLSInfoResponse: function () {
	        let data = LSCacheStore.getResponseData();
	        let message = "hostInfoLS";
	        console.log("message, host ls info response", message, data);
	        this.hostLSInfo = data;
	        emitter.emit(message);
	    },
	    handleTracerouteResponse: function (data, i) {
	        this.tracerouteReqsCompleted++;
	        this.tracerouteInfo.push(data);
	        if (this.tracerouteReqsCompleted == this.tracerouteReqs) {
	            this.mergeTracerouteData();
	        }
	    },
	    mergeTracerouteData: function () {
	        emitter.emit("getTrace");
	    },
	    getTraceInfo: function () {
	        return this.tracerouteInfo;
	    },
	    subscribeTrace: function (callback) {
	        emitter.on("getTrace", callback);
	    },
	    unsubscribeTrace: function (callback) {
	        emitter.off("getTrace", callback);
	    },
	    subscribe: function (callback) {
	        emitter.on("get", callback);
	    },
	    subscribeLSInfo: function (callback) {
	        emitter.on("hostInfoLS", callback);
	    },
	    unsubscribeLSInfo: function (callback) {
	        emitter.off("hostInfoLS", callback);
	    },
	    unsubscribe: function (callback) {
	        emitter.removeListener("get", callback);
	    },
	    subscribeError: function (callback) {
	        emitter.on("error", callback);
	    },
	    unsubscribeError: function (callback) {
	        emitter.removeListener("error", callback);
	    }
	
	};

/***/ }),

/***/ 971:
/*!*********************************************************!*\
  !*** ../js-shared/lib/DataStores/InterfaceInfoStore.js ***!
  \*********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	import LSCacheStore from "./LSCacheStore.js";
	import HostInfoStore from "./HostInfoStore";
	import GraphUtilities from "./GraphUtilities";
	
	let EventEmitter = __webpack_require__(/*! events */ 803).EventEmitter;
	let emitter = new EventEmitter();
	
	module.exports = {
	
	    /* Expects an object of hosts like this (keys must be src, dst (can be multiple -- number of sources and dests must match) ): 
	     * {
	     *   src: "1.2.3.4,"
	     *   dst: "2.3.4.5",
	     * }
	     * Createes a cache keyed on ip addressas
	     * { 
	     *   {"ip"}: { addresses, mtu, capacity}
	     *   ...
	     *  }
	     */
	    interfaceInfo: [],
	    interfaceObj: {},
	    lsInterfaceResults: [],
	    sources: [],
	    dests: [],
	    lsRequestCount: 0,
	
	    _init: function () {
	        //LSCacheStore.subscribe( LSCacheStore.LSCachesRetrievedTag, this.handleLSCachesRetrieved );
	
	    },
	
	    handleLSCachesRetrieved: function () {},
	
	    handleInterfaceInfoError: function (data) {},
	
	    // This function actually queries the LS cache (using LSCacheStore)
	    retrieveInterfaceInfo: function (sources, dests) {
	
	        if (typeof sources == "undefined" || typeof dests == "undefined") {
	            console.log("sources and/or dests undefined; aborting");
	            return;
	        }
	        if (!Array.isArray(sources)) {
	            sources = [sources];
	        }
	        if (!Array.isArray(dests)) {
	            dests = [dests];
	        }
	        this.sources = sources;
	        this.dests = dests;
	
	        console.log("retrieveInterfaceInfo sources", sources);
	        console.log("dests", dests);
	
	        let hosts = sources.concat(dests);
	        hosts = GraphUtilities.unique(hosts);
	
	        let query = {
	            "query": {
	                "bool": {
	                    "must": [{ "match": { "type": "interface" } }, { "terms": { "interface-addresses": hosts } }]
	                }
	            },
	
	            "sort": [{ "expires": { "order": "desc" } }]
	
	        };
	        let tag = "interfaceInfo";
	        LSCacheStore.queryLSCache(query, tag);
	        LSCacheStore.subscribeTag(this.handleInterfaceInfoResponse.bind(this), tag);
	    },
	
	    getInterfaceInfo: function () {
	        return this.interfaceObj;
	    },
	
	    handleInterfaceInfoResponse: function () {
	        let data = LSCacheStore.getResponseData();
	        console.log("data", data);
	        data = this._parseInterfaceResults(data);
	        console.log("processed data", data);
	
	        let interfaceObj = this.interfaceObj;
	        console.log("combined data", interfaceObj);
	
	        this.interfaceInfo = interfaceObj;
	
	        emitter.emit("get");
	    },
	
	    _parseInterfaceResults: function (data) {
	        let out = [];
	        let obj = {};
	        for (let i in data.hits.hits) {
	            let row = data.hits.hits[i]._source;
	            let addresses = row["interface-addresses"];
	            let uuid = row["client-uuid"];
	            for (let j in addresses) {
	                let address = addresses[j];
	                if (!(address in obj)) {
	                    out.push(row);
	                    this.lsInterfaceResults.push(row);
	                    obj[address] = row;
	                    continue;
	                }
	            }
	        }
	        this.interfaceObj = obj;
	        console.log("keyed on address", out);
	        return out;
	    },
	
	    subscribe: function (callback) {
	        emitter.on("get", callback);
	    },
	    unsubscribe: function (callback) {
	        emitter.off("get", callback);
	    },
	
	    array2param: function (name, array) {
	        var joiner = "&" + name + "=";
	        return joiner + array.join(joiner);
	    },
	
	    // Retrieves interface details for a specific ip and returns them
	    // Currently keys on ip; could extend to search all addresses later if needed
	    getInterfaceDetails: function (host) {
	        let details = this.interfaceObj || {};
	        console.log("getInterfaceDetails details", details);
	        if (host in details) {
	            console.log("found details for ", host, details[host]);
	            return details[host];
	        } else {
	            console.log("host details not found; searching");
	            for (let i in details) {
	                let row = details[i];
	
	                for (let j in row.addresses) {
	                    let address = row.addresses[j];
	                    if (address == host) {
	                        return details[i];
	                    } else {
	                        let addrs = host.split(",");
	                        if (addrs.length > 1) {
	                            // handle case where addresses have comma(s)
	                            for (var k in addrs) {
	                                if (addrs[k] == address) {
	                                    return details[i];
	                                }
	                            }
	                        }
	                    }
	                }
	            }
	        }
	        // host not found in the cache, return empty object
	        return {};
	    }
	};

/***/ }),

/***/ 972:
/*!************************************************!*\
  !*** ../js-shared/lib/Utils/GraphUtilities.js ***!
  \************************************************/
/***/ (function(module, exports) {

	import moment from "moment-timezone";
	
	import { TimeSeries, TimeRange, Event } from "pondjs";
	
	module.exports = {
	    getTimezone: function (date) {
	        let tz;
	        let tzRe = /\(([^)]+)\)/;
	        let out;
	        let offset;
	
	        if (typeof date == "undefined" || date == null) {
	            return;
	        } else if (date == "Invalid Date") {
	            tz = "";
	            out = "";
	        } else {
	            tz = tzRe.exec(date);
	            if (typeof tz == "undefined" || tz === null) {
	                // timezone is unknown
	                return "";
	            } else {
	                tz = tz[1];
	                let dateObj = new Date(date);
	                let dateMoment = moment(dateObj);
	                offset = dateMoment.utcOffset() / 60;
	                if (typeof offset != "undefined" && offset >= 0) {
	                    offset = "+" + offset;
	                }
	            }
	        }
	
	        out = " (GMT" + offset + ")";
	        return out;
	    },
	
	    getTimeVars: function (period) {
	        let timeDiff;
	        let summaryWindow;
	        if (period == '4h') {
	            timeDiff = 60 * 60 * 4;
	            summaryWindow = 0;
	        } else if (period == '12h') {
	            timeDiff = 60 * 60 * 12;
	            summaryWindow = 0;
	        } else if (period == '1d') {
	            timeDiff = 86400;
	            summaryWindow = 300;
	        } else if (period == '3d') {
	            timeDiff = 86400 * 3;
	            summaryWindow = 300;
	        } else if (period == '1w') {
	            timeDiff = 86400 * 7;
	            summaryWindow = 3600;
	        } else if (period == '1m') {
	            timeDiff = 86400 * 31;
	            summaryWindow = 3600;
	        } else if (period == '1y') {
	            timeDiff = 86400 * 365;
	            summaryWindow = 86400;
	        }
	        let timeRange = {
	            timeDiff: timeDiff,
	            summaryWindow: summaryWindow,
	            timeframe: period
	        };
	        return timeRange;
	    },
	
	    // Returns the UNIQUE values of an array
	    unique: function (arr) {
	        var i,
	            len = arr.length,
	            out = [],
	            obj = {};
	
	        for (i = 0; i < len; i++) {
	            obj[arr[i]] = 0;
	        }
	        out = Object.keys(obj);
	        return out;
	    },
	
	    formatBool: function (input, unknownText) {
	        let out;
	        if (input === true || input === 1 || input == "1") {
	            out = "Yes";
	        } else if (input === false || input === 0 || input == "0") {
	            out = "No";
	        }
	        out = this.formatUnknown(out, unknownText);
	        return out;
	    },
	
	    formatSItoSI: function (value, Y) {
	        console.log("value", value);
	        let out = value;
	        let re = /^(\d+\.?\d*)\s?([KMGT])(\w*)/;
	        let results = value.match(re);
	        if (results !== null) {
	            let values = {};
	            values.K = 1024;
	            values.M = 1024 * 1024;
	            values.G = 1024 * 1024 * 1024;
	            console.log("values", values);
	            console.log("value, re, results", value, re, results);
	
	            out = results[1];
	
	            if (results[2].toUpperCase() in values) {
	                let X = results[2];
	                out = out * values[results[2]];
	                // convert to Y
	                out = out / values[Y];
	                out = Math.round(out * 10) / 10;
	                out += " " + Y + results[3];
	            };
	        }
	        console.log("outvalue", out);
	
	        return out;
	    },
	
	    formatUnknown: function (str, unknownText) {
	        if (typeof unknownText == "undefined" || unknownText === null) {
	            unknownText = "unknown";
	        }
	        if (typeof str == "undefined" || str === null || str == "") {
	            return unknownText;
	        } else {
	            return str;
	        }
	    }
	
	};

/***/ }),

/***/ 973:
/*!************************!*\
  !*** ./css/graphs.css ***!
  \************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../~/css-loader!./graphs.css */ 974);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../~/style-loader/addStyles.js */ 902)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../node_modules/css-loader/index.js!./graphs.css", function() {
				var newContent = require("!!../node_modules/css-loader/index.js!./graphs.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),

/***/ 974:
/*!***************************************!*\
  !*** ./~/css-loader!./css/graphs.css ***!
  \***************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ./~/css-loader/cssToString.js */ 901)();
	exports.push([module.id, "/*----------------------------------------------------------\n\n    Graphs\n\n----------------------------------------------------------*/\n\n.graph-filter {\n    padding: 0.25em 0;\n}\n\n.graph-label {\n    display: block;\n    float: left;\n    padding-top: .7em;\n    margin-right: .5em;\n}\n\n.graph-filter__list {\n    display: block;\n    list-style: none;\n    padding: 0;\n    margin: 0;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n    display: inline-block;\n}\n\n.blockTrace {\n    display:block; \n}\n\n.hiddenTrace {\n    display:none;\n}\n\n/*\n * Clear fix\n*/\n.graph:after,\n.graph-filters:after,\n.graph-filter:after,\n.graph-filter__list:after {\n    content: \"\";\n    clear: both;\n    display: block;\n}\n\n.graph-filter__item {\n    float: left;\n    border-right: 1px solid #ccc;\n    margin: 0;\n}\n\n/*\n * Filter active states\n*/\n\n.graph-filter__item.graph-filter__item a {\n    color: #fff;\n    background-color: #ccc;\n}\n\n.graph-filter__item.graph-filter__item--blue-active a {\n    background-color: #0076b4;\n}\n\n.graph-filter__item.graph-filter__item--forward.active a, .graph-filter__item.graph-filter__item--reverse.active a, .graph-filter__item.graph-filter__item--failures.active a, .graph-filter__item.graph-filter__item.packet-retransmits.active a\n{\n    background-color: #0076b4;\n}\n\n\n.graph-filter__item.graph-filter__item.throughput-tcp.active a {\n    background-color: #0076b4;\n}\n\n.graph-filter__item.graph-filter__item.udp.active a {\n    background-color: #d6641e;\n    /*background-color: #cc7dbe;*/ /*pink */\n}\n\n.graph-filter__item.graph-filter__item.ipv4.active a {\n    background-color: #e5a11c;\n}\n\n.graph-filter__item.graph-filter__item.ipv6.active a {\n    background-color: #633;\n}\n\n.graph-filter__item.graph-filter__item.loss-throughput.active a {\n    background-color: #cc7dbe;\n}\n\n.graph-filter__item.graph-filter__item.loss-latency.active a {\n    background-color: #2b9f78;\n}\n\n.graph-filter__item.graph-filter__item.loss-ping.active.active a {\n    /*background-color: #f0e442; */  /* light yellow */\n    /* background-color: #d55e00; */ /* vermillion */\n    background-color: #e5801c; /* slightly browner orange */\n}\n\n.graph-filter__item svg.direction-label {\n    margin-left: 1em;\n    vertical-align: middle;\n}\n\n.graph-filter__item:last-child {\n    border-right: none;\n}\n\n.graph-filter__item a {\n    color: #383f44;\n    display: inline-block;\n    padding: .75em 1em;\n}\n\n.graph-filter__item a:hover {\n    background-color: #ccc;\n    color: #383f44;\n}\n\n.graph-settings {\n    border: 1px solid #383f44;\n    border-radius: 4px;\n    color: #383f44;\n    display: inline-block;\n    margin-left: 1em;\n    /*\n     * This is a magic number to make this thing look right.\n    */\n    padding: .71em;\n}\n\n.graph-settings i {\n    font-size: 1.5em;\n}\n\n.graph-wrapper {\n\n}\n\n.graph-header {\n    border-bottom: 1px solid #ccc;\n    margin-top: 1em;\n    padding-bottom: .5em;\n}\n\n.graph-module,\n.graph-holder {\n    min-height: 400px;\n}\n\n.graph-module {\n    display: flex;\n    flex-direction: column;\n    justify-content: space-around;\n}\n\n.graph-module--small,\n.graph-holder--small {\n    min-height: 150px;\n}\n\n.graph-holder {\n    background-color: #ddd;\n}\n\n.graph-module__cell {\n    /*\n     * This is sort of brittle because it relies on a\n     * specific amount of padding to veritcally center\n     * the label\n    */\n    padding-top: 4em;\n    text-align: center;\n    border-bottom: 1px solid #ccc;\n    flex-grow: 1;\n    align-content: center;\n}\n\n.graph-module__cell--small {\n    padding-top: 1em;\n}\n\n.graph-module__cell--left {\n    padding-top: 1em;\n    padding-left: 1em;\n    text-align: left;\n}\n\n.graph-module__stat {\n    display: block;\n    line-height: 1.8;\n}\n\n.graph-module__stat i {\n    margin-right: 1em;\n}\n\n.graph-module__controls {\n    color: #383f44;\n}\n\n.graph-small {\n    margin-top: 1em;\n}\n\n.graph .hostLabel {\n    font-weight:700;\n}\n\n.sidebar-popover__close span {\n    float:left;\n}\n\n/* Graph-Values popover */\n\n.sidebar-popover span:after {\n    display:inline;\n}\n\n.sidebar-popover.graph-values-popover {\n  position: absolute;\n  top: -33px;\n  right: 0;\n  font-size: 80%;\n  padding: 1em 1em 0 1em;\n  display:block;\n  opacity:0.9;\n}\n\n.graph-values-popover .graph-type {\n  margin: 0;\n  padding: 0;\n  font-weight: 700;\n}\n\n.graph-values-popover__heading {\n  border-bottom: 1px solid rgba(255, 255, 255, .5);\n  font-size: 1.1em;\n  color: #fff;\n  padding: .5em 0;\n}\n\n.graph-values-popover__close {\n    float:right;\n    font-size:120%;\n}\n\n.graph-values-popover__list {\n  list-style: none;\n  padding: 0;\n  margin: 2px 0 0 0;\n}\n\n.graph-values-popover__item {\n  padding: 1em 0;\n  border-top: 1px dashed rgba(255, 255, 255, .5);\n}\n\n.graph-values-popover__item:first-child {\n  border-top: none;\n  padding-top: .8em;\n}\n\n.graph-values-popover__item ul {\n  list-style: none;\n  margin: 0;\n}\n\n.graph-values-popover__item li:first-child {\n  font-size: 1.1em;\n  font-weight: 700;\n}\n\ndiv.graphholder div.small-2.columns {\n    float:left;\n    display:block;\n    width:23%; /* NOTE this width may be overridden in the React code */\n}\n\ndiv.sidebar-popover h6 {\n    margin-top:0;\n    margin-bottom:0.1rem;\n    font-size:0.9rem;\n}\n\ndiv.sidebar-popover h6 a {\n    color: #fff;\n}\n\ndiv.graph-values-popover li i.fa {\n    margin-right: 0.5rem;\n}\n\ndiv.graphholder #loading {\n    margin-top:4em;\n}\n\ndiv.chartTitleBar {\n    margin-top:5px;\n    margin-bottom:-5px;\n    padding-left: 0.9375rem;\n    padding-right: 0.9375rem;\n}\nspan.chartShareLinkContainer {\n    float:right;\n}\n", ""]);

/***/ }),

/***/ 975:
/*!*************************************!*\
  !*** ./src/shared/HostInfoStore.js ***!
  \*************************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var _underscore = __webpack_require__(/*! underscore */ 502);
	
	var _underscore2 = _interopRequireDefault(_underscore);
	
	var _LSCacheStore = __webpack_require__(/*! ./LSCacheStore.js */ 976);
	
	var _LSCacheStore2 = _interopRequireDefault(_LSCacheStore);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var EventEmitter = __webpack_require__(/*! events */ 803).EventEmitter;
	
	var emitter = new EventEmitter();
	
	module.exports = {
	
	    /* Expects an object of hosts like this (keys must be src, dst (can be multiple -- number of sources and dests must match) ): 
	     * {
	     *   src: "1.2.3.4,"
	     *   dst: "2.3.4.5",
	     * }
	     * returns host info as
	     * { 
	     *   src_ip: "1.2.3.4", 
	     *   src_host: "hostname.domain"
	     *   ...
	     *  }
	     */
	    hostInfo: [],
	    hostLSInfo: [],
	    tracerouteReqs: 0,
	    tracerouteReqsCompleted: 0,
	    tracerouteInfo: [],
	    serverURLBase: "",
	
	    retrieveTracerouteData: function retrieveTracerouteData(sources, dests, ma_url) {
	        var _this = this;
	
	        var baseUrl = "cgi-bin/graphData.cgi?action=has_traceroute_data";
	        baseUrl += "&url=" + ma_url;
	        if (!_underscore2.default.isArray(sources)) {
	            sources = [sources];
	        }
	        if (!_underscore2.default.isArray(dests)) {
	            dests = [dests];
	        }
	
	        var _loop = function _loop(i) {
	            var src = sources[i];
	            var dst = dests[i];
	
	            var url = baseUrl + "&source=" + src;
	            url += "&dest=" + dst;
	
	            _this.tracerouteReqs = sources.length;
	
	            _this.serverRequest = $.get(url, function (data) {
	                this.handleTracerouteResponse(data, i);
	            }.bind(_this));
	        };
	
	        for (var i in sources) {
	            _loop(i);
	        }
	    },
	    _getURL: function _getURL(relative_url) {
	        return this.serverURLBase + relative_url;
	    },
	
	    retrieveHostLSInfo: function retrieveHostLSInfo(hostUUIDs) {
	        if (!Array.isArray(hostUUIDs)) {
	            hostUUIDs = [hostUUIDs];
	        }
	
	        var query = {
	            "query": {
	                "constant_score": {
	                    "filter": {
	                        "bool": {
	                            "must": [{ "match": { "type": "host" } }, { "terms": { "client-uuid": hostUUIDs } }]
	                        }
	                    }
	                }
	            },
	
	            "sort": [{ "expires": { "order": "desc" } }]
	
	        };
	        console.log("hostinfo query", query);
	
	        var message = "hostInfoLS";
	        _LSCacheStore2.default.subscribeTag(this.handleHostLSInfoResponse.bind(this), message);
	        _LSCacheStore2.default.queryLSCache(query, message);
	    },
	    retrieveHostInfo: function retrieveHostInfo(source_input, dest_input, callback) {
	        var url = this._getURL("cgi-bin/graphData.cgi?action=hosts");
	
	        var sources = void 0;
	        var dests = void 0;
	        if (Array.isArray(source_input)) {
	            sources = source_input;
	        } else {
	            sources = [source_input];
	        }
	        if (Array.isArray(dest_input)) {
	            dests = dest_input;
	        } else {
	            dests = [dest_input];
	        }
	        for (var i = 0; i < sources.length; i++) {
	            url += "&src=" + sources[i];
	            url += "&dest=" + dests[i];
	        }
	        this.serverRequest = $.get(url, function (data) {
	            console.log("hostInfo data", data);
	            this.handleHostInfoResponse(data);
	        }.bind(this));
	
	        if (typeof this.serverRequest != "undefined ") {
	
	            this.serverRequest.fail(function (jqXHR) {
	                var responseText = jqXHR.responseText;
	                var statusText = jqXHR.statusText;
	                var errorThrown = jqXHR.status;
	
	                var errorObj = {
	                    errorStatus: "error",
	                    responseText: responseText,
	                    statusText: statusText,
	                    errorThrown: errorThrown
	                };
	
	                if (_underscore2.default.isFunction(callback)) {
	                    callback(errorObj);
	                }
	
	                emitter.emit("error");
	            }.bind(this));
	        }
	        //console.log( this.serverRequest.error() );
	    },
	    getHostInfoData: function getHostInfoData() {
	        return this.hostInfo;
	    },
	    getHostLSInfo: function getHostLSInfo() {
	        return this.hostLSInfo;
	    },
	    handleHostInfoResponse: function handleHostInfoResponse(data) {
	        this.hostInfo = data;
	        emitter.emit("get");
	    },
	    handleHostLSInfoResponse: function handleHostLSInfoResponse() {
	        var data = _LSCacheStore2.default.getResponseData();
	        var message = "hostInfoLS";
	        console.log("message, host ls info response", message, data);
	        this.hostLSInfo = data;
	        emitter.emit(message);
	    },
	    handleTracerouteResponse: function handleTracerouteResponse(data, i) {
	        this.tracerouteReqsCompleted++;
	        this.tracerouteInfo.push(data);
	        if (this.tracerouteReqsCompleted == this.tracerouteReqs) {
	            this.mergeTracerouteData();
	        }
	    },
	    mergeTracerouteData: function mergeTracerouteData() {
	        emitter.emit("getTrace");
	    },
	    getTraceInfo: function getTraceInfo() {
	        return this.tracerouteInfo;
	    },
	    subscribeTrace: function subscribeTrace(callback) {
	        emitter.on("getTrace", callback);
	    },
	    unsubscribeTrace: function unsubscribeTrace(callback) {
	        emitter.off("getTrace", callback);
	    },
	    subscribe: function subscribe(callback) {
	        emitter.on("get", callback);
	    },
	    subscribeLSInfo: function subscribeLSInfo(callback) {
	        emitter.on("hostInfoLS", callback);
	    },
	    unsubscribeLSInfo: function unsubscribeLSInfo(callback) {
	        emitter.off("hostInfoLS", callback);
	    },
	    unsubscribe: function unsubscribe(callback) {
	        emitter.removeListener("get", callback);
	    },
	    subscribeError: function subscribeError(callback) {
	        emitter.on("error", callback);
	    },
	    unsubscribeError: function unsubscribeError(callback) {
	        emitter.removeListener("error", callback);
	    }
	
	};

/***/ }),

/***/ 976:
/*!************************************!*\
  !*** ./src/shared/LSCacheStore.js ***!
  \************************************/
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var _GraphUtilities = __webpack_require__(/*! ./GraphUtilities */ 804);
	
	var _GraphUtilities2 = _interopRequireDefault(_GraphUtilities);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var EventEmitter = __webpack_require__(/*! events */ 803).EventEmitter;
	var emitter = new EventEmitter();
	var querystring = __webpack_require__(/*! querystring */ 907);
	
	var axios = __webpack_require__(/*! ./axios-instance-config.js */ 977);
	
	var lsCacheHostsURL = "cgi-bin/graphData.cgi?action=ls_cache_hosts";
	var lsQueryURL = "cgi-bin/graphData.cgi?action=interfaces";
	var proxyURL = "/perfsonar-graphs/cgi-bin/graphData.cgi?action=ls_cache_data&url=";
	
	/*
	 * DESCRIPTION OF CLASS HERE
	*/
	
	module.exports = {
	    LSCachesRetrievedTag: "lsCaches",
	    useProxy: false,
	    lsCacheURL: null,
	    data: null,
	
	    retrieveLSList: function retrieveLSList() {
	        axios.get(lsCacheHostsURL).then(function (response) {
	            var data = response.data;
	            console.log("lscachehosts", data);
	            this.handleLSListResponse(data);
	        }.bind(this));
	    },
	
	    handleLSListResponse: function handleLSListResponse(data) {
	        this.lsURLs = data;
	        console.log("lsURLs", data);
	        if (typeof data == "undefined" || !Array.isArray(data)) {
	            console.log("LS cache host data is invalid/missingZ");
	        } else if (data.length > 0) {
	            console.log("array of LS cache host data");
	            this.lsCacheURL = data[0].url;
	            if (this.lsCacheURL === null) {
	                console.log("no url found!");
	            }
	            console.log("selecting cache url: ", this.lsCacheURL);
	            emitter.emit(this.LSCachesRetrievedTag);
	        } else {
	            console.log("no LS cache host data available");
	        }
	        //LSCacheStore.subscribe( 
	        //this.retrieveLSHosts();
	    },
	
	    subscribeLSCaches: function subscribeLSCaches(callback) {
	        emitter.on(this.LSCachesRetrievedTag, callback);
	    },
	
	    unsubscribeLSCaches: function unsubscribeLSCaches(callback) {
	        emitter.removeListener(this.LSCachesRetrievedTag, callback);
	    },
	
	    subscribeTag: function subscribeTag(callback, tag) {
	        emitter.on(tag, callback);
	    },
	
	    unsubscribeTag: function unsubscribeTag(callback, tag) {
	        emitter.off(tag, callback);
	    },
	
	    // TODO: convert this function to a generic one that can take a query as a parameter
	    // and a callback
	    queryLSCache: function queryLSCache(query, message) {
	        var lsCacheURL = this.lsCacheURL + "_search";
	
	        //this.retrieveHostLSData( hosts, lsCacheURL );
	
	        console.log("query", query);
	
	        var preparedQuery = JSON.stringify(query);
	
	        console.log("stringified query", preparedQuery);
	
	        console.log("lsCacheURL", lsCacheURL);
	        console.log("message", message);
	
	        this.message = message;
	
	        var self = this;
	        var successCallback = function successCallback(data) {
	            self.handleLSCacheDataResponse(data, message);
	        };
	
	        axios({
	            "url": lsCacheURL,
	            "data": preparedQuery,
	            "dataType": 'json',
	            "method": "POST"
	        }).then(function (response) {
	            var data = response.data;
	            console.log("data from posted request FIRST DONE SECTION", data);
	            //this.handleInterfaceInfoResponse( data );
	            //this.handleLSCacheDataResponse( data, message );
	            successCallback(data);
	        }.bind(this)).catch(function (error) {
	            console.log("error", error);
	
	            if (error.response) {
	                // The request was made and the server responded with a status code
	                // that falls out of the range of 2xx
	                console.log("response error", error.response.data);
	                console.log(error.response.status);
	                console.log(error.response.headers);
	            } else if (error.request) {
	                // The request was made but no response was received
	                // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
	                // http.ClientRequest in node.js
	                console.log("request error", error.request);
	                // if we get an error, try the cgi instead
	                // and set a new flag, useProxy  and make
	                // all requests through the proxy CGI
	                var request = error.request;
	                if (request.status == 0) {
	                    console.log("got here!");
	                    this.useProxy = true;
	                    var url = this.getProxyURL(lsCacheURL);
	                    console.log("proxy URL", url);
	
	                    preparedQuery = JSON.stringify(query);
	
	                    var postData = {
	                        "query": preparedQuery,
	                        "action": "ls_cache_data",
	                        "dataType": 'json',
	                        "url": lsCacheURL
	
	                    };
	
	                    var preparedData = JSON.stringify(postData);
	
	                    axios({
	                        url: url,
	                        data: querystring.stringify(postData),
	                        //dataType: 'json',
	                        method: "POST"
	                    }).then(function (response) {
	                        var data = response.data;
	                        console.log("query data! SECOND DONE SECTIONz", data);
	                        //this.handleInterfaceInfoResponse(data);
	                        //this.handleLSCacheDataResponse( data, message );
	                        successCallback(data);
	                    }.bind(this)).catch(function (data) {
	                        //this.handleInterfaceInfoError(data);
	                    }.bind(this));
	                } else {
	                    // Something happened in setting up the request that triggered an Error
	                    console.log('Error', error.message);
	                }
	                console.log(error.config);
	            } else {
	                console.log('fail jqXHR, textStatus, errorThrown', jqXHR, textStatus, errorThrown);
	                this.handleInterfaceInfoError(data);
	            }
	        }.bind(this));
	    },
	    handleLSCacheDataResponse: function handleLSCacheDataResponse(data, message) {
	        console.log("handling LS cache data response (data, message)", data, message);
	        this.data = data;
	        emitter.emit(this.message);
	    },
	
	    getResponseData: function getResponseData() {
	        console.log("getting response data ...");
	        return this.data;
	    },
	
	    getProxyURL: function getProxyURL(url) {
	
	        var proxy = this.parseUrl(proxyURL);
	
	        if (this.useProxy) {
	            url = encodeURIComponent(url);
	            url = proxyURL + url;
	        }
	        var urlObj = this.parseUrl(url);
	        url = urlObj.origin + urlObj.pathname + urlObj.search;
	        return url;
	    },
	
	
	    parseUrl: function () {
	        return function (url) {
	            var a = document.createElement('a');
	            a.href = url;
	
	            // Work around a couple issues:
	            // - don't show the port if it's 80 or 443 (Chrome didn''t do this, but IE did)
	            // - don't append a port if the port is an empty string ""
	            var port = "";
	            if (typeof a.port != "undefined") {
	                if (a.port != "80" && a.port != "443" && a.port != "") {
	                    port = ":" + a.port;
	                }
	            }
	
	            var host = a.host;
	            var ret = {
	                host: a.host,
	                hostname: a.hostname,
	                pathname: a.pathname,
	                port: a.port,
	                protocol: a.protocol,
	                search: a.search,
	                hash: a.hash,
	                origin: a.protocol + "//" + a.hostname + port
	            };
	            return ret;
	        };
	    }(),
	
	    retrieveInterfaceInfo: function retrieveInterfaceInfo(source_input, dest_input) {
	
	        var sources = void 0;
	        var dests = void 0;
	        if (Array.isArray(source_input)) {
	            sources = source_input;
	        } else {
	            sources = [source_input];
	        }
	        if (Array.isArray(dest_input)) {
	            dests = dest_input;
	        } else {
	            dests = [dest_input];
	        }
	        this.sources = sources;
	        this.dests = dests;
	
	        //this.retrieveLSList();
	    },
	    getInterfaceInfo: function getInterfaceInfo() {
	        return this.interfaceObj;
	    },
	    handleInterfaceInfoResponse: function handleInterfaceInfoResponse(data) {
	        console.log("data", data);
	        data = this._parseInterfaceResults(data);
	        console.log("processed data", data);
	        //this.addData( data );
	        this.interfaceInfo = data;
	    },
	
	    _parseInterfaceResults: function _parseInterfaceResults(data) {
	        var out = {};
	        for (var i in data.hits.hits) {
	            var row = data.hits.hits[i]._source;
	            var addresses = row["interface-addresses"];
	            for (var j in addresses) {
	                var address = addresses[j];
	                if (!(address in out)) {
	                    out[address] = row;
	                    console.log("client uuid: ", row["client-uuid"]);
	                }
	            }
	        }
	        console.log("keyed on address", out);
	        return out;
	    },
	
	    subscribe: function subscribe(callback) {
	        emitter.on("get", callback);
	    },
	    unsubscribe: function unsubscribe(callback) {
	        emitter.off("get", callback);
	    },
	
	    array2param: function array2param(name, array) {
	        var joiner = "&" + name + "=";
	        return joiner + array.join(joiner);
	    },
	
	    // Retrieves interface details for a specific ip and returns them
	    // Currently keys on ip; could extend to search all addresses later if needed
	    getInterfaceDetails: function getInterfaceDetails(host) {
	        var details = this.interfaceObj || {};
	        if (host in details) {
	            return details[host];
	        } else {
	            for (var i in details) {
	                var row = details[i];
	
	                for (var j in row.addresses) {
	                    var address = row.addresses[j];
	                    if (address == host) {
	                        return details[i];
	                    } else {
	                        var addrs = host.split(",");
	                        if (addrs.length > 1) {
	                            // handle case where addresses have comma(s)
	                            for (var k in addrs) {
	                                if (addrs[k] == address) {
	                                    return details[i];
	                                }
	                            }
	                        }
	                    }
	                }
	            }
	        }
	        // host not found in the cache, return empty object
	        return {};
	    }
	};
	
	module.exports.retrieveLSList();

/***/ }),

/***/ 977:
/*!*********************************************!*\
  !*** ./src/shared/axios-instance-config.js ***!
  \*********************************************/
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var axios = __webpack_require__(/*! axios */ 911);
	var http = __webpack_require__(/*! http */ 938);
	var https = __webpack_require__(/*! https */ 969);
	
	module.exports = axios.create({
	  //60 sec timeout
	  timeout: 60000,
	
	  //keepAlive pools and reuses TCP connections, so it's faster
	  httpAgent: new http.Agent({ keepAlive: true }),
	  httpsAgent: new https.Agent({ keepAlive: true }),
	
	  //follow up to 10 HTTP 3xx redirects
	  maxRedirects: 10,
	
	  //cap the maximum content length we'll accept to 50MBs, just in case
	  maxContentLength: 50 * 1000 * 1000
	});
	
	//optionally add interceptors here...

/***/ }),

/***/ 978:
/*!****************************************!*\
  !*** ../toolkit/web-ng/root/js/app.js ***!
  \****************************************/
/***/ (function(module, exports) {

	$(document).ready(function () {
	    $(".nav-dropdown-toggle").click(function (e) {
	        e.preventDefault();
	        $(".nav-dropdown-menu").toggle();
	    });
	
	    //Hide the dropdown when anything outside is clicked
	    $(document).click(function () {
	        $(".nav-dropdown-menu").hide();
	    });
	
	    // Don't hide the dropdown if items inside are clicked
	    // and exclude nav-dropdown-toggle from the click outside thing above.
	    $(".nav-dropdown-toggle, .nav-dropdown-menu").click(function (e) {
	        e.stopPropagation();
	    });
	
	    // Show/hide the services. use the on() event to allow DOM elements 
	    // created later to still trigger the event
	    $("div#host_services").on("click", ".services--title-link", function (e) {
	        e.preventDefault();
	        $(this).next(".services--list").toggleClass("visible-inline");
	    });
	    $(".alert--dismiss").click(function (e) {
	        e.preventDefault();
	        $(this).parent().fadeOut();
	    });
	
	    $(".communities__add, .servers__add").click(function (e) {
	        e.preventDefault();
	        $(".communities__popular, .servers__popular").toggle();
	    });
	
	    $("body").on("click", ".add_panel_heading", function (e) {
	        e.preventDefault();
	        $(".add_panel_heading").next(".add_panel").toggle();
	    });
	
	    /*
	    $(".config__input").change(function(e) {
	        $(".js-unsaved-message").fadeIn("fast");
	    });
	    */
	
	    /*
	    $(".js-save-button").click(function(e) {
	        e.preventDefault();
	        $(".js-unsaved-message").fadeOut("fast");
	        $(".sticky-bar--saved").fadeIn("fast").delay(1500).fadeOut("slow");
	    });
	    */
	    /*
	    $(".js-cancel-button").click(function(e) {
	        e.preventDefault();
	        $(".sticky-bar--failure").fadeIn("fast");
	    });
	     $(".js-sticky-dismiss").click(function(e) {
	        e.preventDefault();
	        $(".js-unsaved-message").hide();
	        $(".sticky-bar--failure").fadeOut("fast");
	    });
	    */
	
	    // Sidebar popover menu used to exand on larger sets of sidebar info
	    // For example, "Interfaces"
	    //$(document).on('click', '.btn_test', function() { alert('test'); });
	    $(document).on("click", ".js-sidebar-popover-toggle", function (e) {
	        e.preventDefault();
	        $(this).next(".sidebar-popover").fadeToggle("fast");
	    });
	
	    $(document).on("click", ".js-sidebar-popover-close", function (e) {
	        e.preventDefault();
	        $(this).parent(".sidebar-popover").fadeOut("fast");
	    });
	
	    // Hide the popover when the user clicks outside of it
	    $(document).click(function (e) {
	        $(".sidebar-popover").not(".graph-values-popover").fadeOut("fast");
	    });
	
	    // Stop clicking inside the popover from hiding it
	    $(document).on("click", ".js-sidebar-popover-toggle, .sidebar-popover", function (e) {
	        e.stopPropagation();
	    });
	
	    $(document).on('open.fndtn.reveal', '[data-reveal]', function () {
	        $('body').addClass('modal-open');
	    });
	    $(document).on('close.fndtn.reveal', '[data-reveal]', function () {
	        $('body').removeClass('modal-open');
	    });
	
	    // Select2 plugin - https://select2.github.io/
	    /*
	    $(".js-select-multiple").select2({
	        placeholder: "Add a new server"
	    });
	      $(".select2-search__field").keypress(function() {
	        $(".sticky-bar--unsaved").fadeIn("fast");    
	    });
	    */
	});

/***/ }),

/***/ 979:
/*!******************************************!*\
  !*** ../toolkit/web-ng/root/css/app.css ***!
  \******************************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../../../../react/~/css-loader!./app.css */ 980);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../../../../react/~/style-loader/addStyles.js */ 902)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../../../../react/node_modules/css-loader/index.js!./app.css", function() {
				var newContent = require("!!../../../../react/node_modules/css-loader/index.js!./app.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),

/***/ 980:
/*!*********************************************************!*\
  !*** ./~/css-loader!../toolkit/web-ng/root/css/app.css ***!
  \*********************************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ./~/css-loader/cssToString.js */ 901)();
	exports.push([module.id, "/*------------------------------------------------------------------------------\n\n    Utilities\n\n------------------------------------------------------------------------------*/\n/* Color classes */\n.color-primary {\n  color: #0089ff !important;\n}\n\n.color-bg-accent {\n  color: #f7f7f7 !important;\n}\n\n.color-light, .test_results .host_ip {\n  color: #919ca1 !important;\n}\n\n.color-medium {\n  color: #4d565b !important;\n}\n\n.color-black {\n  color: #383f44 !important;\n}\n\n.color-success {\n  color: #a2d4ba !important;\n}\n\n.color-message {\n  color: #f3dda8 !important;\n}\n\n.color-failure {\n  color: #f7a9a1 !important;\n}\n\n.color-disabled {\n  color: #919ca1 !important;\n}\n\n.color-red, #host_services .off {\n  color: #ef402f !important;\n}\n\n.color-yellow {\n  color: #e5b53e !important;\n}\n\n.color-green, #host_services .running {\n  color: #32a066 !important;\n}\n\n#host_services .disabled {\n  color: #A9B1B5;\n}\n\n/* Typography classes */\n.font-light {\n  font-weight: 300;\n}\n\n.font-regular {\n  font-weight: 400;\n}\n\n.font-bold {\n  font-weight: 700;\n}\n\n.font-size--small {\n  font-size: 0.8em;\n}\n\n/* Float classes */\n.left {\n  float: left;\n}\n\n.right {\n  float: right;\n}\n\n/* Lists add to ul and ol */\n\n.no-list {\n  list-style: none;\n  padding-left: 0;\n}\n\n/* Visibility classes */\n.hidden {\n  display: none;\n}\n\n.visible-inline {\n  display: inline-block;\n}\n\n.display-inline {\n  display: inline-block !important;\n}\n\n/* Margin utilities */\n\n.no-margin {\n    margin: 0;\n}\n\n.no-margin-top {\n    margin-top: 0;\n}\n\n.no-margin-bottom {\n    margin-bottom: 0;\n}\n\n/*! normalize.css v3.0.2 | MIT License | git.io/normalize */\n/**\n * 1. Set default font family to sans-serif.\n * 2. Prevent iOS text size adjust after orientation change, without disabling\n *    user zoom.\n */\nhtml {\n  font-family: sans-serif;\n  /* 1 */\n  -ms-text-size-adjust: 100%;\n  /* 2 */\n  -webkit-text-size-adjust: 100%;\n  /* 2 */\n}\n\n/**\n * Remove default margin.\n */\nbody {\n  margin: 0;\n}\n\n/* HTML5 display definitions\n   ========================================================================== */\n/**\n * Correct `block` display not defined for any HTML5 element in IE 8/9.\n * Correct `block` display not defined for `details` or `summary` in IE 10/11\n * and Firefox.\n * Correct `block` display not defined for `main` in IE 11.\n */\narticle,\naside,\ndetails,\nfigcaption,\nfigure,\nfooter,\nheader,\nhgroup,\nmain,\nmenu,\nnav,\nsection,\nsummary {\n  display: block;\n}\n\n/**\n * 1. Correct `inline-block` display not defined in IE 8/9.\n * 2. Normalize vertical alignment of `progress` in Chrome, Firefox, and Opera.\n */\naudio,\ncanvas,\nprogress,\nvideo {\n  display: inline-block;\n  /* 1 */\n  vertical-align: baseline;\n  /* 2 */\n}\n\n/**\n * Prevent modern browsers from displaying `audio` without controls.\n * Remove excess height in iOS 5 devices.\n */\naudio:not([controls]) {\n  display: none;\n  height: 0;\n}\n\n/**\n * Address `[hidden]` styling not present in IE 8/9/10.\n * Hide the `template` element in IE 8/9/11, Safari, and Firefox < 22.\n */\n[hidden],\ntemplate {\n  display: none;\n}\n\n/* Links\n   ========================================================================== */\n/**\n * Remove the gray background color from active links in IE 10.\n */\na {\n  background-color: transparent;\n}\n\n/**\n * Improve readability when focused and also mouse hovered in all browsers.\n */\na:active,\na:hover {\n  outline: 0;\n}\n\n/* Text-level semantics\n   ========================================================================== */\n/**\n * Address styling not present in IE 8/9/10/11, Safari, and Chrome.\n */\nabbr[title] {\n  border-bottom: 1px dotted;\n}\n\n/**\n * Address style set to `bolder` in Firefox 4+, Safari, and Chrome.\n */\nb,\nstrong {\n  font-weight: bold;\n}\n\n/**\n * Address styling not present in Safari and Chrome.\n */\ndfn {\n  font-style: italic;\n}\n\n/**\n * Address variable `h1` font-size and margin within `section` and `article`\n * contexts in Firefox 4+, Safari, and Chrome.\n */\nh1 {\n  font-size: 2em;\n  margin: 0.67em 0;\n}\n\n/**\n * Address styling not present in IE 8/9.\n */\nmark {\n  background: #ff0;\n  color: #000;\n}\n\n/**\n * Address inconsistent and variable font size in all browsers.\n */\nsmall {\n  font-size: 80%;\n}\n\nsmall.warning {\n    color: #999;\n    margin-bottom: 2px;\n    display:block;\n}\n\n/**\n * Prevent `sub` and `sup` affecting `line-height` in all browsers.\n */\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsup {\n  top: -0.5em;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\n/* Embedded content\n   ========================================================================== */\n/**\n * Remove border when inside `a` element in IE 8/9/10.\n */\nimg {\n  border: 0;\n}\n\n/**\n * Correct overflow not hidden in IE 9/10/11.\n */\nsvg:not(:root) {\n  overflow: hidden;\n}\n\n/* Grouping content\n   ========================================================================== */\n/**\n * Address margin not present in IE 8/9 and Safari.\n */\nfigure {\n  margin: 1em 40px;\n}\n\n/**\n * Address differences between Firefox and other browsers.\n */\nhr {\n  -moz-box-sizing: content-box;\n  box-sizing: content-box;\n  height: 0;\n}\n\n/**\n * Contain overflow in all browsers.\n */\npre {\n  overflow: auto;\n}\n\n/**\n * Address odd `em`-unit font size rendering in all browsers.\n */\ncode,\nkbd,\npre,\nsamp {\n  font-family: monospace, monospace;\n  font-size: 1em;\n}\n\n/* Forms\n   ========================================================================== */\n/**\n * Known limitation: by default, Chrome and Safari on OS X allow very limited\n * styling of `select`, unless a `border` property is set.\n */\n/**\n * 1. Correct color not being inherited.\n *    Known issue: affects color of disabled elements.\n * 2. Correct font properties not being inherited.\n * 3. Address margins set differently in Firefox 4+, Safari, and Chrome.\n */\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  color: inherit;\n  /* 1 */\n  font: inherit;\n  /* 2 */\n  margin: 0;\n  /* 3 */\n}\n\n/**\n * Address `overflow` set to `hidden` in IE 8/9/10/11.\n */\nbutton {\n  overflow: visible;\n}\n\n/**\n * Address inconsistent `text-transform` inheritance for `button` and `select`.\n * All other form control elements do not inherit `text-transform` values.\n * Correct `button` style inheritance in Firefox, IE 8/9/10/11, and Opera.\n * Correct `select` style inheritance in Firefox.\n */\nbutton,\nselect {\n  text-transform: none;\n}\n\n/**\n * 1. Avoid the WebKit bug in Android 4.0.* where (2) destroys native `audio`\n *    and `video` controls.\n * 2. Correct inability to style clickable `input` types in iOS.\n * 3. Improve usability and consistency of cursor style between image-type\n *    `input` and others.\n */\nbutton,\nhtml input[type=\"button\"],\ninput[type=\"reset\"],\ninput[type=\"submit\"] {\n  -webkit-appearance: button;\n  /* 2 */\n  cursor: pointer;\n  /* 3 */\n}\n\n/**\n * Re-set default cursor for disabled elements.\n */\nbutton[disabled],\nhtml input[disabled] {\n  cursor: default;\n}\n\n/**\n * Remove inner padding and border in Firefox 4+.\n */\nbutton::-moz-focus-inner,\ninput::-moz-focus-inner {\n  border: 0;\n  padding: 0;\n}\n\n/**\n * Address Firefox 4+ setting `line-height` on `input` using `!important` in\n * the UA stylesheet.\n */\ninput {\n  line-height: normal;\n}\n\n/**\n * It's recommended that you don't attempt to style these elements.\n * Firefox's implementation doesn't respect box-sizing, padding, or width.\n *\n * 1. Address box sizing set to `content-box` in IE 8/9/10.\n * 2. Remove excess padding in IE 8/9/10.\n */\ninput[type=\"checkbox\"],\ninput[type=\"radio\"] {\n  box-sizing: border-box;\n  /* 1 */\n  padding: 0;\n  /* 2 */\n}\n\n/**\n * Fix the cursor style for Chrome's increment/decrement buttons. For certain\n * `font-size` values of the `input`, it causes the cursor style of the\n * decrement button to change from `default` to `text`.\n */\ninput[type=\"number\"]::-webkit-inner-spin-button,\ninput[type=\"number\"]::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/**\n * 1. Address `appearance` set to `searchfield` in Safari and Chrome.\n * 2. Address `box-sizing` set to `border-box` in Safari and Chrome\n *    (include `-moz` to future-proof).\n */\ninput[type=\"search\"] {\n  -webkit-appearance: textfield;\n  /* 1 */\n  -moz-box-sizing: content-box;\n  -webkit-box-sizing: content-box;\n  /* 2 */\n  box-sizing: content-box;\n}\n\n/**\n * Remove inner padding and search cancel button in Safari and Chrome on OS X.\n * Safari (but not Chrome) clips the cancel button when the search input has\n * padding (and `textfield` appearance).\n */\ninput[type=\"search\"]::-webkit-search-cancel-button,\ninput[type=\"search\"]::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/**\n * Define consistent border, margin, and padding.\n */\nfieldset {\n  border: 1px solid #c0c0c0;\n  margin: 0 2px;\n  padding: 0.35em 0.625em 0.75em;\n}\n\n/**\n * 1. Correct `color` not being inherited in IE 8/9/10/11.\n * 2. Remove padding so people aren't caught out if they zero out fieldsets.\n */\nlegend {\n  border: 0;\n  /* 1 */\n  padding: 0;\n  /* 2 */\n}\n\n/**\n * Remove default vertical scrollbar in IE 8/9/10/11.\n */\ntextarea {\n  overflow: auto;\n}\n\n/**\n * Don't inherit the `font-weight` (applied by a rule above).\n * NOTE: the default cannot safely be changed in Chrome and Safari on OS X.\n */\noptgroup {\n  font-weight: bold;\n}\n\n/* Tables\n   ========================================================================== */\n/**\n * Remove most spacing between table cells.\n */\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\n\ntd,\nth {\n  padding: 0;\n}\n\n/*------------------------------------------------------------------------------\n\n    Base styles\n\n------------------------------------------------------------------------------*/\nbody {\n  font-family: \"Open Sans\", \"Helvetica Neue\", \"Helvetica\", Arial, sans-serif;\n  font-weight: 400;\n  color: #383f44;\n  /* Set base font-size to 14px to start out with due to how much text is on\n  ** the screen at one time\n  */\n  font-size: 87.5%;\n}\n\nhtml,\nbody {\n  font-family: \"Open Sans\", \"Helvetica Neue\", \"Helvetica\", Arial, sans-serif;\n  height: 100%;\n}\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-family: \"Open Sans\", \"Helvetica Neue\", \"Helvetica\", Arial, sans-serif;\n  font-weight: 400;\n  color: #383f44;\n}\n\na {\n  color: #0089ff;\n  /* text-decoration: underline; */\n}\na:hover {\n  color: #a5d5ff;\n}\n\na:focus {\n  color: #006dcc;\n}\n\n/*\n** These rules overide Foundation's more specific styles for lists\n** Switching these to em make the relational to the base font size\n** that we can adjust if we want to scale up the font on bigger screens.\n*/\nol,\nul,\ndl {\n  font-size: 1em;\n}\n\np {\n  font-size: 1em;\n}\n\n/* End text-level Foundation overides */\nstrong {\n  font-weight: 700;\n}\n\nselect {\n  margin-bottom: 1em;\n}\n\n/* Hide only visually, but have it available for screenreaders: h5bp.com/v */\n.visuallyhidden {\n  border: 0;\n  clip: rect(0 0 0 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px;\n}\n\n/* Extends the .visuallyhidden class to allow the element to be focusable when navigated to via the keyboard: h5bp.com/p */\n.visuallyhidden.focusable:active, .visuallyhidden.focusable:focus {\n  clip: auto;\n  height: auto;\n  margin: 0;\n  overflow: visible;\n  position: static;\n  width: auto;\n}\n\n/*\n** Foundation overrides\n** We need these rules to override some of the Foundation grid functionality\n** to make it match the fluid nature of the app.\n*/\n.row {\n  max-width: 100%;\n}\n\n.row--fixed {\n  max-width: 1080px;\n}\n\n/*------------------------------------------------------------------------------\n\n    Utitilities\n\n------------------------------------------------------------------------------*/\n/*\n** Make an unordered list display inline, remove list style, and margins\n*/\n.u-list-nav {\n  list-style-type: none;\n  margin: 0;\n}\n.u-list-nav li {\n  display: inline-block;\n}\n\n/*------------------------------------------------------------------------------\n\n    Grid\n\n------------------------------------------------------------------------------*/\n.container {\n  max-width: 100%;\n  margin: 0 auto;\n}\n.container:after {\n  content: \"\";\n  display: block;\n  clear: both;\n}\n.container:before {\n  content: \"\";\n  display: block;\n  clear: both;\n}\n\n.collapse .unit:first-child {\n  padding-left: 0;\n}\n.collapse .unit:last-child {\n  padding-right: 0;\n}\n\n.unit {\n  padding-left: 24px;\n  padding-right: 24px;\n  padding-top: 24px;\n  padding-bottom: 24px;\n  float: left;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n.unit:after {\n  content: \"\";\n  display: block;\n  clear: both;\n}\n\n.container.kill-vertical .unit {\n  padding-top: 0;\n  padding-bottom: 0;\n}\n\n/* Get rid of container padding when grids are nested */\n.container .container .unit {\n  padding-top: 0;\n}\n.container .container .unit:first-child {\n  padding-left: 0;\n}\n.container .container .unit:last-child {\n  padding-right: 0;\n}\n\n.centered {\n  margin: 0 auto;\n  float: none !important;\n}\n\n.last {\n  float: right;\n}\n\n.whole {\n  width: 100%;\n}\n\n.half {\n  width: 50%;\n}\n\n.one-third {\n  width: 33.33333%;\n}\n\n.two-thirds {\n  width: 66.666666666667%;\n}\n\n.one-fourth {\n  width: 25%;\n}\n\n.three-fourths {\n  width: 75%;\n}\n\n.one-fifth {\n  width: 20%;\n}\n\n.two-fifths {\n  width: 40%;\n}\n\n.three-fifths {\n  width: 60%;\n}\n\n.four-fifths {\n  width: 80%;\n}\n\n/* Push and pull classes */\n.push {\n  float: right;\n}\n\n.pull {\n  float: left;\n}\n\n.container > .unit.pull {\n  padding-left: 0;\n  padding-right: 24px !important;\n}\n\n.container > .unit.push {\n  padding-right: 0;\n  padding-left: 24px !important;\n}\n\n/* List grid */\nul.list-grid-fourths {\n  display: block;\n  list-style-type: none;\n  margin: -24px;\n}\nul.list-grid-fourths:after {\n  content: \"\";\n  display: block;\n  clear: both;\n}\nul.list-grid-fourths li {\n  display: block;\n  float: left;\n  width: 25%;\n  padding: 24px;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\nul.list-grid-thirds {\n  display: block;\n  list-style-type: none;\n  margin: -24px;\n}\nul.list-grid-thirds:after {\n  content: \"\";\n  display: block;\n  clear: both;\n}\nul.list-grid-thirds li {\n  display: block;\n  float: left;\n  width: 33.333333333333%;\n  padding: 24px;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n@media screen and (max-width: 768px) {\n  .unit {\n    float: none;\n    padding-top: 12px;\n    padding-bottom: 12px;\n    padding-right: 12px;\n    padding-left: 12px;\n  }\n\n  .unit .container .unit:first-child {\n    padding-top: 0;\n  }\n\n  .container .container .unit {\n    padding: 24px 0;\n  }\n\n  /* Small grid - This will keep the proportions of the grid even on small devices */\n  .container.small-grid .unit.half {\n    width: 50%;\n    float: left;\n  }\n\n  .container.small-grid .unit.one-third {\n    width: 33.333333333333%;\n    float: left;\n  }\n\n  .container.small-grid .unit.two-thirds {\n    width: 66.666666666667%;\n    float: left;\n  }\n\n  .container.small-grid .unit.one-fourth {\n    width: 25%;\n    float: left;\n  }\n\n  .container.small-grid .unit.three-fourths {\n    width: 75%;\n    float: left;\n  }\n\n  .container.small-grid .unit.one-fifth {\n    width: 20%;\n    float: left;\n  }\n\n  .container.small-grid .unit.two-fifths {\n    width: 40%;\n    float: left;\n  }\n\n  .container.small-grid .unit.three-fifths {\n    width: 60%;\n    float: left;\n  }\n\n  .container.small-grid .unit.four-fifths {\n    width: 80%;\n    float: left;\n  }\n\n  .whole,\n  .half,\n  .one-third,\n  .two-thirds,\n  .one-fourth,\n  .three-fourths,\n  .one-fifth,\n  .two-fifths,\n  .three-fifths,\n  .four-fifths {\n    width: 100% !important;\n  }\n\n  .push,\n  .pull {\n    float: none;\n  }\n\n  .container > .unit.pull {\n    padding-left: 0;\n    padding-right: 0 !important;\n  }\n\n  .container > .unit.push {\n    padding-right: 0;\n    padding-left: 0 !important;\n  }\n\n  ul.list-grid-fourths li {\n    width: 100%;\n    float: none;\n  }\n\n  ul.list-grid-thirds li {\n    width: 100%;\n    float: none;\n  }\n}\n/*------------------------------------------------------------------------------\n\n    Main app header\n\n------------------------------------------------------------------------------*/\n.app-header {\n  padding: 1em 2em;\n  background-color: #383f44;\n  color: white;\n}\n.app-header:after {\n  content: \"\";\n  clear: both;\n  display: block;\n}\n.app-header h1 {\n  margin: 0;\n  color: white;\n  font-size: 1em;\n  padding-top: .15em;\n}\n.app-header h1 a {\n  text-decoration: none;\n  color: white;\n}\n\n@media screen and (max-width: 580px) {\n  .app-header {\n    padding: 1em 12px;\n  }\n}\n.app-logo {\n  float: left;\n}\n.app-logo h1 {\n  font-size: 1.35em;\n  float:right;\n  margin-top: 0;\n}\n\n.app-header img.logo {\n  height: auto;\n  max-width: 150px;\n  margin-right: 1em;\n}\n\n@media screen and (max-width: 580px) {\n  .app-logo h1 {\n    font-size: .9em;\n  }\n}\n.app-nav {\n  float: right;\n  text-align: right;\n}\n.app-nav ul {\n  margin: 0;\n  padding: 0;\n  list-style-type: none;\n}\n.app-nav ul li {\n  display: inline-block;\n  margin-right: 1.25em;\n}\n.app-nav ul li:last-child {\n  margin-right: 0;\n}\n.app-nav ul li a {\n  color: white;\n  display: inline-block;\n  padding: .25em .5em;\n  border: 1px solid rgba(255, 255, 255, 0.5);\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n  text-decoration: none;\n}\n.app-nav ul li a:hover {\n  background-color: #0089ff;\n  border-color: #0089ff;\n  color: white;\n}\n.app-nav ul li a:hover i {\n  color: white;\n}\n.app-nav ul li a i {\n  display: inline-block;\n  margin: 0 .25em;\n  color: white;\n}\n\n@media screen and (max-width: 580px) {\n  .app-nav ul li {\n    margin-right: .8em;\n  }\n\n  .app-nav ul li a {\n    font-size: .8em;\n  }\n}\n/* Dropdowns */\n\n/* These selectors are very specific makes them less reusable\n * with any kind of variation in the markup (on the graphs\n * for instance). I added a less specific versio of each\n * selector, just in case, but I would say the super specific\n * ones could be removed.\n*/\nli.nav-dropdown,\n.nav-dropdown {\n  position: relative;\n}\n\nli.nav-dropdown ul.nav-dropdown-menu,\n.nav-dropdown-menu {\n  display: none;\n  position: absolute;\n  min-width: 250px;\n  top: 42px;\n  right: 0px;\n  z-index: 10;\n  background-color: rgba(255, 255, 255, 0.95);\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n  -webkit-box-shadow: 0px 0px 5px rgba(0, 0, 0, .13);\n  -moz-box-shadow: 0px 0px 5px rgba(0, 0, 0, .13);\n  -o-box-shadow: 0px 0px 5px rgba(0, 0, 0, .13);\n  box-shadow: 0px 0px 5px rgba(0, 0, 0, .13);\n}\nli.nav-dropdown ul.nav-dropdown-menu:before,\n.nav-dropdown-menu:before {\n  content: \"\";\n  display: block;\n  width: 0;\n  height: 0;\n  border: inset 6px;\n  border-color: transparent transparent white;\n  border-bottom-style: solid;\n  position: absolute;\n  top: -12px;\n  right: 25px;\n  z-index: 99;\n}\nli.nav-dropdown ul.nav-dropdown-menu li,\n.nav-dropdown .nav-dropdown-menu li {\n  display: block;\n  margin: 0;\n  text-align: left;\n}\nli.nav-dropdown ul.nav-dropdown-menu li a,\n.nav-dropdown .nav-dropdown-menu li a {\n  display: block;\n  margin: 0;\n  padding: 8px 10px;\n  border: none;\n  border-radius: 0;\n  color: #4d565b;\n}\nli.nav-dropdown ul.nav-dropdown-menu li a:hover,\n.nav-dropdown .nav-dropdown-menu li a:hover {\n  background-color: #ddd;\n  color: #0089ff;\n  border-top-right-radius: 4px;\n  border-top-left-radius: 4px;\n}\n\n.nav-dropdown-menu.visible {\n  display: block !important;\n}\n\n.nav-dropdown-menu__heading {\n    font-weight: 700;\n    padding: 8px 10px;\n    border-bottom: 1px solid #ccc;\n}\n\n/*------------------------------------------------------------------------------\n\n    Footer\n\n------------------------------------------------------------------------------*/\n.site-footer {\n  display: block;\n  padding: 2em;\n  margin-top: 5em;\n  text-align: right;\n  color: #919ca1;\n  border-top: 1px solid #ddd;\n}\n\n/*------------------------------------------------------------------------------\n\n    Main sidebar nav\n\n------------------------------------------------------------------------------*/\n.sidebar {\n  width: 25%;\n  float: left;\n  min-height: 100%;\n  background-color: #f7f7f7;\n  border-left: 1px solid #ddd;\n  float: right;\n  position: relative;\n}\n\n.sidebar:after {\n  content: \"\";\n  display: block;\n  position: absolute;\n  left: -1px;\n  bottom: -99em;\n  height: 99em;\n  width: 100%;\n  background: #f7f7f7;\n  border-left: 1px solid #ddd;\n}\n\n@media screen and (max-width: 850px) {\n  .sidebar {\n    width: 100%;\n    float: none;\n    padding: 0 1em;\n  }\n}\n.sidebar__heading {\n  font-size: 1em;\n  font-weight: 700;\n  background-color: #eaeaea;\n  margin: 1em 0 0 0;\n  padding: 1em 1.5em;\n}\n.sidebar__heading i {\n  color: #4d565b;\n}\n.sidebar__heading:first-of-type {\n  margin-top: 0;\n}\n\n.sidebar-list {\n  display: block;\n  list-style-type: none;\n  margin: 0;\n}\n\n.sidebar-list__item {\n  padding: .5em 1em .5em 1.5em;\n  border-bottom: 1px solid #ddd;\n  position: relative;\n}\n.sidebar-list__item:after {\n  content: \"\";\n  clear: both;\n  display: block;\n}\n.sidebar-list__item:last-child {\n  border-bottom: none;\n}\n\n.sidebar-list__item a {\n  text-decoration: none;\n}\n\n.sidebar-list__parameter {\n  width: 50%;\n  float: left;\n  overflow-wrap: break-word;\n  color:#919ca1;\n}\n.sidebar-list__parameter.communities {\n  width: 100%;\n  padding: 0 0 .3em 0;\n}\n\n.sidebar-list__value {\n  float: left;\n  width: 50%;\n  overflow-wrap: break-word;\n}\n.sidebar-list__value.communities {\n  width: 100%;\n  padding: 0;\n}\n\n/* \n  Graph Options popover\n*/\n.sidebar-popover.options-popover {\n  position: absolute;\n  top: 17em;\n  right: 2.5%;\n  background-color: white;\n  color: #383f44;\n  z-index: 105;\n  padding: 2em;\n  border-radius: 4px;\n  border: 1px solid #383f44;\n  min-width: 55%;\n}\n\n.options-popover .sidebar-popover__close, .sidebar-popover i.fa {\n  color: #a9b1b5;\n}\n\n.options-popover__heading {\n  border-bottom: 1px solid rgba(255, 255, 255, .2);\n  font-size: 1.2em;\n  color: #383f44;\n  padding: 0 0 .2em 0;\n}\n\n.options-popover__list {\n  list-style: none;\n  margin: 0em 0;\n}\n\n.options-popover__list>li {\n  padding: 0.1em 0;\n  white-space: nowrap;\n}\n\n.options-popover__list .options-popover__row {\n  margin: 0;\n}\n\n.options-popover__row>li {\n  list-style: none;\n  display: inline-block;\n}\n\n.options-popover__row li:first-child {\n    width: 16%;\n    margin-right: 8px;\n    color: black:\n}\n\n.options-popover__row input[type=\"checkbox\"] {\n   margin: 0;\n}\n.options-popover__row input[type=\"checkbox\"]+label {\n    margin-left: .1em;\n}\n\n#timeperiod {\n    width:60%;\n    margin: 0 .75em 0 .75em;\n    border: 1px solid #919ca1;\n    padding: 0 0.5rem;\n}\n\nspan.timerange_holder {\n    float:left;\n    margin:0.1rem 0.4rem;\n}\n\n/*\n  Sidebar popover\n*/\n\n.sidebar-popover {\n  display: none;\n  position: absolute;\n  top: 2.65em;\n  right: 2.5%;\n  background-color: rgba(56, 63, 68, .95);\n  color: #fff;\n  z-index: 205;\n  padding: .75em;\n  border-radius: 4px;\n  min-width: 95%;\n  font-size:95%;\n}\n\n.sidebar-popover.double {\n  width: 180%;\n}\n\n.sidebar-popover--overview {\n    top: 5.75em;\n}\n\n.sidebar-popover :after {\n  content: \"\";\n  clear: both;\n  display: block;\n}\n\n.sidebar-popover__heading {\n  border-bottom: 1px solid rgba(255, 255, 255, .2);\n  font-size: 1.2em;\n  color: #fff;\n  padding: 1em 0 .5em 0;\n  clear: left;}\n\n.sidebar-popover__heading:first-of-type {\n  /*padding-top: 0;*/\n}\n\n.sidebar-popover__list,\n.sidebar-popover-double__list {\n  list-style: none;\n  margin: 0;\n}\n\n.sidebar-popover-double__list {\n  width: 50%;\n  float: left;\n  padding: 0 .75em;\n}\n\n.sidebar-popover-double__list.onright {\n  border-left: 1px solid rgba(255, 255, 255, .2);\n}\n\n.sidebar-popover__item {\n  padding: .2em 0;\n}\n\n.sidebar-popover__param,\n.sidebar-popover__value,\n.sidebar-popover__param-3col,\n.sidebar-popover__value-3col,\n.sidebar-popover__subvalue_wide {\n  display: block;\n}\n\n.sidebar-popover__param {\n  float: left;\n  color: #ccc;\n  width: 45%;\n}\n\n.sidebar-popover__param-3col {\n  float: left;\n  color: #ccc;\n  width: 33%;\n}\n.sidebar-popover__param-3col.right {\n  text-align: right;\n}\n\n.sidebar-popover__value {\n  float: right;\n  text-align: right;\n  width: 55%;\n}\n\n.sidebar-popover__value-3col {\n  float: left;\n  text-align: right;\n  width: 33%;\n}\n\n.sidebar-popover__subvalue_wide {\n  float: right;\n  width: 90%;\n  text-align: right;\n  font-size: 85%;\n  color: #ccc;\n  margin: -3px 0 5px 0;\n}\n\n.sidebar-popover-toggle:focus {\n  color: #0089ff;\n}\n\n.sidebar-popover__close {\n  color: #ccc;\n  display: block;\n  position: absolute;\n  top: .9em;\n  right: .7em;\n}\n\n.sidebar-popover__close:hover i {\n  color: #a5d5ff;\n}\n\n.sidebar-popover__close i {\n  color: #fff;\n}\n\n/*------------------------------------------------------------------------------\n\n    Breadcrumbs\n\n------------------------------------------------------------------------------*/\n.nav--breadcrumbs {\n  padding: 0;\n  margin-bottom: 2em;\n}\n.nav--breadcrumbs li:after {\n  content: \"/\";\n  display: inline-block;\n  margin: 0 10px;\n  color: #919ca1;\n}\n.nav--breadcrumbs li:last-child:after {\n  content: \"\";\n}\n\n.nav--breadcrumbs li a,\n.nav--breadcrumbs li a i {\n  color: #919ca1;\n}\n\n.nav--breadcrumbs li a:hover,\n.nav--breadcrumbs li a:hover i {\n  color: #0089ff;\n}\n\n.nav--breadcrumbs li.active a,\n.nav--breadcrumbs li.active a i {\n  color: #0089ff;\n  cursor: default;\n}\n\n/*------------------------------------------------------------------------------\n\n    Tables\n\n------------------------------------------------------------------------------*/\ntable {\n  border: none;\n  font-size: 1em !important;\n  width: 100%;\n  overflow: auto;\n}\n\ntable tr td {\n  font-size: 1em;\n  padding: .75em .5em;\n}\n\ntable thead {\n  background-color: transparent;\n}\n\ntable thead tr th,\n.sub-heading {\n  font-weight: 400;\n  color: #919ca1;\n  text-transform: uppercase;\n  letter-spacing: .07em;\n  background-color:#eee;\n}\n\n/*\n**  Override: make zebra stripes on tables a bit darker\n*/\n\ntable tr.even, table tr.alt, table tr:nth-of-type(even) {\n    background-color:#eee;\n}\n\ntable tr.odd, table tr:nth-of-type(odd) { \n    background-color: #fff;\n}\n\n.services {\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  box-sizing: border-box;\n}\n\n.services--title {\n  /*color: #919ca1;*/\n  /* color:##383F44; */\n  color: #0089FF;\n  display: block;\n  font-weight: 700;\n  text-decoration: none;\n}\n\n.services--title-link, .services--title a {\n  display: block;\n  font-weight: 700;\n  text-decoration: none;\n}\n.services--title-link i {\n  color: #919ca1;\n}\n\n.services--list {\n  display: none;\n  list-style-type: none;\n  margin-top: .75em;\n  /* This (-999px) is a hack to fix some weirdness caused by the jQuery toggle we are using */\n  padding-left: 1em;\n  border-left: 5px solid #ddd;\n}\n.services--list li {\n  padding: .35em 0;\n}\n\n.visible-inline {\n  display: inline-block;\n}\n\n/* Test results */\n.test-results:after {\n  content: \"\";\n  clear: both;\n  display: block;\n}\ntable.test_results tr {\n  vertical-align: top;\n}\n.test-results table tr td span,\n.test-results table tr td a {\n  display: block;\n  line-height: 1.5;\n}\n.test_results .traceroute_link_container.has_traceroute {\n    display:inline;\n}\n.test_results .traceroute_link_container {\n    display:none;\n}\n\n/* Pay special attention here. For some reason, this fontawesome override doesn't work with .test-results, only .test_results. */\n.test_results i.fa {\n  font-size: 10px;\n  color: #919ca1;\n}\n\n.test_results i.fa-external-link {\n    color:inherit;\n}\n\ni.fa.disabled, tr.disabled td, tr.disabled td i.fa {\n    color:#aaa;\n}\n\n\ntd.test-values {\n  font-weight:bold;\n}\ntd.test-values.loss {\n    white-space: nowrap;\n}\n\n.test-results--warnings {\n  list-style-type: none;\n  margin: 0;\n}\n\n.timeperiod-div {\n    width: 170px;\n    float: right;\n    position: relative;\n    z-index: 101;\n    }\n#testResultsTable_filter label input {\n    height: 19px;\n    margin-left: 0px;\n    display: block !important;\n}\n#testResultsTable_length label {\n    color: #999;\n}\n#testResultsTable_length select {\n    padding: 0 8 1 8;\n    height: 30;\n}\n#testResultsTable_info {\n    margin: 0 30px 0 30px;\n}\n#testResultsTable thead .sorting, #testResultsTable thead .sorting_asc, #testResultsTable thead .sorting_desc, #testResultsTable thead .sorting_asc_disabled, #testResultsTable thead .sorting_desc_disabled {\n    background-position: center left;\n}\n#testResultsTable thead > tr > th.sorting_asc, #testResultsTable thead > tr > th.sorting_desc, #testResultsTable thead > tr > th.sorting, #testResultsTable thead > tr > td.sorting_asc, #testResultsTable thead > tr > td.sorting_desc, #testResultsTable thead > tr > td.sorting {\n    padding-left: 1.5em;\n}\n\n@media screen and (max-width: 580px) {\n  .test-results, .services {\n    overflow-x: scroll;\n    border: 1px solid #ddd;\n    -webkit-border-radius: 4px;\n    -moz-border-radius: 4px;\n    -ms-border-radius: 4px;\n    -o-border-radius: 4px;\n    border-radius: 4px;\n    padding: 1em;\n  }\n}\n/*------------------------------------------------------------------------------\n\n    Forms\n\n------------------------------------------------------------------------------*/\nlabel {\n  color: #4d565b;\n}\n\n.inline-label {\n  display: inline;\n}\n\nfieldset {\n  border-color: #ddd;\n  background-color: #f7f7f7;\n  padding-top: 1em;\n  padding-bottom: 1em;\n  margin-bottom: 1.5em;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n}\n\ninput[type=\"text\"],\ninput[type=\"password\"],\ninput[type=\"date\"],\ninput[type=\"datetime\"],\ninput[type=\"datetime-local\"],\ninput[type=\"month\"],\ninput[type=\"week\"],\ninput[type=\"email\"],\ninput[type=\"number\"],\ninput[type=\"search\"],\ninput[type=\"tel\"],\ninput[type=\"time\"],\ninput[type=\"url\"],\ninput[type=\"color\"],\ntextarea,\nselect {\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n}\n\n.inline-input {\n  display: inline !important;\n  width: auto;\n}\n\n.advanced_params { \n  padding-top: 4px;\n  display: none;\n}\n\n/*------------------------------------------------------------------------------\n\n    Alerts\n\n------------------------------------------------------------------------------*/\n/* Altert colors */\n.alert-success {\n  color: #a2d4ba;\n}\n\n.alert-message {\n  color: #f3dda8;\n}\n\n.alert-failure {\n  color: #f7a9a1;\n}\n\n.alert-disabled {\n  color: #919ca1;\n}\n\n.alert-message--bg {\n  background-color: #f3dda8;\n}\n\n.alert-failure--bg {\n  background-color: #f7a9a1;\n}\n\n/* Block alerts - these will fill the full width of the parent container */\n.alert-small-success, .alert-small-success--inline {\n  position: relative;\n  display: block;\n  margin: 1em 0;\n  padding: .2em .45em;\n  background-color: #a2d4ba;\n  color: #698978;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n}\n.alert-small-success i, .alert-small-success--inline i {\n  color: #698978;\n}\n\n.alert-small-message, .alert-small-message--inline {\n  position: relative;\n  display: block;\n  margin: 1em 0;\n  padding: .2em .45em;\n  background-color: #f3dda8;\n  color: #9d8f6d;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n}\n.alert-small-message i, .alert-small-message--inline i {\n  color: #9d8f6d;\n}\n\n.alert-small-failure, .alert-small-failure--inline {\n  position: relative;\n  display: block;\n  margin: 1em 0;\n  padding: .2em .45em;\n  background-color: #f7a9a1;\n  color: #a06d68;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n}\n.alert-small-failure i, .alert-small-failure--inline i {\n  color: #a06d68;\n}\n\n/* Inline Alerts - these will display inline and will only be the width of the content inside */\n.alert-small-success--inline {\n  display: inline-block;\n}\n\n.alert-small-message--inline {\n  display: inline-block;\n}\n\n.alert-small-failure--inline {\n  display: inline-block;\n}\n\n.alert-small-failure a, .alert-small-failure--inline a,\n.alert-small-message a,\n.alert-small-message--inline a,\n.alert-small-success a,\n.alert-small-success--inline a {\n  color: #383f44;\n}\n.alert-small-failure a:hover, .alert-small-failure--inline a:hover,\n.alert-small-message a:hover,\n.alert-small-message--inline a:hover,\n.alert-small-success a:hover,\n.alert-small-success--inline a:hover {\n  color: #9b9fa1;\n}\n\n.alert--dismiss {\n  display: inline-block;\n  position: absolute;\n  top: 0;\n  right: .65em;\n}\n\n/*------------------------------------------------------------------------------\n\n    Buttons\n\n------------------------------------------------------------------------------*/\n\nbutton:hover, button:focus {\n  background-color: #8f9699;\n}\n\nbutton,\ninput[type=\"submit\"],\ninput[type=\"button\"],\n.button-primary,\n.button-primary--small,\n.button-secondary,\n.button-secondary:hover,\n.button-secondary--small,\n.button-secondary--small:hover,\n.button-alternate,\n.button-alternate:hover,\n.button-alternate--small,\n.button-alternate--small:hover,\ninput.button-primary,\ninput.button-primary--small,\ninput.button-secondary,\ninput.button-secondary--small,\ninput.button-alternate,\ninput.button-alternate--small {\n  display: inline-block;\n  padding: .25em .45em;\n  line-height: 1.65;\n  min-width: 120px;\n  min-height: 37px;\n  color: white;\n  background-color: #0089ff;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  appearance: none;\n  border: none;\n  font-family: \"Open Sans\", \"Helvetica Neue\", \"Helvetica\", Arial, sans-serif;\n  text-decoration: none;\n  text-align: center;\n  border-radius: 4px;\n}\n\n.button-primary,\n.button-primary--small,\ninput.button-primary,\ninput.button-primary--small {\n  background-color: #0089ff;\n}\n.button-primary:hover,\n.button-primary--small:hover,\ninput.button-primary:hover,\ninput.button-primary--small:hover {\n  background-color: #0074d8;\n}\n\ninput[type='button']:disabled, input[type='button']:disabled.cancel, input[type='submit']:disabled {\n    color:#ddd;\n    border-color:#ddd;\n}\n\ninput[type='button']:disabled.button-primary,\ninput[type='submit']:disabled.button-primary  {\n    background-color: rgba(0, 137, 255, 0.81);\n}\n\ninput[type='button']:disabled.button-primary.cancel, input[type='button']:disabled.button-primary.cancel:hover {\n    background-color: rgba(0, 0, 0, 0.1);\n}\n\n.button-secondary,\n.button-secondary--small,\ninput.button-secondary,\ninput.button-secondary--small {\n  background-color: #32a066;\n}\n.button-secondary:hover,\n.button-secondary--small:hover,\ninput.button-secondary:hover,\ninput.button-secondary--small:hover {\n  background-color: #2a8856;\n}\n\n.button-alternate,\n.button-alternate--small,\ninput.button-alternate,\ninput.button-alternate--small {\n  background-color: #ef402f;\n}\n.button-alternate:hover,\n.button-alternate--small:hover,\ninput.button-alternate:hover,\ninput.button-alternate--small:hover {\n  background-color: #cb3627;\n}\n\n.button-quiet,\n.button-quiet--small,\ninput.button-quiet,\ninput.button-quiet--small {\n  background-color: transparent;\n  border: 1px solid #919ca1;\n  color: #4d565b;\n}\n.button-quiet:hover,\n.button-quiet--small:hover,\ninput.button-quiet:hover,\ninput.button-quiet--small:hover {\n  background-color: #8f9699;\n}\n\n.button-primary--small,\n.button-secondary--small,\n.button-alternate--small,\ninput.button-primary--small,\ninput.button-secondary--small,\ninput.button-alternate--small {\n  padding: .25em .45em;\n  line-height: 1.65;\n}\n\n.button-primary.hollow, input[type='button'].cancel {\n  display: inline-block;\n  background-color: transparent;\n  border: 1px solid #fff;\n  color: #fff;\n  text-decoration: none;\n  padding: .25em .5em;\n  border-radius: 4px;\n  margin: 0;\n}\n.button-primary.hollow:hover, input[type='button']:enabled.cancel:hover {\n  background-color: #f7f7f7;\n  border-color: #f7f7f7;\n  color: #383f44;\n}\n\n.button-secondary--form-align,\n.button-primary--form-align,\n.button-quiet--form-align {\n  margin-top: 1.5em;\n  width: 100%;\n}\n\n/*\n * Button modifiers\n*/\n\n\n/*\n * This class will make a button take up the full width\n * of it's parent container.\n*/\n.button--full-width {\n    display: block;\n    width: 100%\n}\n\n/*\n**  Overide Foundation dropdown buttons\n*/\n\n.dropdown.button::after, button.dropdown::after {\n  border-color: #444 transparent transparent transparent;\n}\n\n.f-dropdown {\n  background-color: rgba(255, 255, 255, 0.95);\n  border: none;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n  -webkit-box-shadow: 0px 2px 2px #ccc;\n  -moz-box-shadow: 0px 2px 2px #ccc;\n  -o-box-shadow: 0px 2px 2px #ccc;\n  box-shadow: 0px 2px 2px #ccc;\n}\n\n.f-dropdown a {\n  text-decoration: none;\n}\n\n/*\n** Disabled states for Config buttons\n*/\n\ninput[type='button']:disabled.button-primary, input[type='submit']:disabled.button-primary {\n  background-color: #999;\n  color: #666;\n  border: none;\n}\n\ninput[type='button']:disabled.button-primary:hover, input[type='submit']:disabled.button-primary:hover {\n  background-color: #999;\n  border-color: #999;\n  color: #666;\n  cursor: default;\n}\n\ninput[type='button']:disabled.button-primary--hollow {\n  border: 1px solid #999;\n  color: #888;\n  background-color:transparent;\n}\n\ninput[type='button']:disabled.button-primary--hollow:hover {\n  background-color: transparent;\n  border-color: #999;\n  color: #888;\n  cursor: default;\n}\n\n.button-dropdown {\n\n}\n\n/*\n**  Button group\n*/\n\n.button-group {\n  padding: 1em 0;\n}\n\n.button-group-testing {\n    float:right;\n}\n\n.button-group button, .button-group-testing button {\n  margin-right: 1em;\n}\n\n.overview {\n  background-color: #f7f7f7;\n  position: relative;\n  padding: 1em 1em 1em 2em;\n  margin: 1em 0;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n  border: 1px solid #dedede;\n}\n\n.overview--no-pad {\n    padding-left: 0;\n    padding-right: 0;\n}\n\n.overview--list {\n  margin-bottom: 0;\n}\n.overview--list dt, .overview--list dd {\n  float: left;\n  margin-bottom: 0;\n}\n.overview--list dt {\n  clear: both;\n  margin-right: .65em;\n}\n\n.overview--list:after {\n  content: \"\";\n  clear: both;\n  display: block;\n}\n\n.overview--title {\n  font-size: 1.75em;\n  line-height: 1.2;\n  font-weight: 700;\n  margin-bottom: .65em;\n}\n.overview--title i {\n  margin-left: -20px;\n  color: #ef402f;\n}\n\n.overview--edit {\n  position: absolute;\n  display: inline-block;\n  top: 0;\n  right: 0;\n  padding: .75em 1em;\n  color: #0089ff;\n  text-decoration: none;\n}\n.overview--edit i {\n  color: #0089ff;\n}\n.overview--edit:hover {\n  text-decoration: underline;\n  color: #a5d5ff;\n}\n.overview--edit:hover i {\n  text-decoration: underline;\n  color: #a5d5ff;\n}\n\n/* Module header block */\n.module-header {\n  position: relative;\n  padding: .5em;\n  background-color: #4d565b;\n}\n\n.module-header__title {\n  font-size: 1.25em;\n}\n\n.module-header .module-header__title {\n  margin: 0;\n}\n\n.module-header__action {\n  position: absolute;\n  display: inline-block;\n  top: 0;\n  right: 0;\n  padding: .6em .75em;\n  border-left: 1px solid #353b40;\n  color: #f7f7f7;\n  text-decoration: none;\n}\n.module-header__action:hover i {\n  color: #a5d5ff;\n}\n.module-header__action i {\n  color: #f7f7f7;\n}\n\n@media screen and (max-width: 580px) {\n  .module-header .module-header__action {\n    display: block;\n    position: relative;\n    top: 0;\n    border-left: none;\n    padding: 0;\n  }\n\n  .module-header .module-header__title {\n    display: block;\n  }\n}\n/*------------------------------------------------------------------------------\n\n    Aside - Components/modules use in sidebars, etc. for secondary\n    or subordinate information.\n\n------------------------------------------------------------------------------*/\n.aside {\n  position: relative;\n  margin: 2em 0;\n  background-color: #f7f7f7;\n  border: 1px solid #DDDDDD;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n}\n.aside a:hover {\n  color: #a5d5ff;\n}\n\n.aside__heading {\n  font-size: 1em;\n  font-weight: 700;\n  padding: .825em;\n  margin-top: 0;\n  background-color: #ddd;\n}\n\n.aside__list {\n  display: block;\n  list-style-type: none;\n  margin: 0;\n  padding: .825em;\n}\n\n.aside__list li {\n  padding: .35em 0;\n}\n.aside__list li:after {\n  content: \"\";\n  clear: both;\n  display: block;\n}\n.aside__list li:first-child {\n  padding-top: 0;\n}\n\n.aside__list li a {\n  text-decoration: none;\n}\n\n.aside--nav-list {\n  list-style-type: none;\n  margin: 0 0 1em 0;\n}\n.aside--nav-list li {\n  border-bottom: 1px solid #3d4448;\n  padding: .35em 0;\n}\n.aside--nav-list li:last-child {\n  border-bottom: none;\n}\n.aside--nav-list li a {\n  text-decoration: none;\n  color: #919ca1;\n}\n.aside--nav-list li a:hover {\n  text-decoration: underline;\n}\n.aside--nav-list li a i {\n  color: #919ca1;\n}\n\n/*------------------------------------------------------------------------------\n\n    Sticky bar\n\n------------------------------------------------------------------------------*/\n.sticky-bar {\n  position: fixed;\n  bottom: 0;\n  right: 0;\n  /*text-align: center;*/\n  width: 100%;\n  height: 70px;\n  font-size: 1.15em;\n}\n\n.sticky-bar__message {\n  display: inline-block;\n}\n\n.js-unsaved-message {\n  display: none;\n}\n\n.sticky-bar--unsaved {\n  background: rgba(56, 63, 68, 0.85);\n  /*display: none;*/\n  color: #ffffff;\n  padding-top: 1.15em;\n}\n\n.sticky-bar--saved {\n  background-color: #32a066;\n  color: #fff;\n  display: none;\n  padding-top: 1.5em;\n}\n\n.sticky-bar--failure {\n  /*background-color: #ef402f;*/\n  background-color: #f7a9a1;\n  color: #a06d68;\n  display: none;\n  padding-top: 1.5em;\n}\n\n.sticky-bar--failure a {\n  color: #383f44;\n}\n\n.sticky-bar--failure a:hover {\n  text-decoration: none;\n}\n\n.sticky-bar__message {\n  margin-right: 1em;\n  padding-left: 2.35em;\n}\n\n.sticky-bar__dismiss {\n  position: absolute;\n  right: 1.4em;\n  top: 1.4em;\n}\n\n.sticky-bar__dismiss a {\n  text-decoration: none;\n}\n\n.sticky-bar__dismiss i:hover {\n  color: #a06d68;\n}\n\n/* ** Get rid of this thing once you figure out a better place\nto put the stuff inside. */\n.module {\n  margin: 2em 0 1em 0;\n}\n\n.module--config-table {\n  margin-top: 1em;\n}\n\n.dashboard-main {\n  width: 75%;\n  padding: 1em 3em 0 2em;\n  float: left;\n}\n\n.config-panel-wrapper {\n  max-width: 1080px;\n  padding: 2em 1em;\n  margin: 0 auto;\n}\n\n.config-panel-wrapper div.actions {\n    text-align:center;\n}\n\n.config-panel-wrapper div.actions a {\n    margin:1em;\n}\n\n.config-panel-wrapper .config__form label {\n    /* width:70px; */\n}\n\n.config-panel-wrapper .config__form dl dt input[type=checkbox] {\n    margin:0;\n}\n\n.uninstalled {\n    color:#999;\n}\n\n.config-panel-wrapper .config__form dl dt {\n    float:left;\n    clear:left;\n    width:7em;\n}\n\n.config-panel-wrapper .config__form dl dd {\n}\n\n.config-panel-wrapper span.label-description {\n    /*position:absolute;\n    left:10em;*/\n    /* margin-right:0.5em; */\n}\n\n@media screen and (max-width: 850px) {\n  .dashboard-main {\n    float: none;\n    width: 100%;\n    padding: 1em;\n  }\n}\n/* Key for icons */\n.key {\n  color: #919ca1;\n  margin-top: 1.5em;\n}\n\n.key__items {\n  list-style-type: none;\n  margin: 0;\n}\n\n.key__item {\n  display: inline-block;\n  margin-right: 1em;\n  font-size: .875em;\n}\n\n.key__item:last-child {\n  margin-right: 0;\n}\n\n.key__item--normal i {\n  color: #ef402f;\n}\n\n.key__item--vm i {\n  color: #e5b53e;\n}\n\n.key__item--small i {\n  color: #32a066;\n}\n\n/*------------------------------------------------------------------------------\n\n    Tab navigation\n\n------------------------------------------------------------------------------*/\n.nav-tabs {\n  display: block;\n  margin-top: 1em;\n  border-bottom: 1px solid #ddd;\n}\n\n.nav-tabs__panel {\n  border: 1px solid #ddd;\n  border-right: none;\n  border-bottom: none;\n  margin-right: -4px;\n}\n.nav-tabs__panel:first-child {\n  border-top-left-radius: 4px;\n}\n.nav-tabs__panel:last-child {\n  border-right: 1px solid #ddd;\n  border-top-right-radius: 4px;\n}\n.nav-tabs__panel a {\n  background-color: #f7f7f7;\n  display: inline-block;\n  text-decoration: none;\n  padding: .5em 1em;\n  color: #0089ff;\n}\n.nav-tabs__panel a:hover {\n  background-color: #f1f1f1;\n  color: #a5d5ff;\n}\n\n.nav-tabs__panel--active a, .nav-tabs__panel.active a {\n  background-color: #ddd;\n  cursor: default;\n  color: #999;\n  border-color: #0089ff;\n}\n.nav-tabs__panel--active, .nav-tabs__panel.active a:hover {\n  background-color: #ddd;\n  color: #999;\n}\n\n/*------------------------------------------------------------------------------\n\n    Config forms\n\n------------------------------------------------------------------------------*/\n.config__form {\n  padding: 2em 0;\n  margin-bottom: 6em;\n}\n\n.config__breadcrumbs {\n    /*background-color: #f7f7f7;*/\n    padding: .85em;\n    text-align: right;\n}\n\n.config__breadcrumbs a {\n    text-decoration: none;\n}\n\n/*\n  Select2 add servers - Adding a bunch of rules to override conflicts between\n  Foundation and Select2 plugin\n*/\n\n.select2-search__field {\n  box-shadow: none !important;\n  transition: none !important;\n}\n\n.servers input,\n.servers select,\n.servers li {\n  margin: 0;\n}\n\n.select2-container .select2-search--inline .select2-search__field {\n  margin: 0 !important;\n}\n\n/*------------------------------------------------------------------------------\n\n    Communities module\n\n------------------------------------------------------------------------------*/\n.communities,\n.servers {\n  padding: 1em 0;\n}\n.communities:after,\n.servers:after {\n  content: \"\";\n  clear: both;\n  display: block;\n}\n\n.communities__popular,\n.servers__popular, .add_panel {\n  display: none;\n  padding: 1em 0 0 0;\n}\n\n.communities__popular a:hover,\n.servers__popular a:hover {\n  background-color: #32a066;\n}\n\n.communities__popular input,\n.servers__popular input {\n  /*margin: 0;*/\n}\n\n@media screen and (max-width: 850px) {\n  .servers__popular input {\n    margin-bottom: 1em;\n  }\n}\n.communities__node,\n.servers__node {\n  position: relative;\n  border: 1px solid #ddd;\n  -webkit-border-radius: 4px;\n  -moz-border-radius: 4px;\n  -ms-border-radius: 4px;\n  -o-border-radius: 4px;\n  border-radius: 4px;\n  margin: 0 .875em .875em 0;\n  padding-left: .75em;\n  background-color: #f7f7f7;\n  overflow: hidden;\n}\n\n.communities__node a,\n.servers__node a {\n  text-decoration: none;\n  display: inline-block;\n  padding: .25em .5em;\n  margin-left: .5em;\n  font-size: .875em;\n  color: #ef402f;\n  border-left: 1px solid #ddd;\n}\n.communities__node a:hover,\n.servers__node a:hover {\n  background-color: #ef402f;\n  color: white;\n}\n\n/*\n.communities__add,\n.servers__add {\n  display: inline-block;\n  margin: 1em 0;\n}\n*/\n\n.servers__options-list {\n  list-style: none;\n  padding: 0;\n  margin: 1.5em 0;\n}\n\n.servers__options-item {\n  padding: .5em 0;\n}\n\n/* Override Foundation's switch color */\n.switch input:checked + label {\n  background-color: #32a066;\n}\n\n.switch-wrapper {\n  margin-bottom: 3em;\n}\n\n/*------------------------------------------------------------------------------\n\n    Manage NTP servers modal\n\n------------------------------------------------------------------------------*/\n\n.ntp-servers {\n  text-align: left;\n}\n\n.ntp-list {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n  border: 1px solid #ddd;\n  border-radius: 4px;\n  max-height: 500px;\n  overflow: scroll;\n}\n\n.ntp-list__item {\n  border-bottom: 1px solid #ddd;\n  padding: .5em 1em;\n  position: relative;\n}\n\n.ntp-list__item:nth-of-type(2n +1) {\n  background-color: #f7f7f7;\n}\n\n.ntp-list__item:last-child {\n  border-bottom: none;\n}\n\n.ntp-list__title {\n  margin-right: 1em;\n  font-weight: 700;\n}\n\n.ntp-list__description {\n  font-style: italic;\n  color: #919ca1;\n}\n\n.ntp-list__delete {\n  color: #ef402f;\n  position: absolute;\n  top: .7em;\n  right: 1em;\n  text-decoration: none;\n}\n\n.ntp-list__delete:hover {\n  color: #ef402f;\n  text-decoration: underline;\n}\n\n/*------------------------------------------------------------------------------\n\n    Austin's shame\n\n------------------------------------------------------------------------------*/\n.wrapper {\n  overflow: hidden;\n  min-height: 100%;\n  position: relative;\n}\n\n/* Modals */\n\n/*\n * Getting rid of this centered text rule because it is cause weird issues\n * inside the modals on some stuff (like graphs) where elements are set to\n * display: inline-block but the text should not be centere.\n *\n * Use Foundation's .text-center utility class instead on the modals that\n * need to have the text centered.\n\n .reveal-modal {\n   text-align: center;\n }\n\n\n*/\n\n.reveal-modal.loading.ntpclosest {\n    width:80%;\n    margin-left:20%;\n}\n\n.reveal-modal.loading {\n  position: fixed;\n  overflow: hidden;\n  /* top: 50px !important; */\n  top:30% !important;  /* previous value */\n  left:20% !important;\n  height:150px;\n  width:300px;\n  /*bottom: 50% !important; */\n  transform:translate(-40%, 0);\n\n}\n\n.reveal-modal.large {\n  position: fixed;\n  overflow: scroll;\n  top: 50px !important;\n  /* top:50% !important; */ /* previous value */\n  left:50% !important;\n  bottom: 50px !important;\n  transform:translate(-50%, 0);\n\n}\n\n.reveal-modal.xlarge {\n  /*width: 95%;*/\n  position: fixed;\n  overflow: scroll;\n  top: 30px !important;\n/*  left:95% !important;\n  transform:translate(-97%, 0);\n\n  bottom: 50px !important;\n*/\n}\n\n.reveal-modal-bg { position: fixed; }\n\n.reveal-modal__heading {\n  font-weight: 700;\n  font-size: 1.15em;\n  margin-top: 1.5em;\n}\n\n.reveal-modal__heading:first-child {\n  margin-top: 0;\n  margin-bottom: 1em;\n}\n\n.reveal-modal__heading--large {\n    font-size: 2em;\n    border-bottom: 1px solid #ddd;\n}\n\n.reveal-modal .close-reveal-modal {\n  font-size: 1.5em;\n}\n\n/*\n**  Test config table styling\n*/\n\n.subrow td {\n  /*padding-left: 3.5em;*/\n  /*background-color: #eee;*/\n  line-height: 1.25em;\n}\n\n.subrow input {\n  margin: 0;\n}\n\n.subrow--heading td {\n  background-color: #ddd;\n  border-top: 1px solid #ccc;\n  color: #888;\n  text-transform: uppercase;\n  letter-spacing: 2px;\n  padding: .25em .5em;\n}\n\n.subrow--content {\n  border-top: 1px solid #ddd;\n}\n\n.subrow--indent td:first-child {\n  padding-left: 3em;\n}\n\n/*.subrow--content td:first-child {\n  padding-left: 3em;\n}*/\n\n.subrow--content td a {\n  display: inline-block;\n  margin-right: 1em;\n  color: #383f44;\n}\n\n.subrow--content td a:hover {\n  color: #999;\n}\n\n.subrow--content td:first-child {\n  font-weight: 700;\n}\n\n.new-host-save {\n  display: none;\n}\n\ntable .has-tip {\n    border-bottom:none;\n    font-weight:inherit;\n    color:inherit;\n}\n\ntable .has-tip:hover {\n    border-bottom:none;\n}\n", ""]);

/***/ }),

/***/ 981:
/*!*******************************!*\
  !*** ../html/css/spinner.css ***!
  \*******************************/
/***/ (function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(/*! !../../react/~/css-loader!./spinner.css */ 982);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(/*! ../../react/~/style-loader/addStyles.js */ 902)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!../../react/node_modules/css-loader/index.js!./spinner.css", function() {
				var newContent = require("!!../../react/node_modules/css-loader/index.js!./spinner.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ }),

/***/ 982:
/*!**********************************************!*\
  !*** ./~/css-loader!../html/css/spinner.css ***!
  \**********************************************/
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(/*! ./~/css-loader/cssToString.js */ 901)();
	exports.push([module.id, "#loading {\n    /*position:relative;*/\n    /*top:150px;*/\n    /*left:300px;*/\n    width:200px;\n    margin-left:auto;\n    margin-right:auto;\n    background-color:#ffffff;\n}\n#loading h4 {\n    margin-left:80px;\n    padding-top:20px;\n}\n#circularG{\n    position:relative;\n    float:left;\n    width:64px;\n    height:64px}\n.circularG{\n    position:absolute;\n    background-color:#405E9A;\n    width:15px;\n    height:15px;\n    -moz-border-radius:10px;\n    -moz-animation-name:bounce_circularG;\n    -moz-animation-duration:1.04s;\n    -moz-animation-iteration-count:infinite;\n    -moz-animation-direction:linear;\n    -webkit-border-radius:10px;\n    -webkit-animation-name:bounce_circularG;\n    -webkit-animation-duration:1.04s;\n    -webkit-animation-iteration-count:infinite;\n    -webkit-animation-direction:linear;\n    -ms-border-radius:10px;\n    -ms-animation-name:bounce_circularG;\n    -ms-animation-duration:1.04s;\n    -ms-animation-iteration-count:infinite;\n    -ms-animation-direction:linear;\n    -o-border-radius:10px;\n    -o-animation-name:bounce_circularG;\n    -o-animation-duration:1.04s;\n    -o-animation-iteration-count:infinite;\n    -o-animation-direction:linear;\n    border-radius:10px;\n    animation-name:bounce_circularG;\n    animation-duration:1.04s;\n    animation-iteration-count:infinite;\n    animation-direction:linear;\n}\n\n#circularG_1{\n    left:0;\n    top:25px;\n    -moz-animation-delay:0.39s;\n    -webkit-animation-delay:0.39s;\n    -ms-animation-delay:0.39s;\n    -o-animation-delay:0.39s;\n    animation-delay:0.39s;\n}\n\n#circularG_2{\n    left:7px;\n    top:7px;\n    -moz-animation-delay:0.52s;\n    -webkit-animation-delay:0.52s;\n    -ms-animation-delay:0.52s;\n    -o-animation-delay:0.52s;\n    animation-delay:0.52s;\n}\n\n#circularG_3{\n    top:0;\n    left:25px;\n    -moz-animation-delay:0.65s;\n    -webkit-animation-delay:0.65s;\n    -ms-animation-delay:0.65s;\n    -o-animation-delay:0.65s;\n    animation-delay:0.65s;\n}\n\n#circularG_4{\n    right:7px;\n    top:7px;\n    -moz-animation-delay:0.78s;\n    -webkit-animation-delay:0.78s;\n    -ms-animation-delay:0.78s;\n    -o-animation-delay:0.78s;\n    animation-delay:0.78s;\n}\n\n#circularG_5{\n    right:0;\n    top:25px;\n    -moz-animation-delay:0.91s;\n    -webkit-animation-delay:0.91s;\n    -ms-animation-delay:0.91s;\n    -o-animation-delay:0.91s;\n    animation-delay:0.91s;\n}\n\n#circularG_6{\n    right:7px;\n    bottom:7px;\n    -moz-animation-delay:1.04s;\n    -webkit-animation-delay:1.04s;\n    -ms-animation-delay:1.04s;\n    -o-animation-delay:1.04s;\n    animation-delay:1.04s;\n}\n\n#circularG_7{\n    left:25px;\n    bottom:0;\n    -moz-animation-delay:1.17s;\n    -webkit-animation-delay:1.17s;\n    -ms-animation-delay:1.17s;\n    -o-animation-delay:1.17s;\n    animation-delay:1.17s;\n}\n\n#circularG_8{\n    left:7px;\n    bottom:7px;\n    -moz-animation-delay:1.3s;\n    -webkit-animation-delay:1.3s;\n    -ms-animation-delay:1.3s;\n    -o-animation-delay:1.3s;\n    animation-delay:1.3s;\n}\n\n@-moz-keyframes bounce_circularG{\n    0%{\n        -moz-transform:scale(1)}\n\n    100%{\n        -moz-transform:scale(.3)}\n\n}\n\n@-webkit-keyframes bounce_circularG{\n    0%{\n        -webkit-transform:scale(1)}\n\n    100%{\n        -webkit-transform:scale(.3)}\n\n}\n\n@-ms-keyframes bounce_circularG{\n    0%{\n        -ms-transform:scale(1)}\n\n    100%{\n        -ms-transform:scale(.3)}\n\n}\n\n@-o-keyframes bounce_circularG{\n    0%{\n        -o-transform:scale(1)}\n\n    100%{\n        -o-transform:scale(.3)}\n\n}\n\n@keyframes bounce_circularG{\n    0%{\n        transform:scale(1)}\n\n    100%{\n        transform:scale(.3)}\n\n}\n\n", ""]);

/***/ })

});
//# sourceMappingURL=bundle.js.map