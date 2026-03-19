/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/block-editor/color-utils.ts"
/*!*****************************************!*\
  !*** ./src/block-editor/color-utils.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getColorTargetMeta: () => (/* binding */ getColorTargetMeta),
/* harmony export */   resolvePresetColorValue: () => (/* binding */ resolvePresetColorValue)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");

const COLOR_META_MAP = {
  "style.color.text": {
    sourceKind: "style-value",
    channel: "text"
  },
  "style.color.background": {
    sourceKind: "style-value",
    channel: "background"
  },
  "style.border.color": {
    sourceKind: "style-value",
    channel: "border"
  },
  textColor: {
    sourceKind: "preset-slug",
    channel: "text"
  },
  backgroundColor: {
    sourceKind: "preset-slug",
    channel: "background"
  },
  borderColor: {
    sourceKind: "preset-slug",
    channel: "border"
  }
};
const GENERIC_META = {
  sourceKind: "generic",
  channel: undefined
};
const getColorTargetMeta = path => COLOR_META_MAP[(0,_utils__WEBPACK_IMPORTED_MODULE_0__.normalizePath)(path)] ?? GENERIC_META;

/**
 * Resolve a Gutenberg preset slug or existing color value to a CSS-ready string.
 *
 * Accepted input forms:
 *   "var:preset|color|slug"        → var(--wp--preset--color--slug)
 *   "var(--wp--preset--color--…)"  → returned as-is
 *   any CSS color literal           → returned as-is
 *   plain slug e.g. "vivid-red"    → var(--wp--preset--color--vivid-red)
 */
const resolvePresetColorValue = rawValue => {
  const value = String(rawValue || "").trim();
  if (!value) {
    return value;
  }
  if (value.startsWith("var(--wp--preset--color--")) {
    return value;
  }
  if (value.startsWith("var:preset|color|")) {
    const slug = value.slice("var:preset|color|".length);
    return slug ? `var(--wp--preset--color--${slug})` : value;
  }
  if (value.startsWith("#") || value.startsWith("rgb(") || value.startsWith("rgba(") || value.startsWith("hsl(") || value.startsWith("hsla(") || value.startsWith("var(")) {
    return value;
  }
  const slug = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug ? `var(--wp--preset--color--${slug})` : value;
};

/***/ },

/***/ "./src/block-editor/preview-adapter-registry.ts"
/*!******************************************************!*\
  !*** ./src/block-editor/preview-adapter-registry.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PreviewAdapterRegistry: () => (/* binding */ PreviewAdapterRegistry),
/* harmony export */   previewAdapterRegistry: () => (/* binding */ previewAdapterRegistry)
/* harmony export */ });
/**
 * Registry that maps target paths to preview adapters.
 *
 * Resolution order:
 *   1. Exact-path registered adapters (highest determinism).
 *   2. Catch-all adapters registered with `registerFallback()`.
 * Within each tier adapters are sorted descending by `priority`.
 */
class PreviewAdapterRegistry {
  pathMap = new Map();
  fallbacks = [];
  register(path, adapter) {
    const existing = this.pathMap.get(path) ?? [];
    existing.push(adapter);
    existing.sort((a, b) => b.priority - a.priority);
    this.pathMap.set(path, existing);
  }
  registerFallback(adapter) {
    this.fallbacks.push(adapter);
    this.fallbacks.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Return the first adapter that can handle the given target.
   * Prefers path-specific adapters over fallbacks.
   */
  resolve(target) {
    const pathAdapters = this.pathMap.get(target.path) ?? [];
    const candidate = pathAdapters.find(a => a.canHandle(target)) ?? this.fallbacks.find(a => a.canHandle(target));
    return candidate;
  }
}
const previewAdapterRegistry = new PreviewAdapterRegistry();

/***/ },

/***/ "./src/block-editor/preview-adapters/border-geometry.ts"
/*!**************************************************************!*\
  !*** ./src/block-editor/preview-adapters/border-geometry.ts ***!
  \**************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   borderGeometryAdapter: () => (/* binding */ borderGeometryAdapter)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils */ "./src/utils/index.ts");

const RADIUS_PROPS = {
  topLeft: "border-top-left-radius",
  topRight: "border-top-right-radius",
  bottomRight: "border-bottom-right-radius",
  bottomLeft: "border-bottom-left-radius"
};
const WIDTH_PROPS = {
  top: "border-top-width",
  right: "border-right-width",
  bottom: "border-bottom-width",
  left: "border-left-width"
};
function expandBorderObject(value, propMap) {
  const result = {};
  for (const key of Object.keys(propMap)) {
    const v = value[key];
    if (typeof v === "string" || typeof v === "number") {
      result[propMap[key]] = v;
    }
  }
  return result;
}

/**
 * Handles style.border.radius → border-*-radius CSS properties (corners).
 *         style.border.width  → border-*-width CSS properties (sides).
 */
const borderGeometryAdapter = {
  id: "border-geometry",
  priority: 80,
  canHandle(target) {
    return target.path === "style.border.radius" || target.path === "style.border.width";
  },
  resolve(target, value) {
    if (target.path === "style.border.width" && (typeof value === "string" || typeof value === "number")) {
      return {
        cssProperty: "border-width",
        cssValue: value
      };
    }
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value)) {
      return {
        skip: true
      };
    }
    const propMap = target.path === "style.border.radius" ? RADIUS_PROPS : WIDTH_PROPS;
    const cssProperties = expandBorderObject(value, propMap);
    if (!Object.keys(cssProperties).length) {
      return {
        skip: true
      };
    }
    return {
      cssProperties
    };
  }
};

/***/ },

/***/ "./src/block-editor/preview-adapters/color-preset-slug.ts"
/*!****************************************************************!*\
  !*** ./src/block-editor/preview-adapters/color-preset-slug.ts ***!
  \****************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   colorPresetSlugAdapter: () => (/* binding */ colorPresetSlugAdapter)
/* harmony export */ });
/* harmony import */ var _color_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../color-utils */ "./src/block-editor/color-utils.ts");

/**
 * Handles textColor → CSS `color` (via preset slug)
 *         backgroundColor → CSS `background-color` (via preset slug)
 *         borderColor → CSS `border-color` (via preset slug)
 *
 * Preset slugs are resolved to var(--wp--preset--color--<slug>).
 * Priority 50 — defers to style-value adapters (priority 100) for the same channel.
 */
const colorPresetSlugAdapter = {
  id: "color-preset-slug",
  priority: 50,
  canHandle(target) {
    return target.path === "textColor" || target.path === "backgroundColor" || target.path === "borderColor";
  },
  resolve(target, value, resolvedChannels) {
    if (typeof value !== "string" || !value) {
      return {
        skip: true
      };
    }
    const channel = target.path === "textColor" ? "text" : target.path === "borderColor" ? "border" : "background";

    // Yield to a style-value that was already applied for this channel.
    if (resolvedChannels[channel] === "style-value") {
      return {
        skip: true
      };
    }
    const cssProperty = channel === "text" ? "color" : channel === "border" ? "border-color" : "background-color";
    const cssValue = (0,_color_utils__WEBPACK_IMPORTED_MODULE_0__.resolvePresetColorValue)(value);
    if (!cssValue) {
      return {
        skip: true
      };
    }
    return {
      cssProperty,
      cssValue
    };
  }
};

/***/ },

/***/ "./src/block-editor/preview-adapters/color-style-value.ts"
/*!****************************************************************!*\
  !*** ./src/block-editor/preview-adapters/color-style-value.ts ***!
  \****************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   colorStyleValueAdapter: () => (/* binding */ colorStyleValueAdapter)
/* harmony export */ });
/**
 * Handles style.color.text → CSS `color`
 *         style.color.background → CSS `background-color`
 *         style.border.color → CSS `border-color`
 *
 * These carry literal color values entered by the user (e.g. #ff0000).
 * Priority 100 — always wins over preset-slug adapters.
 */
const colorStyleValueAdapter = {
  id: "color-style-value",
  priority: 100,
  canHandle(target) {
    return target.path === "style.color.text" || target.path === "style.color.background" || target.path === "style.border.color";
  },
  resolve(target, value) {
    if (typeof value !== "string" || !value) {
      return {
        skip: true
      };
    }
    const cssProperty = target.path === "style.color.text" ? "color" : target.path === "style.border.color" ? "border-color" : "background-color";
    return {
      cssProperty,
      cssValue: value
    };
  }
};

/***/ },

/***/ "./src/block-editor/preview-adapters/generic-path.ts"
/*!***********************************************************!*\
  !*** ./src/block-editor/preview-adapters/generic-path.ts ***!
  \***********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   genericPathAdapter: () => (/* binding */ genericPathAdapter)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils */ "./src/utils/index.ts");

/**
 * Convert a dotted style path to the closest CSS property name.
 * Mirrors the logic previously in getCssPropertyForPath() so behaviour is identical.
 */
function cssPropertyForPath(path) {
  const normalizedPath = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.normalizePath)(path);
  if (!normalizedPath || normalizedPath === "style") {
    return "";
  }
  const segments = normalizedPath.split(".");
  const leaf = segments[segments.length - 1];
  if (segments[0] !== "style") {
    return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.camelToKebab)(leaf);
  }
  const namespace = segments[1] || "";
  if (namespace === "color") {
    if (leaf === "text") return "color";
    if (leaf === "background") return "background-color";
  }
  if (namespace === "border") {
    if (leaf === "color") return "border-color";
  }
  if (namespace === "spacing" && leaf === "blockGap") {
    return "gap";
  }
  if (namespace === "dimensions") {
    if (leaf === "minHeight") return "min-height";
    if (leaf === "aspectRatio") return "aspect-ratio";
  }
  return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.camelToKebab)(leaf);
}

/**
 * Catch-all fallback adapter.
 *
 * Handles any scalar path not claimed by a more specific adapter, using the
 * same path-to-CSS-property conversion that existed previously.
 * Also handles generic objects by expanding via target.leafKeys or object keys.
 *
 * Priority 0 — runs last.
 */
const genericPathAdapter = {
  id: "generic-path",
  priority: 0,
  canHandle(_target) {
    return true;
  },
  resolve(target, value) {
    if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value)) {
      const obj = value;
      const leafKeys = Array.isArray(target.leafKeys) && target.leafKeys.length ? target.leafKeys : Object.keys(obj);
      const cssProperties = {};
      leafKeys.forEach(leafKey => {
        if (!Object.prototype.hasOwnProperty.call(obj, leafKey)) {
          return;
        }
        const v = obj[leafKey];
        if (typeof v !== "string" && typeof v !== "number") {
          return;
        }
        const cssProp = cssPropertyForPath(`${target.path}.${leafKey}`);
        if (cssProp) {
          cssProperties[(0,_utils__WEBPACK_IMPORTED_MODULE_0__.cssPropToJsProp)(cssProp)] = v;
        }
      });
      if (Object.keys(cssProperties).length) {
        return {
          cssProperties
        };
      }
      return {
        skip: true
      };
    }
    if (typeof value !== "string" && typeof value !== "number") {
      return {
        skip: true
      };
    }
    const cssProperty = cssPropertyForPath(target.path);
    if (!cssProperty) {
      return {
        skip: true
      };
    }
    return {
      cssProperty,
      cssValue: value
    };
  }
};

/***/ },

/***/ "./src/block-editor/preview-adapters/index.ts"
/*!****************************************************!*\
  !*** ./src/block-editor/preview-adapters/index.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../preview-adapter-registry */ "./src/block-editor/preview-adapter-registry.ts");
/* harmony import */ var _color_style_value__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./color-style-value */ "./src/block-editor/preview-adapters/color-style-value.ts");
/* harmony import */ var _color_preset_slug__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./color-preset-slug */ "./src/block-editor/preview-adapters/color-preset-slug.ts");
/* harmony import */ var _spacing_object__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./spacing-object */ "./src/block-editor/preview-adapters/spacing-object.ts");
/* harmony import */ var _border_geometry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./border-geometry */ "./src/block-editor/preview-adapters/border-geometry.ts");
/* harmony import */ var _generic_path__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./generic-path */ "./src/block-editor/preview-adapters/generic-path.ts");
/**
 * Registers all built-in preview adapters into the shared registry.
 * Import this module once (from with-responsive-preview.tsx) to set up
 * the registry before the preview HOC runs.
 */







// --- Exact-path registrations ---
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("style.color.text", _color_style_value__WEBPACK_IMPORTED_MODULE_1__.colorStyleValueAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("style.color.background", _color_style_value__WEBPACK_IMPORTED_MODULE_1__.colorStyleValueAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("style.border.color", _color_style_value__WEBPACK_IMPORTED_MODULE_1__.colorStyleValueAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("textColor", _color_preset_slug__WEBPACK_IMPORTED_MODULE_2__.colorPresetSlugAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("backgroundColor", _color_preset_slug__WEBPACK_IMPORTED_MODULE_2__.colorPresetSlugAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("borderColor", _color_preset_slug__WEBPACK_IMPORTED_MODULE_2__.colorPresetSlugAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("style.spacing.padding", _spacing_object__WEBPACK_IMPORTED_MODULE_3__.spacingObjectAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("style.spacing.margin", _spacing_object__WEBPACK_IMPORTED_MODULE_3__.spacingObjectAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("style.border.radius", _border_geometry__WEBPACK_IMPORTED_MODULE_4__.borderGeometryAdapter);
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.register("style.border.width", _border_geometry__WEBPACK_IMPORTED_MODULE_4__.borderGeometryAdapter);

// --- Catch-all fallback ---
_preview_adapter_registry__WEBPACK_IMPORTED_MODULE_0__.previewAdapterRegistry.registerFallback(_generic_path__WEBPACK_IMPORTED_MODULE_5__.genericPathAdapter);

/***/ },

/***/ "./src/block-editor/preview-adapters/spacing-object.ts"
/*!*************************************************************!*\
  !*** ./src/block-editor/preview-adapters/spacing-object.ts ***!
  \*************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   spacingObjectAdapter: () => (/* binding */ spacingObjectAdapter)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils */ "./src/utils/index.ts");

const PADDING_PROPS = {
  top: "padding-top",
  right: "padding-right",
  bottom: "padding-bottom",
  left: "padding-left"
};
const MARGIN_PROPS = {
  top: "margin-top",
  right: "margin-right",
  bottom: "margin-bottom",
  left: "margin-left"
};
function expandSides(value, propMap) {
  const result = {};
  for (const side of ["top", "right", "bottom", "left"]) {
    const v = value[side];
    if (typeof v === "string" || typeof v === "number") {
      result[propMap[side]] = v;
    }
  }
  return result;
}

/**
 * Handles style.spacing.padding and style.spacing.margin object expansion.
 */
const spacingObjectAdapter = {
  id: "spacing-object",
  priority: 80,
  canHandle(target) {
    return target.path === "style.spacing.padding" || target.path === "style.spacing.margin";
  },
  resolve(target, value) {
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value)) {
      return {
        skip: true
      };
    }
    const propMap = target.path === "style.spacing.padding" ? PADDING_PROPS : MARGIN_PROPS;
    const cssProperties = expandSides(value, propMap);
    if (!Object.keys(cssProperties).length) {
      return {
        skip: true
      };
    }
    return {
      cssProperties
    };
  }
};

/***/ },

/***/ "./src/block-editor/responsive-targets-modal.tsx"
/*!*******************************************************!*\
  !*** ./src/block-editor/responsive-targets-modal.tsx ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ResponsiveTargetsModal: () => (/* binding */ ResponsiveTargetsModal)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_edit_post__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/edit-post */ "@wordpress/edit-post");
/* harmony import */ var _wordpress_edit_post__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_edit_post__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _target_discovery__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./target-discovery */ "./src/block-editor/target-discovery.ts");
/* harmony import */ var _targets_store__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./targets-store */ "./src/block-editor/targets-store.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);









const HeaderToolbarButton = _wordpress_edit_post__WEBPACK_IMPORTED_MODULE_1__?.PluginToolbarButton;
const runtimeSettings = window?.responsiveOverridesSettings || {};
const ResponsiveTargetsModal = () => {
  const [isOpen, setIsOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [isSaving, setIsSaving] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [search, setSearch] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("");
  const [selectedMap, setSelectedMap] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({});
  const [feedback, setFeedback] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (HeaderToolbarButton) {
      return undefined;
    }
    let buttonEl = null;
    let intervalId = null;
    const mountFallbackButton = () => {
      if (buttonEl && document.body.contains(buttonEl)) {
        return;
      }
      const headerSettings = document.querySelector(".editor-header .editor-header__settings");
      if (!headerSettings) {
        return;
      }
      buttonEl = document.createElement("button");
      buttonEl.type = "button";
      buttonEl.className = "components-button is-secondary";
      buttonEl.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Responsive", "responsive-overrides");
      buttonEl.style.marginLeft = "8px";
      buttonEl.setAttribute("aria-label", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Responsive Overrides", "responsive-overrides"));
      buttonEl.addEventListener("click", () => setIsOpen(true));
      const previewDropdown = headerSettings.querySelector(".editor-post-preview-dropdown, .editor-preview-dropdown");
      if (previewDropdown && previewDropdown.parentNode) {
        previewDropdown.parentNode.insertBefore(buttonEl, previewDropdown.nextSibling);
      } else {
        headerSettings.appendChild(buttonEl);
      }
    };
    mountFallbackButton();
    intervalId = window.setInterval(mountFallbackButton, 1200);
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (buttonEl && buttonEl.parentNode) {
        buttonEl.parentNode.removeChild(buttonEl);
      }
    };
  }, []);
  const blockTypes = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.useSelect)(select => {
    return select("core/blocks")?.getBlockTypes?.() || [];
  }, []) || [];
  const discovered = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    return blockTypes.map(block => {
      if (block.name === "core/group") {
        console.log(block.attributes);
      }
      const attrs = (0,_target_discovery__WEBPACK_IMPORTED_MODULE_6__.listAttributeCandidates)(block.attributes || {});
      return {
        name: block.name,
        title: block.title || block.name,
        attributes: attrs
      };
    }).filter(block => block.attributes.length > 0);
  }, [blockTypes]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const initial = {};
    (0,_targets_store__WEBPACK_IMPORTED_MODULE_7__.getActiveTargets)().forEach(target => {
      const key = `${target.block}|${target.path}`;
      initial[key] = target;
    });
    setSelectedMap(initial);
  }, [isOpen]);
  const filteredBlocks = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return discovered;
    }
    return discovered.map(block => {
      const matchesBlock = block.name.toLowerCase().includes(term) || block.title.toLowerCase().includes(term);
      if (matchesBlock) {
        return block;
      }
      const attrMatches = block.attributes.filter(attr => attr.path.toLowerCase().includes(term));
      if (!attrMatches.length) {
        return null;
      }
      return {
        ...block,
        attributes: attrMatches
      };
    }).filter(block => Boolean(block));
  }, [discovered, search]);
  const selectedCount = Object.keys(selectedMap).length;
  const toggleSelection = (block, attr, isChecked) => {
    const key = `${block.name}|${attr.path}`;
    setSelectedMap(current => {
      if (!isChecked) {
        const next = {
          ...current
        };
        delete next[key];
        return next;
      }
      return {
        ...current,
        [key]: {
          block: block.name,
          path: attr.path,
          valueKind: attr.valueKind,
          leafKeys: attr.leafKeys || [],
          mapper: attr.mapper || ""
        }
      };
    });
  };
  const saveTargets = async () => {
    setIsSaving(true);
    setFeedback(null);
    const payload = {
      targets: Object.values(selectedMap)
    };
    try {
      const response = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        path: runtimeSettings?.restPath || "/responsive-overrides/v1/targets",
        method: "POST",
        headers: {
          "X-WP-Nonce": runtimeSettings?.nonce || ""
        },
        data: payload
      });
      const nextTargets = (0,_targets_store__WEBPACK_IMPORTED_MODULE_7__.setActiveTargets)(response?.targets || []);
      if (runtimeSettings?.config) {
        runtimeSettings.config.targets = nextTargets;
      }
      setFeedback({
        status: "success",
        message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Responsive targets saved.", "responsive-overrides")
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Failed to save responsive targets.", "responsive-overrides");
      setFeedback({
        status: "error",
        message: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.Fragment, {
    children: [HeaderToolbarButton ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(HeaderToolbarButton, {
      icon: "smartphone",
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Responsive Overrides", "responsive-overrides"),
      onClick: () => setIsOpen(true)
    }) : null, isOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Modal, {
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Responsive Target Settings", "responsive-overrides"),
      onRequestClose: () => setIsOpen(false),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.SearchControl, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Filter blocks or attributes", "responsive-overrides"),
        value: search,
        onChange: setSearch
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("p", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Select block attributes to make responsive per device.", "responsive-overrides")
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("p", {
        children: `${selectedCount} ${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("attributes selected", "responsive-overrides")}`
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
        style: {
          maxHeight: "50vh",
          overflow: "auto",
          border: "1px solid #ddd",
          padding: "8px"
        },
        children: filteredBlocks.map(block => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
          style: {
            marginBottom: "16px"
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("strong", {
            children: block.title
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("code", {
            style: {
              display: "block",
              marginBottom: "6px"
            },
            children: block.name
          }), block.attributes.map(attr => {
            const key = `${block.name}|${attr.path}`;
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.CheckboxControl, {
              label: `${attr.path} (${attr.valueKind})`,
              checked: Boolean(selectedMap[key]),
              onChange: isChecked => toggleSelection(block, attr, isChecked)
            }, key);
          })]
        }, block.name))
      }), feedback && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Notice, {
        status: feedback.status,
        isDismissible: false,
        children: feedback.message
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
        style: {
          marginTop: "16px",
          display: "flex",
          gap: "8px"
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
          variant: "primary",
          onClick: saveTargets,
          isBusy: isSaving,
          disabled: isSaving,
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Save Targets", "responsive-overrides")
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
          variant: "secondary",
          onClick: () => setIsOpen(false),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)("Close", "responsive-overrides")
        })]
      })]
    })]
  });
};

/***/ },

/***/ "./src/block-editor/responsive-targets.ts"
/*!************************************************!*\
  !*** ./src/block-editor/responsive-targets.ts ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getResponsiveValue: () => (/* binding */ getResponsiveValue),
/* harmony export */   getResponsiveValueWithFallback: () => (/* binding */ getResponsiveValueWithFallback),
/* harmony export */   removeResponsiveValue: () => (/* binding */ removeResponsiveValue),
/* harmony export */   setResponsiveValue: () => (/* binding */ setResponsiveValue)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");

class ResponsiveWriteAdapterRegistry {
  adapters = [];
  register(adapter) {
    this.adapters.push(adapter);
    this.adapters.sort((a, b) => b.priority - a.priority);
  }
  resolve(target) {
    return this.adapters.find(adapter => adapter.canHandle(target));
  }
}
const COLOR_ALIAS_CONFLICTS = {
  "style.color.background": ["backgroundColor"],
  backgroundColor: ["style.color.background"],
  "style.color.text": ["textColor"],
  textColor: ["style.color.text"],
  "style.border.color": ["borderColor"],
  borderColor: ["style.border.color"]
};
const colorAliasWriteAdapter = {
  id: "color-alias-write-adapter",
  priority: 100,
  canHandle(target) {
    return Object.prototype.hasOwnProperty.call(COLOR_ALIAS_CONFLICTS, target.path);
  },
  normalize({
    devicePayload,
    target
  }) {
    const conflictingPaths = COLOR_ALIAS_CONFLICTS[target.path] || [];
    conflictingPaths.forEach(path => {
      const key = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.encodePathKey)(path);
      if (devicePayload[key] !== undefined) {
        delete devicePayload[key];
      }
    });
  }
};
const responsiveWriteAdapterRegistry = new ResponsiveWriteAdapterRegistry();
responsiveWriteAdapterRegistry.register(colorAliasWriteAdapter);
const getDeviceFallbackChain = device => {
  const normalizedDevice = String(device || "desktop").toLowerCase();
  if (normalizedDevice === "mobile") {
    return ["mobile", "tablet", "desktop"];
  }
  if (normalizedDevice === "tablet") {
    return ["tablet", "desktop"];
  }
  return ["desktop"];
};
const PRESET_TO_STYLE_ALIAS = {
  backgroundColor: "style.color.background",
  textColor: "style.color.text",
  borderColor: "style.border.color"
};
const setResponsiveValue = (attributes, device, target, value) => {
  const nextResponsiveStyles = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.clone)(attributes?.responsiveStyles || {});
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(nextResponsiveStyles[device])) {
    nextResponsiveStyles[device] = {};
  }
  const pathKey = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.encodePathKey)(target.path);
  if (target.valueKind === "object" && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value)) {
    const existingValue = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(nextResponsiveStyles[device][pathKey]) ? nextResponsiveStyles[device][pathKey] : {};
    const nextValue = {
      ...existingValue
    };
    if (Array.isArray(target.leafKeys) && target.leafKeys.length) {
      target.leafKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          nextValue[key] = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.clone)(value[key]);
        }
      });
    } else {
      Object.assign(nextValue, (0,_utils__WEBPACK_IMPORTED_MODULE_0__.clone)(value));
    }
    nextResponsiveStyles[device][pathKey] = nextValue;
  } else {
    nextResponsiveStyles[device][pathKey] = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.clone)(value);
  }
  try {
    const adapter = responsiveWriteAdapterRegistry.resolve(target);
    if (adapter && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(nextResponsiveStyles[device])) {
      adapter.normalize({
        devicePayload: nextResponsiveStyles[device],
        target
      });
    }
  } catch (e) {
    // Defensive: don't let this helper throw in edge cases.
  }
  return nextResponsiveStyles;
};
const removeResponsiveValue = (attributes, device, target) => {
  const nextResponsiveStyles = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.clone)(attributes?.responsiveStyles || {});
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(nextResponsiveStyles[device])) {
    nextResponsiveStyles[device] = {};
  }
  const pathKey = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.encodePathKey)(target.path);
  if (nextResponsiveStyles[device][pathKey] !== undefined) {
    delete nextResponsiveStyles[device][pathKey];
  }
  return nextResponsiveStyles;
};
const getResponsiveValue = (attributes, device, target) => {
  const payload = attributes?.responsiveStyles?.[device];
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(payload)) {
    return undefined;
  }
  const pathKey = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.encodePathKey)(target.path);
  if (payload[pathKey] !== undefined) {
    return payload[pathKey];
  }
  return undefined;
};
const getResponsiveValueWithFallback = (attributes, device, target, includeCurrentDevice = true) => {
  const fallbackChain = getDeviceFallbackChain(device);
  const devicesToCheck = includeCurrentDevice ? fallbackChain : fallbackChain.slice(1);
  const styleAliasPath = PRESET_TO_STYLE_ALIAS[target.path];
  const styleAliasTarget = styleAliasPath ? {
    ...target,
    path: styleAliasPath
  } : null;
  for (const fallbackDevice of devicesToCheck) {
    if (styleAliasTarget) {
      const styleAliasValue = getResponsiveValue(attributes, fallbackDevice, styleAliasTarget);
      if (styleAliasValue !== undefined) {
        // Style-value aliases win at this precedence level, and block lower-level preset fallback.
        return undefined;
      }
    }
    const value = getResponsiveValue(attributes, fallbackDevice, target);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
};

/***/ },

/***/ "./src/block-editor/target-discovery.ts"
/*!**********************************************!*\
  !*** ./src/block-editor/target-discovery.ts ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   listAttributeCandidates: () => (/* binding */ listAttributeCandidates),
/* harmony export */   normalizeTargets: () => (/* binding */ normalizeTargets)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");
/* harmony import */ var _color_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./color-utils */ "./src/block-editor/color-utils.ts");


const DEVICE_KEYS = ["desktop", "tablet", "mobile"];
const DEFAULT_TARGETS = [];
const DEFAULT_STYLE_TARGETS = [{
  path: "style.spacing.padding",
  valueKind: "object",
  leafKeys: ["top", "right", "bottom", "left"],
  mapper: "spacingPadding",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.spacing.margin",
  valueKind: "object",
  leafKeys: ["top", "right", "bottom", "left"],
  mapper: "spacingMargin",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.color.text",
  valueKind: "scalar",
  leafKeys: [],
  mapper: "textColor",
  sourceKind: "style-value",
  channel: "text"
}, {
  path: "style.color.background",
  valueKind: "scalar",
  leafKeys: [],
  mapper: "backgroundColor",
  sourceKind: "style-value",
  channel: "background"
}, {
  path: "style.border.radius",
  valueKind: "object",
  leafKeys: ["topLeft", "topRight", "bottomRight", "bottomLeft"],
  mapper: "borderRadius",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.border.width",
  valueKind: "scalar",
  leafKeys: [],
  mapper: "borderWidth",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.border.color",
  valueKind: "scalar",
  leafKeys: [],
  mapper: "borderColor",
  sourceKind: "style-value",
  channel: "border"
}];
const normalizeTargets = rawTargets => {
  if (!Array.isArray(rawTargets) || !rawTargets.length) {
    return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.clone)(DEFAULT_TARGETS);
  }

  // Generic object paths that should never be targets (too broad)
  const FORBIDDEN_PATHS = ["style"];
  return rawTargets.filter(target => {
    if (!target?.block || !target?.path) {
      return false;
    }
    const normalizedPath = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.normalizePath)(target.path);
    if (!normalizedPath) {
      return false;
    }

    // Reject generic object paths
    if (FORBIDDEN_PATHS.includes(normalizedPath.toLowerCase())) {
      if (window.console && window.console.warn) {
        window.console.warn("[RO] Rejecting generic target path:", normalizedPath, "for block:", target.block);
      }
      return false;
    }
    return true;
  }).map(target => {
    const normalizedPath = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.normalizePath)(target.path);
    const colorMeta = (0,_color_utils__WEBPACK_IMPORTED_MODULE_1__.getColorTargetMeta)(normalizedPath);
    const normalized = {
      block: String(target.block),
      path: normalizedPath,
      valueKind: target.valueKind === "scalar" ? "scalar" : "object",
      leafKeys: Array.isArray(target.leafKeys) ? target.leafKeys.map(String) : [],
      mapper: target.mapper ? String(target.mapper) : "",
      sourceKind: target.sourceKind ? String(target.sourceKind) : colorMeta.sourceKind,
      channel: target.channel ? String(target.channel) : colorMeta.channel
    };
    if (!normalized.mapper) {
      normalized.mapper = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getMapperForPath)(normalized.path);
    }
    return normalized;
  });
};
const detectValueKind = value => {
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value)) {
    return "object";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return "scalar";
  }
  return null;
};
const listAttributeCandidates = (attributes, pathPrefix = "", depth = 0) => {
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(attributes) || depth > 4) {
    return [];
  }
  const candidates = [];
  const hiddenAttributes = ["tagName", "templateLock", "metadata", "allowedBlocks", "ariaLabel"];
  const forbiddenPaths = new Set(["style"]);

  // Always include well-known style paths regardless of schema discovery
  if (depth === 0 && !pathPrefix) {
    candidates.push(...DEFAULT_STYLE_TARGETS);
  }
  Object.entries(attributes).forEach(([attrName, schema]) => {
    const path = pathPrefix ? `${pathPrefix}.${attrName}` : attrName;
    const type = schema?.type;

    // Skip internal/control attributes at top level
    if (depth === 0 && attrName === "responsiveStyles") {
      return;
    }
    if (depth === 0 && hiddenAttributes.includes(attrName)) {
      return;
    }
    if (type === "object" && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(schema?.properties)) {
      if (!forbiddenPaths.has(path)) {
        const colorMeta = (0,_color_utils__WEBPACK_IMPORTED_MODULE_1__.getColorTargetMeta)(path);
        const mapper = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getMapperForPath)(path);
        const leafKeys = Object.entries(schema.properties).filter(([, childSchema]) => {
          const childType = childSchema?.type;
          return childType === "string" || childType === "number" || childType === "boolean";
        }).map(([key]) => key);

        // Only expose object paths that are directly actionable.
        // This avoids surfacing container/typo paths like `style.brder`
        // that have nested children but no usable direct value contract.
        if (leafKeys.length || mapper || colorMeta.channel) {
          candidates.push({
            path,
            valueKind: "object",
            leafKeys,
            mapper,
            sourceKind: colorMeta.sourceKind,
            channel: colorMeta.channel
          });
        }
      }
      candidates.push(...listAttributeCandidates(schema.properties, path, depth + 1));
      return;
    }
    const valueKind = detectValueKind(schema?.default) || (type === "object" ? "object" : "scalar");
    if (!valueKind) {
      return;
    }

    // Skip generic object-type attributes without explicit mappers
    // to prevent selecting overly broad paths like "style"
    if (valueKind === "object" || forbiddenPaths.has(path)) {
      return;
    }
    candidates.push({
      path,
      valueKind,
      leafKeys: [],
      mapper: "",
      ...(0,_color_utils__WEBPACK_IMPORTED_MODULE_1__.getColorTargetMeta)(path)
    });
  });

  // Deduplicate by path
  const deduped = new Map();
  candidates.forEach(candidate => {
    deduped.set(candidate.path, candidate);
  });
  return Array.from(deduped.values());
};

/***/ },

/***/ "./src/block-editor/targets-store.ts"
/*!*******************************************!*\
  !*** ./src/block-editor/targets-store.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getActiveTargets: () => (/* binding */ getActiveTargets),
/* harmony export */   setActiveTargets: () => (/* binding */ setActiveTargets),
/* harmony export */   useActiveTargets: () => (/* binding */ useActiveTargets)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _target_discovery__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./target-discovery */ "./src/block-editor/target-discovery.ts");



const runtimeSettings = window?.responsiveOverridesSettings || {};
const ACTIVE_TARGETS_STORE_NAME = "responsive-overrides/active-targets";
const DEFAULT_ACTIVE_TARGETS_STATE = {
  targets: (0,_target_discovery__WEBPACK_IMPORTED_MODULE_2__.normalizeTargets)(runtimeSettings?.config?.targets)
};
const activeTargetsStore = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.createReduxStore)(ACTIVE_TARGETS_STORE_NAME, {
  reducer(state = DEFAULT_ACTIVE_TARGETS_STATE, action) {
    switch (action.type) {
      case "SET_ACTIVE_TARGETS":
        return {
          ...state,
          targets: (0,_target_discovery__WEBPACK_IMPORTED_MODULE_2__.normalizeTargets)(action.rawTargets)
        };
      default:
        return state;
    }
  },
  actions: {
    setActiveTargets(rawTargets) {
      return {
        type: "SET_ACTIVE_TARGETS",
        rawTargets
      };
    }
  },
  selectors: {
    getActiveTargets(state) {
      return state.targets;
    }
  }
});
(0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.register)(activeTargetsStore);
const getActiveTargets = () => {
  return (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.select)(ACTIVE_TARGETS_STORE_NAME)?.getActiveTargets?.() || [];
};
const setActiveTargets = rawTargets => {
  (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.dispatch)(ACTIVE_TARGETS_STORE_NAME).setActiveTargets(rawTargets);
  return getActiveTargets();
};
const useActiveTargets = blockName => {
  const targets = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(selectRegistry => selectRegistry(ACTIVE_TARGETS_STORE_NAME)?.getActiveTargets?.() || [], []);
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    if (!blockName) {
      return targets;
    }
    return targets.filter(target => target.block === blockName);
  }, [targets, blockName]);
};

/***/ },

/***/ "./src/block-editor/with-responsive-logic.tsx"
/*!****************************************************!*\
  !*** ./src/block-editor/with-responsive-logic.tsx ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   withResponsiveLogic: () => (/* binding */ withResponsiveLogic)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");
/* harmony import */ var _targets_store__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./targets-store */ "./src/block-editor/targets-store.ts");
/* harmony import */ var _responsive_targets__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./responsive-targets */ "./src/block-editor/responsive-targets.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);








const hasPathInObject = (object, path) => {
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(object) || !path) {
    return false;
  }
  const segments = path.split(".");
  let cursor = object;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(cursor) || !Object.prototype.hasOwnProperty.call(cursor, segment)) {
      return false;
    }
    cursor = cursor[segment];
  }
  return true;
};
const cloneResponsiveStyles = attributes => (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attributes?.responsiveStyles || {});
const writeResponsiveValue = (responsiveStyles, device, target, value) => {
  if (value === undefined) {
    return (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_6__.removeResponsiveValue)({
      responsiveStyles
    }, device, target);
  }
  return (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_6__.setResponsiveValue)({
    responsiveStyles
  }, device, target, value);
};
const areValuesEqual = (left, right) => {
  if (left === right) {
    return true;
  }
  return JSON.stringify(left) === JSON.stringify(right);
};
const buildMountSyncAttributes = (attributes, targets) => {
  const nextAttributes = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attributes);
  let nextResponsiveStyles = cloneResponsiveStyles(attributes);
  let needsUpdate = false;
  targets.forEach(target => {
    const desktopValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_6__.getResponsiveValue)({
      responsiveStyles: nextResponsiveStyles
    }, "desktop", target);
    if (desktopValue === undefined) {
      const liveValue = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getValueAtPath)(attributes, target.path);
      if (liveValue === undefined) {
        return;
      }
      nextResponsiveStyles = writeResponsiveValue(nextResponsiveStyles, "desktop", target, liveValue);
      needsUpdate = true;
      return;
    }
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__.setValueAtPath)(nextAttributes, target.path, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(desktopValue));
    needsUpdate = true;
  });
  if (!needsUpdate) {
    return null;
  }
  nextAttributes.responsiveStyles = nextResponsiveStyles;
  return nextAttributes;
};
const buildDeviceSyncAttributes = (attributes, targets, previousDevice, device) => {
  let nextResponsiveStyles = cloneResponsiveStyles(attributes);
  targets.forEach(target => {
    const liveValue = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getValueAtPath)(attributes, target.path);
    const explicitPreviousValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_6__.getResponsiveValue)({
      responsiveStyles: nextResponsiveStyles
    }, previousDevice, target);
    const inheritedPreviousValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_6__.getResponsiveValueWithFallback)({
      responsiveStyles: nextResponsiveStyles
    }, previousDevice, target, false);
    const shouldRemoveInheritedWrite = explicitPreviousValue === undefined && areValuesEqual(liveValue, inheritedPreviousValue);
    const valueToStore = shouldRemoveInheritedWrite ? undefined : liveValue;
    nextResponsiveStyles = writeResponsiveValue(nextResponsiveStyles, previousDevice, target, valueToStore);
  });
  const nextAttributes = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attributes);
  targets.forEach(target => {
    const currentDeviceValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_6__.getResponsiveValueWithFallback)({
      responsiveStyles: nextResponsiveStyles
    }, device, target);
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__.setValueAtPath)(nextAttributes, target.path, currentDeviceValue === undefined ? undefined : (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(currentDeviceValue));
  });
  nextAttributes.responsiveStyles = nextResponsiveStyles;
  return nextAttributes;
};
const buildResponsiveAttributeUpdate = (attributes, newAttrs, device, targets) => {
  let nextResponsiveStyles = cloneResponsiveStyles(attributes);
  let hasResponsiveChange = false;
  targets.forEach(target => {
    if (!hasPathInObject(newAttrs, target.path)) {
      return;
    }
    const incomingValue = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getValueAtPath)(newAttrs, target.path);
    const currentValue = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getValueAtPath)(attributes, target.path);
    if (incomingValue === undefined && currentValue === undefined) {
      return;
    }
    if (incomingValue === undefined) {
      hasResponsiveChange = true;
      nextResponsiveStyles = writeResponsiveValue(nextResponsiveStyles, device, target, incomingValue);
      return;
    }
    if (areValuesEqual(incomingValue, currentValue)) {
      return;
    }
    hasResponsiveChange = true;
    nextResponsiveStyles = writeResponsiveValue(nextResponsiveStyles, device, target, incomingValue);
  });
  if (!hasResponsiveChange) {
    return null;
  }
  return {
    ...newAttrs,
    responsiveStyles: nextResponsiveStyles
  };
};
const scheduleSyncReset = syncRef => {
  requestAnimationFrame(() => {
    syncRef.current = false;
  });
};
const withResponsiveLogic = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.createHigherOrderComponent)(BlockEdit => {
  return props => {
    const targets = (0,_targets_store__WEBPACK_IMPORTED_MODULE_5__.useActiveTargets)(props.name);
    if (!targets.length) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(BlockEdit, {
        ...props
      });
    }
    const {
      setAttributes,
      attributes
    } = props;
    const deviceType = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.useSelect)(select => select("core/editor").getDeviceType?.() || "Desktop", []);
    const device = (deviceType || "Desktop").toLowerCase();
    const prevDeviceRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(device);
    const isSyncingRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(false);
    const attrsRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(attributes);
    const didMountRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(false);
    attrsRef.current = attributes;
    const applySyncedAttributes = nextAttributes => {
      isSyncingRef.current = true;
      setAttributes(nextAttributes);
      scheduleSyncReset(isSyncingRef);
    };

    /**
     * Run only once onMount
     */
    (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
      if (didMountRef.current) {
        return;
      }
      didMountRef.current = true;
      const nextAttributes = buildMountSyncAttributes(attrsRef.current, targets);
      if (!nextAttributes) {
        return;
      }
      applySyncedAttributes(nextAttributes);
    }, []);
    /**
     * Run after every device preview change
     */
    (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
      if (prevDeviceRef.current === device) {
        return;
      }
      const previousDevice = prevDeviceRef.current;
      prevDeviceRef.current = device;
      const nextAttributes = buildDeviceSyncAttributes(attrsRef.current, targets, previousDevice, device);
      applySyncedAttributes(nextAttributes);
    }, [device]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Run Everytime an attribute changes.
     */

    const interceptedSetAttributes = newAttrs => {
      if (isSyncingRef.current) {
        setAttributes(newAttrs);
        return;
      }
      const nextAttributes = buildResponsiveAttributeUpdate(attrsRef.current, newAttrs, device, targets);
      if (!nextAttributes) {
        setAttributes(newAttrs);
        return;
      }
      setAttributes(nextAttributes);
    };
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(BlockEdit, {
      ...props,
      setAttributes: interceptedSetAttributes
    });
  };
}, "withResponsiveLogic");

/***/ },

/***/ "./src/block-editor/with-responsive-preview.tsx"
/*!******************************************************!*\
  !*** ./src/block-editor/with-responsive-preview.tsx ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   withResponsivePreview: () => (/* binding */ withResponsivePreview)
/* harmony export */ });
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");
/* harmony import */ var _targets_store__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./targets-store */ "./src/block-editor/targets-store.ts");
/* harmony import */ var _responsive_targets__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./responsive-targets */ "./src/block-editor/responsive-targets.ts");
/* harmony import */ var _preview_adapter_registry__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./preview-adapter-registry */ "./src/block-editor/preview-adapter-registry.ts");
/* harmony import */ var _preview_adapters_index__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./preview-adapters/index */ "./src/block-editor/preview-adapters/index.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);








const withResponsivePreview = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_0__.createHigherOrderComponent)(BlockListBlock => {
  return props => {
    const targets = (0,_targets_store__WEBPACK_IMPORTED_MODULE_3__.useActiveTargets)(props.name);
    if (!targets.length) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(BlockListBlock, {
        ...props
      });
    }
    const deviceType = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_1__.useSelect)(select => select("core/editor").getDeviceType?.() || "Desktop", []);
    const device = (deviceType || "Desktop").toLowerCase();
    if (device === "desktop") {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(BlockListBlock, {
        ...props
      });
    }
    const {
      attributes
    } = props;
    const previewStyles = {};
    const resolvedChannels = {};
    targets.forEach(target => {
      const responsiveValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_4__.getResponsiveValueWithFallback)(attributes, device, target);
      if (responsiveValue === undefined) {
        return;
      }
      const adapter = _preview_adapter_registry__WEBPACK_IMPORTED_MODULE_5__.previewAdapterRegistry.resolve(target);
      if (!adapter) {
        return;
      }
      const result = adapter.resolve(target, responsiveValue, resolvedChannels);
      if ("skip" in result) {
        return;
      }
      if ("cssProperty" in result) {
        previewStyles[(0,_utils__WEBPACK_IMPORTED_MODULE_2__.cssPropToJsProp)(result.cssProperty)] = result.cssValue;
        if (target.channel && target.sourceKind) {
          resolvedChannels[target.channel] = target.sourceKind;
        }
        return;
      }
      if ("cssProperties" in result) {
        Object.entries(result.cssProperties).forEach(([prop, val]) => {
          // Adapter may emit kebab-case or already-camelCase keys.
          const jsProp = prop.includes("-") ? (0,_utils__WEBPACK_IMPORTED_MODULE_2__.cssPropToJsProp)(prop) : prop;
          previewStyles[jsProp] = val;
        });
      }
    });
    if (!Object.keys(previewStyles).length) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(BlockListBlock, {
        ...props
      });
    }
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(BlockListBlock, {
      ...props,
      wrapperProps: {
        ...(props.wrapperProps || {}),
        style: {
          ...(props.wrapperProps?.style || {}),
          ...previewStyles
        }
      }
    });
  };
}, "withResponsivePreview");

/***/ },

/***/ "./src/utils/index.ts"
/*!****************************!*\
  !*** ./src/utils/index.ts ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   camelToKebab: () => (/* binding */ camelToKebab),
/* harmony export */   clone: () => (/* binding */ clone),
/* harmony export */   cssPropToJsProp: () => (/* binding */ cssPropToJsProp),
/* harmony export */   encodePathKey: () => (/* binding */ encodePathKey),
/* harmony export */   getMapperForPath: () => (/* binding */ getMapperForPath),
/* harmony export */   getResponsiveValue: () => (/* binding */ getResponsiveValue),
/* harmony export */   getValueAtPath: () => (/* binding */ getValueAtPath),
/* harmony export */   isObject: () => (/* binding */ isObject),
/* harmony export */   normalizePath: () => (/* binding */ normalizePath),
/* harmony export */   setResponsiveValue: () => (/* binding */ setResponsiveValue),
/* harmony export */   setValueAtPath: () => (/* binding */ setValueAtPath)
/* harmony export */ });
const SUPPORTED_PATH_TO_MAPPER = {
  "style.spacing.padding": "spacingPadding",
  "style.spacing.margin": "spacingMargin",
  "style.color.text": "textColor",
  "style.color.background": "backgroundColor",
  "style.border.radius": "borderRadius",
  "style.border.width": "borderWidth",
  "style.border.color": "borderColor"
};

/**
 *
 * @param {string} value: The camelCase string to convert to kebab-case.
 * @returns {string} The converted kebab-case string.
 * * @example
 * camelToKebab("spacingPadding") -> "spacing-padding"
 */
const camelToKebab = value => String(value || "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 *
 * @param {string} cssProperty: The kebab-case CSS property to convert to camelCase.
 * @returns {string} The converted camelCase string.
 * * @example
 * cssPropToJsProp("spacing-padding") -> "spacingPadding"
 */
const cssPropToJsProp = cssProperty => cssProperty.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());

/**
 *
 * @param {any} value: The value to check.
 * @returns {boolean} True if the value is an object, false otherwise.
 */
const isObject = value => value && typeof value === "object" && !Array.isArray(value);

/**
 *
 * @param {Object | any[]} value: The value to clone.
 * @returns {Object | any[]} The cloned value.
 * @description Deep clones an object or array. For non-object values, it returns the value as-is. Note that this method does not handle functions, dates, or other complex types.
 */
const clone = value => isObject(value) || Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : value;

/**
 * Encodes a path key by replacing dots with double underscores.
 * @param {string} path: The path to encode.
 * @returns {string} The encoded path key.
 * @example
 * encodePathKey("style.spacing.padding") -> "style__spacing__padding"
 */
const encodePathKey = path => path.replace(/\./g, "__");
const normalizePath = path => String(path || "").trim();
const getMapperForPath = path => {
  return SUPPORTED_PATH_TO_MAPPER[normalizePath(path)] || "";
};

/**
 * Read a nested value using dot notation.
 * Example:
 *   getValueAtPath({ style: { spacing: { padding: "2rem" } } }, "style.spacing.padding")
 *   -> "2rem"
 */
const getValueAtPath = (object, path) => {
  if (!object || !path) {
    return undefined;
  }
  return path.split(".").reduce((acc, segment) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }
    return acc[segment];
  }, object);
};
const setValueAtPath = (object, path, value) => {
  if (!path) {
    return object;
  }
  const segments = path.split(".");
  let cursor = object;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      // If both current and new values are objects, merge them to preserve siblings
      if (isObject(cursor[segment]) && isObject(value)) {
        cursor[segment] = {
          ...cursor[segment],
          ...value
        };
      } else {
        cursor[segment] = value;
      }
      return;
    }
    if (!isObject(cursor[segment])) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  });
  return object;
};
const setResponsiveValue = (attributes, device, target, value) => {
  const nextResponsiveStyles = clone(attributes?.responsiveStyles || {});
  if (!isObject(nextResponsiveStyles[device])) {
    nextResponsiveStyles[device] = {};
  }
  const pathKey = encodePathKey(target.path);
  if (target.valueKind === "object" && isObject(value)) {
    const existingValue = isObject(nextResponsiveStyles[device][pathKey]) ? nextResponsiveStyles[device][pathKey] : {};
    const nextValue = {
      ...existingValue
    };
    if (Array.isArray(target.leafKeys) && target.leafKeys.length) {
      target.leafKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          nextValue[key] = clone(value[key]);
        }
      });
    } else {
      Object.assign(nextValue, clone(value));
    }
    nextResponsiveStyles[device][pathKey] = nextValue;
  } else {
    nextResponsiveStyles[device][pathKey] = clone(value);
  }
  return nextResponsiveStyles;
};
const getResponsiveValue = (attributes, device, target) => {
  const payload = attributes?.responsiveStyles?.[device];
  if (!isObject(payload)) {
    return undefined;
  }
  const pathKey = encodePathKey(target.path);
  if (payload[pathKey] !== undefined) {
    return payload[pathKey];
  }
  return undefined;
};

/***/ },

/***/ "react"
/*!************************!*\
  !*** external "React" ***!
  \************************/
(module) {

module.exports = window["React"];

/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/api-fetch"
/*!**********************************!*\
  !*** external ["wp","apiFetch"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["apiFetch"];

/***/ },

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

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

/***/ "@wordpress/edit-post"
/*!**********************************!*\
  !*** external ["wp","editPost"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["editPost"];

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

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/plugins"
/*!*********************************!*\
  !*** external ["wp","plugins"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["plugins"];

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
  !*** ./src/block-editor/index.ts ***!
  \***********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/plugins */ "@wordpress/plugins");
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _responsive_targets_modal__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./responsive-targets-modal */ "./src/block-editor/responsive-targets-modal.tsx");
/* harmony import */ var _with_responsive_logic__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./with-responsive-logic */ "./src/block-editor/with-responsive-logic.tsx");
/* harmony import */ var _with_responsive_preview__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./with-responsive-preview */ "./src/block-editor/with-responsive-preview.tsx");





(0,_wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__.registerPlugin)('responsive-overrides-settings', {
  render: _responsive_targets_modal__WEBPACK_IMPORTED_MODULE_2__.ResponsiveTargetsModal
});
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addFilter)('editor.BlockEdit', 'responsive-overrides/interceptor', _with_responsive_logic__WEBPACK_IMPORTED_MODULE_3__.withResponsiveLogic);
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addFilter)('editor.BlockListBlock', 'responsive-overrides/previewer', _with_responsive_preview__WEBPACK_IMPORTED_MODULE_4__.withResponsivePreview);
})();

/******/ })()
;
//# sourceMappingURL=themeplix-block-editor.js.map