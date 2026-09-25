# Digest

A recap of what the hourly search found in a window, for the user to read at a fixed time. It reads Jobs only: no Upwork search, no writes anywhere, no Notion changes — automatic mode.

## 1. Read first

Fetch **Search rules** (for the assessment vocabulary and any format the user defined) and **Field notes**. Rules unreadable → send nothing, stop.

## 2. Select

Query `jobs_inbox` (it is already `Status` New, newest first; page while `has_more`). Keep the cards whose `Found` falls in the window, in the config timezone. The window comes from the task prompt: the morning digest covers from the evening digest's hour yesterday to now; the evening one from the morning's hour today to now. `Found` comes back as a UTC instant — convert before comparing.

Applied and Skipped cards are never in a digest, even inside the window: the user has already decided on them. Reading `Status` on every card is the filter, not decoration — if a card in the view is not New, it does not go in.

Nothing left → the final reply is empty (SKILL.md → automatic mode): not a word about the window or what you checked.

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

## 4. After the digest — live chat

As soon as the user writes in this session, automatic mode ends: answer normally, the format is no longer required, and `references/chat.md` applies. Two things follow directly from the digest:

- **"details N"** or **"details #584350"** → the full card of that item in the hourly message format (`references/hourly.md` §8, one card, no number), from the card's properties and body.
- **A conversation about a specific posting starts from fresh data**: `find_jobs` `get` first, then talk. The card is a snapshot; proposals, hires and the connects price have moved since.
