import pointEquals from './point'
import latLngEquals from './latLng'

const coordEquals = (p, c) => pointEquals(p, c) || latLngEquals(p, c);

export default coordEquals