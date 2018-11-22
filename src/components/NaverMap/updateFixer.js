import React from 'react';

const updateFixer = WrappedComponent => {
  class Wrapper extends React.Component {
    constructor(props) {
      super(props);

      // this.reupdateTimer;
      this.handleUpdateStart = this.handleUpdateStart.bind(this);
      this.handleUpdateEnd = this.handleUpdateEnd.bind(this);
      this.handleCenterChanged = this.handleCenterChanged.bind(this);
    }

    // shouldComponentUpdate(nextProps) {
    //   return !this.updating;
    // }

    // registerInstance(map) {
    //   this.map = map;

    //   this.addFixerListener();
    // }

    handleCenterChanged(center) {
      // if (!this.updating && this.props.onCenterChanged) {
      this.props.onCenterChanged(center);
      // }
    }

    handleUpdateStart() {
      // console.log('start updating');
      // this.updating = true;
    }

    handleUpdateEnd() {
      // console.log('end updating');
      // this.updating = false;
    }

    clearUpdating() {
      // console.log('clear');
      // this.updating = false;
      // clearTimeout(this.reupdateTimer);
    }

    // addFixerListener() {
    //   this.map.addListener('idle', () => {
    //     this.clearUpdating();
    //   });

    //   this.map.addListener('zooming', () => {
    //     this.clearUpdating();
    //   });
    // }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          onUpdateStart={this.handleUpdateStart}
          onUpdateEnd={this.handleUpdateEnd}
          onCenterChanged={this.handleCenterChanged}
        />
      );
    }
  }

  return Wrapper;
};

export default updateFixer;
