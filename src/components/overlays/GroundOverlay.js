/**
 * npm modules
 */
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';

/**
 * local moduleds
 */
import { withNavermaps, bridgeEventHandlers, withMap } from '../../hocs';

/**
 *
 * @param {*} props
 */
class GroundOverlay extends React.PureComponent {
  componentWillUnmount() {
    if (this.overlay) this.overlay.setMap(null);
  }

  createGroundOverlay() {
    const {
      navermaps,
      map,
      bounds,
      url,
      clickable,
      registerEventInstance,
    } = this.props;

    const groundOverlay = new navermaps.GroundOverlay(url, bounds, {
      map,
      clickable,
    });

    registerEventInstance(groundOverlay);
    return groundOverlay;
  }

  updateGroundOverlay(groundOverlay) {
    const { opacity } = this.props;

    groundOverlay.setOpacity(opacity);
  }

  render() {
    if (!this.overlay) {
      this.overlay = this.createGroundOverlay();
    }

    this.updateGroundOverlay(this.overlay);

    return null;
  }
}

GroundOverlay.defaultProps = {
  events: ['click', 'dblclick'],
};

GroundOverlay.propTypes = {
  events: PropTypes.arrayOf(PropTypes.string),
  bounds: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  clickable: PropTypes.bool,
  opacity: PropTypes.number,
  map: PropTypes.object,
  navermaps: PropTypes.object,
  registerEventInstance: PropTypes.func,
};

export default compose(
  withNavermaps,
  withMap,
  bridgeEventHandlers,
)(GroundOverlay);
