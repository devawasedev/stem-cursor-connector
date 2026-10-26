# STEM for Cursor

Save selected project context in STEM, then recall it from Cursor or another compatible assistant connected to the same STEM account. Useful context includes architectural decisions, project constraints, preferences and next-step notes.

This public package contains one remote MCP configuration and one scoped project-context skill. It runs no local server, installs no dependencies and adds no hooks. The hosted STEM service is operated by Awase LLC.

## Connect the MCP server

[Add the STEM MCP server to Cursor](https://cursor.com/install-mcp?name=stem&config=eyJ1cmwiOiJodHRwczovL2F3YXNlLmRldi9zdGVtIn0%3D)

The link opens Cursor's installation flow for the MCP server only; it does not install this repository's skill or create a STEM account. Review the endpoint, then complete Cursor's OAuth sign-in with your intended STEM account. If you already use STEM in another assistant, authorize that same account. Your organization may restrict custom MCP servers or require tool approval.

For manual setup, merge this entry into `.cursor/mcp.json` for a project or `~/.cursor/mcp.json` for your user. Preserve existing server entries.

```json
{
  "mcpServers": {
    "stem": {
      "url": "https://awase.dev/stem"
    }
  }
}
```

Cursor discovers STEM's OAuth metadata and dynamically registers its client. Do not paste passwords, API keys or access tokens into this configuration. OAuth approval gives the connection access to your STEM account's memory tools, not to the unsaved chats in other assistants.

## Install the complete plugin

This repository is the source package for the existing `stem` Cursor plugin identity. Marketplace acceptance and availability must be verified separately; this README does not claim an approved listing. When STEM is available in Cursor's Marketplace or a team marketplace, review its repository and install it through Cursor's Customize page. A complete plugin installation includes the `stem-project-context` skill as well as the MCP server. Do not add a second STEM server if you already configured it manually.

### Test a local checkout

The repository includes `.cursor-plugin/marketplace.json` with one entry pointing to the existing `stem` plugin at `./`. For a Cursor **From Local Repository** marketplace import, choose the repository root containing that file. Review and select STEM; importing a marketplace alone is not proof that its plugin is installed or authenticated.

Cursor also documents a direct local-development route: copy the complete plugin into `~/.cursor/plugins/local/stem`, then restart Cursor or run **Developer: Reload Window**. Open Customize and check for the project-context skill and STEM MCP server. Do not overwrite an existing local plugin without reviewing it. An installed marketplace plugin with the same name takes precedence over a local copy. Enterprise policy may disable local imports, and symlinks outside the local plugins folder are skipped. See [Cursor's local testing guide](https://cursor.com/docs/plugins#test-plugins-locally).

## Verify a real save and recall

Use a synthetic note with a unique marker, such as `stem-cursor-check-<your-unique-suffix>`. Replace the placeholder before running the check.

1. Ask Cursor: “Remember in STEM: For project `<marker>`, the demo theme is amber. This is synthetic test data.” Confirm an actual successful `remember` result and record its numeric memory ID.
2. Start a fresh conversation, or use another compatible assistant authorized to the same account. Ask it to recall the STEM note for that exact marker. Compare the returned ID and note; do not copy the answer into the new prompt.
3. Ask to delete that test memory by its verified numeric ID. Confirm the `forget` result and check that subsequent recall does not return that ID. Ranked recall is bounded, so the deletion tool result is the primary evidence.

A configuration appearing in settings is not proof of a save, recall, cross-assistant handoff or deletion. Cursor runtime verification of this package must be recorded separately from the local package validation below.

## What the tools do

| Tool | Purpose |
| --- | --- |
| `remember` | Save selected context explicitly requested by the user. |
| `recall` | Search saved memories; evaluate relevance before using results. |
| `link` | Connect two existing memories using numeric IDs. |
| `graph` | View a bounded graph of saved memory labels and relationships. |
| `forget` | Delete a specified memory and its attached links. |
| `memory_status` | Read current automatic-saving permission for this connection with `{}`. |
| `remember_automatically` | Make an eligible, opted-in automatic save after checking current permission. |

The last two tools are available on eligible OAuth connections. The authenticated `tools/list` response determines what your connection exposes. This plugin does not change automatic-memory settings. Host confirmations and user no-save instructions still apply.

## Boundaries and data control

STEM shares saved context across compatible assistants connected to the same account. It does not import earlier conversations, synchronize full chat histories, message other agents, or expose privately uploaded media through these MCP memory tools. Save only context you intend to put in that account. Never save secrets.

You can export memories and links from the authenticated STEM web dashboard and manage connections and memory preferences there. Disconnecting a host does not delete saved memories. Use specific memory deletion or the account controls described in the trust guide when needed. Current plan limits and availability are on the pricing page; this plugin does not enable checkout or promise a paid plan is available.

- [Cursor setup and troubleshooting](https://awase.dev/integrations/cursor)
- [STEM agent hub](https://awase.dev/agents)
- [Tool reference](https://awase.dev/docs/mcp)
- [Selected-context workflows](https://awase.dev/workflows/project-context)
- [Client cookbook](https://awase.dev/developers/cookbook)
- [Pricing](https://awase.dev/pricing) · [Limits](https://awase.dev/docs/limits)
- [Trust and data controls](https://awase.dev/trust)
- [Privacy policy](https://awase.dev/privacy) · [Terms](https://awase.dev/terms)
- [Support](mailto:support@awase.dev)

## Validate the package

From this directory, using Node.js 22 or later:

```sh
node scripts/validate.mjs
node scripts/validate.mjs --network
```

The first command checks the marketplace wrapper, its resolution to the single plugin, documented Cursor manifest constraints, component paths, skill metadata, exact remote configuration, logo and decoded install link. The optional network check reads the public install page and OAuth discovery endpoints. Neither command signs in, installs a plugin, invokes a memory tool or proves an authenticated Cursor workflow. The validator is maintained by Awase, not a Cursor approval or certification.

## License

The plugin's configuration, instructions, documentation and validation code are available under the [MIT License](LICENSE). STEM/Awase names, logos and hosted service are excluded as described in [NOTICE.md](NOTICE.md). This license does not license the private STEM backend or change the hosted service's terms.
