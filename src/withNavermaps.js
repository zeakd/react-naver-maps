import React from 'react'
import invariant from 'invariant'
import { wrapDisplayName } from 'recompose'

const withNavermaps = ({ submodules = []} = {}) => WrappedComponent => {
  class Navermaps extends React.Component {
    constructor (props) {
      super(props);
      
      const navermaps = this.getNavermapsModule();
      invariant(navermaps, 'props.navermaps or window.naver.maps is required.')
      
      if (submodules) {
        submodules.forEach(submodule => {
          invariant(navermaps[submodule], `navermaps.${submodule} is required`)
        })
      }
    }
    
    getNavermapsModule () {
      return this.props.navermaps || (window.naver && window.naver.maps);
    }
    
    render () {
      const navermaps = this.getNavermapsModule();
      
      return <WrappedComponent {...this.props} navermaps={navermaps} />
    }
  }

  Navermaps.displayName = wrapDisplayName(WrappedComponent, 'withNavermaps');
  
  return Navermaps;
}
  
export default withNavermaps;