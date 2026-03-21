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
/* harmony export */   COLOR_CHANNEL_PRESET_PATHS: () => (/* binding */ COLOR_CHANNEL_PRESET_PATHS),
/* harmony export */   COLOR_CHANNEL_STYLE_PATHS: () => (/* binding */ COLOR_CHANNEL_STYLE_PATHS),
/* harmony export */   getColorAliasPath: () => (/* binding */ getColorAliasPath),
/* harmony export */   getColorTargetMeta: () => (/* binding */ getColorTargetMeta),
/* harmony export */   resolvePresetColorValue: () => (/* binding */ resolvePresetColorValue)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");

const COLOR_CHANNEL_STYLE_PATHS = {
  text: "style.color.text",
  background: "style.color.background",
  border: "style.border.color"
};
const COLOR_CHANNEL_PRESET_PATHS = {
  text: "textColor",
  background: "backgroundColor",
  border: "borderColor"
};
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
const getColorAliasPath = path => {
  const normalizedPath = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.normalizePath)(path);
  const colorMeta = COLOR_META_MAP[normalizedPath];
  if (!colorMeta?.channel) {
    return undefined;
  }
  const stylePath = COLOR_CHANNEL_STYLE_PATHS[colorMeta.channel];
  const presetPath = COLOR_CHANNEL_PRESET_PATHS[colorMeta.channel];
  if (normalizedPath === stylePath) {
    return presetPath;
  }
  if (normalizedPath === presetPath) {
    return stylePath;
  }
  return undefined;
};
const extractPresetSlug = rawValue => {
  const value = String(rawValue || "").trim();
  if (value.startsWith("var:preset|color|")) {
    return value.slice("var:preset|color|".length);
  }
  const cssVarMatch = value.match(/^var\(--wp--preset--color--([a-z0-9-]+)\)$/i);
  if (cssVarMatch?.[1]) {
    return cssVarMatch[1];
  }
  if (value && !value.startsWith("#") && !value.startsWith("rgb(") && !value.startsWith("rgba(") && !value.startsWith("hsl(") && !value.startsWith("hsla(") && !value.startsWith("var(")) {
    return value;
  }
  return "";
};
const findPaletteColor = (paletteColors = [], slug) => {
  if (!slug) {
    return undefined;
  }
  const match = paletteColors.find(entry => entry?.slug === slug);
  return typeof match?.color === "string" && match.color ? match.color : undefined;
};
const getColorTargetMeta = path => COLOR_META_MAP[(0,_utils__WEBPACK_IMPORTED_MODULE_0__.normalizePath)(path)] ?? GENERIC_META;

/**
 * Resolve a Gutenberg preset slug or existing color value to a CSS-ready string.
 *
 * Accepted input forms:
 *   "var:preset|color|slug"        → palette literal (if available), else var(--wp--preset--color--slug)
 *   "var(--wp--preset--color--…)"  → palette literal (if available), else returned as-is
 *   any CSS color literal           → returned as-is
 *   plain slug e.g. "vivid-red"    → palette literal (if available), else var(--wp--preset--color--vivid-red)
 */
const resolvePresetColorValue = (rawValue, paletteColors = []) => {
  const value = String(rawValue || "").trim();
  if (!value) {
    return value;
  }
  const presetSlug = extractPresetSlug(value);
  const paletteColor = findPaletteColor(paletteColors, presetSlug);
  if (paletteColor) {
    return paletteColor;
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

/***/ "./src/block-editor/responsive-target-families.ts"
/*!********************************************************!*\
  !*** ./src/block-editor/responsive-target-families.ts ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   expandTrackedTargets: () => (/* binding */ expandTrackedTargets),
/* harmony export */   getSiblingAliasPath: () => (/* binding */ getSiblingAliasPath)
/* harmony export */ });
/* harmony import */ var _color_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./color-utils */ "./src/block-editor/color-utils.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");


const getColorFamilyPaths = target => {
  const siblingAliasPath = (0,_color_utils__WEBPACK_IMPORTED_MODULE_0__.getColorAliasPath)(target.path);
  if (!siblingAliasPath) {
    return [target.path];
  }
  return Array.from(new Set([target.path, siblingAliasPath]));
};
const getSiblingAliasPath = target => {
  return (0,_color_utils__WEBPACK_IMPORTED_MODULE_0__.getColorAliasPath)(target.path);
};
const getTrackedTargetPriority = target => {
  if (target.sourceKind === "preset-slug") {
    return 0;
  }
  if (target.sourceKind === "style-value") {
    return 2;
  }
  return 1;
};
const expandTrackedTargets = targets => {
  const trackedTargets = new Map();
  targets.forEach(target => {
    trackedTargets.set(target.path, target);
    if (!target.channel) {
      return;
    }
    getColorFamilyPaths(target).forEach(path => {
      if (trackedTargets.has(path)) {
        return;
      }
      const colorMeta = (0,_color_utils__WEBPACK_IMPORTED_MODULE_0__.getColorTargetMeta)(path);
      trackedTargets.set(path, {
        ...target,
        path,
        cssProperty: (0,_utils__WEBPACK_IMPORTED_MODULE_1__.getCssPropertyForPath)(path),
        styleStrategy: undefined,
        sourceKind: colorMeta.sourceKind,
        channel: colorMeta.channel
      });
    });
  });
  return Array.from(trackedTargets.values()).sort((left, right) => getTrackedTargetPriority(left) - getTrackedTargetPriority(right));
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
const buildSearchTerms = (block, attribute) => {
  const terms = [block.name, block.title];
  if (!attribute) {
    return terms.map(term => term.toLowerCase());
  }
  terms.push(attribute.path);
  if (attribute.cssProperty) {
    terms.push(attribute.cssProperty);
  }
  if (attribute.styleStrategy) {
    terms.push(attribute.styleStrategy);
  }
  terms.push(`${block.name}/${attribute.path}`);
  if (attribute.cssProperty) {
    terms.push(`${block.name}/${attribute.cssProperty}`);
  }
  if (attribute.styleStrategy) {
    terms.push(`${block.name}/${attribute.styleStrategy}`);
  }
  return terms.map(term => term.toLowerCase());
};
const matchesSearch = (block, term, attribute) => buildSearchTerms(block, attribute).some(candidate => candidate.includes(term));
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
      const matchesBlock = matchesSearch(block, term);
      if (matchesBlock) {
        return block;
      }
      const attrMatches = block.attributes.filter(attr => matchesSearch(block, term, attr));
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
          cssProperty: attr.cssProperty || "",
          styleStrategy: attr.styleStrategy,
          sourceKind: attr.sourceKind,
          channel: attr.channel
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
/* harmony import */ var _color_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./color-utils */ "./src/block-editor/color-utils.ts");


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
const colorAliasWriteAdapter = {
  id: "color-alias-write-adapter",
  priority: 100,
  canHandle(target) {
    return !!(0,_color_utils__WEBPACK_IMPORTED_MODULE_1__.getColorAliasPath)(target.path);
  },
  normalize({
    devicePayload,
    target
  }) {
    const siblingAliasPath = (0,_color_utils__WEBPACK_IMPORTED_MODULE_1__.getColorAliasPath)(target.path);
    if (!siblingAliasPath) {
      return;
    }
    const key = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.encodePathKey)(siblingAliasPath);
    if (devicePayload[key] !== undefined) {
      delete devicePayload[key];
    }
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
  const siblingAliasPath = (0,_color_utils__WEBPACK_IMPORTED_MODULE_1__.getColorAliasPath)(target.path);
  const siblingAliasTarget = siblingAliasPath ? {
    ...target,
    path: siblingAliasPath
  } : null;
  for (const fallbackDevice of devicesToCheck) {
    const directValue = getResponsiveValue(attributes, fallbackDevice, target);
    if (directValue !== undefined) {
      return directValue;
    }
    if (siblingAliasTarget) {
      const siblingAliasValue = getResponsiveValue(attributes, fallbackDevice, siblingAliasTarget);
      if (siblingAliasValue !== undefined) {
        // Any explicit family member at this precedence level blocks fallback to lower devices.
        // For preset targets, the style sibling wins. For style targets, the preset sibling means
        // this path should stay unset at this level.
        return undefined;
      }
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


const DEFAULT_TARGETS = [];
const STYLE_STRATEGY_BY_PATH = {
  "style.spacing.padding": "padding",
  "style.spacing.margin": "margin",
  "style.border.radius": "border-radius",
  "style.border.width": "border-width",
  "style.border.color": "border-color",
  "style.border.style": "border-style"
};
const DEFAULT_STYLE_TARGETS = [{
  path: "style.spacing.padding",
  valueKind: "object",
  leafKeys: ["top", "right", "bottom", "left"],
  styleStrategy: "padding",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.spacing.margin",
  valueKind: "object",
  leafKeys: ["top", "right", "bottom", "left"],
  styleStrategy: "margin",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.color.text",
  valueKind: "scalar",
  leafKeys: [],
  cssProperty: "color",
  sourceKind: "style-value",
  channel: "text"
}, {
  path: "style.color.background",
  valueKind: "scalar",
  leafKeys: [],
  cssProperty: "background-color",
  sourceKind: "style-value",
  channel: "background"
}, {
  path: "style.border.radius",
  valueKind: "object",
  leafKeys: ["topLeft", "topRight", "bottomRight", "bottomLeft"],
  styleStrategy: "border-radius",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.border.width",
  valueKind: "object",
  leafKeys: ["top", "right", "bottom", "left"],
  styleStrategy: "border-width",
  sourceKind: "generic",
  channel: undefined
}, {
  path: "style.border.color",
  valueKind: "object",
  leafKeys: ["top", "right", "bottom", "left"],
  styleStrategy: "border-color",
  sourceKind: "style-value",
  channel: "border"
}];
const getStyleStrategyForPath = path => {
  return STYLE_STRATEGY_BY_PATH[path];
};
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
    const cssProperty = typeof target.cssProperty === "string" ? target.cssProperty.trim() : "";
    const styleStrategy = typeof target.styleStrategy === "string" ? target.styleStrategy : getStyleStrategyForPath(normalizedPath);
    const normalized = {
      block: String(target.block),
      path: normalizedPath,
      valueKind: target.valueKind === "scalar" ? "scalar" : "object",
      leafKeys: Array.isArray(target.leafKeys) ? target.leafKeys.map(String) : [],
      cssProperty,
      styleStrategy,
      sourceKind: target.sourceKind ? String(target.sourceKind) : colorMeta.sourceKind,
      channel: target.channel ? String(target.channel) : colorMeta.channel
    };
    if (normalized.valueKind === "scalar" && !normalized.cssProperty) {
      return null;
    }
    if (normalized.valueKind === "object" && !normalized.styleStrategy) {
      return null;
    }
    return normalized;
  }).filter(Boolean);
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
        const leafKeys = Object.entries(schema.properties).filter(([, childSchema]) => {
          const childType = childSchema?.type;
          return childType === "string" || childType === "number" || childType === "boolean";
        }).map(([key]) => key);
        const styleStrategy = getStyleStrategyForPath(path);

        // Only expose object paths that are directly actionable.
        // This avoids surfacing container/typo paths like `style.brder`
        // that have nested children but no usable direct value contract.
        if ((leafKeys.length || colorMeta.channel) && styleStrategy) {
          candidates.push({
            path,
            valueKind: "object",
            leafKeys,
            styleStrategy,
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

    // Skip generic object-type attributes without explicit CSS mapping
    // to prevent selecting overly broad paths like "style"
    if (valueKind === "object" || forbiddenPaths.has(path)) {
      return;
    }
    const cssProperty = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getCssPropertyForPath)(path);
    if (!cssProperty) {
      return;
    }
    candidates.push({
      path,
      valueKind,
      leafKeys: [],
      cssProperty,
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
/* harmony export */   __withResponsiveLogicTestUtils: () => (/* binding */ __withResponsiveLogicTestUtils),
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
/* harmony import */ var _responsive_target_families__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./responsive-target-families */ "./src/block-editor/responsive-target-families.ts");
/* harmony import */ var _responsive_targets__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./responsive-targets */ "./src/block-editor/responsive-targets.ts");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);









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
    return (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_7__.removeResponsiveValue)({
      responsiveStyles
    }, device, target);
  }
  return (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_7__.setResponsiveValue)({
    responsiveStyles
  }, device, target, value);
};
const areValuesEqual = (left, right) => {
  if (left === right) {
    return true;
  }
  return JSON.stringify(left) === JSON.stringify(right);
};

/**
 * Build a minimal setAttributes patch containing only top-level keys
 * whose values changed between the original and modified objects.
 * Keys explicitly set to undefined in modified are included so
 * Gutenberg can unset them.
 */
const buildTopLevelPatch = (original, modified) => {
  const patch = {};
  for (const key of Object.keys(modified)) {
    if (!areValuesEqual(original[key], modified[key])) {
      patch[key] = modified[key];
    }
  }

  // Include keys that existed in original but are now undefined in modified.
  for (const key of Object.keys(original)) {
    if (modified[key] === undefined && original[key] !== undefined) {
      patch[key] = undefined;
    }
  }
  return patch;
};
const hasPatchChanges = patch => {
  return Object.keys(patch).length > 0;
};
const buildMountSyncAttributes = (attributes, targets) => {
  const nextAttributes = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attributes);
  let nextResponsiveStyles = cloneResponsiveStyles(attributes);
  let needsUpdate = false;
  targets.forEach(target => {
    const desktopValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_7__.getResponsiveValue)({
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
  return buildTopLevelPatch(attributes, nextAttributes);
};
const buildDeviceSyncAttributes = (attributes, targets, previousDevice, device) => {
  let nextResponsiveStyles = cloneResponsiveStyles(attributes);
  targets.forEach(target => {
    const liveValue = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.getValueAtPath)(attributes, target.path);
    const explicitPreviousValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_7__.getResponsiveValue)({
      responsiveStyles: nextResponsiveStyles
    }, previousDevice, target);
    const inheritedPreviousValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_7__.getResponsiveValueWithFallback)({
      responsiveStyles: nextResponsiveStyles
    }, previousDevice, target, false);
    const shouldRemoveInheritedWrite = explicitPreviousValue === undefined && areValuesEqual(liveValue, inheritedPreviousValue);
    const valueToStore = shouldRemoveInheritedWrite ? undefined : liveValue;
    nextResponsiveStyles = writeResponsiveValue(nextResponsiveStyles, previousDevice, target, valueToStore);
  });
  const nextAttributes = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attributes);
  targets.forEach(target => {
    const currentDeviceValue = (0,_responsive_targets__WEBPACK_IMPORTED_MODULE_7__.getResponsiveValueWithFallback)({
      responsiveStyles: nextResponsiveStyles
    }, device, target);
    const normalizedCurrentDeviceValue = currentDeviceValue === undefined ? undefined : (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(currentDeviceValue);
    (0,_utils__WEBPACK_IMPORTED_MODULE_4__.setValueAtPath)(nextAttributes, target.path, normalizedCurrentDeviceValue);
  });
  nextAttributes.responsiveStyles = nextResponsiveStyles;
  return buildTopLevelPatch(attributes, nextAttributes);
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
const __withResponsiveLogicTestUtils = {
  buildDeviceSyncAttributes,
  buildResponsiveAttributeUpdate
};
const scheduleSyncReset = syncRef => {
  requestAnimationFrame(() => {
    syncRef.current = false;
  });
};
const withResponsiveLogic = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.createHigherOrderComponent)(BlockEdit => {
  return props => {
    const activeTargets = (0,_targets_store__WEBPACK_IMPORTED_MODULE_5__.useActiveTargets)(props.name);
    const targets = (0,_responsive_target_families__WEBPACK_IMPORTED_MODULE_6__.expandTrackedTargets)(activeTargets);
    if (!targets.length) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(BlockEdit, {
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
    const applySyncedAttributes = patch => {
      if (!hasPatchChanges(patch)) {
        return;
      }
      isSyncingRef.current = true;
      attrsRef.current = {
        ...attrsRef.current,
        ...patch
      };
      setAttributes(patch);
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
      if (!hasPatchChanges(nextAttributes)) {
        return;
      }
      requestAnimationFrame(() => {
        applySyncedAttributes(nextAttributes);
      });
    }, [device]); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Run every time an attribute changes.
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
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(BlockEdit, {
      ...props,
      setAttributes: interceptedSetAttributes
    });
  };
}, "withResponsiveLogic");

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
/* harmony export */   getCssPropertyForPath: () => (/* binding */ getCssPropertyForPath),
/* harmony export */   getValueAtPath: () => (/* binding */ getValueAtPath),
/* harmony export */   isObject: () => (/* binding */ isObject),
/* harmony export */   normalizePath: () => (/* binding */ normalizePath),
/* harmony export */   setValueAtPath: () => (/* binding */ setValueAtPath)
/* harmony export */ });
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
const getCssPropertyForPath = path => {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath || normalizedPath === "style") {
    return "";
  }
  const segments = normalizedPath.split(".");
  const leaf = segments[segments.length - 1];
  if (segments[0] !== "style") {
    return camelToKebab(leaf);
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
  return camelToKebab(leaf);
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




(0,_wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__.registerPlugin)("responsive-overrides-settings", {
  render: _responsive_targets_modal__WEBPACK_IMPORTED_MODULE_2__.ResponsiveTargetsModal
});
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addFilter)("editor.BlockEdit", "responsive-overrides/interceptor", _with_responsive_logic__WEBPACK_IMPORTED_MODULE_3__.withResponsiveLogic);
})();

/******/ })()
;
//# sourceMappingURL=themeplix-block-editor.js.map