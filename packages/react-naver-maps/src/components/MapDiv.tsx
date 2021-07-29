import React from 'react';
import { MapContext } from '../contexts/map-context';
import useNaverMap from '../hooks/useNaverMap';

export default React.forwardRef<HTMLDivElement>(function MapDiv({ children, ...restProps }, ref) {
  const [map, innerRef] = useNaverMap();

  if (ref) {
    return <div ref={ref} {...restProps}>{children}</div>;
  }

  return (
    <div ref={innerRef} {...restProps}>
      {map && <MapContext.Provider value={map}>
        {children}
      </MapContext.Provider>}
    </div>
  );
});
