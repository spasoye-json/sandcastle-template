export const config = {
  repo: process.env.GH_REPO ?? "OWNER/REPO",
  base: process.env.BASE_BRANCH ?? "main",
  testDir: process.env.TEST_DIR ?? ".",
  gateCommands: ["npm run lint", "npm test"],
  queueLabel: "ready-for-agent",
  workingLabel: "claude-working",
  humanLabel: "ready-for-human",
  localBranchPrefix: "sandcastle/issue-",
};
