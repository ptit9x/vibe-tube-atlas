---
name: git-repo-privacy-audit
description: >-
  Audit a git repository for secrets, API keys, and personal information in both
  the working tree AND the full commit history (including commit author/committer
  metadata), then safely scrub anything found and prevent recurrence. Use before
  making a repo public, after a suspected leak, or when someone asks whether a
  repo exposes secrets or personal data. Framework-agnostic.
---

# Git Repo Privacy Audit & Scrub

Two separate questions, often conflated: **(1) secrets/keys** (credentials — high
severity) and **(2) PII** (emails, phone, names — moderate). Both can hide in
*file content* OR in *commit metadata*. Check all four combinations.

## Part 1 — Audit (read-only)

```bash
# [a] Is a real .env (not .env.example) tracked?
git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.example'   # want: empty

# [b] Secret patterns across ALL history (added or later removed), placeholders excluded
PATS='re_[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{20,}|sk_(live|test)_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|github_pat_|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY'
git log --all -p | grep -aInE "$PATS" | grep -aivE 'xxxx|placeholder|example|your[-_]'

# [c] PII in file content — use FIXED strings and a reliable per-blob check.
#     grep regex '.' matches any char and inflates counts; -F avoids that.
git log --all --oneline -S"person@gmail.com" -- path/to/file   # pickaxe = file-content changes only

# [d] PII in COMMIT METADATA (the one everyone forgets — GitHub shows this publicly):
git log --all --format='author: %an <%ae>' | sort | uniq -c
git log --all --format='commit: %cn <%ce>' | sort | uniq -c

# [e] .env.example must contain only placeholders
git show HEAD:.env.example
```

**Key insight:** a repo's code can be clean while its commit *authorship* leaks a
personal email — because `git log`/GitHub display `author.email`. Always run [d].

**Measurement traps that cause false positives/negatives:**
- `grep 'a.b@x.com'` — `.` is any-char; use `grep -F`.
- `git log -p | grep` counts diff *context* lines and *author* lines, so a string
  present only in metadata shows up as many "hits". Cross-check with pickaxe `-S`
  (file content only) and per-blob `git show <sha>:<path> | grep -F`.
- zsh: `for c in $(git rev-list --all)` splits oddly — prefer `git rev-list --all | while IFS= read -r c`.
- Definitive check: `git show <sha>:<path> > /tmp/f && grep -Fn "STRING" /tmp/f`.

## Part 2 — Scrub (rewrites history → force-push)

`git filter-repo` is best if installed. If not, `git filter-branch` works.

**Scrub PII from FILE content** (replace, don't delete lines — keeps old commits
valid). Use **perl, not `sed -i ''`** — GNU sed on the PATH mis-parses the empty
suffix and silently does nothing. In perl regex, escape `@` as `\@` (arrays
interpolate even in single-quoted `-e`).

```sh
# scrub.sh  (referenced by absolute path so cwd doesn't matter)
if [ -f path/to/file ]; then
  perl -i -pe 's/old\.value\@gmail\.com/redacted\@example.com/g' path/to/file
fi
exit 0
```
```bash
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --tree-filter '/abs/scrub.sh' -- --all
```

**Scrub a personal email from AUTHOR/COMMITTER metadata** → replace with GitHub's
privacy noreply so commits still link to the account (get the numeric id from
`gh api users/<username> --jq .id` → `<id>+<username>@users.noreply.github.com`):

```bash
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "old@gmail.com" ]; then export GIT_AUTHOR_EMAIL="ID+user@users.noreply.github.com"; fi
if [ "$GIT_COMMITTER_EMAIL" = "old@gmail.com" ]; then export GIT_COMMITTER_EMAIL="ID+user@users.noreply.github.com"; fi
' -- --all
```

**Always finish the cleanup** — filter-branch leaves the old commits reachable via
backup + remote-tracking refs, so scans keep "finding" them until you purge:

```bash
git for-each-ref --format='%(refname)' refs/original/ refs/remotes/ | xargs -r -n1 git update-ref -d
git reflog expire --expire=now --all
git gc --prune=now
```

## Part 3 — Verify, then push

```bash
git log --all -p | grep -Fc "STRING"                 # 0
git log --all --format='%ae %ce' | sort -u           # only the safe address(es)
# push the rewritten history; --force-with-lease aborts if the remote moved:
REMOTE=$(git ls-remote <url> refs/heads/main | cut -f1)
git push --force-with-lease=main:$REMOTE <url> main
# confirm on the PUBLIC side (not just local):
gh api repos/<owner>/<repo>/commits --jq '.[].commit.author.email' | sort -u
```

## Part 4 — Prevent recurrence

The personal email in commits comes from local git config. Set it to the noreply:

```bash
git config --global user.email "ID+username@users.noreply.github.com"
# GitHub: Settings → Emails → "Keep my email addresses private" to enforce it.
```

## Before making any repo public — the gate

Run Part 1 [a]–[e]. **If a real secret/key is or ever was committed: rotate it
first** (scrubbing history does not un-leak an exposed credential — assume it's
compromised). Then scrub, verify, and only then flip visibility. Making a repo
public is effectively irreversible (clones/caches during the public window persist).
