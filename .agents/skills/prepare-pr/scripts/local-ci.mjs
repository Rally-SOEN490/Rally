// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Runs the pull request CI checks locally, in parallel, so you do not have to wait for GitHub.
// The naming patterns and required files are read from the workflows themselves, and any
// workflow step this script does not run locally is listed at the end.
//
// Usage, from anywhere in the repository:
//   node .agents/skills/prepare-pr/scripts/local-ci.mjs [--only <ids>] [--skip <ids>] [--title "<PR title>"] [--list]
//
// Job ids are comma-separated, for example --skip api-tests. Logs go to .agents/local/ci/<time>/.
// Exits with 1 when a job that CI also runs fails. Jobs marked "ahead of CI" only warn.

import { execFileSync, spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WORKFLOWS = ".github/workflows";
const AI_CHECK = ".agents/skills/ai-checklist/scripts/check.mjs";
const API_LOCK = join(tmpdir(), "rally-api-tests.lock");
const LOCK_WAIT_MS = 10 * 60 * 1000;
const ESLINT_CONFIGS = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", ".eslintrc.js", ".eslintrc.json"];
// Workflow steps the jobs below mirror. Anything else in a pull request workflow is reported as not run locally.
const MIRRORED = [/^\s*npm ci\s*$/m, /npm run test:coverage/, /npm run typecheck/, /pattern='\^\(feature/, /pattern='\^RALLY/, /required=\(/];

const JOBS = [
  { id: "naming", label: "Branch name and PR title", check: checkNaming },
  { id: "required-files", label: "Required files", check: checkRequiredFiles },
  { id: "ai-checklist", label: "AI checklist", cwd: ".", command: ["node", [AI_CHECK]] },
  { id: "app-tests", label: "App tests with coverage", cwd: "apps/app", command: ["npm", ["run", "test:coverage"]] },
  { id: "api-typecheck", label: "API type-check", cwd: "apps/api", command: ["npm", ["run", "typecheck"]] },
  { id: "api-tests", label: "API tests with coverage", cwd: "apps/api", command: ["npm", ["run", "test:coverage"]], database: true },
  { id: "app-typecheck", label: "App type-check", ahead: true, cwd: "apps/app", command: ["npx", ["tsc", "--noEmit"]] },
  { id: "app-lint", label: "App lint", ahead: true, cwd: "apps/app", command: ["npx", ["expo", "lint"]], needsEslintConfig: true },
];

function parseArgs(argv) {
  const options = { only: null, skip: [], title: null, list: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === "--list") options.list = true;
    else if (arg === "--only" && value) options.only = argv[++index].split(",");
    else if (arg === "--skip" && value) options.skip = argv[++index].split(",");
    else if (arg === "--title" && value) options.title = argv[++index];
    else throw new Error(`Unknown or incomplete option: ${arg}`);
  }
  return options;
}

function run(command, args) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function pullRequestWorkflows() {
  return readdirSync(WORKFLOWS)
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => ({ file, text: readFileSync(join(WORKFLOWS, file), "utf8") }))
    .filter((workflow) => /^\s*pull_request\b/m.test(workflow.text));
}

// A small line-based reader for `- name:` steps and their `run:` scripts; enough for these workflows.
function runSteps(text) {
  const rows = text.split("\n");
  const steps = [];
  let name = null;
  for (let index = 0; index < rows.length; index += 1) {
    const named = rows[index].match(/^\s*-\s+name:\s*(.+)$/);
    if (named) name = named[1].trim();
    else if (/^\s*-\s+\w+:/.test(rows[index])) name = null;
    const runLine = rows[index].match(/^(\s*)run:\s*(.*)$/);
    if (!runLine) continue;
    let body = runLine[2];
    if (/^[|>][-+]?$/.test(body)) {
      const block = [];
      while (index + 1 < rows.length && (rows[index + 1].trim() === "" || rows[index + 1].search(/\S/) > runLine[1].length)) {
        block.push(rows[++index]);
      }
      body = block.join("\n");
    }
    steps.push({ name: name ?? body.trim().split("\n")[0], body });
  }
  return steps;
}

function findStep(file, stepName) {
  const text = readFileSync(join(WORKFLOWS, file), "utf8");
  const step = runSteps(text).find((candidate) => candidate.name === stepName);
  if (!step) throw new Error(`step "${stepName}" not found in ${file}; update local-ci.mjs`);
  return step.body;
}

function pullRequestTitle(options) {
  if (options.title) return { title: options.title };
  try {
    return { title: run("gh", ["pr", "view", "--json", "title", "--jq", ".title"]) };
  } catch (cause) {
    return { title: null, reason: `no pull request for this branch yet (${cause.message.split("\n")[0]}); pass --title to check one` };
  }
}

async function checkNaming(options) {
  const branchPattern = findStep("branch-pr-naming.yml", "Check branch name").match(/pattern='([^']+)'/)[1];
  const titlePattern = findStep("branch-pr-naming.yml", "Check PR title").match(/pattern='([^']+)'/)[1];
  const branch = run("git", ["branch", "--show-current"]);
  const lines = [];
  let ok = new RegExp(branchPattern).test(branch);
  lines.push(`${ok ? "✓" : "✗"} branch "${branch}" against ${branchPattern}`);
  const { title, reason } = pullRequestTitle(options);
  if (title === null) {
    lines.push(`· title not checked: ${reason}`);
  } else {
    const titleOk = new RegExp(titlePattern).test(title);
    ok &&= titleOk;
    lines.push(`${titleOk ? "✓" : "✗"} title "${title}" against ${titlePattern}`);
  }
  return { ok, output: lines.join("\n") };
}

async function checkRequiredFiles() {
  const body = findStep("repository-check.yml", "Verify required files");
  const list = body.match(/required=\(([\s\S]*?)\)/)[1].split("\n").map((line) => line.trim()).filter(Boolean);
  const missing = list.filter((path) => run("git", ["ls-files", "--", path]) === "");
  const output = missing.length === 0 ? `✓ all ${list.length} required files are tracked` : `✗ missing: ${missing.join(", ")}`;
  return { ok: missing.length === 0, output };
}

function databaseUrl() {
  const env = existsSync("apps/api/.env") ? readFileSync("apps/api/.env", "utf8") : "";
  const match = env.match(/^TEST_DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  return match ? new URL(match[1]) : null;
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = connect({ host, port, timeout: 2000 });
    const finish = (reachable) => {
      socket.destroy();
      resolve(reachable);
    };
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function preflight(job) {
  if (job.cwd && job.cwd !== "." && !existsSync(join(job.cwd, "node_modules"))) {
    return `dependencies are not installed: run npm ci in ${job.cwd}`;
  }
  if (job.needsEslintConfig && !ESLINT_CONFIGS.some((file) => existsSync(join(job.cwd, file)))) {
    // Without a config, `expo lint` asks to create one, which would change files.
    return "skipped: no ESLint config yet (#171)";
  }
  if (!job.database) return null;
  const url = databaseUrl();
  if (!url) return "TEST_DATABASE_URL is missing: copy apps/api/.env.example to apps/api/.env";
  const reachable = await canConnect(url.hostname, Number(url.port || 5432));
  return reachable ? null : `PostgreSQL is not reachable at ${url.host}: start it with docker compose up -d`;
}

function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (cause) {
    return cause.code === "EPERM";
  }
}

// API test runs share the rally_test database, so only one may run at a time across worktrees.
async function acquireLock(path, onWait) {
  const started = Date.now();
  let announced = false;
  for (;;) {
    try {
      mkdirSync(path);
      writeFileSync(join(path, "pid"), String(process.pid));
      return () => rmSync(path, { recursive: true, force: true });
    } catch (cause) {
      if (cause.code !== "EEXIST") throw cause;
    }
    const owner = Number(existsSync(join(path, "pid")) ? readFileSync(join(path, "pid"), "utf8") : 0);
    if (owner && !processAlive(owner)) {
      rmSync(path, { recursive: true, force: true });
      continue;
    }
    if (Date.now() - started > LOCK_WAIT_MS) throw new Error(`another API test run (pid ${owner}) still holds ${path}`);
    if (!announced) onWait(owner);
    announced = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

function runCommand(job, logPath) {
  return new Promise((resolve) => {
    const log = createWriteStream(logPath);
    const [command, args] = job.command;
    const child = spawn(command, args, {
      cwd: job.cwd,
      env: { ...process.env, CI: "true", FORCE_COLOR: "0", NO_COLOR: "1" },
      shell: process.platform === "win32",
    });
    let settled = false;
    const finish = (ok, message) => {
      if (settled) return;
      settled = true;
      log.end(message ? `\n${message}\n` : "");
      resolve({ ok });
    };
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on("error", (cause) => finish(false, cause.message));
    child.on("close", (code) => finish(code === 0, code === 0 ? "" : `exit code ${code}`));
  });
}

async function runJob(job, options, logDir) {
  const started = Date.now();
  const logPath = join(logDir, `${job.id}.log`);
  const problem = await preflight(job);
  if (problem) {
    writeFileSync(logPath, `${problem}\n`);
    const skipped = problem.startsWith("skipped:");
    return { job, status: skipped ? "skipped" : "fail", seconds: 0, logPath, detail: problem };
  }
  let release = null;
  try {
    if (job.database) release = await acquireLock(API_LOCK, (pid) => console.log(`… ${job.id} waiting for another API test run (pid ${pid})`));
    const result = job.check ? await job.check(options) : await runCommand(job, logPath);
    if (job.check) writeFileSync(logPath, `${result.output}\n`);
    return { job, status: result.ok ? "pass" : "fail", seconds: (Date.now() - started) / 1000, logPath };
  } catch (cause) {
    writeFileSync(logPath, `${cause.message}\n`);
    return { job, status: "fail", seconds: (Date.now() - started) / 1000, logPath, detail: cause.message };
  } finally {
    release?.();
  }
}

function warnings() {
  const found = [];
  const ciNode = pullRequestWorkflows().map((workflow) => workflow.text.match(/node-version:\s*['"]?(\d+)/)?.[1]).find(Boolean);
  const localNode = process.versions.node.split(".")[0];
  if (ciNode && ciNode !== localNode) found.push(`CI uses Node ${ciNode}; you are on Node ${localNode}, so results can differ`);
  for (const app of ["apps/app", "apps/api"]) {
    const installed = join(app, "node_modules", ".package-lock.json");
    if (existsSync(installed) && statSync(join(app, "package-lock.json")).mtimeMs > statSync(installed).mtimeMs) {
      found.push(`${app}/package-lock.json changed since the last install; run npm ci in ${app}`);
    }
  }
  return found;
}

function notMirrored() {
  const steps = pullRequestWorkflows().flatMap((workflow) =>
    runSteps(workflow.text).map((step) => ({ ...step, file: workflow.file })),
  );
  const missing = steps.filter((step) => !MIRRORED.some((pattern) => pattern.test(step.body)));
  const ciOnly = pullRequestWorkflows().some((workflow) => /uses:\s*SonarSource\//.test(workflow.text))
    ? ["the SonarQube Cloud scan and quality gate (check them with pr-status after pushing)"]
    : [];
  return [...missing.map((step) => `${step.file}: "${step.name}"`), ...ciOnly];
}

function tail(path, count = 15) {
  return readFileSync(path, "utf8").trimEnd().split("\n").slice(-count).map((line) => `      ${line}`).join("\n");
}

function printSummary(results, logDir) {
  const marks = { pass: "✓", fail: "✗", skipped: "·" };
  console.log(`\nLocal CI (logs in ${logDir})`);
  for (const result of results) {
    const ahead = result.job.ahead ? " (ahead of CI)" : "";
    const time = result.seconds ? ` ${result.seconds.toFixed(1)}s` : "";
    console.log(`  ${marks[result.status]} ${result.job.id}${ahead}${time}${result.detail ? `: ${result.detail}` : ""}`);
  }
  for (const result of results.filter((item) => item.status === "fail" && !item.detail)) {
    console.log(`\n  ${result.job.id}, last lines of ${result.logPath}:\n${tail(result.logPath)}`);
  }
  for (const warning of warnings()) console.log(`\n! ${warning}`);
  const missing = notMirrored();
  if (missing.length > 0) console.log(`\nNot run locally:\n${missing.map((item) => `  - ${item}`).join("\n")}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  process.chdir(run("git", ["rev-parse", "--show-toplevel"]));
  const jobs = JOBS.filter((job) => (!options.only || options.only.includes(job.id)) && !options.skip.includes(job.id));
  if (options.list) {
    for (const job of JOBS) console.log(`${job.id}: ${job.label}${job.ahead ? " (ahead of CI)" : ""}`);
    return 0;
  }
  const logDir = join(".agents", "local", "ci", new Date().toISOString().replace(/[:.]/g, "-"));
  mkdirSync(logDir, { recursive: true });
  console.log(`Running ${jobs.map((job) => job.id).join(", ")} in parallel…`);
  const results = await Promise.all(jobs.map(async (job) => {
    const result = await runJob(job, options, logDir);
    console.log(`${{ pass: "✓", fail: "✗", skipped: "·" }[result.status]} ${job.id}`);
    return result;
  }));
  printSummary(results, logDir);
  const failed = results.filter((result) => result.status === "fail" && !result.job.ahead);
  console.log(failed.length === 0 ? "\nResult: CI checks pass locally." : `\nResult: ${failed.length} CI check(s) failed.`);
  return failed.length === 0 ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (cause) => {
    console.error(`local-ci: ${cause.message}`);
    process.exitCode = 2;
  },
);
