# Project 8: L’Oréal Chatbot

A learning project for a beauty assistant that answers questions about L’Oréal products, routines, and beauty-related recommendations.

## Start the site

Open `index.html` in the Codespaces live preview. The provided L’Oréal logo is in `img/loreal-logo.png`.

## Connect a Cloudflare Worker

The browser must call a Cloudflare Worker. Never put an OpenAI API key in `script.js`, `secrets.js`, or any file served by the website.

1. In Cloudflare, create a Worker and paste the contents of `RESOURCE_cloudflare-worker.js`.
2. In the Worker settings, add a secret named `OPENAI_API_KEY` and paste your OpenAI key there. Keep the key in Cloudflare; do not commit it to GitHub.
3. Deploy the Worker and copy its `.workers.dev` URL.
4. In `script.js`, replace the example value of `WORKER_URL` with that URL.
5. Reload the site and ask a beauty question. The Worker adds the L’Oréal-only system prompt and forwards the conversation to OpenAI.

The Worker URL is account-specific, so it cannot be filled in until you deploy it. This repository does not contain an API key or a deployed Worker URL.

## Conversation and privacy

The chat sends the current conversation turns to the Worker so it can answer follow-up questions. The conversation history is held in browser memory for the current tab and clears when the page is refreshed. The visible “Your latest question” panel updates with each new question.

## Brand and type choices

The interface uses L’Oréal’s black, white, and vibrant red direction described in [FutureBrand’s L’Oréal case study](https://www.futurebrand.com/our-work/loreal). The serif display and sans-serif interface pairing is informed by [Monotype’s L’Oréal font review](https://hello.monotype.com/rs/800-DWE-978/images/BrandReview_LOREAL.pdf). The referenced commercial typefaces are not bundled; this project uses web-available display fonts with system serif and sans-serif fallbacks.

## Project note

Independent learning project; not an official L’Oréal service. Product availability varies by region. Follow product labels, and consult a qualified healthcare professional about persistent skin or scalp concerns.

## Routine Builder

The Routine Builder is the homepage. The original Beauty Assistant is linked
from its header. To preview locally, run `python -m http.server 8000` from the
repository root and visit `http://localhost:8000/`.

The builder uses the same Worker URL as the chatbot. Product selection is saved
on the current browser, and follow-ups use the generated routine's product
selection and chat history.

To enable live web sources, deploy the updated `RESOURCE_cloudflare-worker.js`
as the existing Cloudflare Worker. Keep its `OPENAI_API_KEY` secret in Cloudflare.
The existing chatbot uses `POST /` and the upgraded builder uses `POST /routine`.
Before the upgrade, the builder uses the existing chat response without web
sources. After deploying, generate a routine and check that product source links
appear on relevant replies.
