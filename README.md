# Permit Orchestrator

A contractor-side permit orchestrator for Maryland jurisdictions with automated workflow from pre-check to inspections.

## Features

- **Multi-Jurisdictional Support**: Gaithersburg, Rockville, and Montgomery County (Germantown)
- **Automated Workflows**: Pre-check → Auto-Package → Submit/Track → Inspections
- **Magic Link Authentication**: Secure email-based authentication
- **Multi-Tenant**: Organization-based access control
- **Document Management**: File upload and attachment handling
- **Real-time Status Tracking**: Portal automation and status polling
- **Inspection Scheduling**: Automated inspection management
- **Audit Trail**: Complete event logging for compliance

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for development and building
- Tailwind CSS + shadcn/ui components
- React Query for data management
- Wouter for routing
- PWA capabilities with service worker

### Backend
- Node.js with Express and TypeScript
- PostgreSQL with Drizzle ORM
- Jurisdiction Pack (JP) system for AHJ rules
- Background job processing
- Magic link authentication
- Comprehensive audit logging

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
