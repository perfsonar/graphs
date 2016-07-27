import React from "react";

import HostInfoStore from "./HostInfoStore";

import "../../css/graphs.css";


export default React.createClass({
    render() {
        return (

        <div className="chartHeader">
                    <div className="overview overview--pad">
                        <div className="row">
                            {/* GRAPH: Source */}
                            <div className="medium-4 columns">
                                <label htmlFor="source">Source:</label>
                                <select className="no-margin" name="source" id="source">
                                    <option>Source One</option>
                                    <option>Source Two</option>
                                    <option>Source Three</option>
                                </select>

                                {/* GRAPH: Source Host Info*/}
                                <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

                                <div className="sidebar-popover sidebar-popover--overview">
                                    <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                                    <h4 className="sidebar-popover__heading">Host inhtmlFormation</h4>
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
                                <label htmlFor="destination">Destination:</label>
                                <select className="no-margin" name="destination" id="destination">
                                    <option>Destination One</option>
                                    <option>Destination Two</option>
                                    <option>Destination Three</option>
                                </select>

                                {/* GRAPH: Destination Host Info*/}
                                <a className="js-sidebar-popover-toggle"href="#">Host info <i className="fa fa-angle-down"></i></a>

                                <div className="sidebar-popover sidebar-popover--overview">
                                    <a className="sidebar-popover__close js-sidebar-popover-close">Close &nbsp;<i className="fa fa-close"></i></a>
                                    <h4 className="sidebar-popover__heading">Host inhtmlFormation</h4>
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
                                <label>Report range</label>
                                <button className="button-quiet button--full-width">Wed May 4, 2016 - Mon May 16, 2016 <i className="fa fa-calendar"></i></button>
                            </div>
                        </div> {/* End row */}
                    </div> {/* End overview */}

        {/* End chartHeader */}
        </div> 
        ); // End render()
    }

});
