import React from "react";

export default React.createClass({
    render () {
        return (
                <span>{ this.formatValue() }</span>
               );
    },
    formatValue() {
        let value = this.props.value;
        if ( isNaN(value ) ) {
            return value;
        }
        let iec = this.props.iec || false;
        let si = !iec;
        let suffix = this.props.unit || '';
        var thresh = si ? 1000 : 1024;
        if(Math.abs(value) < thresh) {
            return value + ' B';
        }
        var units = si
            ? ['k','M','G','T','P','E','Z','Y']
            : ['Ki','Mi','Gi','Ti','Pi','Ei','Zi','Yi'];
        var u = -1;
        do {
            value /= thresh;
            ++u;
        } while(Math.abs(value) >= thresh && u < units.length - 1);
        return value.toFixed(1)+' '+units[u] + suffix;
    }
});
