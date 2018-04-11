import falsyCheck from './helpers/falsyCheck'

const latLngEquals = (p, c) => {

  if (Array.isArray(p)) {
    return p[0] === c[0] && p[1] === c[1];
  }

  if (typeof p === 'object') {

    if (p.equals) {
      return p.equals(c);
    }

    if (c.equals) {
      return c.equals(p);
    }

    return p.lat === c.lat && p.lng === c.lng;
  }

  return false;
}

export default falsyCheck(latLngEquals)