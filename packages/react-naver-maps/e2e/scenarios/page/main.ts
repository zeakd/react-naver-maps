import { mountApp } from '../app/index.js';
import { mountPanorama } from '../app/panorama.js';
import { sdkContract } from '../../../src/__tests__/sdk-contract.js';

Object.assign(window, { mountApp, mountPanorama, sdkContract });
