const submoduleChecker = {
  panorama: 'Panorama',
  geocoder: 'Service',
  drawing: 'drawing',
  visualization: 'visualization',
};

const hasSubmodule = (navermaps, submodule) => !!navermaps[submoduleChecker[submodule]]

export default hasSubmodule;