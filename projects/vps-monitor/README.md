# VPS Monitor

## Goal
Keep this VPS healthy and running smoothly.

## Responsibilities
- Monitor Docker container health (restart crashed containers)
- Track disk usage (alert if > 80%)
- Track memory usage (alert if > 85%)
- Check for and apply security updates weekly
- Review Docker logs for errors
- Monitor OpenClaw gateway uptime

## Tools
- Use the hostinger-manager skill for API-based monitoring
- Use docker-essentials skill for container management
- Use exec tool for system commands (df, free, top, journalctl)

## Reporting
- Report issues via WhatsApp if urgent
- Log routine checks to this directory
