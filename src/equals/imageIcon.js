import sizeEquals from './size'
import positionEquals from './position'
import pointEquals from './point'
import falsyCheck from './helpers/falsyCheck'

const imageIconEquals = (p, c) => {

  if (typeof p === 'object') {
    const {
      url: pUrl,
      size: pSize,
      scaledSize: pScaledSize,
      origin: pOrigin,
      anchor: pAnchor,
    } = p;

    const {
      url: cUrl,
      size: cSize,
      scaledSize: cScaledSize,
      origin: cOrigin,
      anchor: cAnchor,
    } = c;

    const urlEquality = pUrl === cUrl;
    
    const sizeEquality = sizeEquals(pSize, cSize);

    const scaledSizeEquality = sizeEquals(pScaledSize, cScaledSize);

    const originEquality = pointEquals(pOrigin, cOrigin);

    const anchorEquality = pointEquals(pAnchor, cAnchor) || positionEquals(pAnchor, cAnchor);

    return urlEquality && sizeEquality && scaledSizeEquality && originEquality && anchorEquality;
  }

  return false;
}

export const pure = imageIconEquals;
export default falsyCheck(imageIconEquals);