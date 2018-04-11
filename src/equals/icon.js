import htmlIconEquals from './htmlIcon'
// import imageIconEquals from './imageIcon'
// import symbolIconEquals from './symbolIcon'

import falsyCheck from './helpers/falsyCheck'

const iconEquals = (p, c) => {
  // string
  if (typeof p === 'string') {
    return p === c;
  }

  // one of input is not a object
  if (typeof p !== 'object' || typeof c !== 'object') {
    return false;
  }

  // HtmlIcon
  if (p.content) {
    return htmlIconEquals(p, c);
  }

  // ImageIcon
  if (p.url) {
    return imageIconEquals(p, c);
  }

  // SymbolIcon
  if (p.path) {
    return symbolIconEquals(p, c);
  }

  return false;
}

export default falsyCheck(iconEquals)
