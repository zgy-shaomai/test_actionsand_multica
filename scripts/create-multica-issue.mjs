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

function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

async function main() {
  const branch = process.env.GITHUB_REF_NAME ?? "unknown-branch";
  const sha = process.env.GITHUB_SHA ?? "unknown-sha";
  const repo = process.env.GITHUB_REPOSITORY ?? "unknown-repo";
  const repoName = repo.split("/").pop() ?? "unknown-repo";
  const assignee = process.env.MULTICA_ASSIGNEE ?? "";
  const errorPath = process.env.ISSUE_ERROR_PATH ?? "scripts/mock-test.mjs";
  const failureReason = process.env.ISSUE_REASON ?? "模拟测试失败";

  const title = truncate(
    `[CI失败][${repoName}][${branch}] ${failureReason}（错误信息路径：${errorPath}）`,
    180
  );
  const description = [
    "这是由 GitHub Actions 自动创建的失败任务。",
    `项目仓库：${repo}`,
    `分支：${branch}`,
    `提交：${sha}`,
    `失败原因：${failureReason}`,
    `错误信息路径：${errorPath}`,
    "处理建议：请先检查失败路径中的错误信息，再决定是否进入自动修复。"
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
