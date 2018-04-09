import React from 'react'
import { wrapDisplayName } from 'recompose';

const withNaverInstanceRef = WrappedComponent => {
  const RefNaverInstance = props => <WrappedComponent {...props} ref={props.naverInstanceRef} />

  RefNaverInstance.displayName = wrapDisplayName(WrappedComponent, 'withNaverInstanceRef');

  return RefNaverInstance;
}

export default withNaverInstanceRef