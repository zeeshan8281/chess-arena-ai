# Browser inspection of the five user-supplied links
As of 2026-10-13. Inspected in Chrome through CUA only, no webfetch. These are external product observations and author reports, not reproduced experiments. User's private Slack excerpt is context, not public evidence; do not republish names, timestamps, or anecdotes from it.

## Sources
Y1 Softmax — https://softmax.com/ | official | public | undated, accessed 2026-10-13 | authority 8 for own workflow.
Y2 Proxy War homepage — https://proxywar.xyz/ and build flow https://proxywar.xyz/build | official | public | undated, accessed 2026-10-13 | authority 8 for own workflow.
Y3 STS2 agent README — https://github.com/mingxuan-he/sts2-agent | official | public | current visible commit dated 2026-09-12 | authority 8 for repository design, not performance.
Y4 STS2 pod design — https://github.com/mingxuan-he/sts2-agent/blob/main/docs/track2-pod-design.md | official | public | design 2026-08-22, build notes 2026-08-22 | authority 8 for documented implementation status.
Y5 Dataset — https://huggingface.co/datasets/mingxuan-he/sts2-agent-runs | inaccessible public 404. README describes private. DROP as evidence about actual dataset contents; cannot inspect. 404 does not prove absence.
Y6 Peter Wang X announcement — https://x.com/BrainsAndTennis/status/2103522861373915244 | community (author announcement) | semi-public (read in signed-in browser) | 2026-09-25 | authority 6; prefer full public article Y7.
Y7 Peter Wang and Nico Christie, Warcraft III as an RL environment — https://pwang724.github.io/wc3env/ | official (project authors) | public | 2026-09-25 | authority 8 for design, 6 for unreplicated results.

## Findings and deep reads
1. Softmax gives a copyable coding-agent instruction, then steps for pairing, building players, learning, and ranks. It advertises SDK/API, replays/logs and analysis bundles. This supports executable onboarding as a design pattern; it does not establish conversion or user demand. [Y1]
2. Proxy War has a visible league, recent match evidence, starter instruction, and seven-step Build guide. It distinguishes Builder (owner), Agent (persistent competitor), Version (uploaded policy and release notes). [Y2]
3. Proxy War Improve explicitly points to episode replays, decision logs including stderr, and scores. It distinguishes fallbackUsed/llmPlannerDegraded diagnostic flags from losing a valid game. New upload is a new version, with a new registry entry rather than overwritten history. No upload was performed. [Y2]
4. STS2 has weight-training and fixed-weight agent tracks. In the latter, persistent notes, skills, context management and harness code can change. Real game state remains outside the agent sandbox, exposed through JSON. README mixes planned labels with later built components; do not describe the whole research loop as finished. [Y3][Y4]
5. Pod design describes server-selected separate train/eval seed pools, serialized observations and legal actions, logs of action attempts including invalid actions, context snapshots, and query records. End-of-document implementation notes explicitly leave restore and evaluation-battery scripts as remaining work. The architecture is a useful specification, not proof of measured self-improvement or a security audit. [Y4]
6. Dataset returned 404. README says private and describes per-decision state/prompt/action and persistent context logs. Those contents were not inspected and must be attributed to README, not reported as dataset findings. [Y3][Y5]
7. Warcraft article describes a Gym-like reset/step API controlling the original licensed game through an injected DLL (offline, specific version), deterministic seeds and replays, partial observations, and no built-in reward. No game or code was installed/run. [Y7]
8. Warcraft authors report good isolated combat but poor full-game performance for their setup. Their narrative exposes concrete failures: target switching, forgetting earlier commitments, latency, and retreat orders cancelling a portal. This motivates failure-focused review and scenario tests; it is not a universal conclusion about any model family. Do not promote author's approximately $5/game, speed, model names, or hardware results as independent measurements. [Y7]
9. The pasted chat's claims about minimum viable model, 8k context, and 24–36h SFT remain anecdotes, not validated limits. Omit them from professional public copy.

## Application inference
Build → evaluate same public cases → inspect replay/errors → change one policy → compare version. Proposed immediate addition: free deterministic public regression suite for local policies, balanced colors, fixed seed list and opponent, honest stopped/error categories, downloadable PGN+JSON and source/config versions. Clearly distinguish public suite from held-out evaluation and hosted community games from controlled comparisons. No claim of automatic learning, fine-tuning, or uploaded-code sandboxing.
