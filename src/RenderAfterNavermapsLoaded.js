import React from 'react'
import PropTypes from 'prop-types'
import loadNavermapsScript from './loadNavermapsScript'

class RenderAfterNavermapsLoaded extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      loading: true,
    }
  }

  render () {
    
    if (this.state.loading) {
      return this.props.loading
    }

    if (this.state.error) {
      return this.props.error
    }

    return this.props.children;

  }

  componentDidMount() {
    const { clientId, submodules } = this.props;
    
    loadNavermapsScript({
      clientId,
      submodules,
    }).then(() => {
      
      this.setState({
        loading: false,
      })
    }).catch(() => {
      
      this.setState({
        loading: false,
        error: true,
      })
    })
  }
}

RenderAfterNavermapsLoaded.propTypes = {
  loading: PropTypes.node,
  error: PropTypes.node,
  clientId: PropTypes.string.isRequired,
  submodules: PropTypes.arrayOf(PropTypes.string),
}

RenderAfterNavermapsLoaded.defaultProps = {
  loading: null,
  error: null,
}


export default RenderAfterNavermapsLoaded