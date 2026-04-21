import { spawn } from "node:child_process";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`multica command failed: ${stderr || stdout}`));
    });
  });
}

async function main() {
  const branch = process.env.GITHUB_REF_NAME ?? "unknown-branch";
  const sha = process.env.GITHUB_SHA ?? "unknown-sha";
  const repo = process.env.GITHUB_REPOSITORY ?? "unknown-repo";
  const assignee = process.env.MULTICA_ASSIGNEE ?? "";

  const title = `[auto-fix] mock test failed on ${branch}`;
  const description = [
    "This is an automatic issue created by GitHub Actions.",
    `repository: ${repo}`,
    `branch: ${branch}`,
    `commit: ${sha}`,
    "reason: mock test failed"
  ].join("\n");

  const args = [
    "issue",
    "create",
    "--title",
    title,
    "--description",
    description,
    "--priority",
    "high",
    "--output",
    "json"
  ];

  if (assignee) {
    args.push("--assignee", assignee);
  }

  const result = await runCommand("multica", args);
  console.log(result.stdout);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
