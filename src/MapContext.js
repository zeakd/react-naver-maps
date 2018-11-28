import createReactContext from 'create-react-context';

const MapContext = createReactContext(null);

export const Provider = MapContext.Provider;
export const Consumer = MapContext.Consumer;

export default MapContext;
