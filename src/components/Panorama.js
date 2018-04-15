import React from 'react'
import ResizeDetector from 'react-resize-detector'
import invariant from 'invariant'
import debug from 'debug'
import { compose, wrapDisplayName } from 'recompose'

import createLogger from '../utils/createLogger'
import namedWrapper from '../utils/namedWrapper'
import withNavermaps from '../withNavermaps'
import withNaverEvents from '../withNaverEvents'
import withNaverInstanceRef from '../withNaverInstanceRef'

const log = createLogger('Panorama');

class NaverPanoramaDOM extends React.PureComponent {
  constructor (props) {
    super(props);
    
    this.handleResize = this.handleResize.bind(this);
  }

  handleResize (width, height) {
    const {
      instance,
    } = this.props

    if (instance) {

      // resize map on wrapping div resized
      instance.setSize({
        width, height
      })
    }
  }

  render () {
    const { id, className, panoDivId } = this.props;

    return (
      <div id={id} className={className}>
        <div id={panoDivId} style={{ width: "100%", height: "100%" }}/>
        <ResizeDetector handleWidth handleHeight onResize={this.handleResize}/>
      </div>
    )
  }
}

const withNaverPanoramaInstance = WrappedComponent => {
  class NaverPanoramaInstance extends React.PureComponent {
    render () {
      return (
        <WrappedComponent 
          {...this.props} 
          instance={this.pano}
          ref={this.props.naverInstanceRef}
        />
      )
    }

    // create panorama instance
    createPanoramaInstance () {
      const {
        panoDivId,
        position,
        size,
        navermaps,
      } = this.props;

      const panoOptions = {
        position,
        size,
      }

      this.instance = this.pano = new navermaps.Panorama(panoDivId, panoOptions);
    }

    // update panorama instance
    updatePanoramaInstance () {

      // log('UPDATE Start')
      const {
        position,
        size,
      } = this.props;

      if (position && !position.equals(this.pano.getPosition())) {
        
        // log('UPDATE position', pano.getPosition(), position)
        this.pano.setPosition(position);
      }

      if (size && !size.equals(this.pano.getSize())) {
        
        // log('UPDATE size', pano.getSize(), size)
        this.pano.setSize(size);
      }
    }

    // destroy panorama instance
    destroyPanoramaInstance () {
      this.pano.destroy();
    }

    componentDidMount () {
      this.createPanoramaInstance();
    }

    componentDidUpdate () {
      this.updatePanoramaInstance();
    }

    componentWillUnmount () {
      if (this.pano) this.destroyPanoramaInstance()
    }
  }

  NaverPanoramaInstance.defaultProps = {
    naverEventNames: [
      'init',
      'pano_changed',
      'pano_status',
      'pov_changed',
    ],
  }

  NaverPanoramaInstance.displayName = wrapDisplayName(WrappedComponent, 'withNaverPanoramaInstance');

  return NaverPanoramaInstance;
}

// compose Panorama component
const Panorama = compose(
  namedWrapper('NaverPanorama'),
  withNavermaps({ submodules: ['Panorama'] }),
  withNaverInstanceRef,
  withNaverPanoramaInstance,
  withNaverEvents,
)(NaverPanoramaDOM)

Panorama.defaultProps = {
  panoDivId: 'naver-pano',
}

export default Panorama;

// class Panorama extends Base {
//   shouldComponentUpdate(nextProps) {
//     const {
//       position: currentPosition,
//       size: currentSize,
//       ...currentRestProps,
//     } = this.props;
    
//     const {
//       position: nextPosition,
//       size: nextSize,
//       ...nextRestProps,
//     } = nextProps;
    
//     // check position equality
//     const panoPosition = this.pano && this.pano.getPosition();
//     const isPositionEqual = (panoPosition && panoPosition.equals(nextProps.position));

//     // check position equality
//     const panoSize = this.pano && this.pano.getSize();
//     const isSizeEqual = (!nextProps.size || nextProps.size.equals(panoSize));

//     // check rest props equality
//     const isRestEqual = shallowEqualObjects(currentRestProps, nextRestProps);
    
//     const shouldUpdate = 
//       !(isRestEqual && isPositionEqual && isSizeEqual);

//     // log ('shouldUpdate', shouldUpdate)

//     return shouldUpdate;
//   }

// }