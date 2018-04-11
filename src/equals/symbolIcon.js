import { shallowEqual } from 'recompose'
import positionEquals from './position'
import pointEquals from './point'
import falsyCheck from './helpers/falsyCheck'

// TODO: need to test
const symbolIconEquals = (p, c) => {

  if (typeof p === 'object') {
    if (p === c) {
      return true;
    }

    const {
      path: pPath,
      anchor: pAnchor,

      ...restPrevParams
    } = p;

    const {
      path: cPath,
      anchor: cAnchor,

      ...restCurrentParams
    } = c;

    const pathEquality = pPath === cPath;

    const anchorEquality = pointEquals(pAnchor, cAnchor) || positionEquals(pAnchor, cAnchor);

    const restEquality = shallowEqual(restPrevParams, restCurrentParams);

    return pathEquality && anchorEquality && restEquality;
  }

  return false;
}

export const pure = symbolIconEquals;
export default falsyCheck(symbolIconEquals);