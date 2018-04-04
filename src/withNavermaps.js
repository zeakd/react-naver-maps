import React from 'react'
import invariant from 'invariant'

const withNavermaps = ({ submodules = []} = {}) => WrappedComponent => {
  class WithNavermaps extends React.Component {
    constructor (props) {
      super(props);
      
      const navermaps = this.getNavermapsModule();
      invariant(navermaps, 'props.navermaps or window.naver.maps is required.')
      
      if (submodules) {
        submodules.forEach(submodule => {
          invariant(navermaps[submodule], `navermaps.${submodule} is required`)
        })
      }

      this.hi = 'hihi'
    }
    
    getNavermapsModule () {
      return this.props.navermaps || (window.naver && window.naver.maps);
    }
    
    render () {
      const navermaps = this.getNavermapsModule();
      const { ...restProps } = this.props;
      
      return <WrappedComponent {...restProps} navermaps={navermaps} />
    }
  }

  const name = WrappedComponent.displayName || WrappedComponent.name;
  WithNavermaps.displayName = `withNavermaps(${name})`;
  
  return WithNavermaps;
}
  
export default withNavermaps;