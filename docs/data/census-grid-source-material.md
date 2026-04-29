# Census Grid Source-Material Preparation Manual

This guide describes the repository-local tooling path for importing real-world census datasets into OpenVayra - Cities scenario demand configurations.

## Scope and Objectives

The baseline application fixtures distribute residential coverage using artificial/synthetic distributions. For higher fidelity scenarios, developers can consume structured population density models.

> [!IMPORTANT]
> OpenVayra - Cities remains focused on lightweight simulation slices rather than absolute real-world urban reconstruction workflows.

## Execution Lifecycle

Raw spatial formats pass through multi-stage pipeline constraints:

```mermaid
graph TD
    A[External Census Data] -->|prepare-census CLI| B[Normalized CSV data/generated/]
    B --> C[Local Manifest JSON data/generated/]
    C -->|build-scenario-demand CLI| D[Demand Artifact JSON apps/web/public/]
```

1. **Raw Source Material:** Non-committed local datasets (typically GIS downloads).
2. **Normalized Local Source Material:** Bounds-restricted WGS84 CSV targets (`grid_id,lng,lat,population`).
3. **Generated Local Manifest:** Intermediary configuration combining spatial components.
4. **Final Runtime Demand Artifact:** Consolidated static payload executed by web adapters.

---

## Available Data Sources

* **Eurostat GISCO Population Grids:** Harmonized 1 km grid cells for EU member states.
* **German Zensus 2022:** Official high-density structural demographics mapped to standardized projections.

*Users assume responsibility for verifying applicable data licenses and attribution rules.*

## Handling Coordinate Reference Systems (CRS)

Large demographic models map to standard equal-area grids (such as **ETRS89-LAEA / EPSG:3035**), but the runtime expects raw **WGS84 Longitude/Latitude (EPSG:4326)**.

The preparation pipeline translates projections via embedded `proj4` dependencies.

### Example: German Zensus 2022

The official German Zensus 2022 1 km population grid is provided as a CSV file with projected coordinates.

**Workflow:**

1. Download the dataset (e.g., `Zensus2022_Bevoelkerungszahl_1km-Gitter.csv`).
2. Place the file in the appropriate external directory, renamed to match expectations:
   ```text
   data/external/census/hamburg-core-mvp/population-grid-1km.csv
   ```
3. The file contains the following headers separated by semicolons:
   ```text
   GITTER_ID_1km;x_mp_1km;y_mp_1km;Einwohner
   ```
4. The `x_mp_1km` and `y_mp_1km` columns represent projected midpoint coordinates in **EPSG:3035**.
5. Run the normalization script. It will automatically detect the headers, delimiter, and CRS:
   ```bash
   pnpm scenario-demand:prepare-census:hamburg-core-mvp
   ```
6. Build the runtime artifact:
   ```bash
   pnpm scenario-demand:build:hamburg-core-mvp:local-census
   ```

> [!IMPORTANT]
> Projected midpoint coordinates (`x_mp_1km`, `y_mp_1km`) are converted to WGS84 longitude/latitude during normalization. Runtime artifacts only consume WGS84 truth.

---

## Execution Commands

### 1. Census Grid Normalization

Map local grid extractions toward target scenarios:

```bash
pnpm scenario-demand:prepare-census:hamburg-core-mvp
```

*Default Options supported dynamically:*
* `--input-crs epsg:3035` (Converts projected metrics to WGS84)
* `--id-column`
* `--population-column`
* `--longitude-column`
* `--latitude-column`
* `--delimiter`

### 2. Artifact Generation

Compile processed grids into client bundles:

```bash
pnpm scenario-demand:build:hamburg-core-mvp:local-census
```

---

## Combined Local Demand Execution

For workflows incorporating spatial attractors alongside standard demographic baselines, consult [OSM Attractor Source-Material Preparation](file:///d:/__DEV/open-vayra-cities/docs/data/osm-attractor-source-material.md) requirements for structured manifest options.
