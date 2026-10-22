// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Checks a branch against Rally's AI-use rules in CONTRIBUTING.md:
// source-file declarations, commit acknowledgments, and the pull request's AI sections.
//
// Usage, from anywhere in the repository:
//   node .agents/skills/ai-checklist/scripts/check.mjs [--base <ref>] [--pr <number> | --pr-body <file> [--branch <name>]] [--json]
//   node .agents/skills/ai-checklist/scripts/check.mjs --all [--json]
//
// The default mode checks files changed since the merge base with origin/main (including
// uncommitted and untracked files) and the branch's commits. --all checks every tracked
// source file and reports declaration coverage. Exits with 1 when an error is found.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const LEVELS = [
  "No substantial AI-generated code",
  "Below 50% AI-generated",
  "50% or more AI-generated",
];
const SOURCE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
// Generated, vendored, and build output files are excluded by rubric §8.
const EXCLUDED = [
  /(^|\/)node_modules\//,
  /(^|\/)(generated|dist|build|coverage|\.expo|ios|android)\//,
  /(^|\/)prisma\/migrations\//,
  /\.d\.ts$/,
];
const HEADER_LINES = 15;
const NOTICE = /Copyright \(c\) 20\d\d Rally\. All rights reserved\./;
const OLD_NOTICE = /SPDX-License-Identifier: MIT|Copyright \(c\) 20\d\d Rally contributors/;
const DECLARATION = /AI contribution:\s*(.*?)\s*(?:\*\/)?\s*$/;
const ACK_LINE = /^\s*AI(?:[- ]use)?(?: acknowledg(?:e)?ment)?\s*:\s*\S/im;
const ACK_HEADING = /^#+\s*AI[- ]use acknowledg(?:e)?ment\s*\n+\s*[^\s#]/im;
const FIELD_LABELS = ["AI-assisted source files", "Verification evidence"];
const TEMPLATE_HINTS = new Set([
  "Name the tool and its contribution, or write `None`.",
  "For feature/fix PRs, select one level for the implementation introduced or substantially changed:",
]);

const error = (message) => ({ severity: "error", message });
const warning = (message) => ({ severity: "warning", message });

function parseArgs(argv) {
  const options = { base: null, pr: null, prBody: null, branch: null, all: false, json: false, help: false };
  const valueOptions = { "--base": "base", "--pr": "pr", "--pr-body": "prBody", "--branch": "branch" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") options.all = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (valueOptions[arg] && argv[index + 1]) options[valueOptions[arg]] = argv[++index];
    else throw new Error(`Unknown or incomplete option: ${arg}`);
  }
  return options;
}

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).trim();
}

function lines(text) {
  return text ? text.split("\n").filter(Boolean) : [];
}

function isApplicable(path) {
  return SOURCE_EXTENSIONS.test(path) && !EXCLUDED.some((pattern) => pattern.test(path)) && existsSync(path);
}

function resolveMergeBase(base) {
  const candidates = base ? [base] : ["origin/main", "main"];
  const failures = [];
  for (const ref of candidates) {
    try {
      return { ref, commit: run("git", ["merge-base", "HEAD", ref]) };
    } catch (cause) {
      failures.push(`${ref}: ${cause.message.split("\n")[0]}`);
    }
  }
  throw new Error(`Cannot find a merge base (${failures.join("; ")}). Pass --base <ref>.`);
}

function changedFiles(mergeBase) {
  const changed = lines(run("git", ["diff", "--name-only", "--diff-filter=AMR", mergeBase]));
  const untracked = lines(run("git", ["ls-files", "--others", "--exclude-standard"]));
  return [...new Set([...changed, ...untracked])].filter(isApplicable).sort();
}

function checkFile(path) {
  const header = readFileSync(path, "utf8").split("\n").slice(0, HEADER_LINES);
  const problems = [];
  if (header.some((line) => OLD_NOTICE.test(line))) {
    problems.push(error("replace the old MIT notice with the Rally license notice"));
  } else if (!header.some((line) => NOTICE.test(line))) {
    problems.push(error("add the license notice"));
  }
  const match = header.map((line) => line.match(DECLARATION)).find(Boolean);
  const level = match && LEVELS.includes(match[1]) ? match[1] : null;
  if (!match) problems.push(error("add an AI contribution declaration"));
  else if (!level) problems.push(error(`use one of the three levels exactly (found "${match[1]}")`));
  return { path, level, problems };
}

function hasAcknowledgment(text) {
  return ACK_LINE.test(text) || ACK_HEADING.test(text);
}

function checkCommits(mergeBase) {
  const raw = run("git", ["log", "--no-merges", "--format=%h%x1f%s%x1f%B%x1e", `${mergeBase}..HEAD`]);
  return raw
    .split("\x1e")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body] = entry.split("\x1f");
      const problems = [];
      if (!hasAcknowledgment(body)) problems.push(error("no AI-use acknowledgment line"));
      if (!/#\d+/.test(body)) problems.push(warning("no issue reference such as Refs #123"));
      return { hash, subject, problems };
    });
}

function readPullRequest(options) {
  if (options.prBody) {
    const branch = options.branch || run("git", ["branch", "--show-current"]);
    return { label: options.prBody, body: readFileSync(options.prBody, "utf8"), branch };
  }
  if (!options.pr) return null;
  const data = JSON.parse(run("gh", ["pr", "view", options.pr, "--json", "number,body,headRefName"]));
  return { label: `#${data.number}`, body: data.body, branch: data.headRefName };
}

function section(body, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "im");
  const match = body.match(pattern);
  return match ? match[1] : null;
}

function meaningful(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !TEMPLATE_HINTS.has(line));
}

function fieldValue(text, label) {
  const rows = text.split("\n");
  const start = rows.findIndex((row) => row.trim().startsWith(label));
  if (start === -1) return "";
  const colon = rows[start].indexOf(":");
  const collected = [colon === -1 ? "" : rows[start].slice(colon + 1)];
  for (const row of rows.slice(start + 1)) {
    if (FIELD_LABELS.some((other) => row.trim().startsWith(other))) break;
    collected.push(row);
  }
  return meaningful(collected.join("\n")).join("\n");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkedLevels(contribution) {
  return LEVELS.filter((level) =>
    new RegExp(`^\\s*[-*]\\s*\\[[xX]\\]\\s*${escapeRegExp(level)}\\s*$`, "m").test(contribution),
  );
}

function checkContribution(body, files) {
  const contribution = section(body, "AI contribution");
  if (contribution === null) return [error("add the AI contribution section from the PR template")];
  const checked = checkedLevels(contribution);
  if (checked.length !== 1) return [error(`tick exactly one AI contribution level (found ${checked.length})`)];
  const problems = [];
  if (checked[0] !== LEVELS[0]) {
    if (!fieldValue(contribution, FIELD_LABELS[0])) problems.push(error("list the AI-assisted source files"));
    if (!fieldValue(contribution, FIELD_LABELS[1])) problems.push(error("describe the verification evidence"));
  }
  const declaredMore = files.filter((file) => file.level && file.level !== LEVELS[0]).map((file) => file.path);
  if (checked[0] === LEVELS[0] && declaredMore.length > 0) {
    problems.push(warning(`the PR declares no substantial AI code, but these files declare more: ${declaredMore.join(", ")}`));
  }
  return problems;
}

function checkPullRequest(pullRequest, files) {
  const problems = [];
  const acknowledgment = section(pullRequest.body, "AI-use acknowledgment");
  if (acknowledgment === null || meaningful(acknowledgment).length === 0) {
    problems.push(error("fill in the AI-use acknowledgment, or write None"));
  }
  if (/^(feature|bug)\//.test(pullRequest.branch)) problems.push(...checkContribution(pullRequest.body, files));
  return problems;
}

function collect(options) {
  if (options.all) {
    const files = lines(run("git", ["ls-files"])).filter(isApplicable).sort().map(checkFile);
    return { mode: "all", files, commits: [], pullRequest: null };
  }
  const mergeBase = resolveMergeBase(options.base);
  const files = changedFiles(mergeBase.commit).map(checkFile);
  const pullRequest = readPullRequest(options);
  return {
    mode: "branch",
    base: mergeBase.ref,
    mergeBase: mergeBase.commit.slice(0, 7),
    branch: run("git", ["branch", "--show-current"]),
    files,
    commits: checkCommits(mergeBase.commit),
    pullRequest: pullRequest && { label: pullRequest.label, problems: checkPullRequest(pullRequest, files) },
  };
}

function allProblems(result) {
  return [
    ...result.files.flatMap((file) => file.problems),
    ...result.commits.flatMap((commit) => commit.problems),
    ...(result.pullRequest ? result.pullRequest.problems : []),
  ];
}

function formatProblems(problems) {
  const mark = problems.some((problem) => problem.severity === "error") ? "✗" : "!";
  return `${mark} ${problems.map((problem) => problem.message).join("; ")}`;
}

function printFiles(result) {
  const declared = result.files.filter((file) => file.level).length;
  const total = result.files.length;
  const percent = total === 0 ? 100 : Math.round((declared / total) * 100);
  console.log(`\nSource files: ${declared} of ${total} have a valid declaration (${percent}%)`);
  for (const file of result.files) {
    if (file.problems.length > 0) console.log(`  ${file.path}: ${formatProblems(file.problems)}`);
    else if (result.mode === "branch") console.log(`  ${file.path}: ✓ ${file.level}`);
  }
}

function printReport(result) {
  if (result.mode === "branch") {
    console.log(`AI checklist for ${result.branch || "HEAD"} against ${result.base} (merge base ${result.mergeBase})`);
  } else {
    console.log("AI checklist for every tracked source file");
  }
  printFiles(result);
  if (result.mode === "branch") {
    console.log(`\nCommits: ${result.commits.length}`);
    for (const commit of result.commits) {
      const status = commit.problems.length > 0 ? formatProblems(commit.problems) : "✓";
      console.log(`  ${commit.hash} ${commit.subject}: ${status}`);
    }
  }
  if (result.pullRequest) {
    console.log(`\nPull request ${result.pullRequest.label}`);
    const problems = result.pullRequest.problems;
    console.log(problems.length > 0 ? problems.map((problem) => `  ${formatProblems([problem])}`).join("\n") : "  ✓");
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(3, 13).join("\n"));
    return 0;
  }
  process.chdir(run("git", ["rev-parse", "--show-toplevel"]));
  const result = collect(options);
  const problems = allProblems(result);
  const errors = problems.filter((problem) => problem.severity === "error").length;
  if (options.json) {
    console.log(JSON.stringify({ ...result, errors, warnings: problems.length - errors }, null, 2));
  } else {
    printReport(result);
    console.log(`\nResult: ${errors} error(s), ${problems.length - errors} warning(s).`);
  }
  return errors > 0 ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (cause) {
  console.error(`ai-checklist: ${cause.message}`);
  process.exitCode = 2;
}
