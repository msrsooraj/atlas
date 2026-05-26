# Security Policy

## Scope

Atlas is a fully local, browser-only application. It stores all data in IndexedDB on your device. There is no server, no API, no accounts, and no data transmission.

Security concerns most relevant to this project:
- XSS vulnerabilities in the exported static HTML
- Local data handling (blob storage, file imports)
- Dependency vulnerabilities

## Reporting a Vulnerability

Do **not** open a public issue for security vulnerabilities.

Report privately via GitHub's [Security Advisories](https://github.com/msrsooraj/atlas/security/advisories/new) feature.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

You can expect an initial response within 7 days.

## Supported Versions

Only the latest version on the `main` branch is actively maintained.
