import React from 'react';
import { wrapDisplayName } from 'recompose';
import MapContext from '../MapContext';

/**
 * inject context 'map'
 * @param {*} WrappedComponent
 */
const withMap = WrappedComponent => {
  function Wrapper(props) {
    return (
      <MapContext.Consumer>
        {map => <WrappedComponent {...props} map={map} />}
      </MapContext.Consumer>
    );
  }

  Wrapper.displayName = wrapDisplayName(WrappedComponent, 'withMap');

  return Wrapper;
};

export default withMap;
