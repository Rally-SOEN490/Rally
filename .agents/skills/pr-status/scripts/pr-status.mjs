// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Reports what stands between a pull request and merging: CI checks, conflicts,
// the description, the linked issue, and reviews. Read-only: it never changes GitHub.
//
// Usage, from anywhere in the repository:
//   node .agents/skills/pr-status/scripts/pr-status.mjs [<number>] [--json]
//
// Without a number it uses the pull request for the current branch.
// Exits with 1 when something blocks the merge.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const PR_FIELDS = [
  "number", "title", "url", "state", "isDraft", "author", "body", "headRefName", "headRefOid",
  "mergeable", "mergeStateStatus", "reviewDecision", "closingIssuesReferences", "reviews",
  "statusCheckRollup", "files",
].join(",");
const AI_CHECK = ".agents/skills/ai-checklist/scripts/check.mjs";
const GENERIC = /^(lgtm|looks good( to me)?|approved?|nice( work)?|great( work| job)?|good job|ok(ay)?|ship it|thanks?( you)?|👍|✅)[\s.!:)]*$/i;
const FAILED = new Set(["FAILURE", "CANCELLED", "TIMED_OUT", "ACTION_REQUIRED", "STARTUP_FAILURE", "ERROR"]);
const THREADS_QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) { pullRequest(number: $number) {
    reviewThreads(first: 100) { nodes { isResolved isOutdated path line
      comments(first: 1) { nodes { author { login } body } } } } } } }`;

const blocker = (area, message) => ({ level: "blocker", area, message });
const warning = (area, message) => ({ level: "warning", area, message });
const note = (area, message) => ({ level: "note", area, message });

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }).trim();
}

function jsonLines(text) {
  return text ? text.split("\n").filter(Boolean).map((line) => JSON.parse(line)) : [];
}

function isBot(login, type) {
  return type === "Bot" || /\[bot\]$/i.test(login) || /^copilot/i.test(login);
}

function preview(text, length = 90) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > length ? `${flat.slice(0, length - 1)}…` : flat;
}

function loadPullRequest(number) {
  const pr = JSON.parse(run("gh", ["pr", "view", ...(number ? [number] : []), "--json", PR_FIELDS]));
  const repo = run("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
  const [owner, name] = repo.split("/");
  const comment = '{login: .user.login, type: .user.type, body: .body}';
  pr.inlineComments = jsonLines(run("gh", ["api", `repos/${repo}/pulls/${pr.number}/comments`, "--paginate", "--jq", `.[] | ${comment}`]));
  pr.conversation = jsonLines(run("gh", ["api", `repos/${repo}/issues/${pr.number}/comments`, "--paginate", "--jq", `.[] | ${comment}`]));
  const threads = JSON.parse(run("gh", [
    "api", "graphql", "-f", `query=${THREADS_QUERY}`, "-f", `owner=${owner}`, "-f", `name=${name}`, "-F", `number=${pr.number}`,
  ]));
  pr.threads = threads.data.repository.pullRequest.reviewThreads.nodes;
  pr.issues = pr.closingIssuesReferences.map((issue) =>
    JSON.parse(run("gh", ["issue", "view", String(issue.number), "-R", repo, "--json", "number,title,state,milestone,issueType"])),
  );
  return pr;
}

function checkState(pr) {
  if (pr.state !== "OPEN") return [note("State", `the pull request is ${pr.state.toLowerCase()}`)];
  return pr.isDraft ? [blocker("State", "the pull request is a draft; mark it ready for review")] : [];
}

function checkResult(check) {
  if (check.__typename === "StatusContext") {
    const state = check.state === "SUCCESS" ? "pass" : FAILED.has(check.state) ? "fail" : "pending";
    return { name: check.context, state, url: check.targetUrl };
  }
  if (check.status !== "COMPLETED") return { name: check.name, state: "pending", url: check.detailsUrl };
  return { name: check.name, state: FAILED.has(check.conclusion) ? "fail" : "pass", url: check.detailsUrl };
}

function checkCi(pr) {
  const byName = new Map();
  for (const result of pr.statusCheckRollup.map(checkResult)) {
    const previous = byName.get(result.name);
    if (!previous || result.state === "fail" || (result.state === "pending" && previous.state === "pass")) {
      byName.set(result.name, result);
    }
  }
  const checks = [...byName.values()];
  if (checks.length === 0) return [warning("CI", "no checks have reported yet")];
  return checks.map((check) => {
    if (check.state === "fail") return blocker("CI", `${check.name} failed: ${check.url}`);
    if (check.state === "pending") return blocker("CI", `${check.name} is still running`);
    return note("CI", `${check.name} passed`);
  });
}

function checkBranch(pr) {
  if (pr.state !== "OPEN") return [];
  if (pr.mergeable === "CONFLICTING") return [blocker("Branch", "it has merge conflicts with the base branch")];
  if (pr.mergeStateStatus === "BEHIND") return [warning("Branch", "it is behind the base branch; update it and let CI run again")];
  if (pr.mergeable === "UNKNOWN") return [note("Branch", "GitHub is still checking for conflicts; run again shortly")];
  return [];
}

function section(body, heading) {
  const match = body.match(new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "im"));
  return match ? match[1].replace(/<!--[\s\S]*?-->/g, "").trim() : null;
}

function aiProblems(pr) {
  if (!existsSync(AI_CHECK)) return [warning("Description", `AI sections not checked: ${AI_CHECK} is not on this checkout`)];
  let output;
  try {
    output = run("node", [AI_CHECK, "--body-only", "--pr", String(pr.number), "--json"]);
  } catch (cause) {
    // The checker exits with 1 when it finds errors; its report is still on stdout.
    output = cause.stdout?.toString().trim();
    if (!output) return [warning("Description", `AI sections not checked: ${cause.message.split("\n")[0]}`)];
  }
  return JSON.parse(output).pullRequest.problems.map((problem) =>
    (problem.severity === "error" ? blocker : warning)("Description", `AI sections: ${problem.message}`),
  );
}

function checkDescription(pr) {
  const findings = [];
  for (const heading of ["Summary", "Testing"]) {
    const content = section(pr.body, heading);
    if (!content) findings.push(blocker("Description", `fill in the ${heading} section`));
  }
  const changesScreens = pr.files.some((file) => /^apps\/app\/src\/.+\.tsx$/.test(file.path));
  const screenshots = section(pr.body, "Screenshots?");
  if (changesScreens && !(screenshots && /!\[|<img|https?:\/\//.test(screenshots))) {
    findings.push(warning("Description", "app screens changed but there are no screenshots"));
  }
  return [...findings, ...aiProblems(pr)];
}

function checkIssues(pr) {
  if (pr.issues.length === 0) {
    return [blocker("Issue", "no linked issue; link it in the Development sidebar or write Closes #<number> in the description")];
  }
  return pr.issues.flatMap((issue) => {
    const label = `#${issue.number} ${issue.title}`;
    const findings = [note("Issue", `closes ${label}`)];
    if (issue.state !== "OPEN") findings.push(warning("Issue", `${label} is already closed`));
    if (!issue.milestone) findings.push(warning("Issue", `${label} has no milestone`));
    if (issue.issueType?.name === "User story") findings.push(note("Issue", `record stakeholder signoff on ${label} once it is accepted`));
    return findings;
  });
}

function latestReviews(pr) {
  const latest = new Map();
  for (const review of pr.reviews) {
    const login = review.author.login;
    if (login === pr.author.login || isBot(login) || review.state === "COMMENTED") continue;
    latest.set(login, review);
  }
  return [...latest.values()];
}

function substantiveComments(pr) {
  const fromOthers = (login, type) => login !== pr.author.login && !isBot(login, type);
  const meaningful = (body, minimum) => body && body.trim().length >= minimum && !GENERIC.test(body.trim());
  return [
    ...pr.reviews.filter((r) => fromOthers(r.author.login) && meaningful(r.body, 20)).map((r) => ({ login: r.author.login, body: r.body })),
    ...pr.inlineComments.filter((c) => fromOthers(c.login, c.type) && meaningful(c.body, 1)),
    ...pr.conversation.filter((c) => fromOthers(c.login, c.type) && meaningful(c.body, 20)),
  ];
}

function checkReviews(pr) {
  const findings = [];
  for (const review of latestReviews(pr)) {
    const who = review.author.login;
    if (review.state === "CHANGES_REQUESTED") findings.push(blocker("Reviews", `${who} requested changes`));
    else if (review.state === "APPROVED" && review.commit?.oid && review.commit.oid !== pr.headRefOid) {
      findings.push(warning("Reviews", `${who} approved an earlier commit; ask for another look at the new changes`));
    } else if (review.state === "APPROVED") findings.push(note("Reviews", `approved by ${who}`));
  }
  if (pr.reviewDecision !== "APPROVED" && !findings.some((finding) => finding.level === "blocker")) {
    findings.push(blocker("Reviews", "it still needs an approval from another member"));
  }
  const substantive = substantiveComments(pr);
  if (substantive.length === 0) {
    findings.push(blocker("Reviews", "no review comment with technical content from another member yet; an empty approval or a bot comment does not count (rubric §6)"));
  } else {
    for (const comment of substantive.slice(0, 5)) findings.push(note("Reviews", `${comment.login}: ${preview(comment.body)}`));
  }
  const open = pr.threads.filter((thread) => !thread.isResolved && !thread.isOutdated);
  for (const thread of open) {
    const first = thread.comments.nodes[0];
    findings.push(warning("Reviews", `unresolved thread on ${thread.path}:${thread.line ?? "?"} by ${first?.author?.login}: ${preview(first?.body ?? "")}`));
  }
  return findings;
}

function printReport(pr, findings) {
  const marks = { blocker: "✗", warning: "!", note: "·" };
  console.log(`#${pr.number} ${pr.title}\n${pr.url}`);
  for (const area of ["State", "CI", "Branch", "Description", "Issue", "Reviews"]) {
    const items = findings.filter((finding) => finding.area === area);
    if (items.length === 0) continue;
    console.log(`\n${area}`);
    for (const item of items) console.log(`  ${marks[item.level]} ${item.message}`);
  }
  const blockers = findings.filter((finding) => finding.level === "blocker").length;
  const warnings = findings.filter((finding) => finding.level === "warning").length;
  console.log(blockers === 0 ? `\nReady to merge (${warnings} warning(s)).` : `\nNot ready: ${blockers} blocker(s), ${warnings} warning(s).`);
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const number = args.find((arg) => /^\d+$/.test(arg));
  const unknown = args.filter((arg) => arg !== "--json" && arg !== number);
  if (unknown.length > 0) throw new Error(`Unknown option: ${unknown.join(" ")}`);
  process.chdir(run("git", ["rev-parse", "--show-toplevel"]));
  const pr = loadPullRequest(number);
  const findings = [checkState, checkCi, checkBranch, checkDescription, checkIssues, checkReviews].flatMap((check) => check(pr));
  const ready = pr.state === "OPEN" && !findings.some((finding) => finding.level === "blocker");
  if (json) console.log(JSON.stringify({ number: pr.number, title: pr.title, url: pr.url, ready, findings }, null, 2));
  else printReport(pr, findings);
  return ready ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (cause) {
  console.error(`pr-status: ${cause.message.split("\n")[0]}`);
  process.exitCode = 2;
}
