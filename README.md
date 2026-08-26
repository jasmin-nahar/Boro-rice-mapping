# Google Earth Engine workflow

This folder contains a configuration-driven Google Earth Engine JavaScript
workflow for selecting, quality-masking, scaling, previewing, and exporting
Sentinel-2 Level-2A surface-reflectance imagery for PlanetScope–Sentinel-2 HPF
fusion. The same script can be used for Tanore, Manda, or another study area.

## Script

- `01_Generic_Sentinel2_Export.js`: creates one export task for every exact date
  listed in the user-editable `CONFIG` block.

## Dataset and output

- Earth Engine collection: `COPERNICUS/S2_SR_HARMONIZED`
- Exported bands: Blue, Green, Red, NIR
- Data type: Float32 surface reflectance
- Scale factor: 0.0001
- Output resolution: 10 m
- Output CRS: EPSG:32645
- NoData value: -9999
- Output format: cloud-optimized GeoTIFF

NDVI is shown only as a quality-control preview. It is recalculated in the
downstream preparation/fusion notebooks and is not exported by this script.

## Running the script

1. Open the script in the Google Earth Engine Code Editor.
2. Edit only the `CONFIG` block: set the study-area name, AOI source, Earth
   Engine asset ID, Google Drive folder, acquisition dates, and output CRS.
3. Alternatively, import/draw a geometry, assign it to `CUSTOM_GEOMETRY`, and
   set `aoiMode` to `geometry`.
4. Run the script and inspect the Console scene metadata and map previews.
5. Confirm that each exact date returns at least one scene.
6. Open the **Tasks** tab and run every image-export task.
7. Archive the printed scene IDs, product IDs, sensing times, MGRS tiles,
   processing baselines, and cloud percentages with the publication outputs.

### Example: Manda

```javascript
studyAreaName: 'Manda',
aoiMode: 'asset',
aoiAssetId: 'projects/YOUR_PROJECT/assets/Manda',
exportFolder: 'S2_Manda',
acquisitionDates: ['2026-01-23', '2026-03-04', '2026-04-10']
```

For a study area outside UTM Zone 45N, update `outputCrs` to the appropriate
projected CRS before exporting.

The approximately 3,000 km² monthly download quota reported in the manuscript
was a project-specific PlanetScope account constraint. It was not a Google Earth
Engine or Sentinel-2 download limit.

## Data-access note

An Earth Engine AOI asset path is not an authentication credential. Users who
cannot access the configured asset must upload/import an equivalent boundary
and update `aoiAssetId`, or use the geometry mode.
