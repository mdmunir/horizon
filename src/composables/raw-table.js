
import format from '@/composables/format';

function tableHeader(columns, options) {
    const lines = [];
    const labels = [];
    columns.forEach(column => {
        let width = column.width || 16;
        lines.push('*'.padStart(width, '*'));
        let str = (column.label || column.name).align('center', width);
        labels.push(str.substring(0, width));
    });
    
    if(options.headerLine === false){
        return labels.join('  ');
    }else{
        return [lines.join('**'),labels.join('  '),lines.join('**')].join('\n');
    }
};

/**
 * 
 * @param {Object} row 
 * @param {string} key 
 */
function getValue(obj, path, defaultValue = undefined) {
    if(!path){
        return obj;
    }
    for (const key of path.split('.')) {
        if (obj == null) {
            return defaultValue;
        }
        obj = obj[key];
    }
    return obj ?? defaultValue;
}

const tableRows = (columns, data) => {
    return data.map((row, idx) => {
        const line = [];
        columns.forEach(column => {
            let val = getValue(row, column.field || column.name);
            if (column.format) {
                if (typeof column.format === 'function') {
                    val = column.format(val, row, idx);
                } else {
                    val = format(val, column.format);
                }
            }
            let str = (val === null || val === undefined) ? '' : val.toString();
            let width = column.width || 16;
            str = str.align(column.align || 'left', width);
            line.push(str.substring(0,width));
        });
        return line.join('  ');
    }).join('\n');
};

export function rawTable(data, columns, options){
    const contents = [];
    const opts = options || {};
    if(opts.header){
        contents.push(opts.header);
    }
    if(opts.showHeader !== false){
        contents.push(tableHeader(columns, opts));
    }
    contents.push(tableRows(columns, data || []));
    if(opts.footer){
        contents.push(opts.footer);
    }
    return contents.join('\n');
}

export function downloadText(content, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || 'output.txt';
    a.click();

    URL.revokeObjectURL(url);
}

export function copyClipboard(content) {
    const blob = new Blob([content], { type: "text/plain" });
    const data = [new ClipboardItem({ "text/plain": blob })];
    navigator.clipboard.write(data);
    $bus.emit('toast', 'Copy to clipboard');
}