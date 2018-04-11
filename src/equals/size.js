import falsyCheck from './helpers/falsyCheck'

const sizeEquals = (p, c) => {
  // check array first
  if (Array.isArray(p)) {
    return c && p[0] === c[0] && p[1] === c[1]; 
  }

  // object type size
  if (typeof p === 'object') {
    if (p.equals) {
      return p.equals(c);
    } 

    return c && p.width === c.width && p.height === c.height;
  }

  return false;
}

export const pure = sizeEquals;
export default falsyCheck(sizeEquals);