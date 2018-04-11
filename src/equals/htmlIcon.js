import sizeEquals from './size'
import positionEquals from './position'
import pointEquals from './point'
import falsyCheck from './helpers/falsyCheck'

const htmlIconEquals = (p, c) => {

  if (typeof p === 'object') {
    const {
      content: pContent,
      size: pSize,
      anchor: pAnchor,
    } = p;

    const {
      content: cContent,
      size: cSize,
      anchor: cAnchor,
    } = c;

    const contentEquality = pContent.isEqualNode ? 
      pContent.isEqualNode(cContent) : 
      (typeof pContent === 'string') && pContent === cContent;
    
    const sizeEquality = sizeEquals(pSize, cSize);

    const anchorEquality = pointEquals(pAnchor, cAnchor) || positionEquals(pAnchor, cAnchor);

    return contentEquality && sizeEquality && anchorEquality;
  }

  return false;
}

export const pure = htmlIconEquals;
export default falsyCheck(htmlIconEquals);