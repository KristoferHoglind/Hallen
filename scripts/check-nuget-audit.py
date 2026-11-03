#!/usr/bin/env python3
"""Fail CI when NuGet reports vulnerabilities, without relying on CLI exit codes."""
import json
import sys
with open(sys.argv[1], encoding="utf-8") as stream:
    result = json.load(stream)
issues = []
for project in result.get("projects", []):
    for framework in project.get("frameworks", []):
        for package in framework.get("topLevelPackages", []) + framework.get("transitivePackages", []):
            for vulnerability in package.get("vulnerabilities", []):
                issues.append(f"{package['id']} {package.get('resolvedVersion', '')}: {vulnerability.get('severity')} {vulnerability.get('advisoryurl', '')}")
if result.get("logs"):
    for log in result["logs"]:
        if log.get("level", "").lower() in ("error", "warning"):
            issues.append("NuGet audit failed: " + log.get("message", "unknown error"))
if not result.get("projects"):
    issues.append("No projects were audited")
print("\n".join(issues) if issues else "No vulnerable NuGet dependencies reported")
sys.exit(bool(issues))
