/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/compose"
/*!*********************************!*\
  !*** external ["wp","compose"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["compose"];

/***/ },

/***/ "@wordpress/data"
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["data"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/hooks"
/*!*******************************!*\
  !*** external ["wp","hooks"] ***!
  \*******************************/
(module) {

module.exports = window["wp"]["hooks"];

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***********************************!*\
  !*** ./src/block-editor/index.js ***!
  \***********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





const TARGET_BLOCK = 'core/group';
const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => isObject(v) ? JSON.parse(JSON.stringify(v)) : v;

/**
 * Get the padding object from attributes (e.g. { top: "20px", left: "10px" }).
 */
const getPadding = attributes => {
  const p = attributes?.style?.spacing?.padding;
  return isObject(p) ? p : {};
};

/**
 * Get stored responsive padding for a device from responsiveStyles.
 */
const getDevicePadding = (attributes, device) => {
  const p = attributes?.responsiveStyles?.[device]?.padding;
  return isObject(p) ? p : {};
};

/**
 * Build an updated responsiveStyles object with new padding for a device.
 */
const setDevicePadding = (attributes, device, padding) => {
  const rs = clone(attributes?.responsiveStyles || {});
  if (!isObject(rs[device])) {
    rs[device] = {};
  }
  rs[device].padding = {
    ...(rs[device].padding || {}),
    ...padding
  };
  return rs;
};

/**
 * Build a style object with replaced padding.
 */
const buildStyleWithPadding = (attributes, padding) => {
  const s = clone(attributes?.style || {});
  if (!isObject(s.spacing)) {
    s.spacing = {};
  }
  s.spacing.padding = padding;
  return s;
};

// ── editor.BlockEdit: intercept setAttributes + swap on device switch ──

const withResponsiveLogic = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.createHigherOrderComponent)(BlockEdit => {
  return props => {
    if (props.name !== TARGET_BLOCK) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(BlockEdit, {
        ...props
      });
    }
    const {
      setAttributes,
      attributes
    } = props;
    const deviceType = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useSelect)(select => select('core/editor').getDeviceType(), []);
    const device = (deviceType || 'Desktop').toLowerCase();

    // Refs to track previous device and prevent infinite loops.
    const prevDeviceRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useRef)(device);
    const isSyncing = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useRef)(false);
    const attrsRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useRef)(attributes);
    attrsRef.current = attributes;
    const didMount = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useRef)(false);

    // On mount, restore desktop padding from responsiveStyles if saved
    // while on a different device.
    (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useEffect)(() => {
      if (didMount.current) {
        return;
      }
      didMount.current = true;
      const a = attrsRef.current;
      const desktopPadding = a?.responsiveStyles?.desktop?.padding;
      if (!isObject(desktopPadding) || !Object.keys(desktopPadding).length) {
        return;
      }
      const livePadding = getPadding(a);
      if (JSON.stringify(livePadding) === JSON.stringify(desktopPadding)) {
        return;
      }
      isSyncing.current = true;
      setAttributes({
        style: buildStyleWithPadding(a, clone(desktopPadding))
      });
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // When the device changes, swap padding in the store.
    (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useEffect)(() => {
      if (prevDeviceRef.current === device) {
        return;
      }
      const prev = prevDeviceRef.current;
      prevDeviceRef.current = device;
      isSyncing.current = true;
      const currentAttrs = attrsRef.current;

      // 1. Save current live padding into responsiveStyles for the *previous* device.
      const livePadding = getPadding(currentAttrs);
      let nextRS = setDevicePadding(currentAttrs, prev, livePadding);

      // 2. Also persist the nextRS update for the previous device.
      // 3. Load the new device's stored padding into style.spacing.padding.
      const newPadding = nextRS[device]?.padding;
      const nextStyle = buildStyleWithPadding(currentAttrs, isObject(newPadding) && Object.keys(newPadding).length ? clone(newPadding) : clone(livePadding));
      setAttributes({
        responsiveStyles: nextRS,
        style: nextStyle
      });

      // Reset syncing flag after React processes the update.
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    }, [device]); // eslint-disable-line react-hooks/exhaustive-deps

    // Intercept setAttributes: on tablet/mobile, also mirror padding into responsiveStyles.
    const interceptedSetAttributes = newAttrs => {
      // During our own sync, pass through untouched.
      if (isSyncing.current) {
        setAttributes(newAttrs);
        return;
      }

      // Check if this update touches padding.
      const incomingPadding = newAttrs?.style?.spacing?.padding;
      const hasPaddingChange = isObject(incomingPadding);
      if (device === 'desktop') {
        if (hasPaddingChange) {
          // Also mirror into responsiveStyles.desktop
          const merged = {
            ...getPadding(attributes),
            ...incomingPadding
          };
          newAttrs = {
            ...newAttrs,
            responsiveStyles: setDevicePadding(attributes, 'desktop', merged)
          };
        }
        setAttributes(newAttrs);
        return;
      }

      // Tablet / Mobile
      if (hasPaddingChange) {
        const merged = {
          ...getDevicePadding(attributes, device),
          ...incomingPadding
        };
        newAttrs = {
          ...newAttrs,
          responsiveStyles: setDevicePadding(attributes, device, merged)
        };
      }
      setAttributes(newAttrs);
    };
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(BlockEdit, {
      ...props,
      setAttributes: interceptedSetAttributes
    });
  };
}, 'withResponsiveLogic');
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addFilter)('editor.BlockEdit', 'responsive-overrides/interceptor', withResponsiveLogic);

// ── editor.BlockListBlock: preview responsive padding in canvas ──

const withPreviewStyles = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.createHigherOrderComponent)(BlockListBlock => {
  return props => {
    if (props.name !== TARGET_BLOCK) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(BlockListBlock, {
        ...props
      });
    }
    const deviceType = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useSelect)(select => select('core/editor').getDeviceType(), []);
    const device = (deviceType || 'Desktop').toLowerCase();
    if (device === 'desktop') {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(BlockListBlock, {
        ...props
      });
    }
    const padding = getDevicePadding(props.attributes, device);
    if (!Object.keys(padding).length) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(BlockListBlock, {
        ...props
      });
    }
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(BlockListBlock, {
      ...props,
      wrapperProps: {
        style: {
          paddingTop: padding.top,
          paddingRight: padding.right,
          paddingBottom: padding.bottom,
          paddingLeft: padding.left
        }
      }
    });
  };
}, 'withPreviewStyles');
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addFilter)('editor.BlockListBlock', 'responsive-overrides/previewer', withPreviewStyles);
})();

/******/ })()
;
//# sourceMappingURL=themeplix-block-editor.js.map