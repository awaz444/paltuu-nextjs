# Agent rules for paltuu-nextjs

Read [CLAUDE.md](CLAUDE.md) before doing anything in this repo. Its rules apply
to every agent, not only Claude:

- Agents never merge pull requests or push to `main`. People merge by hand,
  unless their own message to the agent contains the exact words `AAWAIZ merge`.
- Every PR has a `Migrations:` line. A PR that needs a database change is never
  merged until Shuja has run it on production and said so on the PR.
