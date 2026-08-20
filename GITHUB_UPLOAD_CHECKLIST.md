# GitHub Upload Checklist

1. Create a repository named `boro-rice-mapping-bangladesh`.
2. Extract this package and upload its contents, not the outer ZIP file alone.
3. Keep `Data/` and `Outputs/` outside Git tracking; `.gitignore` already excludes them.
4. Do not upload PlanetScope imagery, credentials, API keys, or sensitive GPS attributes.
5. Run Jupyter from the repository root or set `BORO_PROJECT_ROOT`.
6. Execute notebooks in the order listed in `README.md` to regenerate figures and tables.
7. After a successful clean rerun, create a tagged release such as `v1.0.0`.

## Path behavior

All notebooks now use a portable project root. Generated images remain under each notebook's existing `Outputs/.../figures` directory; tables, reports, maps, and models retain their original output logic beneath `Outputs/`.

## Comments

Python comments beginning with `#` were retained because they document methods and do not affect execution. No JavaScript-style `//` comment lines were present in the supplied notebooks.
