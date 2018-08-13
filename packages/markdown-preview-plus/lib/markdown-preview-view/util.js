"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const util_1 = require("../util");
function editorForId(editorId) {
    for (const editor of atom.workspace.getTextEditors()) {
        if (editor.id === editorId) {
            return editor;
        }
    }
    return undefined;
}
exports.editorForId = editorForId;
let getStylesOverride = undefined;
function __setGetStylesOverride(f) {
    getStylesOverride = f;
}
exports.__setGetStylesOverride = __setGetStylesOverride;
function getStyles(context) {
    if (getStylesOverride)
        return getStylesOverride(context);
    const textEditorStyles = document.createElement('atom-styles');
    textEditorStyles.initialize(atom.styles);
    textEditorStyles.setAttribute('context', context);
    return Array.from(textEditorStyles.childNodes).map((styleElement) => styleElement.innerText);
}
exports.getStyles = getStyles;
function getMarkdownPreviewCSS() {
    const markdowPreviewRules = ['body { padding: 0; margin: 0; }'];
    const cssUrlRefExp = /url\(atom:\/\/markdown-preview-plus\/assets\/(.*)\)/;
    return markdowPreviewRules
        .concat(getStyles('markdown-preview-plus'))
        .concat(getStyles('atom-text-editor'))
        .join('\n')
        .replace(/\batom-text-editor\b/g, 'pre.editor-colors')
        .replace(/\bmarkdown-preview-plus-view\b/g, '.markdown-preview-plus-view')
        .replace(/\b\.\.markdown-preview-plus-view\b/g, '.markdown-preview-plus-view')
        .replace(cssUrlRefExp, function (_match, assetsName, _offset, _string) {
        const assetPath = path.join(__dirname, '../../assets', assetsName);
        const originalData = fs.readFileSync(assetPath, 'binary');
        const base64Data = new Buffer(originalData, 'binary').toString('base64');
        return `url('data:image/jpeg;base64,${base64Data}')`;
    });
}
function decodeTag(token) {
    if (token.tag === 'math') {
        return 'span';
    }
    if (token.tag === 'code') {
        return 'atom-text-editor';
    }
    if (token.tag === '') {
        return null;
    }
    return token.tag;
}
function buildLineMap(tokens) {
    const lineMap = {};
    const tokenTagCount = {};
    tokenTagCount[0] = {};
    for (const token of tokens) {
        if (token.hidden)
            continue;
        if (token.map == null)
            continue;
        const tag = decodeTag(token);
        if (tag === null)
            continue;
        if (token.nesting === 1) {
            for (let line = token.map[0]; line < token.map[1]; line += 1) {
                if (lineMap[line] == null)
                    lineMap[line] = [];
                lineMap[line].push({
                    tag: tag,
                    index: tokenTagCount[token.level][tag] || 0,
                });
            }
            tokenTagCount[token.level + 1] = {};
        }
        else if (token.nesting === 0) {
            for (let line = token.map[0]; line < token.map[1]; line += 1) {
                if (lineMap[line] == null)
                    lineMap[line] = [];
                lineMap[line].push({
                    tag: tag,
                    index: tokenTagCount[token.level][tag] || 0,
                });
            }
        }
        const ttc = tokenTagCount[token.level][tag];
        tokenTagCount[token.level][tag] = ttc ? ttc + 1 : 1;
    }
    return lineMap;
}
exports.buildLineMap = buildLineMap;
function mathJaxScript(texConfig) {
    return `\
<script type="text/x-mathjax-config">
  MathJax.Hub.Config({
    jax: ["input/TeX","output/HTML-CSS"],
    extensions: ["[a11y]/accessibility-menu.js"],
    'HTML-CSS': {
      availableFonts: [],
      webFont: 'TeX',
      undefinedFamily: ${JSON.stringify(util_1.atomConfig().mathConfig.undefinedFamily)},
      mtextFontInherit: true,
    },
    TeX: ${JSON.stringify(texConfig, undefined, 2)},
    showMathMenu: true
  });
</script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.4/MathJax.js"></script>`;
}
function mkHtml(title, html, renderLaTeX, useGithubStyle, texConfig) {
    const githubStyle = useGithubStyle ? ' data-use-github-style' : '';
    let maybeMathJaxScript;
    if (renderLaTeX) {
        maybeMathJaxScript = mathJaxScript(texConfig);
    }
    else {
        maybeMathJaxScript = '';
    }
    return `\
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>${maybeMathJaxScript}
    <style>${getMarkdownPreviewCSS()}</style>
${html.head.innerHTML}
  </head>
  <body class="markdown-preview-plus-view"${githubStyle}>
    ${html.body.innerHTML}
  </body>
</html>
`;
}
exports.mkHtml = mkHtml;
function destroy(item) {
    const pane = atom.workspace.paneForItem(item);
    if (pane)
        util_1.handlePromise(pane.destroyItem(item));
}
exports.destroy = destroy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXJrZG93bi1wcmV2aWV3LXZpZXcvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZCQUE0QjtBQUM1Qix5QkFBd0I7QUFFeEIsa0NBQW1EO0FBRW5ELHFCQUE0QixRQUFnQjtJQUMxQyxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLEVBQUU7UUFDcEQsSUFBSSxNQUFNLENBQUMsRUFBRSxLQUFLLFFBQVEsRUFBRTtZQUMxQixPQUFPLE1BQU0sQ0FBQTtTQUNkO0tBQ0Y7SUFDRCxPQUFPLFNBQVMsQ0FBQTtBQUNsQixDQUFDO0FBUEQsa0NBT0M7QUFHRCxJQUFJLGlCQUFpQixHQUFpQyxTQUFTLENBQUE7QUFFL0QsZ0NBQXVDLENBQW9CO0lBQ3pELGlCQUFpQixHQUFHLENBQUMsQ0FBQTtBQUN2QixDQUFDO0FBRkQsd0RBRUM7QUFFRCxtQkFBMEIsT0FBZTtJQUN2QyxJQUFJLGlCQUFpQjtRQUFFLE9BQU8saUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDeEQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUM3QyxhQUFhLENBQzhDLENBQUE7SUFDN0QsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUN4QyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBR2pELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQ2hELENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBRSxZQUFpQyxDQUFDLFNBQVMsQ0FDL0QsQ0FBQTtBQUNILENBQUM7QUFaRCw4QkFZQztBQUVEO0lBQ0UsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUE7SUFDL0QsTUFBTSxZ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Q2Ysa0JBQWtCLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0tBQzlDO1NBQU07UUFDTCxrQkFBa0IsR0FBRyxFQUFFLENBQUE7S0FDeEI7SUFDRCxPQUFPOzs7OzthQUtJLEtBQUssV0FBVyxrQkFBa0I7YUFDbEMscUJBQXFCLEVBQUU7RUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTOzs0Q0FFdUIsV0FBVztNQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVM7OztDQUd4QixDQUFBO0FBQ0QsQ0FBQztBQTVCRCx3QkE0QkM7QUFFRCxpQkFBd0IsSUFBWTtJQUNsQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM3QyxJQUFJLElBQUk7UUFBRSxvQkFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtBQUNqRCxDQUFDO0FBSEQsMEJBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RWRpdG9yLCBTdHlsZU1hbmFnZXIgfSBmcm9tICdhdG9tJ1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnXG5pbXBvcnQgeyBUb2tlbiB9IGZyb20gJ21hcmtkb3duLWl0J1xuaW1wb3J0IHsgaGFuZGxlUHJvbWlzZSwgYXRvbUNvbmZpZyB9IGZyb20gJy4uL3V0aWwnXG5cbmV4cG9ydCBmdW5jdGlvbiBlZGl0b3JGb3JJZChlZGl0b3JJZDogbnVtYmVyKTogVGV4dEVkaXRvciB8IHVuZGVmaW5lZCB7XG4gIGZvciAoY29uc3QgZWRpdG9yIG9mIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkpIHtcbiAgICBpZiAoZWRpdG9yLmlkID09PSBlZGl0b3JJZCkge1xuICAgICAgcmV0dXJuIGVkaXRvclxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8vIHRoaXMgd2VpcmRuZXNzIGFsbG93cyBvdmVycmlkaW5nIGluIHRlc3RzXG5sZXQgZ2V0U3R5bGVzT3ZlcnJpZGU6IHR5cGVvZiBnZXRTdHlsZXMgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcblxuZXhwb3J0IGZ1bmN0aW9uIF9fc2V0R2V0U3R5bGVzT3ZlcnJpZGUoZj86IHR5cGVvZiBnZXRTdHlsZXMpIHtcbiAgZ2V0U3R5bGVzT3ZlcnJpZGUgPSBmXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsZXMoY29udGV4dDogc3RyaW5nKTogc3RyaW5nW10ge1xuICBpZiAoZ2V0U3R5bGVzT3ZlcnJpZGUpIHJldHVybiBnZXRTdHlsZXNPdmVycmlkZShjb250ZXh0KVxuICBjb25zdCB0ZXh0RWRpdG9yU3R5bGVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcbiAgICAnYXRvbS1zdHlsZXMnLFxuICApIGFzIEhUTUxFbGVtZW50ICYgeyBpbml0aWFsaXplKHN0eWxlczogU3R5bGVNYW5hZ2VyKTogdm9pZCB9XG4gIHRleHRFZGl0b3JTdHlsZXMuaW5pdGlhbGl6ZShhdG9tLnN0eWxlcylcbiAgdGV4dEVkaXRvclN0eWxlcy5zZXRBdHRyaWJ1dGUoJ2NvbnRleHQnLCBjb250ZXh0KVxuXG4gIC8vIEV4dHJhY3Qgc3R5bGUgZWxlbWVudHMgY29udGVudFxuICByZXR1cm4gQXJyYXkuZnJvbSh0ZXh0RWRpdG9yU3R5bGVzLmNoaWxkTm9kZXMpLm1hcChcbiAgICAoc3R5bGVFbGVtZW50KSA9PiAoc3R5bGVFbGVtZW50IGFzIEhUTUxTdHlsZUVsZW1lbnQpLmlubmVyVGV4dCxcbiAgKVxufVxuXG5mdW5jdGlvbiBnZXRNYXJrZG93blByZXZpZXdDU1MoKSB7XG4gIGNvbnN0IG1hcmtkb3dQcmV2aWV3UnVsZXMgPSBbJ2JvZHkgeyBwYWRkaW5nOiAwOyBtYXJnaW46IDA7IH0nXVxuICBjb25zdCBjc3NVcmxSZWZFeHAgPSAvdXJsXFwoYXRvbTpcXC9cXC9tYXJrZG93bi1wcmV2aWV3LXBsdXNcXC9hc3NldHNcXC8oLiopXFwpL1xuXG4gIHJldHVybiBtYXJrZG93UHJldmlld1J1bGVzXG4gICAgLmNvbmNhdChnZXRTdHlsZXMoJ21hcmtkb3duLXByZXZpZXctcGx1cycpKVxuICAgIC5jb25jYXQoZ2V0U3R5bGVzKCdhdG9tLXRleHQtZWRpdG9yJykpXG4gICAgLmpvaW4oJ1xcbicpXG4gICAgLnJlcGxhY2UoL1xcYmF0b20tdGV4dC1lZGl0b3JcXGIvZywgJ3ByZS5lZGl0b3ItY29sb3JzJylcbiAgICAucmVwbGFjZSgvXFxibWFya2Rvd24tcHJldmlldy1wbHVzLXZpZXdcXGIvZywgJy5tYXJrZG93bi1wcmV2aWV3LXBsdXMtdmlldycpXG4gICAgLnJlcGxhY2UoXG4gICAgICAvXFxiXFwuXFwubWFya2Rvd24tcHJldmlldy1wbHVzLXZpZXdcXGIvZyxcbiAgICAgICcubWFya2Rvd24tcHJldmlldy1wbHVzLXZpZXcnLFxuICAgIClcbiAgICAucmVwbGFjZShjc3NVcmxSZWZFeHAsIGZ1bmN0aW9uKFxuICAgICAgX21hdGNoLFxuICAgICAgYXNzZXRzTmFtZTogc3RyaW5nLFxuICAgICAgX29mZnNldCxcbiAgICAgIF9zdHJpbmcsXG4gICAgKSB7XG4gICAgICAvLyBiYXNlNjQgZW5jb2RlIGFzc2V0c1xuICAgICAgY29uc3QgYXNzZXRQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2Fzc2V0cycsIGFzc2V0c05hbWUpXG4gICAgICBjb25zdCBvcmlnaW5hbERhdGEgPSBmcy5yZWFkRmlsZVN5bmMoYXNzZXRQYXRoLCAnYmluYXJ5JylcbiAgICAgIGNvbnN0IGJhc2U2NERhdGEgPSBuZXcgQnVmZmVyKG9yaWdpbmFsRGF0YSwgJ2JpbmFyeScpLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgcmV0dXJuIGB1cmwoJ2RhdGE6aW1hZ2UvanBlZztiYXNlNjQsJHtiYXNlNjREYXRhfScpYFxuICAgIH0pXG59XG5cbi8vXG4vLyBEZWNvZGUgdGFncyB1c2VkIGJ5IG1hcmtkb3duLWl0XG4vL1xuLy8gQHBhcmFtIHttYXJrZG93bi1pdC5Ub2tlbn0gdG9rZW4gRGVjb2RlIHRoZSB0YWcgb2YgdG9rZW4uXG4vLyBAcmV0dXJuIHtzdHJpbmd8bnVsbH0gRGVjb2RlZCB0YWcgb3IgYG51bGxgIGlmIHRoZSB0b2tlbiBoYXMgbm8gdGFnLlxuLy9cbmZ1bmN0aW9uIGRlY29kZVRhZyh0b2tlbjogVG9rZW4pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHRva2VuLnRhZyA9PT0gJ21hdGgnKSB7XG4gICAgcmV0dXJuICdzcGFuJ1xuICB9XG4gIGlmICh0b2tlbi50YWcgPT09ICdjb2RlJykge1xuICAgIHJldHVybiAnYXRvbS10ZXh0LWVkaXRvcidcbiAgfVxuICBpZiAodG9rZW4udGFnID09PSAnJykge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIHRva2VuLnRhZ1xufVxuXG4vL1xuLy8gRGV0ZXJtaW5lIHBhdGggdG8gYSB0YXJnZXQgdG9rZW4uXG4vL1xuLy8gQHBhcmFtIHsobWFya2Rvd24taXQuVG9rZW4pW119IHRva2VucyBBcnJheSBvZiB0b2tlbnMgYXMgcmV0dXJuZWQgYnlcbi8vICAgYG1hcmtkb3duLWl0LnBhcnNlKClgLlxuLy8gQHBhcmFtIHtudW1iZXJ9IGxpbmUgTGluZSByZXByZXNlbnRpbmcgdGhlIHRhcmdldCB0b2tlbi5cbi8vIEByZXR1cm4geyh0YWc6IDx0YWc+LCBpbmRleDogPGluZGV4PilbXX0gQXJyYXkgcmVwcmVzZW50aW5nIGEgcGF0aCB0byB0aGVcbi8vICAgdGFyZ2V0IHRva2VuLiBUaGUgcm9vdCB0b2tlbiBpcyByZXByZXNlbnRlZCBieSB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGVcbi8vICAgYXJyYXkgYW5kIHRoZSB0YXJnZXQgdG9rZW4gYnkgdGhlIGxhc3QgZWxtZW50LiBFYWNoIGVsZW1lbnQgY29uc2lzdHMgb2YgYVxuLy8gICBgdGFnYCBhbmQgYGluZGV4YCByZXByZXNlbnRpbmcgaXRzIGluZGV4IGFtb25nc3QgaXRzIHNpYmxpbmcgdG9rZW5zIGluXG4vLyAgIGB0b2tlbnNgIG9mIHRoZSBzYW1lIGB0YWdgLiBgbGluZWAgd2lsbCBsaWUgYmV0d2VlbiB0aGUgcHJvcGVydGllc1xuLy8gICBgbWFwWzBdYCBhbmQgYG1hcFsxXWAgb2YgdGhlIHRhcmdldCB0b2tlbi5cbi8vXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRMaW5lTWFwKHRva2VuczogUmVhZG9ubHlBcnJheTxSZWFkb25seTxUb2tlbj4+KSB7XG4gIGNvbnN0IGxpbmVNYXA6IHsgW2xpbmU6IG51bWJlcl06IEFycmF5PHsgdGFnOiBzdHJpbmc7IGluZGV4OiBudW1iZXIgfT4gfSA9IHt9XG4gIGNvbnN0IHRva2VuVGFnQ291bnQ6IHsgW2xpbmU6IG51bWJlcl06IHsgW3RhZzogc3RyaW5nXTogbnVtYmVyIH0gfSA9IHt9XG4gIHRva2VuVGFnQ291bnRbMF0gPSB7fVxuXG4gIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgaWYgKHRva2VuLmhpZGRlbikgY29udGludWVcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6c3RyaWN0LXR5cGUtcHJlZGljYXRlcyAvLyBUT0RPOiBjb21wbGFpbiBvbiBEVFxuICAgIGlmICh0b2tlbi5tYXAgPT0gbnVsbCkgY29udGludWVcblxuICAgIGNvbnN0IHRhZyA9IGRlY29kZVRhZyh0b2tlbilcbiAgICBpZiAodGFnID09PSBudWxsKSBjb250aW51ZVxuXG4gICAgaWYgKHRva2VuLm5lc3RpbmcgPT09IDEpIHtcbiAgICAgIC8vIG9wZW5pbmcgdGFnXG4gICAgICBmb3IgKGxldCBsaW5lID0gdG9rZW4ubWFwWzBdOyBsaW5lIDwgdG9rZW4ubWFwWzFdOyBsaW5lICs9IDEpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnN0cmljdC10eXBlLXByZWRpY2F0ZXNcbiAgICAgICAgaWYgKGxpbmVNYXBbbGluZV0gPT0gbnVsbCkgbGluZU1hcFtsaW5lXSA9IFtdXG4gICAgICAgIGxpbmVNYXBbbGluZV0ucHVzaCh7XG4gICAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgICAgaW5kZXg6IHRva2VuVGFnQ291bnRbdG9rZW4ubGV2ZWxdW3RhZ10gfHwgMCxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHRva2VuVGFnQ291bnRbdG9rZW4ubGV2ZWwgKyAxXSA9IHt9XG4gICAgfSBlbHNlIGlmICh0b2tlbi5uZXN0aW5nID09PSAwKSB7XG4gICAgICAvLyBzZWxmLWNsb3NpbmcgdGFnXG4gICAgICBmb3IgKGxldCBsaW5lID0gdG9rZW4ubWFwWzBdOyBsaW5lIDwgdG9rZW4ubWFwWzFdOyBsaW5lICs9IDEpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnN0cmljdC10eXBlLXByZWRpY2F0ZXNcbiAgICAgICAgaWYgKGxpbmVNYXBbbGluZV0gPT0gbnVsbCkgbGluZU1hcFtsaW5lXSA9IFtdXG4gICAgICAgIGxpbmVNYXBbbGluZV0ucHVzaCh7XG4gICAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgICAgaW5kZXg6IHRva2VuVGFnQ291bnRbdG9rZW4ubGV2ZWxdW3RhZ10gfHwgMCxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgdHRjID0gdG9rZW5UYWdDb3VudFt0b2tlbi5sZXZlbF1bdGFnXVxuICAgIHRva2VuVGFnQ291bnRbdG9rZW4ubGV2ZWxdW3RhZ10gPSB0dGMgPyB0dGMgKyAxIDogMVxuICB9XG5cbiAgcmV0dXJuIGxpbmVNYXBcbn1cblxuZnVuY3Rpb24gbWF0aEpheFNjcmlwdCh0ZXhDb25maWc6IE1hdGhKYXguVGVYSW5wdXRQcm9jZXNzb3IpIHtcbiAgcmV0dXJuIGBcXFxuPHNjcmlwdCB0eXBlPVwidGV4dC94LW1hdGhqYXgtY29uZmlnXCI+XG4gIE1hdGhKYXguSHViLkNvbmZpZyh7XG4gICAgamF4OiBbXCJpbnB1dC9UZVhcIixcIm91dHB1dC9IVE1MLUNTU1wiXSxcbiAgICBleHRlbnNpb25zOiBbXCJbYTExeV0vYWNjZXNzaWJpbGl0eS1tZW51LmpzXCJdLFxuICAgICdIVE1MLUNTUyc6IHtcbiAgICAgIGF2YWlsYWJsZUZvbnRzOiBbXSxcbiAgICAgIHdlYkZvbnQ6ICdUZVgnLFxuICAgICAgdW5kZWZpbmVkRmFtaWx5OiAke0pTT04uc3RyaW5naWZ5KFxuICAgICAgICBhdG9tQ29uZmlnKCkubWF0aENvbmZpZy51bmRlZmluZWRGYW1pbHksXG4gICAgICApfSxcbiAgICAgIG10ZXh0Rm9udEluaGVyaXQ6IHRydWUsXG4gICAgfSxcbiAgICBUZVg6ICR7SlNPTi5zdHJpbmdpZnkodGV4Q29uZmlnLCB1bmRlZmluZWQsIDIpfSxcbiAgICBzaG93TWF0aE1lbnU6IHRydWVcbiAgfSk7XG48L3NjcmlwdD5cbjxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cImh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL21hdGhqYXgvMi43LjQvTWF0aEpheC5qc1wiPjwvc2NyaXB0PmBcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1rSHRtbChcbiAgdGl0bGU6IHN0cmluZyxcbiAgaHRtbDogSFRNTERvY3VtZW50LFxuICByZW5kZXJMYVRlWDogYm9vbGVhbixcbiAgdXNlR2l0aHViU3R5bGU6IGJvb2xlYW4sXG4gIHRleENvbmZpZzogTWF0aEpheC5UZVhJbnB1dFByb2Nlc3Nvcixcbikge1xuICBjb25zdCBnaXRodWJTdHlsZSA9IHVzZUdpdGh1YlN0eWxlID8gJyBkYXRhLXVzZS1naXRodWItc3R5bGUnIDogJydcbiAgbGV0IG1heWJlTWF0aEpheFNjcmlwdDogc3RyaW5nXG4gIGlmIChyZW5kZXJMYVRlWCkge1xuICAgIG1heWJlTWF0aEpheFNjcmlwdCA9IG1hdGhKYXhTY3JpcHQodGV4Q29uZmlnKVxuICB9IGVsc2Uge1xuICAgIG1heWJlTWF0aEpheFNjcmlwdCA9ICcnXG4gIH1cbiAgcmV0dXJuIGBcXFxuPCFET0NUWVBFIGh0bWw+XG48aHRtbD5cbiAgPGhlYWQ+XG4gICAgPG1ldGEgY2hhcnNldD1cInV0Zi04XCIgLz5cbiAgICA8dGl0bGU+JHt0aXRsZX08L3RpdGxlPiR7bWF5YmVNYXRoSmF4U2NyaXB0fVxuICAgIDxzdHlsZT4ke2dldE1hcmtkb3duUHJldmlld0NTUygpfTwvc3R5bGU+XG4ke2h0bWwuaGVhZC5pbm5lckhUTUx9XG4gIDwvaGVhZD5cbiAgPGJvZHkgY2xhc3M9XCJtYXJrZG93bi1wcmV2aWV3LXBsdXMtdmlld1wiJHtnaXRodWJTdHlsZX0+XG4gICAgJHtodG1sLmJvZHkuaW5uZXJIVE1MfVxuICA8L2JvZHk+XG48L2h0bWw+XG5gIC8vIEVuc3VyZSB0cmFpbGluZyBuZXdsaW5lXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95KGl0ZW06IG9iamVjdCkge1xuICBjb25zdCBwYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0oaXRlbSlcbiAgaWYgKHBhbmUpIGhhbmRsZVByb21pc2UocGFuZS5kZXN0cm95SXRlbShpdGVtKSlcbn1cbiJdfQ==