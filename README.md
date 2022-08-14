# Firehose

## Setup

Install:

- Python 3, at least Python 3.6.
- Node.js 16, at least Node 16.16.
  - My favorite way is through [nvm](https://github.com/nvm-sh/nvm).

In the root directory, run:

- `pip install -r requirements.txt` to install dependencies.
- `npm install` to install dependencies.

## Updating

### Normal updating

- To update schedules, run `python update.py`. This runs three steps:
  - `python scrapers/coursews.py` to get the class schedules.
  - `python scrapers/catalog.py` to get the class descriptions.
  - `python scrapers/package.py` to bundle schedules, descriptions, and evaluations into a `json` file.
- To update evaluations, run `python update_evals.py`.
- To update the frontend, run `npm build`. Then run `./deploy.sh` or something.
  - You can run `npm start` for the frontend hotloader.

### Changing semesters

Let's say you're updating from e.g. IAP 2022 to Fall 2022.

- First, archive the old semester:
  - Run `npm build`.
  - Run `mkdir -p public/semesters/i22/static`.
  - Run `cp -r build/static/. public/semesters/i22/static`.
  - Run `cp build/full.json public/semesters/i22/full.json`.
  - Run `cp build/index.html public/semesters/i22/iap.html`.
- Then, update the new semester:
  - Open `public/latestTerm.json`.
  - Change `urlName` to `f22`.
- After running `npm build`, copy everything in `build` to e.g. `public/semesters/i22` for IAP 2022.
- Rename `public/semesters/i22/index.html` to `iap.html`.
- Update `public/latestTerm.json` for the new semester. For example, for Fall 2022:
- Run the normal update process: `python update.py && npm build`.

## Development notes

### Architecture

*I want to change...*

- *...the data available to Firehose.*
  - The entry point is `scrapers/update.py` (and `update_evals.py` for evaluation data).
  - This goes through `src/components/App.tsx`, which looks for the data.
  - The exit point is through the constructor of `Firehose` in `src/lib/firehose.ts`.
- *...the way Firehose behaves.*
  - The entry point is `src/lib/firehose.ts`.
  - The exit point is through `src/components/App.tsx`, which constructs `Firehose` and passes it down.
- *...the way Firehose looks.*
  - The entry point is `src/components/App.tsx`.
  - We use [Chakra UI](https://chakra-ui.com/) as our component library. Avoid writing CSS.

### Technologies

Try to introduce as few technologies as possible to keep this mostly future-proof. If you introduce something, make sure it'll last a few years. Usually one of these is a sign it'll last:

- some MIT class teaches how to use it
  - e.g. web.lab teaches React, 6.102 teaches Typescript
- it's tiny and used in only a small part of the app
  - e.g. msgpack-lite is only used for URL encoding, nanoid is only used to make IDs
- it's a big, popular, well-documented project that's been around for several years
  - e.g. FullCalendar has been around since old Firehose, Chakra UI has a large community
