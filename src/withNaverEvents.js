import React from 'react'
import invariant from 'invariant'
import debug from 'debug'
import { camelCase, difference } from 'lodash'
import { wrapDisplayName } from 'recompose'
import createLogger from './utils/createLogger'

const log = createLogger('withNaverEvents');

const withNaverEvents = WrappedComponent => {
  class NaverEvents extends React.PureComponent {
    constructor (props) {
      super(props);

      this.listeners = {};
    }

    render () {   
      return <WrappedComponent {...this.props} />
    }

    componentDidUpdate () {
      // log('componentDidUpdate')
      invariant(this.props.instance, 'naver KVO instance is required on props.instance.')
      this.updateListeners();
    }
  
    generateListenerNames () {
      this.listenerNames = this.props.naverEventNames.map(naverEventName => {
  
        // camelCased event name 
        const camelEventName = camelCase(naverEventName);
      
        // propsListener is event listener defined on props. (user input)
        const propsListenerName = camelCase(`on_${naverEventName}`);
      
        // naverListener is naver kvo event listener defined and managed inside component.
        const naverListenerName = `_${camelEventName}Listener`;
      
        return {
          naverEventName,
          camelEventName,
          propsListenerName,
          naverListenerName,
        }
      })
  
      return this.listenerNames;
    }
  
    updateListeners () {

      const {
        navermaps 
      } = this.props;
  
      const beforeListenerNames = Object.keys(this.listeners);
      const currentListenerNames = [];
  
      // TODO: cache listeners info.
      this.generateListenerNames().forEach(({ 
        propsListenerName, 
        naverListenerName, 
        naverEventName 
      }) => {
        if (this.props[propsListenerName]) {
          if (!this.listeners[naverListenerName]) {
  
            // add naver kvo event listener
            this.listeners[naverListenerName] = navermaps.Event.addListener(this.props.instance, naverEventName, (...args) => {
  
              // run listener
              if (this.props[propsListenerName]) {
                this.props[propsListenerName](...args);
              } 
            })
          }
  
          // push to current listener names
          currentListenerNames.push(naverListenerName);
        }
      })
  
      // collect orphan listeners
      const orphanListenerNames = difference(beforeListenerNames, currentListenerNames);
  
      // log('orphanListenerNames', orphanListenerNames)
  
      // detach and delete orphan naver event listeners
      orphanListenerNames.forEach(orphanListenerName => {
        
        // log('orphanListenerName', orphanListenerName)
        navermaps.Event.removeListener(this.listeners[orphanListenerName]); 
        delete this.listeners[orphanListenerName];      
      })
    }
  }

  NaverEvents.displayName = wrapDisplayName(WrappedComponent, 'withNaverEvents');

  return NaverEvents;
}
  

export default withNaverEvents