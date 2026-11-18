# Kittyloluar

A monochrome, responsive Kittylol script-workspace UI prototype.

## Run locally

Open `index.html` in a browser, or serve this directory with any static web server. The interface is a client-side prototype: workspace data is stored in the browser's `localStorage`.

## Prototype boundaries

- The Discord button enters a preview session; Discord OAuth is not configured.
- Script text and attachment names stay in the local browser. Uploaded files are not sent to a server, and script contents are never evaluated.
- Public/private controls and protected previews are UI-only. There is no API, public hosting, or executable loader behind the generated preview links.

A production deployment needs a trusted backend, Discord OAuth configuration, access controls, and a reviewed design for safely storing and serving user content.
