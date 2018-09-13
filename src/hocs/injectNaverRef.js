import React from 'react';
import { wrapDisplayName } from 'recompose';

const injectNaverRef = WrappedComponent => {
  function Wrapper({ naverRef, ...restProps }) {
    return <WrappedComponent {...restProps} ref={naverRef} />;
  }

  Wrapper.displayName = wrapDisplayName(WrappedComponent, 'injectNaverRef');
  return Wrapper;
};

export default injectNaverRef;
