import { readdirSync, writeFileSync } from "fs";
import { dirname, resolve, extname, sep } from "path";

function listFiles(dir, prefix = '/') {
    const fullPath = resolve(dir);
    const entries = readdirSync(fullPath, { withFileTypes: true });
    const results = {};

    for (const entry of entries) {
        const res = resolve(fullPath, entry.name);
        if (entry.isDirectory()) {
            Object.assign(results, listFiles(res, prefix + entry.name + '/'));
        } else if (extname(res) == ".vue") {
            results[(prefix + entry.name).replace(/\.vue$/, '')] = res;
        }
    }
    return results;
}

/**
 * 
 * @param {Object} pages 
 * @returns Object[]
 */
function buildRoutes(pages) {
    const routes = {};
    Object.entries(pages).forEach(([path, page]) => {
        var matches = path.match(/^(?<key>[^\@\$]+)(\@(?<layout>[\w\-]+))?(\$(?<view>[\w\-]+))?$/);
        if (matches) {
            var { key, view, layout } = matches.groups;
            view = view || 'default';
            if (routes[key]) {
                routes[key].components[view] = `<<${page}>>`;
                routes[key].props[view] = true;
            } else {
                var p = key.replace(/\[\[([\w\-]+)\]\]\+/g, ':$1*')
                    .replace(/\[\[([\w\-]+)\]\]/g, ':$1?')
                    .replace(/\[([\w\-]+)\](\+)?/g, ':$1$2')
                    .replace(/\[\.\.\.([\w\-]+)\]/g, ':$1(+*)')
                    .replace(/\./g, '/')
                    .replace('(+*)', '(.*)')
                    .replace(/\([\w\-]+\)/g, '')
                    .replace(/\/index$/, '')
                    .replace(/\/+/g, '/')
                    .replace(/\/+$/, '');
                if (p == '') {
                    p = '/';
                }
                routes[key] = {
                    path: p,
                    name: key,
                    components: { [view]: `<<${page}>>` },
                    props: { [view]: true },
                };
            }
            if(layout){
                routes[key].meta = {layout: layout};
            }
        }
    });

    const keys = Object.keys(routes).sort();
    /**
     * 
     * @param {string} key 
     * @returns Object[]
     */
    function getChildren(key) {
        const children = [];
        keys.filter(s => s.startsWith(key + '/')).sort().forEach(k => {
            if (routes[k]) {
                const child = routes[k];
                const subChildren = getChildren(k);
                if (subChildren.length) {
                    child.children = subChildren;
                }
                children.push(child);
                delete routes[k];
            }
        });
        return children;
    }
    return getChildren('');
}

export default function AutoRoute(options) {
    
    function applyImport(content, lazy, aliases) {
        function toRelative(f) {
            for (let i = 0; i < aliases.length; i++) {
                if (f.startsWith(aliases[i].path)) {
                    return aliases[i].alias + f.substring(aliases[i].length);
                }
            }
            return f;
        }
        const REGEX_IMPORT1 = /import (\w+) from \"(.+)\";$/gm;
        const REGEX_IMPORT2 = /\"\<\<([^\>]+)\>\>\"/g;
        content = content.replace(REGEX_IMPORT1, (_, m, f) => {
            let file = aliases ? toRelative(f) : f;
            return `import ${m} from "${file}";`;
        });
        if (lazy) {
            content = content.replace(REGEX_IMPORT2, (_, f) => {
                let file = aliases ? toRelative(f) : f;
                return `() => import("${file}")`;
            }).replace('<<M_PAGES>>', '');
        } else {
            const mPages = [];
            content = content.replace(REGEX_IMPORT2, (_, f) => {
                let file = aliases ? toRelative(f) : f;
                let m_page = 'm_page_' + mPages.length;
                mPages.push(`import ${m_page} from "${file}";`);
                return m_page;
            }).replace('<<M_PAGES>>', mPages.join('\n') + '\n\n');
        }
        return content;
    }

    function BuildContent(config, lazy) {
        const sourcePaths = Array.isArray(config.sourcePath) ? config.sourcePath : [config.sourcePath];

        var routes = [];
        sourcePaths.forEach(source => {
            if (typeof source === 'string') {
                source = { path: source, prefix: config.prefix || '/' };
            }
            const pages = listFiles(source.path, source.prefix || '/');
            routes = routes.concat(buildRoutes(pages));
        });

        let content = '<<M_PAGES>>';

        let s = JSON.stringify(routes, null, 2).replace(/\"(\w+)\"\:/g, '$1:');
        content += `export const routes = ${s};

export default routes;`;

        if (config.output) {
            const fullPath = resolve(config.output);
            let p = dirname(fullPath);
            const aliases = [
                { path: p + sep, alias: './', length: p.length + 1 }
            ];
            let alias = '../';
            while (true) {
                let p2 = dirname(p);
                if (p2 == p) {
                    break;
                }
                p = p2;
                p2 = (p + sep).replace(/\/+/g, '/');
                aliases.push({ path: p2, alias, length: p2.length });
                alias += '../';
            }

            writeFileSync(fullPath, applyImport(content, lazy, aliases), 'utf8');
        }

        return applyImport(content, lazy);
    }

    if (typeof options === 'string') {
        options = { sourcePath: options };
    }

    const name = options.name || 'auto-route';
    const virtualModuleId = `virtual:${name}`;
    const resolvedVirtualModuleId = '\0' + virtualModuleId;
    return {
        name, // required, will show up in warnings and errors
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                return BuildContent(options, options.lazy);
            }
        },
        handleHotUpdate({server}) {
            const updates = [];
            const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
            if(mod){
                server.moduleGraph.invalidateModule(resolvedVirtualModuleId);
                updates.push({
                    type: 'js-update',
                    path: '/' + virtualModuleId,
                    acceptedPath: '/' + virtualModuleId,
                    timestamp: Date.now(),
                });
            }
            if (options.output) {
                BuildContent(options, options.lazy);
            }
            if(updates.length){
                server.ws.send({type:'update'. updates});
            }
        }
    }
}