# The ChatGPT and Codex plugin

This folder is the package that is uploaded to OpenAI's plugin directory (https://platform.openai.com/plugins) for iHatePosting's hosted server. It is **not** part of the npm package and nothing in it is uploaded by this repository: the steps are the owner's, in `PUBLISHING.md` under "Submissions".

| File | What it is |
| --- | --- |
| `plugin.json` | The listing (name, descriptions, URLs, icons), the five positive and three negative review cases, and the release notes, in the portable Agent Plugins format. |
| `mcp.json` | The one hosted server, `https://app.ihateposting.com/mcp/oauth`, signed into with OAuth (dynamic client registration). |
| `skills/` | Four skills that tell the model how to use the server's tools: `get-started`, `schedule-posts`, `manage-scheduled-posts`, `create-post-media`. |
| `assets/` | `logo.png` and `icon.png`: the repository's logo, square, 198 by 198 pixels. |

This README is not in the ZIP. To check the folder and build the ZIP (it uploads nothing):

```bash
npm run chatgpt-plugin:zip
```

The rules the script checks are OpenAI's published package rules (https://developers.openai.com/plugins/build/plugins and https://developers.openai.com/plugins/deploy/submission-errors), read on 2026-11-15. There are no lifecycle hooks and no app files, because a plugin with them cannot be submitted. There is no demo video URL, no reviewer login and no country list in the package: the first is a link only you can make, the second is typed in the portal and never put in a ZIP, and the country list is left to the portal's own setting.

The server this points at answered on 2026-11-15 at 08:17 UTC (see "What must be live first" in `PUBLISHING.md`, which also lists what is still missing).
