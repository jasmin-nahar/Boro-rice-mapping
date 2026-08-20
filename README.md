# Phenology-Based Boro Rice Mapping in Northwestern Bangladesh

This repository contains the computational notebooks used for PlanetScope preparation, Sentinel-2/PlanetScope HPF fusion, phenological feature construction, classification, spatial leakage assessment, bidirectional geographic transfer, temporal ablation, and final point-level validation for Tanore and Manda, Bangladesh.

## Important data notice

PlanetScope source imagery is not redistributed because of licensing restrictions. Place authorized local data beneath `Data/` using the folder structure expected by the notebooks. Do not commit credentials, private API keys, or restricted GPS attributes.

## Project-root configuration

The notebooks no longer contain the original machine-specific `D:` drive path. Use either method below.

1. Launch Jupyter from the repository root; or
2. Set the `BORO_PROJECT_ROOT` environment variable to the local repository path.

Windows PowerShell example:

```powershell
$env:BORO_PROJECT_ROOT = "D:\Boro Rice Classification"
jupyter lab
```

## Notebook order

1. Run the two `01_...Preparation_NDVI` notebooks.
2. Run the two `02_...3Date_HPF_Fusion` notebooks.
3. Run the two `03_...Classification` notebooks.
4. Run notebooks `04` through `08` in numerical order.

## Generated files

Figures, tables, reports, maps, and models are generated beneath `Outputs/`. Those folders are ignored by Git because the products can be large and may contain machine-specific paths.

## Environment

Create a clean environment and install the dependencies:

```bash
python -m venv .venv
pip install -r requirements.txt
jupyter lab
```

## Reproducibility

The analysis code and parameter values are preserved. Notebook outputs and execution counters were cleared before publication so that old local paths and embedded figures are not mistaken for a clean rerun. Execute the notebooks from top to bottom to regenerate outputs.
