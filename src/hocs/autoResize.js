import React from 'react';
import { wrapDisplayName } from 'recompose';
import ResizeDetector from 'react-resize-detector';

const autoResize = WrappedComponent => {
  class Wrapper extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        style: {
          width: '100%',
          height: '100%',
        },
      };

      this.handleResize = this.handleResize.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
      if (props.size) {
        return {
          ...state,
          size: props.size,
        };
      }

      return null;
    }

    handleResize(width, height) {
      this.setState({
        size: {
          width,
          height,
        },
      });
    }

    render() {
      const { id, className, style, ...restProps } = this.props;
      return (
        <div id={id} className={className} style={style}>
          <WrappedComponent
            {...restProps}
            id={`wrapped-${id}`}
            style={this.state.style}
            size={this.state.size}
          />
          <ResizeDetector
            handleWidth
            handleHeight
            onResize={this.handleResize}
            refreshMode="throttle"
            refreshRate={10}
          />
        </div>
      );
    }
  }

  Wrapper.displayName = wrapDisplayName(WrappedComponent, 'autoResize');
  return Wrapper;
};

export default autoResize;
