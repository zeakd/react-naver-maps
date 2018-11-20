import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import bridgeEventHandler from '../hocs/bridgeEventHandlers'

class Overlay extends React.Component {
  componentWillUnmount() {
    if (this.overlay) this.overlay.setMap(null)
  }

  createOverlay() {
    const { 
      OverlayView,
      map,
      registerEventInstance,
    } = this.props;

    const overlay = new OverlayView({
      map,
    });

    registerEventInstance(overlay);
    return overlay;
  }

  updateOverlay(overlay) {
    const overlayOptions = this.props.pickOverlayOptions(this.props);

    overlay.setOptions(overlayOptions);
  }

  render() {
    if (!this.overlay) {
      this.overlay = this.createOverlay();
    }

    this.updateOverlay(this.overlay);

    return null;
  }
}

export default bridgeEventHandler(Overlay)