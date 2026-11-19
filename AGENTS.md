# Agent rules for paltuu-nextjs

Read [CLAUDE.md](CLAUDE.md) before doing anything in this repo. Its rules apply
to every agent, not only Claude:

- Agents never merge pull requests or push to `main`. People merge by hand,
  unless their own message to the agent contains the exact words `AAWAIZ merge`.
- Every PR has a `Migrations:` line. A PR that needs a database change is never
  merged until it has run on production and that is said on the PR. Shuja runs
  and confirms it for the team's PRs; on Aawaiz's own PRs, Aawaiz (or the agent
  he asked) runs and confirms it, with no review from Shuja.
