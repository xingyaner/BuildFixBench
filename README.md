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

## Merged Fixes

The following benchmark cases have corresponding merged fixes:

| Project | Failure Date | Merge Date | Change Area | References | Merged Commit |
| --- | --- | --- | --- | --- | --- |
| uint256 | 2026.2.29 | 2026.8.24 | Upstream change | [Issue #223](https://github.com/holiman/uint256/issues/223), [PR #224](https://github.com/holiman/uint256/pull/224) | [3b6e9cde](https://github.com/holiman/uint256/commit/3b6e9cdebb7a0462a2748bf24d7fac2b8a943666) |
| tomcat | 2026.8.12 | 2026.9.15 | OSS-Fuzz code change | [OSS-Fuzz PR #16127](https://github.com/google/oss-fuzz/pull/16127) | [5aed4560](https://github.com/google/oss-fuzz/commit/5aed4560637a86f22ab6514c6fa451fea5019310) |
| compress | 2026.9.4 | 2026.9.16 | Upstream change | [Issue #1221](https://github.com/klauspost/compress/issues/1221), [PR #1222](https://github.com/klauspost/compress/pull/1222) | [de8f55df](https://github.com/klauspost/compress/commit/de8f55df9fb3af7aec787942d6b3c71e045bfee9) |
| mdbook-i18n-helpers | 2025.06.03 | 2026.9.16 | Dockerfile change | [OSS-Fuzz PR #16138](https://github.com/google/oss-fuzz/pull/16138) | [1d2405cf](https://github.com/google/oss-fuzz/commit/1d2405cfbf4e7819cb5d5a73aa8dfc5b55894e35) |
| libunwind | 2026.8.29 | 2026.9.16 | build.sh change | [OSS-Fuzz PR #16137](https://github.com/google/oss-fuzz/pull/16137) | [70a468cd](https://github.com/google/oss-fuzz/commit/70a468cd8a80cfae2f4db3316cb2476835d6618e) |

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
