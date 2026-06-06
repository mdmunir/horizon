import moment from "moment";
/**
 * 
 * @param {any} val 
 * @param {String|Function} format 
 * @returns {String}
 */
export default function format(val, format) {
    if (typeof format === 'function') {
        return format(val);
    } else if (typeof format === 'string') {
        if(val === null || val === undefined){
            return val;
        }
        const match = format.match(/^(\w+)(\|(.+))?$/);
        if (match) {
            switch (match[1]) {
                case 'rad':
                    return parseFloat(val).toFixed(match[3] || 6);
                case 'deg':
                    return (val * 180 / Math.PI).toFixed(match[3] || 6);
                case 'dms':
                    return parseFloat(val).dms(match[3] || 2);
                case 'hms':
                    return parseFloat(val).hms(match[3] || 2);
                case 'dmsc':
                    return parseFloat(val).dms(match[3] || 2,true);
                case 'hmsc':
                    return parseFloat(val).hms(match[3] || 2,true);
                case 'moment':
                    return moment(val).format(match[3] || 'YYYY-MM-DD');
                case 'utc':
                    return moment(val).utc().format(match[3] || 'YYYY-MM-DD');
                case 'fixed':
                    return parseFloat(val).toFixed(match[3] || 6);
            }
        }
    }
    return (val === null || val === undefined) ? val : val.toString();
}