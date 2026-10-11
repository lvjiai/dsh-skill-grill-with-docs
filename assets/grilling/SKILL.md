---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Put the whole frontier to the user in **one `ask_user_question` call**: that call is the round, it carries every frontier question at once, and its blocking wait is the pause before the next round.

Each question in that call carries:

- `id` — the question's number and a short slug (`q1-settlement-boundary`), so the answer stays paired with the question.
- `header` — the question title.
- `question` — the body, however many paragraphs it needs.
- `options` — only when the question is genuinely a choice. Your recommended answer goes **first**, with `(Recommended)` appended to its label; then the alternatives you actually weighed, each `description` saying what it costs. Set `multi_select` when more than one may be picked.

The user can answer by typing as well as by picking, so give an open question no `options` at all: a decision that is not a menu should not be dressed up as one, and filler options only make the round look thorough.

If `ask_user_question` is unavailable — a runtime-owned sub-agent is refused with `DELEGATED_CALLER` — fall back to the same round as a numbered message, each question followed by `➡️ <your recommended answer>`, worded so "yes" accepts it.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
