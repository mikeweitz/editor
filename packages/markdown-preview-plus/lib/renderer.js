"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const highlight = require("atom-highlight");
const pandocHelper = require("./pandoc-helper");
const markdownIt = require("./markdown-it-helper");
const extension_helper_1 = require("./extension-helper");
const util_1 = require("./util");
const util_common_1 = require("./util-common");
const { resourcePath } = atom.getLoadSettings();
const packagePath = path.dirname(__dirname);
async function render(options) {
    const text = options.text.replace(/^\s*<!doctype(\s+.*)?>\s*/i, '');
    let html;
    let error;
    if (util_1.atomConfig().renderer === 'pandoc') {
        try {
            html = await pandocHelper.renderPandoc(text, options.filePath, options.renderLaTeX);
        }
        catch (err) {
            const e = err;
            if (e.html === undefined)
                throw e;
            error = e.message;
            html = e.html;
        }
    }
    else {
        html = markdownIt.render(text, options.renderLaTeX);
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    sanitize(doc);
    if (options.mode === 'normal') {
        options.imageWatcher.clear();
        resolveImagePaths(doc, options.filePath, false, undefined, options.imageWatcher);
    }
    else {
        switch (options.mode) {
            case 'save':
                handleImages({
                    doc,
                    filePath: options.filePath,
                    savePath: options.savePath,
                    behaviour: util_1.atomConfig().saveConfig.mediaOnSaveAsHTMLBehaviour,
                });
                break;
            case 'copy':
                handleImages({
                    doc,
                    filePath: options.filePath,
                    behaviour: util_1.atomConfig().saveConfig.mediaOnCopyAsHTMLBehaviour,
                });
                break;
            default:
                throw invalidMode(options.mode);
        }
    }
    let defaultCodeLanguage = 'text';
    if ((options.grammar && options.grammar.scopeName) === 'source.litcoffee') {
        defaultCodeLanguage = 'coffee';
    }
    if (!(util_1.atomConfig().renderer === 'pandoc' &&
        util_1.atomConfig().pandocConfig.useNativePandocCodeStyles)) {
        highlightCodeBlocks(doc, defaultCodeLanguage, options.mode !== 'normal');
    }
    if (error) {
        const errd = doc.createElement('div');
        const msgel = doc.createElement('code');
        msgel.innerText = error;
        errd.innerHTML = `<h1>Pandoc Error:</h1>${msgel.outerHTML}<hr>`;
        doc.body.insertBefore(errd, doc.body.firstElementChild);
    }
    return doc;
}
exports.render = render;
function invalidMode(mode) {
    return new Error(`Invalid render mode ${JSON.stringify(mode)}`);
}
function sanitize(doc) {
    doc.querySelectorAll("script:not([type^='math/tex'])").forEach((elem) => {
        elem.remove();
    });
    const attributesToRemove = [
        'onabort',
        'onblur',
        'onchange',
        'onclick',
        'ondbclick',
        'onerror',
        'onfocus',
        'onkeydown',
        'onkeypress',
        'onkeyup',
        'onload',
        'onmousedown',
        'onmousemove',
        'onmouseover',
        'onmouseout',
        'onmouseup',
        'onreset',
        'onresize',
        'onscroll',
        'onselect',
        'onsubmit',
        'onunload',
    ];
    doc.querySelectorAll('*').forEach((elem) => attributesToRemove.map((attribute) => {
        elem.removeAttribute(attribute);
    }));
}
function handleImages(opts) {
    const relativize = opts.behaviour === 'relativized';
    switch (opts.behaviour) {
        case 'relativized':
        case 'absolutized':
            resolveImagePaths(opts.doc, opts.filePath, relativize, opts.savePath);
            break;
        case 'untouched':
    }
}
function resolveImagePaths(doc, filePath, relativize, savePath, imageWatcher) {
    const [rootDirectory] = atom.project.relativizePath(filePath || '');
    const media = util_common_1.getMedia(doc);
    Array.from(media).map(function (img) {
        let src = img.getAttribute('src');
        if (src) {
            if (util_1.atomConfig().renderer !== 'pandoc') {
                src = decodeURI(src);
            }
            if (src.match(/^(https?|atom|data):/)) {
                return;
            }
            if (process.resourcesPath && src.startsWith(process.resourcesPath)) {
                return;
            }
            if (src.startsWith(resourcePath)) {
                return;
            }
            if (src.startsWith(packagePath)) {
                return;
            }
            if (src[0] === '/') {
                if (!util_1.isFileSync(src)) {
                    try {
                        if (rootDirectory !== null) {
                            src = path.join(rootDirectory, src.substring(1));
                        }
                    }
                    catch (e) {
                    }
                }
            }
            else if (filePath) {
                src = path.resolve(path.dirname(filePath), src);
            }
            if (relativize && (filePath !== undefined || savePath !== undefined)) {
                const fp = savePath !== undefined ? savePath : filePath;
                src = path.relative(path.dirname(fp), src);
            }
            if (imageWatcher) {
                const v = imageWatcher.watch(src);
                if (v !== undefined)
                    src = `${src}?v=${v}`;
            }
            img.src = src;
        }
    });
}
function highlightCodeBlocks(domFragment, defaultLanguage, copyHTML) {
    const fontFamily = atom.config.get('editor.fontFamily');
    if (fontFamily) {
        for (const codeElement of Array.from(domFragment.querySelectorAll('code'))) {
            codeElement.style.fontFamily = fontFamily;
        }
    }
    for (const preElement of Array.from(domFragment.querySelectorAll('pre'))) {
        const codeBlock = preElement.firstElementChild !== null
            ? preElement.firstElementChild
            : preElement;
        const cbClass = codeBlock.className;
        const fenceName = cbClass
            ? cbClass.replace(/^(lang-|sourceCode )/, '')
            : defaultLanguage;
        const addClass = copyHTML ? 'editor-colors ' : '';
        preElement.outerHTML = highlight({
            fileContents: codeBlock.textContent.replace(/\n$/, ''),
            scopeName: extension_helper_1.scopeForFenceName(fenceName),
            nbsp: false,
            lineDivs: copyHTML ? false : true,
            editorDiv: true,
            editorDivTag: copyHTML ? 'pre' : 'atom-text-editor',
            editorDivClass: fenceName ? `${addClass}lang-${fenceName}` : addClass,
        });
    }
    return domFragment;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVuZGVyZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw2QkFBNkI7QUFDN0IsNENBQTRDO0FBQzVDLGdEQUFnRDtBQUNoRCxtREFBbUQ7QUFDbkQseURBQXNEO0FBRXRELGlDQUErQztBQUMvQywrQ0FBd0M7QUFHeEMsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQTtBQUMvQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBaUJwQyxLQUFLLGlCQUFpQixPQUFzQjtJQUdqRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUVuRSxJQUFJLElBQUksQ0FBQTtJQUNSLElBQUksS0FBSyxDQUFBO0lBQ1QsSUFBSSxpQkFBVSxFQUFFLENBQUMsUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUN0QyxJQUFJO1lBQ0YsSUFBSSxHQUFHLE1BQU0sWUFBWSxDQUFDLFlBQVksQ0FDcEMsSUFBSSxFQUNKLE9BQU8sQ0FBQyxRQUFRLEVBQ2hCLE9BQU8sQ0FBQyxXQUFXLENBQ3BCLENBQUE7U0FDRjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osTUFBTSxDQUFDLEdBQUcsR0FBZ0MsQ0FBQTtZQUMxQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUztnQkFBRSxNQUFNLENBQUMsQ0FBQTtZQUNqQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQWlCLENBQUE7WUFDM0IsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFjLENBQUE7U0FDeEI7S0FDRjtTQUFNO1FBQ0wsSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtLQUNwRDtJQUNELE1BQU0sTUFB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WUFDdkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxDQUFDO1lBQzdDLENBQUMsQ0FBQyxlQUFlLENBQUE7UUFFbkIsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO1FBQ2pELFVBQVUsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQy9CLFlBQVksRUFBRSxTQUFTLENBQUMsV0FBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ3ZELFNBQVMsRUFBRSxvQ0FBaUIsQ0FBQyxTQUFTLENBQUM7WUFDdkMsSUFBSSxFQUFFLEtBQUs7WUFDWCxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUk7WUFDakMsU0FBUyxFQUFFLElBQUk7WUFDZixZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGtCQUFrQjtZQUVuRCxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsUUFBUSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUTtTQUN0RSxDQUFDLENBQUE7S0FDSDtJQUVELE9BQU8sV0FBVyxDQUFBO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuaW1wb3J0IGhpZ2hsaWdodCA9IHJlcXVpcmUoJ2F0b20taGlnaGxpZ2h0JylcbmltcG9ydCBwYW5kb2NIZWxwZXIgPSByZXF1aXJlKCcuL3BhbmRvYy1oZWxwZXInKVxuaW1wb3J0IG1hcmtkb3duSXQgPSByZXF1aXJlKCcuL21hcmtkb3duLWl0LWhlbHBlcicpIC8vIERlZmVyIHVudGlsIHVzZWRcbmltcG9ydCB7IHNjb3BlRm9yRmVuY2VOYW1lIH0gZnJvbSAnLi9leHRlbnNpb24taGVscGVyJ1xuaW1wb3J0IHsgR3JhbW1hciB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBpc0ZpbGVTeW5jLCBhdG9tQ29uZmlnIH0gZnJvbSAnLi91dGlsJ1xuaW1wb3J0IHsgZ2V0TWVkaWEgfSBmcm9tICcuL3V0aWwtY29tbW9uJ1xuaW1wb3J0IHsgSW1hZ2VXYXRjaGVyIH0gZnJvbSAnLi9pbWFnZS13YXRjaC1oZWxwZXInXG5cbmNvbnN0IHsgcmVzb3VyY2VQYXRoIH0gPSBhdG9tLmdldExvYWRTZXR0aW5ncygpXG5jb25zdCBwYWNrYWdlUGF0aCA9IHBhdGguZGlybmFtZShfX2Rpcm5hbWUpXG5cbmV4cG9ydCB0eXBlIFJlbmRlck1vZGUgPSAnbm9ybWFsJyB8ICdjb3B5JyB8ICdzYXZlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbW1vblJlbmRlck9wdGlvbnM8VCBleHRlbmRzIFJlbmRlck1vZGU+IHtcbiAgdGV4dDogc3RyaW5nXG4gIGZpbGVQYXRoOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgZ3JhbW1hcj86IEdyYW1tYXJcbiAgcmVuZGVyTGFUZVg6IGJvb2xlYW5cbiAgbW9kZTogVFxufVxuXG5leHBvcnQgdHlwZSBSZW5kZXJPcHRpb25zID1cbiAgfCAoQ29tbW9uUmVuZGVyT3B0aW9uczwnbm9ybWFsJyB8ICdjb3B5Jz4gJiB7IGltYWdlV2F0Y2hlcjogSW1hZ2VXYXRjaGVyIH0pXG4gIHwgKENvbW1vblJlbmRlck9wdGlvbnM8J3NhdmUnPiAmIHsgc2F2ZVBhdGg6IHN0cmluZyB9KVxuICB8IChDb21tb25SZW5kZXJPcHRpb25zPCdjb3B5Jz4pXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW5kZXIob3B0aW9uczogUmVuZGVyT3B0aW9ucyk6IFByb21pc2U8SFRNTERvY3VtZW50PiB7XG4gIC8vIFJlbW92ZSB0aGUgPCFkb2N0eXBlPiBzaW5jZSBvdGhlcndpc2UgbWFya2VkIHdpbGwgZXNjYXBlIGl0XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGpqL21hcmtlZC9pc3N1ZXMvMzU0XG4gIGNvbnN0IHRleHQgPSBvcHRpb25zLnRleHQucmVwbGFjZSgvXlxccyo8IWRvY3R5cGUoXFxzKy4qKT8+XFxzKi9pLCAnJylcblxuICBsZXQgaHRtbFxuICBsZXQgZXJyb3JcbiAgaWYgKGF0b21Db25maWcoKS5yZW5kZXJlciA9PT0gJ3BhbmRvYycpIHtcbiAgICB0cnkge1xuICAgICAgaHRtbCA9IGF3YWl0IHBhbmRvY0hlbHBlci5yZW5kZXJQYW5kb2MoXG4gICAgICAgIHRleHQsXG4gICAgICAgIG9wdGlvbnMuZmlsZVBhdGgsXG4gICAgICAgIG9wdGlvbnMucmVuZGVyTGFUZVgsXG4gICAgICApXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zdCBlID0gZXJyIGFzIEVycm9yICYgeyBodG1sPzogc3RyaW5nIH1cbiAgICAgIGlmIChlLmh0bWwgPT09IHVuZGVmaW5lZCkgdGhyb3cgZVxuICAgICAgZXJyb3IgPSBlLm1lc3NhZ2UgYXMgc3RyaW5nXG4gICAgICBodG1sID0gZS5odG1sIGFzIHN0cmluZ1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBodG1sID0gbWFya2Rvd25JdC5yZW5kZXIodGV4dCwgb3B0aW9ucy5yZW5kZXJMYVRlWClcbiAgfVxuICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKClcbiAgY29uc3QgZG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJylcbiAgc2FuaXRpemUoZG9jKVxuICBpZiAob3B0aW9ucy5tb2RlID09PSAnbm9ybWFsJykge1xuICAgIG9wdGlvbnMuaW1hZ2VXYXRjaGVyLmNsZWFyKClcbiAgICByZXNvbHZlSW1hZ2VQYXRocyhcbiAgICAgIGRvYyxcbiAgICAgIG9wdGlvbnMuZmlsZVBhdGgsXG4gICAgICBmYWxzZSxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIG9wdGlvbnMuaW1hZ2VXYXRjaGVyLFxuICAgIClcbiAgfSBlbHNlIHtcbiAgICBzd2l0Y2ggKG9wdGlvbnMubW9kZSkge1xuICAgICAgY2FzZSAnc2F2ZSc6XG4gICAgICAgIGhhbmRsZUltYWdlcyh7XG4gICAgICAgICAgZG9jLFxuICAgICAgICAgIGZpbGVQYXRoOiBvcHRpb25zLmZpbGVQYXRoLFxuICAgICAgICAgIHNhdmVQYXRoOiBvcHRpb25zLnNhdmVQYXRoLFxuICAgICAgICAgIGJlaGF2aW91cjogYXRvbUNvbmZpZygpLnNhdmVDb25maWcubWVkaWFPblNhdmVBc0hUTUxCZWhhdmlvdXIsXG4gICAgICAgIH0pXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdjb3B5JzpcbiAgICAgICAgaGFuZGxlSW1hZ2VzKHtcbiAgICAgICAgICBkb2MsXG4gICAgICAgICAgZmlsZVBhdGg6IG9wdGlvbnMuZmlsZVBhdGgsXG4gICAgICAgICAgYmVoYXZpb3VyOiBhdG9tQ29uZmlnKCkuc2F2ZUNvbmZpZy5tZWRpYU9uQ29weUFzSFRNTEJlaGF2aW91cixcbiAgICAgICAgfSlcbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IGludmFsaWRNb2RlKG9wdGlvbnMubW9kZSlcbiAgICB9XG4gIH1cbiAgbGV0IGRlZmF1bHRDb2RlTGFuZ3VhZ2U6IHN0cmluZyA9ICd0ZXh0J1xuICAvLyBEZWZhdWx0IGNvZGUgYmxvY2tzIHRvIGJlIGNvZmZlZSBpbiBMaXRlcmF0ZSBDb2ZmZWVTY3JpcHQgZmlsZXNcbiAgaWYgKChvcHRpb25zLmdyYW1tYXIgJiYgb3B0aW9ucy5ncmFtbWFyLnNjb3BlTmFtZSkgPT09ICdzb3VyY2UubGl0Y29mZmVlJykge1xuICAgIGRlZmF1bHRDb2RlTGFuZ3VhZ2UgPSAnY29mZmVlJ1xuICB9XG4gIGlmIChcbiAgICAhKFxuICAgICAgYXRvbUNvbmZpZygpLnJlbmRlcmVyID09PSAncGFuZG9jJyAmJlxuICAgICAgYXRvbUNvbmZpZygpLnBhbmRvY0NvbmZpZy51c2VOYXRpdmVQYW5kb2NDb2RlU3R5bGVzXG4gICAgKVxuICApIHtcbiAgICBoaWdobGlnaHRDb2RlQmxvY2tzKGRvYywgZGVmYXVsdENvZGVMYW5ndWFnZSwgb3B0aW9ucy5tb2RlICE9PSAnbm9ybWFsJylcbiAgfVxuICBpZiAoZXJyb3IpIHtcbiAgICBjb25zdCBlcnJkID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgY29uc3QgbXNnZWwgPSBkb2MuY3JlYXRlRWxlbWVudCgnY29kZScpXG4gICAgbXNnZWwuaW5uZXJUZXh0ID0gZXJyb3JcbiAgICBlcnJkLmlubmVySFRNTCA9IGA8aDE+UGFuZG9jIEVycm9yOjwvaDE+JHttc2dlbC5vdXRlckhUTUx9PGhyPmBcbiAgICBkb2MuYm9keS5pbnNlcnRCZWZvcmUoZXJyZCwgZG9jLmJvZHkuZmlyc3RFbGVtZW50Q2hpbGQpXG4gIH1cbiAgcmV0dXJuIGRvY1xufVxuXG5mdW5jdGlvbiBpbnZhbGlkTW9kZShtb2RlOiBuZXZlcikge1xuICByZXR1cm4gbmV3IEVycm9yKGBJbnZhbGlkIHJlbmRlciBtb2RlICR7SlNPTi5zdHJpbmdpZnkobW9kZSl9YClcbn1cblxuZnVuY3Rpb24gc2FuaXRpemUoZG9jOiBIVE1MRG9jdW1lbnQpIHtcbiAgLy8gRG8gbm90IHJlbW92ZSBNYXRoSmF4IHNjcmlwdCBkZWxpbWl0ZWQgYmxvY2tzXG4gIGRvYy5xdWVyeVNlbGVjdG9yQWxsKFwic2NyaXB0Om5vdChbdHlwZV49J21hdGgvdGV4J10pXCIpLmZvckVhY2goKGVsZW0pID0+IHtcbiAgICBlbGVtLnJlbW92ZSgpXG4gIH0pXG4gIGNvbnN0IGF0dHJpYnV0ZXNUb1JlbW92ZSA9IFtcbiAgICAnb25hYm9ydCcsXG4gICAgJ29uYmx1cicsXG4gICAgJ29uY2hhbmdlJyxcbiAgICAnb25jbGljaycsXG4gICAgJ29uZGJjbGljaycsXG4gICAgJ29uZXJyb3InLFxuICAgICdvbmZvY3VzJyxcbiAgICAnb25rZXlkb3duJyxcbiAgICAnb25rZXlwcmVzcycsXG4gICAgJ29ua2V5dXAnLFxuICAgICdvbmxvYWQnLFxuICAgICdvbm1vdXNlZG93bicsXG4gICAgJ29ubW91c2Vtb3ZlJyxcbiAgICAnb25tb3VzZW92ZXInLFxuICAgICdvbm1vdXNlb3V0JyxcbiAgICAnb25tb3VzZXVwJyxcbiAgICAnb25yZXNldCcsXG4gICAgJ29ucmVzaXplJyxcbiAgICAnb25zY3JvbGwnLFxuICAgICdvbnNlbGVjdCcsXG4gICAgJ29uc3VibWl0JyxcbiAgICAnb251bmxvYWQnLFxuICBdXG4gIGRvYy5xdWVyeVNlbGVjdG9yQWxsKCcqJykuZm9yRWFjaCgoZWxlbSkgPT5cbiAgICBhdHRyaWJ1dGVzVG9SZW1vdmUubWFwKChhdHRyaWJ1dGUpID0+IHtcbiAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZSlcbiAgICB9KSxcbiAgKVxufVxuXG5mdW5jdGlvbiBoYW5kbGVJbWFnZXMob3B0czoge1xuICBiZWhhdmlvdXI6ICdyZWxhdGl2aXplZCcgfCAnYWJzb2x1dGl6ZWQnIHwgJ3VudG91Y2hlZCdcbiAgZG9jOiBIVE1MRG9jdW1lbnRcbiAgZmlsZVBhdGg/OiBzdHJpbmdcbiAgc2F2ZVBhdGg/OiBzdHJpbmdcbn0pIHtcbiAgY29uc3QgcmVsYXRpdml6ZSA9IG9wdHMuYmVoYXZpb3VyID09PSAncmVsYXRpdml6ZWQnXG4gIHN3aXRjaCAob3B0cy5iZWhhdmlvdXIpIHtcbiAgICBjYXNlICdyZWxhdGl2aXplZCc6XG4gICAgY2FzZSAnYWJzb2x1dGl6ZWQnOlxuICAgICAgcmVzb2x2ZUltYWdlUGF0aHMob3B0cy5kb2MsIG9wdHMuZmlsZVBhdGgsIHJlbGF0aXZpemUsIG9wdHMuc2F2ZVBhdGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VudG91Y2hlZCc6XG4gICAgLyogbm9vcCAqL1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVJbWFnZVBhdGhzKFxuICBkb2M6IEhUTUxEb2N1bWVudCxcbiAgZmlsZVBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgcmVsYXRpdml6ZTogYm9vbGVhbixcbiAgc2F2ZVBhdGg/OiBzdHJpbmcsXG4gIGltYWdlV2F0Y2hlcj86IEltYWdlV2F0Y2hlcixcbikge1xuICBjb25zdCBbcm9vdERpcmVjdG9yeV0gPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZmlsZVBhdGggfHwgJycpXG4gIGNvbnN0IG1lZGlhID0gZ2V0TWVkaWEoZG9jKVxuICBBcnJheS5mcm9tKG1lZGlhKS5tYXAoZnVuY3Rpb24oaW1nKSB7XG4gICAgbGV0IHNyYyA9IGltZy5nZXRBdHRyaWJ1dGUoJ3NyYycpXG4gICAgaWYgKHNyYykge1xuICAgICAgaWYgKGF0b21Db25maWcoKS5yZW5kZXJlciAhPT0gJ3BhbmRvYycpIHtcbiAgICAgICAgc3JjID0gZGVjb2RlVVJJKHNyYylcbiAgICAgIH1cblxuICAgICAgaWYgKHNyYy5tYXRjaCgvXihodHRwcz98YXRvbXxkYXRhKTovKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmIChwcm9jZXNzLnJlc291cmNlc1BhdGggJiYgc3JjLnN0YXJ0c1dpdGgocHJvY2Vzcy5yZXNvdXJjZXNQYXRoKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGlmIChzcmMuc3RhcnRzV2l0aChyZXNvdXJjZVBhdGgpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKHNyYy5zdGFydHNXaXRoKHBhY2thZ2VQYXRoKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKHNyY1swXSA9PT0gJy8nKSB7XG4gICAgICAgIGlmICghaXNGaWxlU3luYyhzcmMpKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChyb290RGlyZWN0b3J5ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHNyYyA9IHBhdGguam9pbihyb290RGlyZWN0b3J5LCBzcmMuc3Vic3RyaW5nKDEpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIG5vb3BcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZmlsZVBhdGgpIHtcbiAgICAgICAgc3JjID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmaWxlUGF0aCksIHNyYylcbiAgICAgIH1cblxuICAgICAgaWYgKHJlbGF0aXZpemUgJiYgKGZpbGVQYXRoICE9PSB1bmRlZmluZWQgfHwgc2F2ZVBhdGggIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgY29uc3QgZnAgPSBzYXZlUGF0aCAhPT0gdW5kZWZpbmVkID8gc2F2ZVBhdGggOiBmaWxlUGF0aCFcbiAgICAgICAgc3JjID0gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUoZnApLCBzcmMpXG4gICAgICB9XG5cbiAgICAgIC8vIFdhdGNoIGltYWdlIGZvciBjaGFuZ2VzXG4gICAgICBpZiAoaW1hZ2VXYXRjaGVyKSB7XG4gICAgICAgIGNvbnN0IHYgPSBpbWFnZVdhdGNoZXIud2F0Y2goc3JjKVxuICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKSBzcmMgPSBgJHtzcmN9P3Y9JHt2fWBcbiAgICAgIH1cblxuICAgICAgaW1nLnNyYyA9IHNyY1xuICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gaGlnaGxpZ2h0Q29kZUJsb2NrcyhcbiAgZG9tRnJhZ21lbnQ6IERvY3VtZW50LFxuICBkZWZhdWx0TGFuZ3VhZ2U6IHN0cmluZyxcbiAgY29weUhUTUw6IGJvb2xlYW4sXG4pIHtcbiAgY29uc3QgZm9udEZhbWlseSA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLmZvbnRGYW1pbHknKVxuICBpZiAoZm9udEZhbWlseSkge1xuICAgIGZvciAoY29uc3QgY29kZUVsZW1lbnQgb2YgQXJyYXkuZnJvbShcbiAgICAgIGRvbUZyYWdtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2NvZGUnKSxcbiAgICApKSB7XG4gICAgICBjb2RlRWxlbWVudC5zdHlsZS5mb250RmFtaWx5ID0gZm9udEZhbWlseVxuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgcHJlRWxlbWVudCBvZiBBcnJheS5mcm9tKGRvbUZyYWdtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3ByZScpKSkge1xuICAgIGNvbnN0IGNvZGVCbG9jayA9XG4gICAgICBwcmVFbGVtZW50LmZpcnN0RWxlbWVudENoaWxkICE9PSBudWxsXG4gICAgICAgID8gcHJlRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZFxuICAgICAgICA6IHByZUVsZW1lbnRcbiAgICBjb25zdCBjYkNsYXNzID0gY29kZUJsb2NrLmNsYXNzTmFtZVxuICAgIGNvbnN0IGZlbmNlTmFtZSA9IGNiQ2xhc3NcbiAgICAgID8gY2JDbGFzcy5yZXBsYWNlKC9eKGxhbmctfHNvdXJjZUNvZGUgKS8sICcnKVxuICAgICAgOiBkZWZhdWx0TGFuZ3VhZ2VcblxuICAgIGNvbnN0IGFkZENsYXNzID0gY29weUhUTUwgPyAnZWRpdG9yLWNvbG9ycyAnIDogJydcbiAgICBwcmVFbGVtZW50Lm91dGVySFRNTCA9IGhpZ2hsaWdodCh7XG4gICAgICBmaWxlQ29udGVudHM6IGNvZGVCbG9jay50ZXh0Q29udGVudCEucmVwbGFjZSgvXFxuJC8sICcnKSxcbiAgICAgIHNjb3BlTmFtZTogc2NvcGVGb3JGZW5jZU5hbWUoZmVuY2VOYW1lKSxcbiAgICAgIG5ic3A6IGZhbHNlLFxuICAgICAgbGluZURpdnM6IGNvcHlIVE1MID8gZmFsc2UgOiB0cnVlLFxuICAgICAgZWRpdG9yRGl2OiB0cnVlLFxuICAgICAgZWRpdG9yRGl2VGFnOiBjb3B5SFRNTCA/ICdwcmUnIDogJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgLy8gVGhlIGBlZGl0b3JgIGNsYXNzIG1lc3NlcyB0aGluZ3MgdXAgYXMgYC5lZGl0b3JgIGhhcyBhYnNvbHV0ZWx5IHBvc2l0aW9uZWQgbGluZXNcbiAgICAgIGVkaXRvckRpdkNsYXNzOiBmZW5jZU5hbWUgPyBgJHthZGRDbGFzc31sYW5nLSR7ZmVuY2VOYW1lfWAgOiBhZGRDbGFzcyxcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIGRvbUZyYWdtZW50XG59XG4iXX0=