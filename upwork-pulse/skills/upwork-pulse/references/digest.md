# Digest

A recap of what the hourly search found in a window, for the user to read at a fixed time. It reads Jobs, after the proposals sync; no Upwork search, no other writes — automatic mode.

## 1. Sync first

Run the proposals sync (`references/sync.md`) before anything else, whether or not the digest has anything to list, so a card the user has just applied to is not listed as a lead. A sync failure is not a reason to skip the digest: it goes in the Log as a `Problems` line. The digest reads no rules page.

## 2. Select

Query `jobs_inbox` (`Status` New, newest `Found` first); take the next page only while the last row is still inside the window. Keep the cards whose `Found` falls in the window, in the config timezone. The window comes from the task prompt: the morning digest covers from the evening digest's hour yesterday to now; the evening one from the morning's hour today to now. `Found` comes back as a UTC instant — convert before comparing.

Nothing left → no push; the report is the header, the counts line (`Cards 0`) and the Log (§3).

## 3. The report

Only these blocks, in `language` (labels translated, structure kept):

```
# Digest HH:MM · window HH:MM–HH:MM
Cards N · take M · maybe K · connects L   ← L: the sum of the listed cards' Connects

## Take
**1. #<short id> <Title>** — <My $: `$45/hr` for hourly, `$1,500 fixed` for fixed> · <My hours> h · <Complexity> · <Proposals> proposals · <Found HH:MM> · [Upwork →](<Link>) · [Notion →](<card url>)
<one or two short sentences: the gist and the main thing that decides it — 20 words at most>

## Maybe
…
```

`<short id>` is the last six digits of `Job ID`. Numbering runs across both sections; an empty section is left out; within a section sort by `Score` descending, then `My $` descending; a card is exactly two lines, no rules between them. After the cards, exactly: `Write "details N" and I will expand the card.` (only when there are cards). Then the Log, last:

```
## Log
- Sync: <n> proposal(s) written — #<short id>, …[; <k> new card(s)][; <m> already in place]   ← nothing new: `Sync: nothing new`
- Problems: <one line per problem: where, what failed, what is left undone>
```

`Sync` is always there (SKILL.md → *Automatic mode*: one line per process, only for what happened); `Problems` only when a call failed or was blocked — a sync that failed and left its watermark is one.

**Push line**, in `language`, plain text: `Upwork digest: <M> take, <K> maybe` (a zero part left out). Last steps: with cards, load `PushNotification` and push the line; then the final reply — the report alone, its first characters `# Digest`. No cards → no push, the report all the same.

## 4. After the digest — live chat

As soon as the user writes in this session, automatic mode ends and `references/chat.md` applies — "details N" for a card of this digest included.

Off limits here: writing to Upwork; `PROCESSED_UNTIL`; every Notion write but the sync's.
