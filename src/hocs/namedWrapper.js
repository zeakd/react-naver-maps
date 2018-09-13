import React from 'react';

const namedWrapper = displayName => WrappedComponent => {
  const Wrapper = props => <WrappedComponent {...props} />;

  Wrapper.displayName = displayName;

  return Wrapper;
};

export default namedWrapper;
