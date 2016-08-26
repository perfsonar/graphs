import React from "react";

import HostInfoStore from "./HostInfoStore";

import InterfaceInfoStore from "./InterfaceInfoStore";

import SIValue from "./SIValue";

import "../../css/graphs.css";

// TODO: add traceroute calls/links

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
                            </div>

                            {/* GRAPH: Destination */}

                            <div className="medium-4 columns">
                                {this.renderHostList("dest", "Destination")}
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
                            <div className="hostname" key={"hostname"+label+i}>{row[ type + "_host"]}</div>,
                            <div className="address" key={"ip"+label+i}>{row[ type + "_ip"]}</div>,
                            <div key={"detailedInfo"+label+i}>{this.showDetailedHostInfo( row[type + "_ip" ] )}</div>
                            );

                }
            } else {
                hosts.push( <div className="hostname" key={"nohostname"+label}></div>, <div className="address" key={"noaddress"+label}></div> );
            }
            if ( hostInfo.length > 1 ) {
                label += "s";
            }
            return (
                    <div>
                                    <div className="hostLabel" key={"hostLabel"+label}>{label}</div>
                                    {hosts}
                    </div>
                   );
        }
    },
    showDetailedHostInfo: function( host ) {
        let details = InterfaceInfoStore.getInterfaceDetails( host );
            {/* GRAPH: Detailed Host Info*/}
            return (
        <div>
            <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

            <div className="sidebar-popover sidebar-popover--overview">
                <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                <h4 className="sidebar-popover__heading">Host details</h4>
                <ul className="sidebar-popover__list">
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">Addresses:</span>
                        <span className="sidebar-popover__value">{details.addresses}</span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">Capacity:</span>
                        <span className="sidebar-popover__value"><SIValue value={details.capacity} /></span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param">MTU:</span>
                        <span className="sidebar-popover__value">{details.mtu}</span>
                    </li>
                    <li className="sidebar-popover__item">
                        <span className="sidebar-popover__param"><a href="#">View traceroute graph</a></span>
                    </li>
                </ul>
            </div>
        </div>
        );

    },
    componentDidMount: function() {
            HostInfoStore.subscribe(this.updateChartHeader);
            InterfaceInfoStore.subscribe(this.updateChartHeader);
            InterfaceInfoStore.retrieveInterfaceInfo( this.props.sources, this.props.dests );

    },
    componentWillUnmount: function() {
        //this.serverRequest.abort();
        HostInfoStore.unsubscribe( this.updateChartHeader );
        InterfaceInfoStore.unsubscribe( this.updateChartHeader );
    },
    updateChartHeader: function() {
        let hostInfo = HostInfoStore.getHostInfoData();
        this.hostInfo = hostInfo;
        this.forceUpdate();

    }


});
