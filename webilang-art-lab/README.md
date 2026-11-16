# Webilang Art Lab — Rivera & Rockefeller

Standalone, colorful A2–B1 English module with illustrated history, interactive tasks, and personal Stocks.

## What changed in this revision

- Removed the old large historical/disclaimer block in the footer.
- Added an accessible explanation of the mural's meaning and why Rivera included Lenin.
- Navigation: 11 compact section tabs, including mandatory Grammar; “Writing & Curating” → “Writing”. Horizontal swipeable navigation at smaller widths.
- Floating **↺ Reset page** and **✦ Ask Kostya** controls throughout the module.
- Every English word in the Rivera comic dialogue and the Comedian reading can be clicked and selected for My Word Stock. Once selected, open My Word Stock and click Save selected words.
- Four multiple-choice comprehension questions after Banksy watching, and four for the banana reading, with feedback after each item.
- Audio recording on Rivera decision and banana opinion. The recorded audio stays local until the user requests server transcription; transcription then appears as editable text. AI feedback can identify grammar issues and offers clickable grammar-item saving.
- Personalized AI practice generation for saved words and grammar when an OpenAI API key is configured, plus existing local fallback exercises.
- Kept the nine compulsory vocabulary words and two grammar topics with 7 questions in each of Recognize, Retrieve, and Produce.

## Latest update

- Speaking: real eight-segment spinning roulette, each segment labeled with a one- or two-word art topic; question shown after the wheel stops, with 45-second timer and audio recording.
- Writing: **Get AI writing feedback** button for the exhibition proposal. AI reviews the text and provides selectable grammar patterns for My Grammar Stock. Requires configured `/api/coach` and `OPENAI_API_KEY`.

## Deployment

1. In this Webilang repository, keep the complete `webilang-art-lab` directory, including its assets and scripts. Do not move the lesson to the repository root.
2. Use Vercel framework **Other**, repository root directory `./`, and serve the repository's static files (no separate build/output directory is required). The lesson is at `/webilang-art-lab/`. Its `<base href="/webilang-art-lab/">` also supports Vercel serving `/webilang-art-lab` without a redirect. A standalone copy at a different mount path must update this base URL.
3. Under Vercel → Project → Settings → Environment Variables, set `OPENAI_API_KEY` (secret). Optionally set `ARTLAB_AI_MODEL` to a model compatible with JSON mode; default is `gpt-4o-mini`.
4. Redeploy. The deployed site must support the `/api/coach`, `/api/transcribe`, and `/api/speak` serverless routes; a GitHub Pages static-only deployment cannot serve AI endpoints.
5. Before publicly promoting the site, configure access controls, abuse/rate limits, a usage budget, and an appropriate privacy notice for student audio and AI processing.

### Rivera image diagnosis and regression checks

The eight JPEGs are committed, valid 762×250 images. On the existing
`webilang-git-test-qwen-webilang.vercel.app` deployment, all eight
`/webilang-art-lab/assets/rivera-N.jpg` URLs returned `200 image/jpeg` and matched
the repository bytes. All eight `/assets/rivera-N.jpg` URLs returned 404.
Vercel served both `/webilang-art-lab` and `/webilang-art-lab/` with 200, without
canonicalizing to the trailing slash. The former made the original relative
image, script, and stylesheet URLs resolve outside the lesson directory.
The lesson base URL fixes this without changing routing for other modules.
No rewrite or image optimization service is needed; `vercel.json` has no
custom output directory or asset exclusions. Dashboard build/root overrides
were not accessible, but the deployed nested files are present and served.
The production homepage `webilang.vercel.app` returned 404 for this lesson at
investigation time; verification used the existing `test-qwen` branch alias.

Each comic image now overlays an embedded SVG with the scene number/title.
An image error makes only the failed image transparent, exposing the fallback;
the original image alt text, dialogue, and vocabulary button remain intact.
No external placeholder or retry loop is involved. A successful later image
load restores the JPEG. The SVG remains available even if lesson scripts fail.

Run the browser regression tests from the repository root (Node 22+ and Chromium):

```sh
npm install --prefix /tmp/webilang-browser-tests --no-save playwright@1.65.1
NODE_PATH=/tmp/webilang-browser-tests/node_modules CHROMIUM_PATH=/usr/bin/chromium \
  node --test tests/rivera-comic.test.cjs
```

The local test server deliberately serves the slashless lesson URL without a
redirect. Tests cover all eight JPEG responses and decoded images on desktop
and mobile, each supported entry URL, all eight 404/corrupt-image fallbacks,
image recovery, and vocabulary selection with images present or missing.
External fonts/APIs are blocked in these tests; AI behavior is outside their scope.

The repository's existing Vercel deployment configuration is unchanged.
No merge or manual deployment is part of this fix's verification; automatic
Git deployments follow the project's existing settings.

## Functional limits

- Without `OPENAI_API_KEY`, AI feedback, AI transcription, real Ask Kostya responses, and AI-generated Stock exercises cannot run. Exercise content and typed responses still work, and local Stock exercise templates remain available.
- Browser voice synthesis is the fallback for unconfigured `/api/speak`; server-side audio uses OpenAI speech with voice `cedar`.
- Audio is submitted to OpenAI for transcription only when the recording stops. A text transcript is then submitted for AI feedback only when the learner clicks the feedback button.
- The local Stocks are browser-local and not yet synchronized with Webilang student accounts.
- Ask Kostya is an on-demand *text* AI art companion, not a cloned video avatar or the existing Webilang student-aware Kostya. It is deliberately labeled as such.
- Full real-browser verification of AI routes has not been possible in this environment. Syntax and structure were checked.

## Source note

The comic is dramatized historical fiction based on the Rivera/Rockefeller dispute. Refer to the historical sources linked within the Story tab for documentary grounding; do not treat character lines as verbatim quotations.

Speaking roulette topics updated to focus on personal experience, choice, ideas and advice.
