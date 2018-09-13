const pick = keys => props =>
  keys.reduce((ret, key) => {
    /* eslint-disable no-param-reassign */
    if (props[key] !== undefined) {
      ret[key] = props[key];
    }
    return ret;
    /* eslint-enable no-param-reassign */
  }, {});

export default pick;
