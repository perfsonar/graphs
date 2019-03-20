import React from "react";
import "../css/graphs.css";

export default React.createClass({
  render() {
    return (
	
	<div className='popup_inner'>
          <div className="pop_close"><a href="#" onClick={this.props.closePopup} ><i className="fa fa-close"></i></a></div>

	  
	  <div className="pop_cell">
	  <input type="checkbox"/> Summary Window<br/><br/>
          <input type="checkbox"/> Interpolation<br/><br/>
          <input type="checkbox"/> Log scale
	  </div>
	  
        </div>
    );
  }
});
