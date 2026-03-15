import { useEffect, useRef } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useMap,
  useNavermaps,
} from 'react-naver-maps';
import { makeMarkerClustering } from '../samples/marker-cluster';
import { accidentDeath } from '../samples/accident-death';

function ClusterMap() {
  const navermaps = useNavermaps();
  const map = useMap();
  const clusterRef = useRef<any>(null);

  useEffect(() => {
    const MarkerClustering = makeMarkerClustering(window.naver);
    const data = accidentDeath.searchResult.accidentDeath;
    const markers = data.map((d: any) => {
      return new navermaps.Marker({
        position: new navermaps.LatLng(
          parseFloat(d.grd_la),
          parseFloat(d.grd_lo),
        ),
      });
    });

    const htmlMarker1 = {
      content:
        '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:url(https://navermaps.github.io/maps.js.ncp/docs/img/cluster-marker-1.png);background-size:contain;"></div>',
      size: new navermaps.Size(40, 40),
      anchor: new navermaps.Point(20, 20),
    };
    const htmlMarker2 = {
      content:
        '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:url(https://navermaps.github.io/maps.js.ncp/docs/img/cluster-marker-2.png);background-size:contain;"></div>',
      size: new navermaps.Size(40, 40),
      anchor: new navermaps.Point(20, 20),
    };
    const htmlMarker3 = {
      content:
        '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:url(https://navermaps.github.io/maps.js.ncp/docs/img/cluster-marker-3.png);background-size:contain;"></div>',
      size: new navermaps.Size(40, 40),
      anchor: new navermaps.Point(20, 20),
    };
    const htmlMarker4 = {
      content:
        '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:url(https://navermaps.github.io/maps.js.ncp/docs/img/cluster-marker-4.png);background-size:contain;"></div>',
      size: new navermaps.Size(40, 40),
      anchor: new navermaps.Point(20, 20),
    };
    const htmlMarker5 = {
      content:
        '<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:url(https://navermaps.github.io/maps.js.ncp/docs/img/cluster-marker-5.png);background-size:contain;"></div>',
      size: new navermaps.Size(40, 40),
      anchor: new navermaps.Point(20, 20),
    };

    clusterRef.current = new MarkerClustering({
      minClusterSize: 2,
      maxZoom: 13,
      map: map,
      markers: markers,
      disableClickZoom: false,
      gridSize: 120,
      icons: [htmlMarker1, htmlMarker2, htmlMarker3, htmlMarker4, htmlMarker5],
      indexGenerator: [10, 100, 200, 500, 1000],
      stylingFunction: (clusterMarker: any, count: number) => {
        clusterMarker.getElement().querySelector('div').textContent =
          count.toString();
      },
    });

    return () => {
      if (clusterRef.current) {
        clusterRef.current.setMap(null);
      }
    };
  }, [map, navermaps]);

  return null;
}

function ClusterMapContent() {
  const navermaps = useNavermaps();

  return (
    <NaverMap
      defaultCenter={new navermaps.LatLng(36.2253017, 127.6460516)}
      defaultZoom={6}
    >
      <ClusterMap />
    </NaverMap>
  );
}

function ClusterMapContainer() {
  return (
    <MapDiv style={{ width: '100%', height: '600px' }}>
      <ClusterMapContent />
    </MapDiv>
  );
}

export default function MarkerClusterExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <ClusterMapContainer />
    </NavermapsProvider>
  );
}
