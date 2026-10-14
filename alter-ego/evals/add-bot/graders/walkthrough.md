---
type: llm
focus: last_message
---
The reply, in Russian, walks the user through what is left for the new bot helper (GitHub acme-helper-bot):
- a classic personal access token for that account with the repo scope;
- a command the user runs in their own terminal that stores the token in the secret store and prompts for it (on macOS `security add-generic-password ... -s alter-ego/acme-helper-bot ... -w`), so the token never goes into the chat;
- that it will verify the token afterwards (alter-ego check helper) or that the user should say when it is stored.
It does not ask the user to paste the token into the chat. Mentioning write access to repositories is a plus, not required.
