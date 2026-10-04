# Digest

A recap of what the hourly search found in a window, for the user to read at a fixed time. It reads Jobs, after the proposals sync; no Upwork search, no other writes — automatic mode.

## 1. Sync first

Run the proposals sync (`references/sync.md`) before anything else, whether or not the digest has anything to send, so a card the user has just applied to is not listed as a lead. A sync failure is not a reason to skip the digest. The digest reads no rules page.

## 2. Select

Query `jobs_inbox` (`Status` New, newest `Found` first); take the next page only while the last row is still inside the window. Keep the cards whose `Found` falls in the window, in the config timezone. The window comes from the task prompt: the morning digest covers from the evening digest's hour yesterday to now; the evening one from the morning's hour today to now. `Found` comes back as a UTC instant — convert before comparing.

Nothing left → no push, and the final reply is empty (SKILL.md → automatic mode): not a word about the window or what you checked.

## 3. The message

Only these blocks, in `language` (labels translated, structure kept):

```
# Digest HH:MM · window HH:MM–HH:MM
Cards N · take M · maybe K · connects L

## Take
**1. #<short id> <Title>** — <My $> · <My hours> h · <Complexity> · <Proposals> proposals · <Found HH:MM> · [Upwork →](<Link>) · [Notion →](<card url>)
<one or two short sentences: the gist and the main thing that decides it — 20 words at most>

## Maybe
…
```

`<short id>` is the last six digits of `Job ID`. Numbering runs across both sections; an empty section is left out; within a section sort by `Score` descending, then `My $` descending; a card is exactly two lines, no rules between them. The last line of the message, exactly: `Write "details N" and I will expand the card.`

**Push line**, in `language`, plain text: `Upwork digest: <M> take, <K> maybe` (a zero part left out). Last steps: load `PushNotification` and push the line; then the final reply — the message alone.

## 4. After the digest — live chat

As soon as the user writes in this session, automatic mode ends: answer normally, the format is no longer required, and `references/chat.md` applies. Two things follow directly from the digest:

- **"details N"** or **"details #584350"** → the full card of that item in the hourly message format (`references/hourly.md` §9, one card, no number), from the card's properties and body.
