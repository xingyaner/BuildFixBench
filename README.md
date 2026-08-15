# BuildFixBench

BuildFixBench is a benchmark dataset for reproducing and repairing fuzzing build
failures observed in OSS-Fuzz.

Live website: [https://xingyaner.github.io/BuildFixBench/](https://xingyaner.github.io/BuildFixBench/)

The website is a static GitHub Pages site that reads the generated public
dataset from [`data/projects.json`](data/projects.json). Upload or update the
source YAML at [`data/projects.yaml`](data/projects.yaml); the Pages workflow
regenerates the JSON and deploys the updated page automatically.

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

`data/projects.yaml` is the single source of truth for the published records.
To update the site, replace that file and push the commit. The workflow runs:

```bash
python3 scripts/build_data.py data/projects.yaml --version v0.2
```

For a local update, run the same command from the repository root. It writes:

- `data/projects.yaml`
- `data/projects.json`

Both outputs remove hidden fields before publication.

The public page also documents the reproduction lock: use the case's
`oss-fuzz_sha`, `software_sha`, `software_repo_url`, and `base_image_digest`.
Check Dockerfiles in both OSS-Fuzz and the upstream repository because either
location may own the base image or clone step.

## Website

访问页面：[https://xingyaner.github.io/BuildFixBench/](https://xingyaner.github.io/BuildFixBench/)

The site is implemented without a frontend build step:

- `index.html`
- `styles.css`
- `app.js`
- `data/projects.json`

GitHub Pages deployment is configured through
[`.github/workflows/pages.yml`](.github/workflows/pages.yml). In the repository
settings, set Pages to deploy from GitHub Actions.
