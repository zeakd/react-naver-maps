import { mountApp } from '../app/index.js';
import { mountPanorama } from '../app/panorama.js';

Object.assign(window, { mountApp, mountPanorama });
