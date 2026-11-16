// Railway Infrastructure as Code for `chain-agnostic-rpc-proxy`.
//
// Replaces the deprecated Config as Code file (`railway.toml`), which Railway stops
// reading on 2026-12-01. Docs: https://docs.railway.com/infrastructure-as-code
//
// This file is a *partial*: it manages only `chain-agnostic-rpc-proxy` in the shared
// `defi-swap-agg` project. Other resources (`definitive_flash_api`, `frontend`, `Postgres`)
// are managed separately and are intentionally NOT declared here.
//
// Workflow (from the repo root, after `railway link` to defi-swap-agg / production):
//   railway config migrate cutover --service chain-agnostic-rpc-proxy  # clears /railway.toml
//   railway config plan --verbose
//   railway config apply
// Do not delete railway.toml until cutover has run.
import { defineRailway, github, project, service } from "railway/iac";

export const partial = "chain-agnostic-rpc-proxy";

export default defineRailway(() => {
  const rpcProxy = service("chain-agnostic-rpc-proxy", {
    source: github("phon3/chain-agnostic-rpc-proxy", {
      branch: "main",
      checkSuites: false,
    }),
    build: {
      builder: "DOCKERFILE",
      buildEnvironment: "V3",
      dockerfilePath: "Dockerfile",
    },
    start: "node index.js",
    healthcheck: "/health",
    healthcheckTimeout: 100,
    replicas: { sfo: 1 },
    deploy: {
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10,
    },
  });

  return project("defi-swap-agg", {
    resources: [rpcProxy],
  });
});
