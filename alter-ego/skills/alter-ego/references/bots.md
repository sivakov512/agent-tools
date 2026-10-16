# Bots

## Adding a bot

Walk the user through it one step at a time and do every step you can yourself.

1. **Account.** The user creates a GitHub account for the bot (e.g. `<them>-robot`) and verifies its email; you can't do that. GitHub's terms allow a machine account next to a personal one; if they want several, point them to the terms first.
2. **Token.** Signed in as the bot, the user creates a classic personal access token with the `repo` scope (add `workflow` if the bot will touch `.github/workflows`) and an expiry they are comfortable with. Classic is what alter-ego is tested with; a fine-grained token may not reach repositories the bot only collaborates on.
3. **Register.** `alter-ego add-bot <name> <login>`. The name is short and is what `{bot}` turns into: `beelzebot` gives commits signed `Claude(beelzebot)`. The default format is `Claude({bot})`; mention it and change it only if they want another (`--name-format` or `alter-ego name-format`). When no token is stored yet, the command prints the one that stores it.
4. **Store the token.** The user runs that command in their own terminal (`alter-ego store-command <bot>` prints it again; the table below has them all). It prompts for the token, so the token never lands in chat or in shell history. If they paste a token into the chat anyway, don't use it: tell them it is exposed, to revoke it and make a new one. Then run `alter-ego check <bot>`: it confirms whose token it is and saves the account id, which links the bot's commits to its GitHub account.
5. **Access.** For each repository the bot should work in, it needs write access. Offer `alter-ego invite <bot> [owner/repo]`: it invites the bot with the user's own `gh` login and accepts as the bot. It acts on the user's GitHub account, so confirm first. Organization repositories may need an org admin instead.
6. **Optional.** Set the account's display name to match, in the bot's GitHub profile settings.

| OS | Secret store | Store command |
|---|---|---|
| macOS | Keychain | `security add-generic-password -U -s alter-ego/<login> -a <login> -w` |
| Linux, desktop | Secret Service (GNOME Keyring, KWallet, KeePassXC) | `secret-tool store --label='alter-ego: <login>' service alter-ego/<login> account <login>` |
| Linux, headless | pass | `pass insert alter-ego/<login>` |
| anything else | a command that prints the token | `alter-ego add-bot <name> <login> --secret-command '<cmd>'`, e.g. `op read op://Private/<login>/token` |

`--secret NAME` stores the token under another item name than `alter-ego/<login>`. On Linux, `alter-ego doctor` shows which store was found; `secret-tool` needs a desktop session's D-Bus, so on a server over SSH use `pass` or `--secret-command`. `"secret_backend": "keychain" | "secret-service" | "pass"` in the config forces a store. A secret command runs on every push and every gh call in a bot repository, so it should not prompt each time.

**Rotating a token:** the user stores the new one with the same command (on macOS `-U` replaces the old entry), then `alter-ego check <bot>`. **Removing a bot:** `alter-ego remove-bot <bot>`. It refuses while repositories use the bot and lists them, so switch those first or confirm `--force`. Its token stays in the secret store until the user deletes it.
