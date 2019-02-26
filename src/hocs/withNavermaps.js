import React from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import { wrapDisplayName } from 'recompose';
import hoistNonReactStatics from 'hoist-non-react-statics';

/**
 * inject navermaps to WrappedComponent.
 * use props.navermaps or window.naver.maps
 * if there is no naver maps module, raise.
 * @param {*} WrappedComponent
 */
const withNavermaps = WrappedComponent => {
  class Navermaps extends React.Component {
    constructor(props) {
      super(props);

      const navermaps = this.getNavermaps();
      invariant(navermaps, 'props.navermaps or window.naver.maps is required.');
    }

    getNavermaps() {
      return this.props.navermaps || (window.naver && window.naver.maps);
    }

    render() {
      const navermaps = this.getNavermaps();

      return <WrappedComponent {...this.props} navermaps={navermaps} />;
    }
  }

  Navermaps.displayName = wrapDisplayName(WrappedComponent, 'withNavermaps');
  Navermaps.propTypes = {
    navermaps: PropTypes.object,
  };
  hoistNonReactStatics(Navermaps, WrappedComponent);

  return Navermaps;
};

export default withNavermaps;
