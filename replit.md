# Overview

The Permit Orchestrator is a contractor-side permit management application designed specifically for Maryland jurisdictions (Gaithersburg, Rockville, and Montgomery County). The system automates the complete permit workflow from pre-check validation through inspection scheduling, with specialized support for multi-jurisdictional requirements and portal automation.

This is a full-stack TypeScript application built as a monorepo with a React frontend, Express backend, and PostgreSQL database. The system uses a modular "Jurisdiction Pack" (JP) architecture to handle different AHJ (Authority Having Jurisdiction) rules and requirements.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 + TypeScript**: Modern React with strict typing
- **Vite Build System**: Fast development server and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: React Query (@tanstack/react-query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **PWA Capabilities**: Service worker support for offline functionality

### Backend Architecture
- **Node.js + Express**: RESTful API server with TypeScript
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Magic link email-based authentication with session management
- **Job Processing**: Background job queue system for portal automation tasks
- **Validation**: Zod schemas for request/response validation

### Data Architecture
- **Multi-tenant Design**: Organization-scoped data model with role-based access
- **Audit Trail**: Comprehensive event logging with append-only events table
- **Location Resolution**: Automatic AHJ detection based on geographic location
- **Document Management**: File upload and attachment handling system

### Jurisdiction Pack (JP) System
- **Modular AHJ Support**: Pluggable system for different jurisdiction rules
- **Rule Engine**: Fee calculations, document requirements, and workflow rules
- **Portal Automation**: Playwright-based automation for permit submission
- **Form Templates**: PDF generation and form filling capabilities

### Authentication & Authorization
- **Magic Link Authentication**: Email-based passwordless login
- **Role-based Access**: Owner, staff, and read-only roles
- **Session Management**: Token-based sessions with expiration
- **Multi-tenant Security**: Organization-scoped data access

### Background Processing
- **Job Queue System**: Automated permit submission and status polling
- **Portal Integration**: Automated interaction with jurisdiction portals
- **Status Tracking**: Real-time permit status updates
- **Inspection Scheduling**: Automated inspection appointment management

## External Dependencies

### Database & Storage
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations and migrations
- **File Storage**: Planned S3-compatible storage for documents and screenshots

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built accessible React components based on Radix UI
- **Radix UI Primitives**: Headless UI components for complex interactions
- **Lucide Icons**: Comprehensive icon library

### Development & Build Tools
- **TypeScript**: Strict typing across frontend and backend
- **Vite**: Frontend development server and build tool
- **ESBuild**: Backend bundling for production
- **React Query**: Server state management and caching

### Planned Integrations
- **Email Service**: Magic link delivery (SendGrid/AWS SES)
- **Portal Automation**: Playwright for jurisdiction portal interaction
- **PDF Processing**: pdf-lib for form filling and document generation
- **Image Processing**: Sharp for image optimization
- **Queue System**: Redis + BullMQ for production job processing

### Jurisdictional Support
- **Maryland Jurisdictions**: 
  - City of Gaithersburg (incorporated)
  - City of Rockville (incorporated) 
  - Montgomery County DPS (unincorporated areas including Germantown)
- **Extensible Design**: Architecture supports adding additional jurisdictions through the JP system