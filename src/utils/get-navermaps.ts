type NaverMapsType = typeof naver.maps;
export default function getNavermaps(): NaverMapsType {
  const navermaps = window.naver?.maps;

  if (!navermaps) {
    throw Error('window.naver.maps is not defined');
  }

  return navermaps;
}
