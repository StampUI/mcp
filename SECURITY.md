# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Email **support@stampui.com** with a description, reproduction steps, and impact. You will get an acknowledgement within a few days; please allow a reasonable window for a fix before public disclosure.

## Scope

- `stamp_block` writes files into the user's project. Anything that could make it write outside the given `targetDir`, or execute code at install time, is in scope and high priority.
- License key (`STAMPUI_TOKEN`) handling is in scope: the key must only ever be sent to the configured registry over HTTPS.
- Issues in the registry service itself (stampui.com) can be reported to the same address.
