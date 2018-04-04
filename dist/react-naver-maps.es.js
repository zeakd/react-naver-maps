import debug from 'debug';
import React from 'react';
import invariant from 'invariant';
import { camelCase, difference, debounce } from 'lodash';
import ResizeDetector from 'react-resize-detector';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

var createLogger = (function (moduleName) {
  return debug("ReactNaverMaps:".concat(moduleName));
});

function compose() {
  for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(void 0, arguments));
    };
  }, function (arg) {
    return arg;
  });
}

var withNavermaps = function withNavermaps() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$submodules = _ref.submodules,
      submodules = _ref$submodules === void 0 ? [] : _ref$submodules;

  return function (WrappedComponent) {
    var WithNavermaps =
    /*#__PURE__*/
    function (_React$Component) {
      _inherits(WithNavermaps, _React$Component);

      function WithNavermaps(props) {
        var _this;

        _classCallCheck(this, WithNavermaps);

        _this = _possibleConstructorReturn(this, (WithNavermaps.__proto__ || Object.getPrototypeOf(WithNavermaps)).call(this, props));

        var navermaps = _this.getNavermapsModule();

        invariant(navermaps, 'props.navermaps or window.naver.maps is required.');

        if (submodules) {
          submodules.forEach(function (submodule) {
            invariant(navermaps[submodule], "navermaps.".concat(submodule, " is required"));
          });
        }

        _this.hi = 'hihi';
        return _this;
      }

      _createClass(WithNavermaps, [{
        key: "getNavermapsModule",
        value: function getNavermapsModule() {
          return this.props.navermaps || window.naver && window.naver.maps;
        }
      }, {
        key: "render",
        value: function render() {
          var navermaps = this.getNavermapsModule();

          var restProps = _extends({}, this.props);

          return React.createElement(WrappedComponent, _extends({}, restProps, {
            navermaps: navermaps
          }));
        }
      }]);

      return WithNavermaps;
    }(React.Component);

    var name = WrappedComponent.displayName || WrappedComponent.name;
    WithNavermaps.displayName = "withNavermaps(".concat(name, ")");
    return WithNavermaps;
  };
};

var log = createLogger('withNaverEvents');

var withNaverEvents = function withNaverEvents(WrappedComponent) {
  var WithNaverEvents =
  /*#__PURE__*/
  function (_React$PureComponent) {
    _inherits(WithNaverEvents, _React$PureComponent);

    function WithNaverEvents(props) {
      var _this;

      _classCallCheck(this, WithNaverEvents);

      _this = _possibleConstructorReturn(this, (WithNaverEvents.__proto__ || Object.getPrototypeOf(WithNaverEvents)).call(this, props));
      _this.listeners = {};
      return _this;
    }

    _createClass(WithNaverEvents, [{
      key: "render",
      value: function render() {
        return React.createElement(WrappedComponent, this.props);
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate() {
        // log('componentDidUpdate')
        invariant(this.props.instance, 'naver KVO instance is required on props.instance.');
        this.updateListeners();
      }
    }, {
      key: "generateListenerNames",
      value: function generateListenerNames() {
        this.listenerNames = this.props.naverEventNames.map(function (naverEventName) {
          // camelCased event name 
          var camelEventName = camelCase(naverEventName); // propsListener is event listener defined on props. (user input)

          var propsListenerName = camelCase("on_".concat(naverEventName)); // naverListener is naver kvo event listener defined and managed inside component.

          var naverListenerName = "_".concat(camelEventName, "Listener");
          return {
            naverEventName: naverEventName,
            camelEventName: camelEventName,
            propsListenerName: propsListenerName,
            naverListenerName: naverListenerName
          };
        });
        return this.listenerNames;
      }
    }, {
      key: "updateListeners",
      value: function updateListeners() {
        var _this2 = this;

        var navermaps = this.props.navermaps;
        var beforeListenerNames = Object.keys(this.listeners);
        var currentListenerNames = []; // TODO: cache listeners info.

        this.generateListenerNames().forEach(function (_ref) {
          var propsListenerName = _ref.propsListenerName,
              naverListenerName = _ref.naverListenerName,
              naverEventName = _ref.naverEventName;

          if (_this2.props[propsListenerName]) {
            if (!_this2.listeners[naverListenerName]) {
              // add naver kvo event listener
              _this2.listeners[naverListenerName] = navermaps.Event.addListener(_this2.props.instance, naverEventName, function () {
                // run listener
                if (_this2.props[propsListenerName]) {
                  var _this2$props;

                  (_this2$props = _this2.props)[propsListenerName].apply(_this2$props, arguments);
                }
              });
            } // push to current listener names


            currentListenerNames.push(naverListenerName);
          }
        }); // collect orphan listeners

        var orphanListenerNames = difference(beforeListenerNames, currentListenerNames); // log('orphanListenerNames', orphanListenerNames)
        // detach and delete orphan naver event listeners

        orphanListenerNames.forEach(function (orphanListenerName) {
          // log('orphanListenerName', orphanListenerName)
          navermaps.Event.removeListener(_this2.listeners[orphanListenerName]);
          delete _this2.listeners[orphanListenerName];
        });
      }
    }]);

    return WithNaverEvents;
  }(React.PureComponent);

  var name = WrappedComponent.displayName || WrappedComponent.name;
  WithNaverEvents.displayName = "withNaverEvents(".concat(name, ")");
  return WithNaverEvents;
};

/**
 * 1. props로 listener를 받아 instance에 addListener
 * 2. mount시 map인스턴스를 생성
 * 3. unmount시 map인스턴스를 파괴
 * 4. props를 받아 map인스턴스를 업데이트
 * 5. updating중에는 event를 발생시키지 않고, 업데이트도 패스.
 * 6. overscrolling중에는 updating block.
 */

/**
 * mount
 * 
 * render dom
 * create instance (component did mount) - check overscrolling, clear updating
 * 
 * addListener (component did update)
 * update instance (component did update) - fire updating, block when updating
 * 
 * 
 * destroy instance (component will unmount)
 * 
 * unmount
 */


var log$1 = createLogger('Map');

var MapDOM =
/*#__PURE__*/
function (_React$Component) {
  _inherits(MapDOM, _React$Component);

  function MapDOM(props) {
    var _this;

    _classCallCheck(this, MapDOM);

    _this = _possibleConstructorReturn(this, (MapDOM.__proto__ || Object.getPrototypeOf(MapDOM)).call(this, props));
    _this.handleResize = _this.handleResize.bind(_assertThisInitialized(_this));
    return _this;
  }

  _createClass(MapDOM, [{
    key: "handleResize",
    value: function handleResize(width, height) {
      var instance = this.props.instance; // resize map on wrapping div resized

      if (instance) {
        instance.setSize({
          width: width,
          height: height
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _props = this.props,
          id = _props.id,
          className = _props.className,
          mapDivId = _props.mapDivId,
          children = _props.children,
          instance = _props.instance;
      return React.createElement("div", {
        id: id,
        className: className
      }, React.createElement("div", {
        id: mapDivId,
        style: {
          width: "100%",
          height: "100%"
        }
      }), React.createElement(ResizeDetector, {
        handleWidth: true,
        handleHeight: true,
        onResize: this.handleResize
      }));
    }
  }]);

  return MapDOM;
}(React.Component);
var defaultProps = {
  mapDivId: 'naver-map',
  zoomEffect: false // size,
  // bounds,
  // center,
  // zoom,
  // mapTypeId,
  // background,
  // baseTileOpacity,
  // disableDoubleClickZoom,
  // disableDoubleTapZoom,
  // disableKineticPan,
  // disableTwoFingerTapZoom,
  // draggable,
  // keyboardShortcuts,
  // logoControl,
  // logoControlOptions,
  // mapDataControl,
  // mapDataControlOptions,
  // mapTypeControl,
  // mapTypeControlOptions,
  // mapTypes,
  // maxBounds,
  // maxZoom,
  // minZoom,
  // padding,
  // pinchZoom,
  // resizeOrigin,
  // scaleControl,
  // scaleControlOptions,
  // scrollWheel,
  // overlayZoomEffect,
  // tileSpare,
  // tileTransition,
  // zoomControl,
  // zoomControlOptions,
  // zoomOrigin,

};

var withNaverMapInstance = function withNaverMapInstance(WrappedComponent) {
  var MapInstance =
  /*#__PURE__*/
  function (_React$PureComponent) {
    _inherits(MapInstance, _React$PureComponent);

    function MapInstance(props) {
      var _this2;

      _classCallCheck(this, MapInstance);

      _this2 = _possibleConstructorReturn(this, (MapInstance.__proto__ || Object.getPrototypeOf(MapInstance)).call(this, props)); // while updating = true, update are banned 
      // until idle or new panning, zooming start

      _this2.updating = false;
      _this2.reupdateTimeout = 0; // to check overScrolling bug

      _this2.scrolling = false;
      _this2.scrollingEndTimeout = 0;
      _this2.handleCenterChanged = _this2.handleCenterChanged.bind(_assertThisInitialized(_this2));
      _this2.handleBoundsChanged = _this2.handleBoundsChanged.bind(_assertThisInitialized(_this2));
      _this2.updateMapInstance = debounce(_this2.updateMapInstance, 0);
      return _this2;
    } // clear updating state.


    _createClass(MapInstance, [{
      key: "clearUpdating",
      value: function clearUpdating() {
        // log('UPDATING CLEAR')
        clearTimeout(this.reupdateTimeout);
        this.updating = false;
      } // create map instance

    }, {
      key: "createMapInstance",
      value: function createMapInstance() {
        var _this3 = this;

        log$1('MAP INSTANCE %cCREATE', 'background: black; color: red;');
        var _props2 = this.props,
            navermaps = _props2.navermaps,
            center = _props2.center,
            zoom = _props2.zoom,
            mapTypeId = _props2.mapTypeId,
            size = _props2.size,
            bounds = _props2.bounds,
            mapDivId = _props2.mapDivId; // create navermap instance

        var mapOptions = {};

        if (center) {
          mapOptions.center = center;
        }

        if (zoom) {
          mapOptions.zoom = zoom;
        }

        if (mapTypeId) {
          mapOptions.mapTypeId = mapTypeId;
        }

        if (size) {
          mapOptions.size = size;
        }

        if (bounds) {
          mapOptions.bounds = bounds;
        }

        log$1('map options', mapDivId, mapOptions);
        this.map = new navermaps.Map(mapDivId, mapOptions);
        invariant(this.map, 'naver.maps.Map instance creation failure'); // there is a macos inertial scroll bug. 
        // check user scrolling
        // scroll event occur on mavdivId > div > div

        var scrollDiv = document.querySelector("#".concat(mapDivId, " > div > div"));

        if (scrollDiv) {
          scrollDiv.addEventListener('mousewheel', function (e) {
            // clear the timeout trying to set flag false
            clearTimeout(_this3.scrollingEndTimeout); // set overscolling flag true

            _this3.scrolling = true; // try to set the flag false

            _this3.scrollingEndTimeout = setTimeout(function () {
              _this3.scrolling = false; // provide blocking when overscroll during panning.

              if (_this3.updating) {
                _this3.clearUpdating();

                _this3.forceUpdate();
              }
            }, 50);
          }, false);
        } // whenever user zoom during 'updating', unblock updating.


        this.map.addListener('zooming', function () {
          // log('%cZOOMING!', 'background: #222; color: #bada55');
          _this3.clearUpdating();
        }); // whenever update finish, unblock updating.

        this.map.addListener('idle', function () {
          // log('%cIDLE!', 'background: #222; color: #bada55');
          _this3.clearUpdating();
        });
      }
    }, {
      key: "updateMapInstance",
      value: function updateMapInstance() {
        var _this4 = this;

        log$1("updateInstance"); // do not use destructing for size, bounds, center, zoom, mapTypeId
        // they can be asyncly changed during updateInstance.

        var _props3 = this.props,
            zoomEffect = _props3.zoomEffect,
            transitionOptions = _props3.transitionOptions; // panning issue
        //
        // issue: macos inertial scrolling cause panTo bug when try to zoom > 14
        // pending update until scrolling is over.
        // clear reupdateTimeout first

        clearTimeout(this.reupdateTimeout); // retry update.

        if ( // bug condition.
        this.props.zoom === 14 && this.scrolling) // // is updating
          // || this.updating
          {
            // blocking update
            log$1('updateInstance RETRY'); // retry after timeout 

            this.reupdateTimeout = setTimeout(function () {
              _this4.forceUpdate();
            }, 50);
            return;
          } // update


        log$1('updateInstance UPDATE!'); // setting properties issue
        //
        // issue 1: setZoom and panTo can not be executed in parallel. 
        // issue 2: morph clear view before move. 
        // issue 3: zooming bug with morph 
        // (repeat zoom in and out with debounce. morph always take times because of animation)
        //
        // zoom first to avoid issue 1
        // set zoom if need

        if (this.props.zoom !== this.map.getZoom()) {
          log$1('UPDATE ZOOM', this.map.getZoom(), this.props.zoom);
          this.updating = true;
          this.map.setZoom(this.props.zoom, zoomEffect);
        } // set center


        if (this.props.center && !this.props.center.equals(this.map.getCenter())) {
          log$1('updateInstance UPDATE %cCENTER', 'background: #222; color: red', this.map.getCenter(), this.props.center);
          this.updating = true;
          this.map.panTo(this.props.center, transitionOptions);
        } // // set else this.map options
        // const mapOptions = pickMapOptions(this.props);
        // // TODO: deep check mapOptions 
        // if (!isEmpty(mapOptions)) {
        //   this.map.setOptions(mapOptions);
        // }

      }
    }, {
      key: "destroyMapInstance",
      value: function destroyMapInstance() {
        // log('KVO INSTANCE %cDESTROY', 'background: black; color: red;')
        this.map.destroy();
      } // proxy onCenterChanged. for blocking when update.

    }, {
      key: "handleCenterChanged",
      value: function handleCenterChanged() {
        var _props4;

        var center = arguments.length <= 0 ? undefined : arguments[0];
        var navermaps = this.props.navermaps;
        log$1('handleCenterChagned');
        new navermaps.Marker({
          position: center.clone(),
          map: this.map
        });
        if (!this.updating) (_props4 = this.props).onCenterChanged.apply(_props4, arguments);
      } // proxy onBoundsChanged for blocking when update.

    }, {
      key: "handleBoundsChanged",
      value: function handleBoundsChanged() {
        var _props5;

        if (!this.updating) (_props5 = this.props).onBoundsChanged.apply(_props5, arguments);
      }
    }, {
      key: "render",
      value: function render() {
        return React.createElement(WrappedComponent, _extends({}, this.props, {
          instance: this.map,
          onCenterChanged: this.props.onCenterChanged && this.handleCenterChanged,
          onBoundsChanged: this.props.onBoundsChanged && this.handleBoundsChanged
        }));
      }
    }, {
      key: "componentDidMount",
      value: function componentDidMount() {
        this.createMapInstance();
        this.forceUpdate();
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate() {
        this.updateMapInstance();
      }
    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        if (this.map) this.destroyMapInstance();
      }
    }]);

    return MapInstance;
  }(React.PureComponent); // MapInstance component default props


  MapInstance.defaultProps = {
    naverEventNames: ['addLayer', 'click', 'dblclick', 'doubletap', 'drag', 'dragend', 'dragstart', 'idle', 'keydown', 'keyup', 'longtap', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'panning', 'pinch', 'pinchend', 'pinchstart', 'removeLayer', 'resize', 'rightclick', 'tap', 'tilesloaded', 'touchend', 'touchmove', 'touchstart', 'twofingertap', 'zooming', 'mapType_changed', 'mapTypeId_changed', 'size_changed', 'bounds_changed', 'center_changed', 'centerPoint_changed', 'projection_changed', 'zoom_changed'],
    zoomEffect: false
  };
  var name = WrappedComponent.displayName || WrappedComponent.name;
  MapInstance.displayName = "withNaverMapInstance(".concat(name, ")");
  return MapInstance;
};

var Composed = compose(withNavermaps(), withNaverMapInstance, withNaverEvents)(MapDOM);
Composed.defaultProps = defaultProps;

export { Composed as Map, withNavermaps, withNaverEvents };
