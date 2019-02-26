import React from 'react';
import PropTypes from 'prop-types';
import { wrapDisplayName } from 'recompose';
import camelCase from 'lodash.camelcase';
import shallowequal from 'shallowequal';
import hoistNonReactStatics from 'hoist-non-react-statics';
import warning from 'warning';
import invariant from 'invariant';

import pick from '../utils/pick';

const propsListenerNameCache = {};

function generateEventLookup(naverEventNames) {
  return naverEventNames.reduce((ret, eventName) => {
    // first find cached propsListerName
    if (!propsListenerNameCache[eventName]) {
      propsListenerNameCache[eventName] = camelCase(`on_${eventName}`);
    }

    // propsListener is event listener defined on props. (user input)
    const propsListenerName = propsListenerNameCache[eventName];
    return {
      ...ret,
      [propsListenerName]: eventName,
    };
  }, {});
}

/**
 * Managing Naver Event Handlers. KVO instance must be registered
 * in the child component by props.registerEventInstance
 * @param {*} WrappedComponent
 */
const bridgeEventHandlers = WrappedComponent => {
  class Wrapper extends React.Component {
    constructor(props) {
      super(props);

      this.naverListeners = {};
      this.naverEventLookup = {};
      this.handlingPropNames = [];

      this.registerEventInstance = this.registerEventInstance.bind(this);
    }

    componentDidMount() {
      this.updateLookup();
      this.updateListeners();
    }

    componentDidUpdate(prevProps) {
      const shouldUpdateLookup = this.shouldLookupUpdate(prevProps);
      if (shouldUpdateLookup) {
        this.updateLookup();
      }

      if (shouldUpdateLookup || this.shouldListenersUpdate(prevProps)) {
        this.updateListeners();
      }
    }

    componentWillUnmount() {
      Object.values(this.naverListeners).forEach(listener => {
        this.unlisten(listener);
      });
    }

    shouldLookupUpdate(prevProps) {
      return (
        prevProps.events !== this.props.events &&
        !shallowequal(prevProps.events, this.props.events)
      );
    }

    updateLookup() {
      this.naverEventLookup = generateEventLookup(this.props.events);
      this.handlingPropNames = Object.keys(this.naverEventLookup);
      this.pickHandlers = pick(this.handlingPropNames);
    }

    shouldListenersUpdate(prevProps) {
      return !shallowequal(
        this.pickHandlers(prevProps),
        this.pickHandlers(this.props),
      );
    }

    updateListeners(props = this.props) {
      // prepare new naver listeners
      const prevNaverListeners = this.naverListeners;
      this.naverListeners = {};
      const orphans = {};
      const updateds = {};

      this.handlingPropNames.forEach(propName => {
        const handler = props[propName];

        if (prevNaverListeners[propName]) {
          const prevNaverListener = prevNaverListeners[propName];
          const prevHandler = prevNaverListener.listener;

          // handler unchanged
          if (prevHandler === handler) {
            this.naverListeners[propName] = prevNaverListeners[propName];

            // handler changed
          } else {
            orphans[propName] = prevNaverListener;
            updateds[propName] = handler;
          }

          // new handler
        } else if (handler) {
          updateds[propName] = handler;
        }
      });

      // listen updated handlers
      Object.keys(updateds).forEach(updatedPropName => {
        const evt = this.getEventByHandlerName(updatedPropName);
        this.naverListeners[updatedPropName] = this.listen(
          evt,
          updateds[updatedPropName],
        );
      });

      // unlisten orphan handlers
      Object.values(orphans).forEach(orphan => {
        this.unlisten(orphan);
      });
    }

    getEventByHandlerName(handlerName) {
      return this.naverEventLookup[handlerName];
    }

    registerEventInstance(instance) {
      warning(
        !this.instance,
        'react-naver-maps: bridgeEventHandlers - Tried to Change instance.',
      );
      invariant(
        instance,
        `react-naver-maps: bridgeEventHandlers - required naver instance, but ${instance}`,
      );
      this.instance = instance;

      if (this.props.registerEventInstance)
        this.props.registerEventInstance(instance);
    }

    listen(eventName, listener) {
      const { navermaps } = this.props;

      invariant(navermaps, 'props.navermaps required');
      invariant(this.instance, 'may be forgot to call registerEventInstance');

      return navermaps.Event.addListener(this.instance, eventName, listener);
    }

    unlisten(listener) {
      const { navermaps } = this.props;

      navermaps.Event.removeListener(listener);
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          registerEventInstance={this.registerEventInstance}
        />
      );
    }
  }

  Wrapper.displayName = wrapDisplayName(
    WrappedComponent,
    'bridgeEventHandlers',
  );

  hoistNonReactStatics(Wrapper, WrappedComponent);
  Wrapper.defaultProps = {
    ...WrappedComponent.defaultProps,
  };
  Wrapper.propTypes = {
    events: PropTypes.arrayOf(PropTypes.string),
    registerEventInstance: PropTypes.func,
    navermaps: PropTypes.object,
  };

  return Wrapper;
};

export default bridgeEventHandlers;
