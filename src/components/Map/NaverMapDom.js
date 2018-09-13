import React from 'react';

function NaverMapDom({ mapDivId, style, className, children }) {
  return (
    <div id={mapDivId} className={className} style={style}>
      {children}
    </div>
  );
}

// NaverMapDom.defaultProps = {
//   style: {
//     width: '100%',
//     height: '100%',
//   },
// };

export default NaverMapDom;
