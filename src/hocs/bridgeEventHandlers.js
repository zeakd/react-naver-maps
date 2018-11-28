import React from 'react';
import { wrapDisplayName } from 'recompose';
import camelCase from 'lodash.camelcase';
import warning from 'warning';
import invariant from 'invariant';

function generageEventLookup(naverEventNames) {
  return naverEventNames.reduce((ret, eventName) => {
    // propsListener is event listener defined on props. (user input)
    const propsListenerName = camelCase(`on_${eventName}`);
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
      this.updateListeners();
    }

    componentDidUpdate() {
      this.updateListeners();
    }

    componentWillUnmount() {
      Object.values(this.naverListeners).forEach(listener => {
        this.unlisten(listener);
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

    updateListeners(props = this.props) {
      if (this.eventsCache !== props.events) {
        this.eventsCache = props.events;
        this.naverEventLookup = generageEventLookup(props.events);
        this.handlingPropNames = Object.keys(this.naverEventLookup);
      }

      // prepare new naver listeners
      const prevNaverListeners = this.naverListeners;
      this.naverListeners = {};
      const orphans = {};
      const updateds = {};

      this.handlingPropNames.forEach(propName => {
        // console.log(`for ${propName}`);
        const handler = props[propName];

        if (prevNaverListeners[propName]) {
          const prevNaverListener = prevNaverListeners[propName];
          const prevHandler = prevNaverListener.listener;
          // handler unchanged

          // console.log(
          //   prevNaverListener,
          //   // prevHandler,
          //   // handler,
          //   prevHandler === handler,
          // );
          if (prevHandler === handler) {
            // console.log('unchanged', propName);
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

      // console.log('updateds', updateds);
      // console.log('orphans', orphans);

      // listen updated handlers
      Object.keys(updateds).forEach(updatedPropName => {
        const evt = this.getEventByHandlerName(updatedPropName);
        this.naverListeners[updatedPropName] = this.listen(
          evt,
          updateds[updatedPropName],
        );
      });
      // console.log('listeners', this.naverListeners);

      // unlisten orphan handlers
      Object.values(orphans).forEach(orphan => {
        this.unlisten(orphan);
      });
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

  return Wrapper;
};

export default bridgeEventHandlers;
