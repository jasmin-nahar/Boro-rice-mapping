/**
 * Sentinel-2 Level-2A export for PlanetScope–Sentinel-2 HPF fusion
 *
 * Study area: User-configurable
 * Acquisition dates: User-configurable
 * Dataset: COPERNICUS/S2_SR_HARMONIZED
 * Output: Four-band surface reflectance (Float32; approximately 0–1)
 * Band order: Blue, Green, Red, NIR
 * Output CRS and resolution: EPSG:32645 at 10 m
 *
 * Notes:
 * - NDVI is displayed only for visual quality control and is not exported.
 * - The fusion workflow subsequently aligns Sentinel-2 to the PlanetScope 3 m grid.
 * - Change only the CONFIG block to run the workflow for another study area.
 * - AOI_MODE supports either an Earth Engine asset or a drawn/imported geometry.
 */


// -----------------------------------------------------------------------------
// 1. USER-CONFIGURABLE SETTINGS — EDIT THIS BLOCK ONLY
// -----------------------------------------------------------------------------

var CONFIG = {
  // Used in output filenames and map-layer names.
  studyAreaName: 'Tanore',

  // Choose 'asset' or 'geometry'.
  aoiMode: 'asset',

  // Used when aoiMode is 'asset'. Replace this path for Manda or another area.
  aoiAssetId: 'projects/ee-jasminnaherjui542/assets/Tanore',

  // Google Drive destination folder.
  exportFolder: 'S2_Tanore',

  // Add, remove, or replace exact acquisition dates as required.
  acquisitionDates: [
    '2026-01-23',
    '2026-03-04',
    '2026-04-10'
  ],

  collectionId: 'COPERNICUS/S2_SR_HARMONIZED',
  outputCrs: 'EPSG:32645',
  outputScaleMeters: 10,
  noData: -9999,
  maxPixels: 1e13,

  // Map-display settings do not affect exported pixel values.
  mapZoom: 10
};

/*
 * Optional geometry input:
 * 1. Import or draw a geometry in the Earth Engine Code Editor.
 * 2. Replace null below with its variable name, for example: geometry
 * 3. Set CONFIG.aoiMode to 'geometry'.
 *
 * Leave this as null when using an Earth Engine asset.
 */
var CUSTOM_GEOMETRY = null;


// -----------------------------------------------------------------------------
// 2. CONFIGURATION VALIDATION AND AOI LOADING
// -----------------------------------------------------------------------------

if (CONFIG.aoiMode !== 'asset' && CONFIG.aoiMode !== 'geometry') {
  throw new Error("CONFIG.aoiMode must be either 'asset' or 'geometry'.");
}

if (!CONFIG.studyAreaName || CONFIG.acquisitionDates.length === 0) {
  throw new Error('Provide a study-area name and at least one acquisition date.');
}

if (CONFIG.aoiMode === 'geometry' && CUSTOM_GEOMETRY === null) {
  throw new Error(
    'CUSTOM_GEOMETRY is null. Import/draw a geometry or use asset mode.'
  );
}

var aoi = CONFIG.aoiMode === 'asset'
  ? ee.FeatureCollection(CONFIG.aoiAssetId)
  : ee.FeatureCollection([ee.Feature(CUSTOM_GEOMETRY)]);

// Create a filesystem-safe label for filenames.
var AREA_SLUG = CONFIG.studyAreaName
  .trim()
  .replace(/[^A-Za-z0-9_-]+/g, '_');


// -----------------------------------------------------------------------------
// 3. SENTINEL-2 CLOUD/SHADOW MASK AND REFLECTANCE SCALING
// -----------------------------------------------------------------------------

/**
 * Masks unsuitable Sentinel-2 pixels using the Scene Classification Layer
 * (SCL), selects the four bands shared with four-band PlanetScope imagery,
 * scales the integer surface-reflectance values, and preserves key metadata.
 *
 * Retained SCL classes include vegetation, bare soil, water, unclassified
 * pixels, and low-probability cloud. Masked classes are:
 *   0  = No data
 *   1  = Saturated or defective
 *   3  = Cloud shadow
 *   8  = Medium-probability cloud
 *   9  = High-probability cloud
 *   10 = Cirrus
 *   11 = Snow or ice
 *
 * @param {ee.Image} image Sentinel-2 Level-2A image.
 * @return {ee.Image} Prepared four-band surface-reflectance image.
 */
function prepareSentinel2(image) {
  var scl = image.select('SCL');

  var validMask = scl.neq(0)
    .and(scl.neq(1))
    .and(scl.neq(3))
    .and(scl.neq(8))
    .and(scl.neq(9))
    .and(scl.neq(10))
    .and(scl.neq(11));

  // Sentinel-2 Level-2A B2, B3, B4, and B8 values use a scale factor of 0.0001.
  var surfaceReflectance = image
    .select(
      ['B2', 'B3', 'B4', 'B8'],
      ['Blue', 'Green', 'Red', 'NIR']
    )
    .multiply(0.0001)
    .toFloat()
    .updateMask(validMask);

  return surfaceReflectance.copyProperties(
    image,
    [
      'system:time_start',
      'system:index',
      'CLOUDY_PIXEL_PERCENTAGE',
      'MGRS_TILE',
      'PROCESSING_BASELINE',
      'PRODUCT_ID'
    ]
  );
}


// -----------------------------------------------------------------------------
// 4. EXACT-DATE IMAGE PREPARATION AND EXPORT
// -----------------------------------------------------------------------------

/**
 * Creates one Google Drive export task for an exact acquisition date.
 * If several Sentinel-2 tiles intersect the AOI, they are mosaicked. Images are
 * sorted from higher to lower CLOUDY_PIXEL_PERCENTAGE because Earth Engine's
 * mosaic() gives priority to the last image; the least-cloudy image is therefore
 * placed on top where valid observations overlap.
 *
 * @param {string} dateString Acquisition date in YYYY-MM-DD format.
 * @param {string} outputLabel Compact date label in YYYYMMDD format.
 */
function exportExactDate(dateString) {
  var startDate = ee.Date(dateString);
  var endDate = startDate.advance(1, 'day');
  var outputLabel = dateString.replace(/-/g, '');

  var collection = ee.ImageCollection(CONFIG.collectionId)
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .map(prepareSentinel2);

  // Record scene-selection metadata in the Earth Engine Console.
  print(outputLabel + ' — image count:', collection.size());
  print(outputLabel + ' — scene IDs:', collection.aggregate_array('system:index'));
  print(outputLabel + ' — product IDs:', collection.aggregate_array('PRODUCT_ID'));
  print(outputLabel + ' — MGRS tiles:', collection.aggregate_array('MGRS_TILE'));
  print(
    outputLabel + ' — processing baselines:',
    collection.aggregate_array('PROCESSING_BASELINE')
  );
  print(
    outputLabel + ' — acquisition times:',
    collection.aggregate_array('system:time_start')
  );
  print(
    outputLabel + ' — cloudy-pixel percentages:',
    collection.aggregate_array('CLOUDY_PIXEL_PERCENTAGE')
  );

  var preparedImage = collection
    .sort('CLOUDY_PIXEL_PERCENTAGE', false)
    .mosaic()
    .clip(aoi)
    .unmask(CONFIG.noData)
    .toFloat();

  var filename = 'S2_' + AREA_SLUG + '_' + outputLabel + '_SR';

  // RGB preview for visual quality control.
  Map.addLayer(
    preparedImage,
    {
      bands: ['Red', 'Green', 'Blue'],
      min: 0.02,
      max: 0.35,
      gamma: 1.2
    },
    filename + '_RGB',
    false
  );

  // NDVI preview only; NDVI is calculated in the downstream workflow.
  var validReflectanceMask = preparedImage
    .select('Red')
    .neq(CONFIG.noData);
  var ndviPreview = preparedImage
    .normalizedDifference(['NIR', 'Red'])
    .updateMask(validReflectanceMask)
    .rename('NDVI');

  Map.addLayer(
    ndviPreview,
    {
      min: -0.2,
      max: 0.9,
      palette: [
        '8c510a',
        'd8b365',
        'f6e8c3',
        'c7eae5',
        '5ab4ac',
        '01665e'
      ]
    },
    filename + '_NDVI_preview',
    false
  );

  Export.image.toDrive({
    image: preparedImage,
    description: filename,
    folder: CONFIG.exportFolder,
    fileNamePrefix: filename,
    region: aoi.geometry(),
    scale: CONFIG.outputScaleMeters,
    crs: CONFIG.outputCrs,
    maxPixels: CONFIG.maxPixels,
    fileFormat: 'GeoTIFF',
    formatOptions: {
      cloudOptimized: true,
      noData: CONFIG.noData
    }
  });
}


// -----------------------------------------------------------------------------
// 5. CREATE ONE EXPORT TASK FOR EACH CONFIGURED DATE
// -----------------------------------------------------------------------------

CONFIG.acquisitionDates.forEach(function(dateString) {
  exportExactDate(dateString);
});


// -----------------------------------------------------------------------------
// 6. MAP DISPLAY AND EXECUTION NOTES
// -----------------------------------------------------------------------------

Map.centerObject(aoi, CONFIG.mapZoom);

Map.addLayer(
  aoi.style({
    color: 'yellow',
    fillColor: '00000000',
    width: 2
  }),
  {},
  CONFIG.studyAreaName + ' AOI'
);

print('====================================================');
print('Study area:', CONFIG.studyAreaName);
print('AOI mode:', CONFIG.aoiMode);
print('Configured dates:', CONFIG.acquisitionDates);
print('Export tasks created:', CONFIG.acquisitionDates.length);
print('Open the Tasks tab and click Run for every task.');
print('Expected band order: Blue, Green, Red, NIR');
print('Output CRS:', CONFIG.outputCrs);
print('Output pixel size (m):', CONFIG.outputScaleMeters);
print('Reflectance range: approximately 0–1');
print('NoData value:', CONFIG.noData);
print('Archive the printed scene metadata with the publication outputs.');
print('====================================================');
