/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);









const HeaderToolbarButton = _wordpress_edit_post__WEBPACK_IMPORTED_MODULE_1__?.PluginToolbarButton;
const runtimeSettings = window?.responsiveOverridesSettings || {};
const ResponsiveTargetsModal = () => {
  const [isOpen, setIsOpen] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [isSaving, setIsSaving] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [search, setSearch] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
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
      const headerSettings = document.querySelector('.editor-header .editor-header__settings');
      if (!headerSettings) {
        return;
      }
      buttonEl = document.createElement('button');
      buttonEl.type = 'button';
      buttonEl.className = 'components-button is-secondary';
      buttonEl.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Responsive', 'responsive-overrides');
      buttonEl.style.marginLeft = '8px';
      buttonEl.setAttribute('aria-label', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Responsive Overrides', 'responsive-overrides'));
      buttonEl.addEventListener('click', () => setIsOpen(true));
      const previewDropdown = headerSettings.querySelector('.editor-post-preview-dropdown, .editor-preview-dropdown');
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
    return select('core/blocks')?.getBlockTypes?.() || [];
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
    (0,_target_discovery__WEBPACK_IMPORTED_MODULE_6__.normalizeTargets)((0,_target_discovery__WEBPACK_IMPORTED_MODULE_6__.getActiveTargets)()).forEach(target => {
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
          mapper: attr.mapper || ''
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
        path: runtimeSettings?.restPath || '/responsive-overrides/v1/targets',
        method: 'POST',
        headers: {
          'X-WP-Nonce': runtimeSettings?.nonce || ''
        },
        data: payload
      });
      const nextTargets = (0,_target_discovery__WEBPACK_IMPORTED_MODULE_6__.setActiveTargets)(response?.targets || []);
      if (runtimeSettings?.config) {
        runtimeSettings.config.targets = nextTargets;
      }
      setFeedback({
        status: 'success',
        message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Responsive targets saved.', 'responsive-overrides')
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Failed to save responsive targets.', 'responsive-overrides');
      setFeedback({
        status: 'error',
        message: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.Fragment, {
    children: [HeaderToolbarButton ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(HeaderToolbarButton, {
      icon: "smartphone",
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Responsive Overrides', 'responsive-overrides'),
      onClick: () => setIsOpen(true)
    }) : null, isOpen && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Modal, {
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Responsive Target Settings', 'responsive-overrides'),
      onRequestClose: () => setIsOpen(false),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.SearchControl, {
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Filter blocks or attributes', 'responsive-overrides'),
        value: search,
        onChange: setSearch
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Select block attributes to make responsive per device.', 'responsive-overrides')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
        children: `${selectedCount} ${(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('attributes selected', 'responsive-overrides')}`
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
        style: {
          maxHeight: '50vh',
          overflow: 'auto',
          border: '1px solid #ddd',
          padding: '8px'
        },
        children: filteredBlocks.map(block => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
          style: {
            marginBottom: '16px'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("strong", {
            children: block.title
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("code", {
            style: {
              display: 'block',
              marginBottom: '6px'
            },
            children: block.name
          }), block.attributes.map(attr => {
            const key = `${block.name}|${attr.path}`;
            return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.CheckboxControl, {
              label: `${attr.path} (${attr.valueKind})`,
              checked: Boolean(selectedMap[key]),
              onChange: isChecked => toggleSelection(block, attr, isChecked)
            }, key);
          })]
        }, block.name))
      }), feedback && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Notice, {
        status: feedback.status,
        isDismissible: false,
        children: feedback.message
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
        style: {
          marginTop: '16px',
          display: 'flex',
          gap: '8px'
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
          variant: "primary",
          onClick: saveTargets,
          isBusy: isSaving,
          disabled: isSaving,
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Save Targets', 'responsive-overrides')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_4__.Button, {
          variant: "secondary",
          onClick: () => setIsOpen(false),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Close', 'responsive-overrides')
        })]
      })]
    })]
  });
};

/***/ },

/***/ "./src/block-editor/target-discovery.ts"
/*!**********************************************!*\
  !*** ./src/block-editor/target-discovery.ts ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   activeTargets: () => (/* binding */ activeTargets),
/* harmony export */   getActiveTargets: () => (/* binding */ getActiveTargets),
/* harmony export */   listAttributeCandidates: () => (/* binding */ listAttributeCandidates),
/* harmony export */   normalizeTargets: () => (/* binding */ normalizeTargets),
/* harmony export */   setActiveTargets: () => (/* binding */ setActiveTargets)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");

const DEVICE_KEYS = ['desktop', 'tablet', 'mobile'];
const DEFAULT_TARGETS = [];
const runtimeSettings = window?.responsiveOverridesSettings || {};
const normalizeTargets = rawTargets => {
  if (!Array.isArray(rawTargets) || !rawTargets.length) {
    return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.clone)(DEFAULT_TARGETS);
  }

  // Generic object paths that should never be targets (too broad)
  const FORBIDDEN_PATHS = ['style'];
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
        window.console.warn('[RO] Rejecting generic target path:', normalizedPath, 'for block:', target.block);
      }
      return false;
    }
    return true;
  }).map(target => {
    const normalized = {
      block: String(target.block),
      path: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.normalizePath)(target.path),
      valueKind: target.valueKind === 'scalar' ? 'scalar' : 'object',
      leafKeys: Array.isArray(target.leafKeys) ? target.leafKeys.map(String) : [],
      mapper: target.mapper ? String(target.mapper) : ''
    };
    if (!normalized.mapper) {
      normalized.mapper = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getMapperForPath)(normalized.path);
    }
    return normalized;
  });
};
const detectValueKind = value => {
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value)) {
    return 'object';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return 'scalar';
  }
  return null;
};
const listAttributeCandidates = (attributes, pathPrefix = '', depth = 0) => {
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(attributes) || depth > 4) {
    return [];
  }
  const candidates = [];
  const hiddenAttributes = ['tagName', 'templateLock', 'metadata', 'allowedBlocks', 'ariaLabel'];
  const forbiddenPaths = new Set(['style']);
  const duplicateAliasPaths = new Set(['backgroundColor', 'textColor']);

  // Always include well-known style paths regardless of schema discovery
  if (depth === 0 && !pathPrefix) {
    candidates.push({
      path: 'style.spacing.padding',
      valueKind: 'object',
      leafKeys: ['top', 'right', 'bottom', 'left'],
      mapper: 'spacingPadding'
    }, {
      path: 'style.spacing.margin',
      valueKind: 'object',
      leafKeys: ['top', 'right', 'bottom', 'left'],
      mapper: 'spacingMargin'
    }, {
      path: 'style.color.text',
      valueKind: 'scalar',
      leafKeys: [],
      mapper: 'textColor'
    }, {
      path: 'style.color.background',
      valueKind: 'scalar',
      leafKeys: [],
      mapper: 'backgroundColor'
    });
  }
  Object.entries(attributes).forEach(([attrName, schema]) => {
    const path = pathPrefix ? `${pathPrefix}.${attrName}` : attrName;
    const type = schema?.type;

    // Skip internal/control attributes at top level
    if (depth === 0 && attrName === 'responsiveStyles') {
      return;
    }
    if (depth === 0 && hiddenAttributes.includes(attrName)) {
      return;
    }

    // Hide legacy aliases when canonical style.color.* paths are available.
    if (depth === 0 && duplicateAliasPaths.has(path)) {
      return;
    }
    if (type === 'object' && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(schema?.properties)) {
      if (!forbiddenPaths.has(path)) {
        const leafKeys = Object.entries(schema.properties).filter(([, childSchema]) => {
          const childType = childSchema?.type;
          return childType === 'string' || childType === 'number' || childType === 'boolean';
        }).map(([key]) => key);
        candidates.push({
          path,
          valueKind: 'object',
          leafKeys,
          mapper: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.getMapperForPath)(path)
        });
      }
      candidates.push(...listAttributeCandidates(schema.properties, path, depth + 1));
      return;
    }
    const valueKind = detectValueKind(schema?.default) || (type === 'object' ? 'object' : 'scalar');
    if (!valueKind) {
      return;
    }

    // Skip generic object-type attributes without explicit mappers
    // to prevent selecting overly broad paths like "style"
    if (valueKind === 'object' || forbiddenPaths.has(path)) {
      return;
    }
    candidates.push({
      path,
      valueKind,
      leafKeys: [],
      mapper: ''
    });
  });

  // Deduplicate by path
  const seen = new Set();
  return candidates.filter(candidate => {
    if (seen.has(candidate.path)) {
      return false;
    }
    seen.add(candidate.path);
    return true;
  });
};
let activeTargets = normalizeTargets(runtimeSettings?.config?.targets);
const getActiveTargets = () => activeTargets;
const setActiveTargets = rawTargets => {
  activeTargets = normalizeTargets(rawTargets);
  return activeTargets;
};

/***/ },

/***/ "./src/block-editor/with-responsive-logic.ts"
/*!***************************************************!*\
  !*** ./src/block-editor/with-responsive-logic.ts ***!
  \***************************************************/
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
/* harmony import */ var _target_discovery__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./target-discovery */ "./src/block-editor/target-discovery.ts");






const getTargetsForBlock = blockName => (0,_target_discovery__WEBPACK_IMPORTED_MODULE_5__.getActiveTargets)().filter(target => target.block === blockName);
const getValueAtPath = (object, path) => {
  if (!object || !path) {
    return undefined;
  }
  return path.split('.').reduce((acc, segment) => {
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
  const segments = path.split('.');
  let cursor = object;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      if ((0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(cursor[segment]) && (0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(value)) {
        cursor[segment] = {
          ...cursor[segment],
          ...value
        };
      } else {
        cursor[segment] = value;
      }
      return;
    }
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(cursor[segment])) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  });
  return object;
};
const setResponsiveValue = (attributes, device, target, value) => {
  const nextResponsiveStyles = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attributes?.responsiveStyles || {});
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(nextResponsiveStyles[device])) {
    nextResponsiveStyles[device] = {};
  }
  const pathKey = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.encodePathKey)(target.path);
  if (target.valueKind === 'object' && (0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(value)) {
    const existingValue = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(nextResponsiveStyles[device][pathKey]) ? nextResponsiveStyles[device][pathKey] : {};
    const nextValue = {
      ...existingValue
    };
    if (Array.isArray(target.leafKeys) && target.leafKeys.length) {
      target.leafKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          nextValue[key] = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(value[key]);
        }
      });
    } else {
      Object.assign(nextValue, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(value));
    }
    nextResponsiveStyles[device][pathKey] = nextValue;
  } else {
    nextResponsiveStyles[device][pathKey] = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(value);
  }
  return nextResponsiveStyles;
};
const getResponsiveValue = (attributes, device, target) => {
  const payload = attributes?.responsiveStyles?.[device];
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_4__.isObject)(payload)) {
    return undefined;
  }
  const pathKey = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.encodePathKey)(target.path);
  if (payload[pathKey] !== undefined) {
    return payload[pathKey];
  }
  return undefined;
};
const withResponsiveLogic = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.createHigherOrderComponent)(BlockEdit => {
  return props => {
    const targets = getTargetsForBlock(props.name);
    if (!targets.length) {
      return react__WEBPACK_IMPORTED_MODULE_0___default().createElement(BlockEdit, props);
    }
    const {
      setAttributes,
      attributes
    } = props;
    const deviceType = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.useSelect)(select => select('core/editor').getDeviceType?.() || 'Desktop', []);
    const device = (deviceType || 'Desktop').toLowerCase();
    const prevDeviceRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(device);
    const isSyncingRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(false);
    const attrsRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(attributes);
    const didMountRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(false);
    attrsRef.current = attributes;
    (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
      if (didMountRef.current) {
        return;
      }
      didMountRef.current = true;
      const nextAttributes = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attrsRef.current);
      let nextResponsiveStyles = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attrsRef.current?.responsiveStyles || {});
      let needsUpdate = false;
      targets.forEach(target => {
        const desktopValue = getResponsiveValue({
          responsiveStyles: nextResponsiveStyles
        }, 'desktop', target);
        if (desktopValue === undefined) {
          const liveValue = getValueAtPath(attrsRef.current, target.path);
          if (liveValue !== undefined) {
            nextResponsiveStyles = setResponsiveValue({
              responsiveStyles: nextResponsiveStyles
            }, 'desktop', target, liveValue);
            needsUpdate = true;
          }
          return;
        }
        setValueAtPath(nextAttributes, target.path, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(desktopValue));
        needsUpdate = true;
      });
      if (needsUpdate) {
        nextAttributes.responsiveStyles = nextResponsiveStyles;
        isSyncingRef.current = true;
        setAttributes(nextAttributes);
        requestAnimationFrame(() => {
          isSyncingRef.current = false;
        });
      }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
      if (prevDeviceRef.current === device) {
        return;
      }
      const previousDevice = prevDeviceRef.current;
      prevDeviceRef.current = device;
      let nextResponsiveStyles = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attrsRef.current?.responsiveStyles || {});
      targets.forEach(target => {
        const liveValue = getValueAtPath(attrsRef.current, target.path);
        if (liveValue !== undefined) {
          nextResponsiveStyles = setResponsiveValue({
            responsiveStyles: nextResponsiveStyles
          }, previousDevice, target, liveValue);
        }
      });
      const nextAttributes = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attrsRef.current);
      targets.forEach(target => {
        const currentDeviceValue = getResponsiveValue({
          responsiveStyles: nextResponsiveStyles
        }, device, target);
        if (currentDeviceValue !== undefined) {
          setValueAtPath(nextAttributes, target.path, (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(currentDeviceValue));
        }
      });
      nextAttributes.responsiveStyles = nextResponsiveStyles;
      isSyncingRef.current = true;
      setAttributes(nextAttributes);
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }, [device]); // eslint-disable-line react-hooks/exhaustive-deps

    const interceptedSetAttributes = newAttrs => {
      if (isSyncingRef.current) {
        setAttributes(newAttrs);
        return;
      }
      let nextResponsiveStyles = (0,_utils__WEBPACK_IMPORTED_MODULE_4__.clone)(attrsRef.current?.responsiveStyles || {});
      let hasResponsiveChange = false;
      targets.forEach(target => {
        const incomingValue = getValueAtPath(newAttrs, target.path);
        if (incomingValue === undefined) {
          return;
        }
        const currentValue = getValueAtPath(attrsRef.current, target.path);
        if (JSON.stringify(incomingValue) === JSON.stringify(currentValue)) {
          return;
        }
        hasResponsiveChange = true;
        nextResponsiveStyles = setResponsiveValue({
          responsiveStyles: nextResponsiveStyles
        }, device, target, incomingValue);
      });
      if (!hasResponsiveChange) {
        setAttributes(newAttrs);
        return;
      }
      setAttributes({
        ...newAttrs,
        responsiveStyles: nextResponsiveStyles
      });
    };
    return react__WEBPACK_IMPORTED_MODULE_0___default().createElement(BlockEdit, {
      ...props,
      setAttributes: interceptedSetAttributes
    });
  };
}, 'withResponsiveLogic');

/***/ },

/***/ "./src/block-editor/with-responsive-preview.ts"
/*!*****************************************************!*\
  !*** ./src/block-editor/with-responsive-preview.ts ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   withResponsivePreview: () => (/* binding */ withResponsivePreview)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils */ "./src/utils/index.ts");
/* harmony import */ var _target_discovery__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./target-discovery */ "./src/block-editor/target-discovery.ts");






const getTargetsForBlock = blockName => (0,_target_discovery__WEBPACK_IMPORTED_MODULE_4__.getActiveTargets)().filter(t => t.block === blockName);
const getCssPropertyForPath = path => {
  const normalizedPath = (0,_utils__WEBPACK_IMPORTED_MODULE_3__.normalizePath)(path);
  if (!normalizedPath || normalizedPath === 'style') {
    return '';
  }
  const segments = normalizedPath.split('.');
  const leaf = segments[segments.length - 1];
  if (segments[0] !== 'style') {
    return (0,_utils__WEBPACK_IMPORTED_MODULE_3__.camelToKebab)(leaf);
  }
  const namespace = segments[1] || '';
  if (namespace === 'color') {
    if (leaf === 'text') {
      return 'color';
    }
    if (leaf === 'background') {
      return 'background-color';
    }
  }
  if (namespace === 'spacing' && leaf === 'blockGap') {
    return 'gap';
  }
  if (namespace === 'dimensions') {
    if (leaf === 'minHeight') {
      return 'min-height';
    }
    if (leaf === 'aspectRatio') {
      return 'aspect-ratio';
    }
  }
  return (0,_utils__WEBPACK_IMPORTED_MODULE_3__.camelToKebab)(leaf);
};
const setPreviewStyleValue = (previewStyles, cssProperty, value) => {
  if (!cssProperty) {
    return;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return;
  }
  previewStyles[(0,_utils__WEBPACK_IMPORTED_MODULE_3__.cssPropToJsProp)(cssProperty)] = value;
};
const applyObjectPreviewValue = (previewStyles, target, responsiveValue) => {
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_3__.isObject)(responsiveValue)) {
    return;
  }
  const path = (0,_utils__WEBPACK_IMPORTED_MODULE_3__.normalizePath)(target.path);
  if (path === 'style.spacing.padding') {
    setPreviewStyleValue(previewStyles, 'padding-top', responsiveValue.top);
    setPreviewStyleValue(previewStyles, 'padding-right', responsiveValue.right);
    setPreviewStyleValue(previewStyles, 'padding-bottom', responsiveValue.bottom);
    setPreviewStyleValue(previewStyles, 'padding-left', responsiveValue.left);
    return;
  }
  if (path === 'style.spacing.margin') {
    setPreviewStyleValue(previewStyles, 'margin-top', responsiveValue.top);
    setPreviewStyleValue(previewStyles, 'margin-right', responsiveValue.right);
    setPreviewStyleValue(previewStyles, 'margin-bottom', responsiveValue.bottom);
    setPreviewStyleValue(previewStyles, 'margin-left', responsiveValue.left);
    return;
  }
  if (path === 'style.border.radius') {
    setPreviewStyleValue(previewStyles, 'border-top-left-radius', responsiveValue.topLeft);
    setPreviewStyleValue(previewStyles, 'border-top-right-radius', responsiveValue.topRight);
    setPreviewStyleValue(previewStyles, 'border-bottom-right-radius', responsiveValue.bottomRight);
    setPreviewStyleValue(previewStyles, 'border-bottom-left-radius', responsiveValue.bottomLeft);
    return;
  }
  if (path === 'style.border.width') {
    setPreviewStyleValue(previewStyles, 'border-top-width', responsiveValue.top);
    setPreviewStyleValue(previewStyles, 'border-right-width', responsiveValue.right);
    setPreviewStyleValue(previewStyles, 'border-bottom-width', responsiveValue.bottom);
    setPreviewStyleValue(previewStyles, 'border-left-width', responsiveValue.left);
    return;
  }
  const leafKeys = Array.isArray(target.leafKeys) && target.leafKeys.length ? target.leafKeys : Object.keys(responsiveValue);
  leafKeys.forEach(leafKey => {
    if (!Object.prototype.hasOwnProperty.call(responsiveValue, leafKey)) {
      return;
    }
    const cssProperty = getCssPropertyForPath(`${path}.${leafKey}`);
    setPreviewStyleValue(previewStyles, cssProperty, responsiveValue[leafKey]);
  });
};
const withResponsivePreview = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.createHigherOrderComponent)(BlockListBlock => {
  return props => {
    const targets = getTargetsForBlock(props.name);
    if (!targets.length) {
      return react__WEBPACK_IMPORTED_MODULE_0___default().createElement(BlockListBlock, props);
    }
    const deviceType = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useSelect)(select => select('core/editor').getDeviceType?.() || 'Desktop', []);
    const device = (deviceType || 'Desktop').toLowerCase();
    if (device === 'desktop') {
      return react__WEBPACK_IMPORTED_MODULE_0___default().createElement(BlockListBlock, props);
    }
    const {
      attributes
    } = props;
    const previewStyles = {};
    targets.forEach(target => {
      const responsiveValue = (0,_utils__WEBPACK_IMPORTED_MODULE_3__.getResponsiveValue)(attributes, device, target);
      if (responsiveValue === undefined) {
        return;
      }
      const mapper = target.mapper || '';
      if (mapper === 'spacingPadding' && (0,_utils__WEBPACK_IMPORTED_MODULE_3__.isObject)(responsiveValue)) {
        applyObjectPreviewValue(previewStyles, target, responsiveValue);
      } else if (mapper === 'spacingMargin' && (0,_utils__WEBPACK_IMPORTED_MODULE_3__.isObject)(responsiveValue)) {
        applyObjectPreviewValue(previewStyles, target, responsiveValue);
      } else if (mapper === 'textColor' && typeof responsiveValue === 'string') {
        setPreviewStyleValue(previewStyles, 'color', responsiveValue);
      } else if (mapper === 'backgroundColor' && typeof responsiveValue === 'string') {
        setPreviewStyleValue(previewStyles, 'background-color', responsiveValue);
      } else if ((0,_utils__WEBPACK_IMPORTED_MODULE_3__.isObject)(responsiveValue)) {
        applyObjectPreviewValue(previewStyles, target, responsiveValue);
      } else {
        const cssProperty = getCssPropertyForPath(target.path);
        setPreviewStyleValue(previewStyles, cssProperty, responsiveValue);
      }
    });
    if (!Object.keys(previewStyles).length) {
      return react__WEBPACK_IMPORTED_MODULE_0___default().createElement(BlockListBlock, props);
    }
    return react__WEBPACK_IMPORTED_MODULE_0___default().createElement(BlockListBlock, {
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
}, 'withResponsivePreview');

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
  'style.spacing.padding': 'spacingPadding',
  'style.spacing.margin': 'spacingMargin',
  'style.color.text': 'textColor',
  'style.color.background': 'backgroundColor'
};
const camelToKebab = value => String(value || '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const cssPropToJsProp = cssProperty => cssProperty.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);
const clone = value => isObject(value) || Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : value;
const encodePathKey = path => path.replace(/\./g, '__');
const normalizePath = path => String(path || '').trim();
const getMapperForPath = path => SUPPORTED_PATH_TO_MAPPER[normalizePath(path)] || '';
const getValueAtPath = (object, path) => {
  if (!object || !path) {
    return undefined;
  }
  return path.split('.').reduce((acc, segment) => {
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
  const segments = path.split('.');
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
  if (target.valueKind === 'object' && isObject(value)) {
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
/* harmony import */ var _with_responsive_logic__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./with-responsive-logic */ "./src/block-editor/with-responsive-logic.ts");
/* harmony import */ var _with_responsive_preview__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./with-responsive-preview */ "./src/block-editor/with-responsive-preview.ts");





(0,_wordpress_plugins__WEBPACK_IMPORTED_MODULE_1__.registerPlugin)('responsive-overrides-settings', {
  render: _responsive_targets_modal__WEBPACK_IMPORTED_MODULE_2__.ResponsiveTargetsModal
});
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addFilter)('editor.BlockEdit', 'responsive-overrides/interceptor', _with_responsive_logic__WEBPACK_IMPORTED_MODULE_3__.withResponsiveLogic);
(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.addFilter)('editor.BlockListBlock', 'responsive-overrides/previewer', _with_responsive_preview__WEBPACK_IMPORTED_MODULE_4__.withResponsivePreview);
})();

/******/ })()
;
//# sourceMappingURL=themeplix-block-editor.js.map