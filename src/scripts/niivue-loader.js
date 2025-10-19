// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 NumFOCUS

import {
  Niivue,
  SLICE_TYPE,
  MULTIPLANAR_TYPE,
  SHOW_RENDER,
} from "@niivue/niivue";
import pLimit from "p-limit";
import { createImageLoader } from "@niivue/itkwasm-loader";
import { dicomLoader } from "@niivue/dicom-loader";

/**
 * Initialize NiiVue viewer on the given canvas element
 * @param {HTMLCanvasElement} canvas - The canvas element to attach NiiVue to
 * @returns {Promise<Niivue>} The initialized NiiVue instance
 */
export async function initializeNiiVue(canvas) {
  if (!canvas) {
    throw new Error("Canvas element is required for NiiVue initialization");
  }

  const isDark = document.documentElement.classList.contains("wa-dark");
  const defaults = {
    backColor: isDark
      ? [16.0 / 255.0, 18.0 / 255.0, 25.0 / 255.0, 1.0]
      : [1, 1, 1, 1],
    logLevel: "info",
    showLegend: true,
    showColorbarBorder: false,
    isColorBar: true,
    isOrientCube: true,
    isOrientationTextVisible: false,
    sliceType: SLICE_TYPE.MULTIPLANAR,
    multiplanarRender: MULTIPLANAR_TYPE.GRID,
    multiplanarShowRender: SHOW_RENDER.ALWAYS,
    heroImageFraction: 0.6,
  };

  const nv = new Niivue(defaults);
  await nv.attachToCanvas(canvas);

  /**
   * Supported image file extensions that ITK-Wasm can read but aren't fully supported by NiiVue
   */
  const imageExtensions = [
    "bmp",
    "gipl",
    "gipl.gz",
    "hdf5",
    "lsm",
    "mnc",
    "mnc.gz",
    "mnc2",
    "mgh",
    "mgz",
    "mgh.gz",
    "mha",
    "mhd",
    "mrc",
    "nia",
    "pic",
    "tif",
    "tiff",
    "isq",
    "aim",
    "fdf",
  ];

  // Register ITK-Wasm loaders for each supported image extension
  for (const ext of imageExtensions) {
    nv.useLoader(createImageLoader(ext), ext, "nii");
  }

  nv.useDicomLoader({ loader: dicomLoader });

  return nv;
}

// Re-export utilities that might be needed
export { Niivue, SLICE_TYPE, MULTIPLANAR_TYPE, SHOW_RENDER, pLimit };
