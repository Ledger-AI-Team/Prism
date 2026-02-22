# Hostinger Manager

## Goal
Manage Hostinger hosting infrastructure via the API.

## Capabilities
- DNS record management (add, update, delete records)
- VPS lifecycle (restart, monitor, scale)
- Docker project deployment via API
- Firewall rule management
- Domain configuration

## API Reference
See the hostinger-manager skill for full endpoint documentation.
API Token is in HOSTINGER_API_TOKEN env var.
VPS ID: 1410865

## Standing Instructions
- Never delete DNS records without explicit confirmation
- Always verify changes after making them
- Log all infrastructure changes
