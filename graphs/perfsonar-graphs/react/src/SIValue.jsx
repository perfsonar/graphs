import React from "react";

export default React.createClass({
    render () {
        return (
                <span>{ this.formatValue() }</span>
               );
    },
    formatValue() {
        let value = this.props.value;
        let digits = this.props.digits || 1;
        if ( isNaN(value ) ) {
            return value;
        }
        let iec = this.props.iec || false;
        let si = !iec;
        let suffix = this.props.unit || '';
        var thresh = si ? 1000 : 1024;
        if(Math.abs(value) < thresh) {
            return value + ' ';
        }
        var units = si
            ? ['k','M','G','T','P','E','Z','Y']
            : ['Ki','Mi','Gi','Ti','Pi','Ei','Zi','Yi'];
        var u = -1;
        do {
            value /= thresh;
            ++u;
        } while(Math.abs(value) >= thresh && u < units.length - 1);
        return value.toFixed( digits )+' '+units[u] + suffix;
    }
});
