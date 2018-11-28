import React from 'react';
import { wrapDisplayName } from 'recompose';
import hoistNonReactStatics from 'hoist-non-react-statics';

const injectNaverRef = WrappedComponent => {
  function Wrapper({ naverRef, ...restProps }) {
    return <WrappedComponent {...restProps} ref={naverRef} />;
  }

  Wrapper.displayName = wrapDisplayName(WrappedComponent, 'injectNaverRef');
  Wrapper.defaultProps = {
    ...WrappedComponent.defaultProps,
  };
  hoistNonReactStatics(Wrapper, WrappedComponent);
  return Wrapper;
};

export default injectNaverRef;
