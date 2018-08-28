import React from 'react'
import { MapContext } from './contexts'

const withMap = WrappedComponent => props => (
  <MapContext.Consumer>
    {map => <WrappedComponent {...props} map={map} />}
  </MapContext.Consumer>
)

export default withMap