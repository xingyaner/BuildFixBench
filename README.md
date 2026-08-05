# BuildFixBench

BuildFixBench is a benchmark dataset for reproducing and repairing fuzzing build
failures observed in OSS-Fuzz.

The website is a static GitHub Pages site that reads the public dataset from
[`data/projects.json`](data/projects.json). The matching YAML artifact is
available at [`data/projects.yaml`](data/projects.yaml).

## Dataset

Each case records the metadata needed to initialize the environment and
reproduce the observed failing build, including:

- project name and primary language
- observed failure date
- OSS-Fuzz commit SHA
- archived OSS-Fuzz build log URL
- upstream repository URL and commit SHA
- fuzzing engine, sanitizer, and architecture
- OSS-Fuzz base image digest
- fine-grained error category
- root-cause commit and workspace, when available

The public artifacts intentionally omit `fixed_state`.

## Error Categories

`error_category` follows the 25 fine-grained root causes from
*My Fuzzers Won't Build: An Empirical Study of Fuzzing Build Failures*.

## Updating Data

Regenerate the public data artifacts from a source `projects.yaml`:

```bash
python3 scripts/build_data.py /path/to/projects.yaml --version v0.1
```

This writes:

- `data/projects.yaml`
- `data/projects.json`

Both outputs remove hidden fields before publication.

## Website

The site is implemented without a frontend build step:

- `index.html`
- `styles.css`
- `app.js`
- `data/projects.json`

GitHub Pages deployment is configured through
[`.github/workflows/pages.yml`](.github/workflows/pages.yml). In the repository
settings, set Pages to deploy from GitHub Actions.
