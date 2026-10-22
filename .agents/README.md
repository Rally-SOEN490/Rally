# Agent files

Shared repository instructions live in [AGENTS.md](../AGENTS.md). Codex, GitHub Copilot, and Claude Code (v2.1.277 or later) read it automatically.

## Shared skills

`skills/` holds skills that any team member can use with a coding agent:

| Skill | Use it to |
| --- | --- |
| [ai-checklist](skills/ai-checklist/SKILL.md) | Check a branch, its commits, and its pull request against the AI-use rules, and fill in missing declarations |
| [review-pr](skills/review-pr/SKILL.md) | Review a pull request against Rally's rules before commenting |

Codex reads skills from `.agents/skills/`. Claude Code reads them from `.claude/skills/`, which contains links to the folders here. On Windows, enable symbolic links in Git (`git config core.symlinks true` with Developer Mode on) before cloning, or the links check out as plain files.

To add a skill, create `skills/<name>/SKILL.md` with `name` and `description` frontmatter, then link it for Claude Code:

```bash
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```

## Personal files

`local/` contains personal notes, temporary plans, and scratch output. Git ignores this directory. It is a project convention, not an automatically loaded instruction location. Create it when needed:

```bash
mkdir -p .agents/local
```

Keep personal skills and instructions outside the repository, for example in `~/.agents/skills/` for Codex and `~/.claude/skills/` or `~/.claude/CLAUDE.md` for Claude Code. A `CLAUDE.md` or `CLAUDE.local.md` inside the repository stops Claude Code from loading `AGENTS.md`.
