import React from "react";

import HostInfoStore from "./HostInfoStore";

import InterfaceInfoStore from "./InterfaceInfoStore";

import "../../css/graphs.css";


export default React.createClass({
    hostInfo: [],
    getInitialState() {
        return {
            showHostSelectors: false,
            sources: [],
            dests: []
        };
    },
    render() {
        return (

        <div className="chartHeader">
                    <div className="overview overview--pad">
                        <div className="row">
                            {/* GRAPH: Source */}
                            <div className="medium-4 columns">
                                {this.renderHostList("source", "Source")}

                                {/* GRAPH: Source Host Info*/}
                                <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

                                <div className="sidebar-popover sidebar-popover--overview">
                                    <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                                    <h4 className="sidebar-popover__heading">Host information</h4>
                                    <ul className="sidebar-popover__list">
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">IP:</span>
                                            <span className="sidebar-popover__value">1 GB</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">Capacity:</span>
                                            <span className="sidebar-popover__value">140.182.44.162</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">MTU:</span>
                                            <span className="sidebar-popover__value">2001:18e8:3:10:8000::1</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param"><a href="#">View traceroute graph</a></span>
                                        </li>
                                    </ul>
                                </div>

                            </div>

                            {/* GRAPH: Destination */}
                            <div className="medium-4 columns">
                                {this.renderHostList("dest", "Destination")}


                                {/* GRAPH: Destination Host Info*/}
                                <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

                                <div className="sidebar-popover sidebar-popover--overview">
                                    <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                                    <h4 className="sidebar-popover__heading">Host information</h4>
                                    <ul className="sidebar-popover__list">
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">IP:</span>
                                            <span className="sidebar-popover__value">1 GB</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">Capacity:</span>
                                            <span className="sidebar-popover__value">140.182.44.162</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param">MTU:</span>
                                            <span className="sidebar-popover__value">2001:18e8:3:10:8000::1</span>
                                        </li>
                                        <li className="sidebar-popover__item">
                                            <span className="sidebar-popover__param"><a href="#">View traceroute graph</a></span>
                                        </li>
                                    </ul>
                                </div>

                            </div>

                            {/* GRAPH: Reporting range */}
                            <div className="medium-4 columns">
                                <label className="hostLabel">Report range</label>
                                <button className="button-quiet button--full-width">Wed May 4, 2016 - Mon May 16, 2016 <i className="fa fa-calendar"></i></button>
                            </div>
                        </div> {/* End row */}
                    </div> {/* End overview */}

        {/* End chartHeader */}
        </div> 
        ); // End render()
    },
    renderHostList: function( type, label ) {
        if ( this.state.showHostSelectors ) {
            return (
                <div>
                                <label htmlFor="source">Source:</label>
                                <select className="no-margin" name="source" id="source">
                                    <option>Source One</option>
                                    <option>Source Two</option>
                                    <option>Source Three</option>
                                </select>
                </div>
               );
        } else {
            let hostInfo = this.hostInfo;
            let hosts = [];
            if ( hostInfo.length > 0 ) {
                for( var i in hostInfo ) {
                    let row = hostInfo[i];
                    hosts.push( 
                            <div className="hostname" key="hostname">{row[ type + "_host"]}</div>,
                            <div className="address" key="ip">{row[ type + "_ip"]}</div>
                            );

                }
            } else {
                hosts.push( <div className="hostname"></div>, <div className="address"></div> );
            }
            if ( hostInfo.length > 1 ) {
                label += "s";
            }
            return (
                    <div>
                                    <div className="hostLabel">{label}</div>
                                    {hosts}
                    </div>
                   );
        }
    },
    componentDidMount: function() {
            HostInfoStore.subscribe(this.updateChartHeader);
            InterfaceInfoStore.retrieveInterfaceInfo( this.props.sources, this.props.dests );

    },
    componentWillUnmount: function() {
        //this.serverRequest.abort();
        HostInfoStore.unsubscribe( this.updateChartHeader );
    },
    updateChartHeader: function() {
        console.log("updating chart header");
        let hostInfo = HostInfoStore.getHostInfoData();
        console.log("hostInfo", hostInfo);
        //this.setState({hostInfo: hostInfo});
        this.hostInfo = hostInfo;
        this.forceUpdate();

    }


});
