import falsyCheck from './helpers/falsyCheck'

const positionEquals = (p, c) => typeof p === 'number' &&  p === c;

export default falsyCheck(positionEquals);