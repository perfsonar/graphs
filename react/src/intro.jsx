import React from "react";

export default React.createClass({


    getInitialState() {
        return {
            content: "Text!"
        };
    },

    render() {
        return (
            <div>
                <div className="row">
                    <div className="col-md-12">
                        <h2>Introduction</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        {this.state.content}
                        <Link to="chart1webservice">Chart1webservice</Link>
                    </div>
                </div>
            </div>
        );
    }
});
