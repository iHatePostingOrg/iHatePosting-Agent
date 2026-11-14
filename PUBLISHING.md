# Publishing

Nothing in this repository publishes by itself yet: the two workflows in `.github/workflows` (`publish-npm.yml`, `sync-skill.yml`) run when a GitHub release is published, and this repository has no remote, so they have never run. Until it does, the steps below are run by a person who owns the package name.

1. Make sure the tree is what you want to ship and the tests pass: `npm test`.
2. Check what the package would hold: `npm pack --dry-run`. It should list `bin`, `src`, `SKILL.md`, `skills`, `README.md`, `CHANGELOG.md` and `LICENSE`, and nothing else (no key, no `.env`, no test).
3. Set the version in `package.json` and in the manifests (`.claude-plugin`, `.cursor-plugin`, `.grok-plugin`, `gemini-extension.json`, and the DeepSeek Harness plugin under `plugins/` if there is one) to the same number, and move the CHANGELOG's entry under it.
4. Put the repository on GitHub, add the repository secret `NPM_TOKEN` (an npm automation token of the owner of `ihateposting-agent`), and publish a release whose tag is `v<the version>`: `publish-npm.yml` checks the tag against `package.json`, runs the tests, and publishes. Or by hand: sign in to npm (`npm login`) and run `npm publish`.
5. `sync-skill.yml` copies `SKILL.md` into `skills/ihateposting-agent/SKILL.md` when a release is published (or when run by hand); it commits to `main`, so keep the two identical in the meantime.

The sign-in's server is the iHatePosting app: its routes `POST /device/code` and `POST /device/token` and its pages `/device` and `/oauth/authorize` must be live on `app.ihateposting.com` before `auth:login` works there.
