webpackJsonp([1],{

/***/ 0:
/***/ (function(module, exports) {

/* globals __VUE_SSR_CONTEXT__ */

// this module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle

module.exports = function normalizeComponent (
  rawScriptExports,
  compiledTemplate,
  injectStyles,
  scopeId,
  moduleIdentifier /* server only */
) {
  var esModule
  var scriptExports = rawScriptExports = rawScriptExports || {}

  // ES6 modules interop
  var type = typeof rawScriptExports.default
  if (type === 'object' || type === 'function') {
    esModule = rawScriptExports
    scriptExports = rawScriptExports.default
  }

  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (compiledTemplate) {
    options.render = compiledTemplate.render
    options.staticRenderFns = compiledTemplate.staticRenderFns
  }

  // scopedId
  if (scopeId) {
    options._scopeId = scopeId
  }

  var hook
  if (moduleIdentifier) { // server build
    hook = function (context) {
      // 2.3 injection
      context =
        context || // cached call
        (this.$vnode && this.$vnode.ssrContext) || // stateful
        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext) // functional
      // 2.2 with runInNewContext: true
      if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__
      }
      // inject component styles
      if (injectStyles) {
        injectStyles.call(this, context)
      }
      // register component module identifier for async chunk inferrence
      if (context && context._registeredComponents) {
        context._registeredComponents.add(moduleIdentifier)
      }
    }
    // used by ssr in case component is cached and beforeCreate
    // never gets called
    options._ssrRegister = hook
  } else if (injectStyles) {
    hook = injectStyles
  }

  if (hook) {
    var functional = options.functional
    var existing = functional
      ? options.render
      : options.beforeCreate
    if (!functional) {
      // inject component registration as beforeCreate hook
      options.beforeCreate = existing
        ? [].concat(existing, hook)
        : [hook]
    } else {
      // register for functioal component in vue file
      options.render = function renderWithStyleInjection (h, context) {
        hook.call(context)
        return existing(h, context)
      }
    }
  }

  return {
    esModule: esModule,
    exports: scriptExports,
    options: options
  }
}


/***/ }),

/***/ 1:
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),

/***/ 2:
/***/ (function(module, exports, __webpack_require__) {

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/

var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

var listToStyles = __webpack_require__(6)

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

module.exports = function (parentId, list, _isProduction) {
  isProduction = _isProduction

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[data-vue-ssr-id~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),

/***/ 58:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(59);


/***/ }),

/***/ 59:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


__webpack_require__(60);

var _vue = __webpack_require__(4);

var _vue2 = _interopRequireDefault(_vue);

var _vueRouter = __webpack_require__(5);

var _vueRouter2 = _interopRequireDefault(_vueRouter);

var _routes = __webpack_require__(62);

var _routes2 = _interopRequireDefault(_routes);

var _Index = __webpack_require__(63);

var _Index2 = _interopRequireDefault(_Index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// 初始化
_vue2.default.use(_vueRouter2.default);

// iframe子页面


var router = new _vueRouter2.default({

    // 添加路由
    routes: [{
        path: '/',
        component: _Index2.default
    }].concat(_routes2.default)
    // 添加路由结束

});

new _vue2.default({
    router: router
}).$mount('#app');

/***/ }),

/***/ 6:
/***/ (function(module, exports) {

/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
module.exports = function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}


/***/ }),

/***/ 60:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(61);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(2)("439bb88f", content, false);
// Hot Module Replacement
if(false) {
 // When the styles change, update the <style> tags
 if(!content.locals) {
   module.hot.accept("!!../../../../Downloads/code/my-project/github/vue-markdown-book/node_modules/css-loader/index.js!../../../../Downloads/code/my-project/github/vue-markdown-book/node_modules/postcss-loader/lib/index.js!../../../../Downloads/code/my-project/github/vue-markdown-book/node_modules/less-loader/dist/cjs.js!./theme.less", function() {
     var newContent = require("!!../../../../Downloads/code/my-project/github/vue-markdown-book/node_modules/css-loader/index.js!../../../../Downloads/code/my-project/github/vue-markdown-book/node_modules/postcss-loader/lib/index.js!../../../../Downloads/code/my-project/github/vue-markdown-book/node_modules/less-loader/dist/cjs.js!./theme.less");
     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
     update(newContent);
   });
 }
 // When the module is disposed, remove the <style> tags
 module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 61:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(1)(undefined);
// imports


// module
exports.push([module.i, "/* reset */\nul,\nli {\n  margin: 0;\n  padding: 0;\n}\nbody {\n  font-family: Helvetica, arial, sans-serif;\n  font-size: 14px;\n  margin: 0;\n  background-color: #f5f5f5;\n}\n/* layout */\n#app {\n  margin: 0 auto;\n}\n.theme-default-body {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  height: 100vh;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -webkit-flex-direction: column;\n          flex-direction: column;\n  -webkit-box-pack: justify;\n  -webkit-justify-content: space-between;\n          justify-content: space-between;\n}\n.theme-default-content {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-flex: 1;\n  -webkit-flex: 1;\n          flex: 1;\n  padding: 0 20px;\n  margin: 20px 0;\n}\n.theme-default-markdown-doc {\n  box-sizing: border-box;\n  -webkit-box-flex: 1;\n  -webkit-flex: 1;\n          flex: 1;\n  overflow-y: scroll;\n  margin-left: 20px;\n  padding: 20px;\n  background-color: #fff;\n}\n/* markdown */\n.common-theme-markdown-doc a {\n  color: #4183C4;\n  text-decoration: none;\n}\n.common-theme-markdown-doc a.absent {\n  color: #cc0000;\n}\n.common-theme-markdown-doc a.anchor {\n  display: block;\n  padding-left: 30px;\n  margin-left: -30px;\n  cursor: pointer;\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 0;\n}\n.common-theme-markdown-doc h1,\n.common-theme-markdown-doc h2,\n.common-theme-markdown-doc h3,\n.common-theme-markdown-doc h4,\n.common-theme-markdown-doc h5,\n.common-theme-markdown-doc h6 {\n  margin: 20px 0 10px;\n  padding: 0;\n  font-weight: bold;\n  -webkit-font-smoothing: antialiased;\n  cursor: text;\n  position: relative;\n}\n.common-theme-markdown-doc h2:first-child,\n.common-theme-markdown-doc h1:first-child,\n.common-theme-markdown-doc h1:first-child + h2,\n.common-theme-markdown-doc h3:first-child,\n.common-theme-markdown-doc h4:first-child,\n.common-theme-markdown-doc h5:first-child,\n.common-theme-markdown-doc h6:first-child {\n  margin-top: 0;\n  padding-top: 0;\n}\n.common-theme-markdown-doc h1:hover a.anchor,\n.common-theme-markdown-doc h2:hover a.anchor,\n.common-theme-markdown-doc h3:hover a.anchor,\n.common-theme-markdown-doc h4:hover a.anchor,\n.common-theme-markdown-doc h5:hover a.anchor,\n.common-theme-markdown-doc h6:hover a.anchor {\n  text-decoration: none;\n}\n.common-theme-markdown-doc h1 tt,\n.common-theme-markdown-doc h1 code {\n  font-size: inherit;\n}\n.common-theme-markdown-doc h2 tt,\n.common-theme-markdown-doc h2 code {\n  font-size: inherit;\n}\n.common-theme-markdown-doc h3 tt,\n.common-theme-markdown-doc h3 code {\n  font-size: inherit;\n}\n.common-theme-markdown-doc h4 tt,\n.common-theme-markdown-doc h4 code {\n  font-size: inherit;\n}\n.common-theme-markdown-doc h5 tt,\n.common-theme-markdown-doc h5 code {\n  font-size: inherit;\n}\n.common-theme-markdown-doc h6 tt,\n.common-theme-markdown-doc h6 code {\n  font-size: inherit;\n}\n.common-theme-markdown-doc h1 {\n  font-size: 28px;\n  color: black;\n}\n.common-theme-markdown-doc h2 {\n  font-size: 24px;\n  border-bottom: 1px solid #cccccc;\n  color: black;\n}\n.common-theme-markdown-doc h3 {\n  font-size: 18px;\n}\n.common-theme-markdown-doc h4 {\n  font-size: 16px;\n}\n.common-theme-markdown-doc h5 {\n  font-size: 14px;\n}\n.common-theme-markdown-doc h6 {\n  color: #777777;\n  font-size: 14px;\n}\n.common-theme-markdown-doc p,\n.common-theme-markdown-doc blockquote,\n.common-theme-markdown-doc ul,\n.common-theme-markdown-doc ol,\n.common-theme-markdown-doc dl,\n.common-theme-markdown-doc li,\n.common-theme-markdown-doc table,\n.common-theme-markdown-doc pre {\n  margin: 15px 0;\n}\n.common-theme-markdown-doc hr {\n  background: transparent repeat-x 0 0;\n  border: 0 none;\n  color: #cccccc;\n  height: 4px;\n  padding: 0;\n}\n.common-theme-markdown-doc a:first-child h1,\n.common-theme-markdown-doc a:first-child h2,\n.common-theme-markdown-doc a:first-child h3,\n.common-theme-markdown-doc a:first-child h4,\n.common-theme-markdown-doc a:first-child h5,\n.common-theme-markdown-doc a:first-child h6 {\n  margin-top: 0;\n  padding-top: 0;\n}\n.common-theme-markdown-doc h1 p,\n.common-theme-markdown-doc h2 p,\n.common-theme-markdown-doc h3 p,\n.common-theme-markdown-doc h4 p,\n.common-theme-markdown-doc h5 p,\n.common-theme-markdown-doc h6 p {\n  margin-top: 0;\n}\n.common-theme-markdown-doc li p.first {\n  display: inline-block;\n}\n.common-theme-markdown-doc ul,\n.common-theme-markdown-doc ol {\n  padding-left: 30px;\n}\n.common-theme-markdown-doc ul :first-child,\n.common-theme-markdown-doc ol :first-child {\n  margin-top: 0;\n}\n.common-theme-markdown-doc ul :last-child,\n.common-theme-markdown-doc ol :last-child {\n  margin-bottom: 0;\n}\n.common-theme-markdown-doc dl {\n  padding: 0;\n}\n.common-theme-markdown-doc dl dt {\n  font-size: 14px;\n  font-weight: bold;\n  font-style: italic;\n  padding: 0;\n  margin: 15px 0 5px;\n}\n.common-theme-markdown-doc dl dt:first-child {\n  padding: 0;\n}\n.common-theme-markdown-doc dl dt > :first-child {\n  margin-top: 0;\n}\n.common-theme-markdown-doc dl dt > :last-child {\n  margin-bottom: 0;\n}\n.common-theme-markdown-doc dl dd {\n  margin: 0 0 15px;\n  padding: 0 15px;\n}\n.common-theme-markdown-doc dl dd > :first-child {\n  margin-top: 0;\n}\n.common-theme-markdown-doc dl dd > :last-child {\n  margin-bottom: 0;\n}\n.common-theme-markdown-doc blockquote {\n  border-left: 4px solid #dddddd;\n  padding: 0 15px;\n  color: #777777;\n}\n.common-theme-markdown-doc blockquote > :first-child {\n  margin-top: 0;\n}\n.common-theme-markdown-doc blockquote > :last-child {\n  margin-bottom: 0;\n}\n.common-theme-markdown-doc table {\n  padding: 0;\n}\n.common-theme-markdown-doc table tr {\n  border-top: 1px solid #cccccc;\n  background-color: white;\n  margin: 0;\n  padding: 0;\n}\n.common-theme-markdown-doc table tr:nth-child(2n) {\n  background-color: #f8f8f8;\n}\n.common-theme-markdown-doc table tr th {\n  font-weight: bold;\n  border: 1px solid #cccccc;\n  text-align: left;\n  margin: 0;\n  padding: 6px 13px;\n}\n.common-theme-markdown-doc table tr td {\n  border: 1px solid #cccccc;\n  text-align: left;\n  margin: 0;\n  padding: 6px 13px;\n}\n.common-theme-markdown-doc table tr th :first-child,\n.common-theme-markdown-doc table tr td :first-child {\n  margin-top: 0;\n}\n.common-theme-markdown-doc table tr th :last-child,\n.common-theme-markdown-doc table tr td :last-child {\n  margin-bottom: 0;\n}\n.common-theme-markdown-doc img {\n  max-width: 100%;\n}\n.common-theme-markdown-doc span.frame {\n  display: block;\n  overflow: hidden;\n}\n.common-theme-markdown-doc span.frame > span {\n  border: 1px solid #dddddd;\n  display: block;\n  float: left;\n  overflow: hidden;\n  margin: 13px 0 0;\n  padding: 7px;\n  width: auto;\n}\n.common-theme-markdown-doc span.frame span img {\n  display: block;\n  float: left;\n}\n.common-theme-markdown-doc span.frame span span {\n  clear: both;\n  color: #333333;\n  display: block;\n  padding: 5px 0 0;\n}\n.common-theme-markdown-doc span.align-center {\n  display: block;\n  overflow: hidden;\n  clear: both;\n}\n.common-theme-markdown-doc span.align-center > span {\n  display: block;\n  overflow: hidden;\n  margin: 13px auto 0;\n  text-align: center;\n}\n.common-theme-markdown-doc span.align-center span img {\n  margin: 0 auto;\n  text-align: center;\n}\n.common-theme-markdown-doc span.align-right {\n  display: block;\n  overflow: hidden;\n  clear: both;\n}\n.common-theme-markdown-doc span.align-right > span {\n  display: block;\n  overflow: hidden;\n  margin: 13px 0 0;\n  text-align: right;\n}\n.common-theme-markdown-doc span.align-right span img {\n  margin: 0;\n  text-align: right;\n}\n.common-theme-markdown-doc span.float-left {\n  display: block;\n  margin-right: 13px;\n  overflow: hidden;\n  float: left;\n}\n.common-theme-markdown-doc span.float-left span {\n  margin: 13px 0 0;\n}\n.common-theme-markdown-doc span.float-right {\n  display: block;\n  margin-left: 13px;\n  overflow: hidden;\n  float: right;\n}\n.common-theme-markdown-doc span.float-right > span {\n  display: block;\n  overflow: hidden;\n  margin: 13px auto 0;\n  text-align: right;\n}\n.common-theme-markdown-doc code,\n.common-theme-markdown-doc tt {\n  margin: 0 2px;\n  padding: 0 5px;\n  white-space: nowrap;\n  border: 1px solid #eaeaea;\n  background-color: #f8f8f8;\n  border-radius: 3px;\n}\n.common-theme-markdown-doc pre code {\n  margin: 0;\n  padding: 0;\n  white-space: pre;\n  border: none;\n  background: transparent;\n}\n.common-theme-markdown-doc .highlight pre {\n  background-color: #f8f8f8;\n  border: 1px solid #cccccc;\n  font-size: 13px;\n  line-height: 19px;\n  overflow: auto;\n  padding: 6px 10px;\n  border-radius: 3px;\n}\n.common-theme-markdown-doc pre {\n  background-color: #f8f8f8;\n  border: 1px solid #cccccc;\n  font-size: 13px;\n  line-height: 19px;\n  overflow: auto;\n  padding: 6px 10px;\n  border-radius: 3px;\n}\n.common-theme-markdown-doc pre code,\n.common-theme-markdown-doc pre tt {\n  background-color: transparent;\n  border: none;\n}\n/* highlight */\n/*\n\nOriginal highlight.js style (c) Ivan Sagalaev <maniac@softwaremaniacs.org>\n\n*/\n.hljs {\n  display: block;\n  overflow-x: auto;\n  padding: 0.5em;\n  background: #F0F0F0;\n}\n/* Base color: saturation 0; */\n.hljs,\n.hljs-subst {\n  color: #444;\n}\n.hljs-comment {\n  color: #888888;\n}\n.hljs-keyword,\n.hljs-attribute,\n.hljs-selector-tag,\n.hljs-meta-keyword,\n.hljs-doctag,\n.hljs-name {\n  font-weight: bold;\n}\n/* User color: hue: 0 */\n.hljs-type,\n.hljs-string,\n.hljs-number,\n.hljs-selector-id,\n.hljs-selector-class,\n.hljs-quote,\n.hljs-template-tag,\n.hljs-deletion {\n  color: #880000;\n}\n.hljs-title,\n.hljs-section {\n  color: #880000;\n  font-weight: bold;\n}\n.hljs-regexp,\n.hljs-symbol,\n.hljs-variable,\n.hljs-template-variable,\n.hljs-link,\n.hljs-selector-attr,\n.hljs-selector-pseudo {\n  color: #BC6060;\n}\n/* Language color: hue: 90; */\n.hljs-literal {\n  color: #78A960;\n}\n.hljs-built_in,\n.hljs-bullet,\n.hljs-code,\n.hljs-addition {\n  color: #397300;\n}\n/* Meta color: hue: 200 */\n.hljs-meta {\n  color: #1f7199;\n}\n.hljs-meta-string {\n  color: #4d99bf;\n}\n/* Misc effects */\n.hljs-emphasis {\n  font-style: italic;\n}\n.hljs-strong {\n  font-weight: bold;\n}\n", ""]);

// exports


/***/ }),

/***/ 62:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* 这个文件需要存在 */

module.exports = [];

/***/ }),

/***/ 63:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_loader_Downloads_code_my_project_github_vue_markdown_book_node_modules_vue_loader_lib_selector_type_script_index_0_Index_vue__ = __webpack_require__(64);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Downloads_code_my_project_github_vue_markdown_book_node_modules_vue_loader_lib_template_compiler_index_id_data_v_753b7b30_hasScoped_false_Downloads_code_my_project_github_vue_markdown_book_node_modules_vue_loader_lib_selector_type_template_index_0_Index_vue__ = __webpack_require__(65);
var disposed = false
var normalizeComponent = __webpack_require__(0)
/* script */

/* template */

/* styles */
var __vue_styles__ = null
/* scopeId */
var __vue_scopeId__ = null
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  __WEBPACK_IMPORTED_MODULE_0__babel_loader_Downloads_code_my_project_github_vue_markdown_book_node_modules_vue_loader_lib_selector_type_script_index_0_Index_vue__["a" /* default */],
  __WEBPACK_IMPORTED_MODULE_1__Downloads_code_my_project_github_vue_markdown_book_node_modules_vue_loader_lib_template_compiler_index_id_data_v_753b7b30_hasScoped_false_Downloads_code_my_project_github_vue_markdown_book_node_modules_vue_loader_lib_selector_type_template_index_0_Index_vue__["a" /* default */],
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)
Component.options.__file = ".v2u2eb2ook/scaffold/vuebook-temp-code/book-iframe/routes/Index.vue"
if (Component.esModule && Object.keys(Component.esModule).some(function (key) {return key !== "default" && key.substr(0, 2) !== "__"})) {console.error("named exports are not supported in *.vue files.")}
if (Component.options.functional) {console.error("[vue-loader] Index.vue: functional components are not supported with templates, they should use render functions.")}

/* hot reload */
if (false) {(function () {
  var hotAPI = require("vue-hot-reload-api")
  hotAPI.install(require("vue"), false)
  if (!hotAPI.compatible) return
  module.hot.accept()
  if (!module.hot.data) {
    hotAPI.createRecord("data-v-753b7b30", Component.options)
  } else {
    hotAPI.reload("data-v-753b7b30", Component.options)
  }
  module.hot.dispose(function (data) {
    disposed = true
  })
})()}

/* harmony default export */ __webpack_exports__["default"] = (Component.exports);


/***/ }),

/***/ 64:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
//
//
//
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["a"] = ({
    components: {}
});

/***/ }),

/***/ 65:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
var render = function() {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _vm._m(0)
}
var staticRenderFns = [
  function() {
    var _vm = this
    var _h = _vm.$createElement
    var _c = _vm._self._c || _h
    return _c("div", { staticClass: "theme-default-body" }, [
      _c("div", { staticClass: "theme-default-content" }, [
        _c("div", {
          staticClass: "common-theme-markdown-doc theme-default-markdown-doc"
        })
      ])
    ])
  }
]
render._withStripped = true
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ __webpack_exports__["a"] = (esExports);
if (false) {
  module.hot.accept()
  if (module.hot.data) {
     require("vue-hot-reload-api").rerender("data-v-753b7b30", esExports)
  }
}

/***/ })

},[58]);