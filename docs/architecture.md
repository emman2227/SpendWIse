# SpendWise Architecture

## Overview

SpendWise is organized as a TypeScript monorepo that supports web and mobile clients, a backend API, and a separate AI analytics layer. The structure is designed to stay beginner-friendly while still following production-aware boundaries.

## Architectural Layers

### 1. Presentation Layer

Location:

- `apps/web`
- `apps/mobile`

Responsibilities:

- user interaction
- auth screens and dashboard surfaces
- expense entry and list views
- budget and insight presentation
- client-side query orchestration

Shared dependencies:

- `@spendwise/shared` for contracts, schemas, helpers
- `@spendwise/ui` for reusable tokens and primitives

### 2. Application Layer

Location:

- `apps/api`

Responsibilities:

- auth flow orchestration
- expense processing
- budgeting rules
- analytics orchestration
- validation, guards, error handling, logging
- API versioning and health checks

Pattern:

- NestJS modules act as the application-layer entry points for each feature
- controllers handle transport concerns
- services coordinate business use cases
- repositories isolate persistence access

### 3. Data Layer

Location:

- `apps/api/src/modules/**/**.schema.ts`
- `apps/api/src/modules/**/**.repository.ts`
- `apps/api/src/modules/database/seeds`

Responsibilities:

- MongoDB models and collection structure
- persistence logic and repository boundaries
- starter seed data for categories
- future extension point for migrations, indexes, and reporting collections

### 4. AI Analytics Layer

Location:

- `packages/ai`

Responsibilities:

- spending summaries
- anomaly detection
- forecasting
- user-facing insights
- provider abstraction for future Gemini integration

Design:

- `BaseAnalyticsProvider` defines the provider contract
- `MockAiProvider` gives realistic starter behavior
- `AnalyticsService` composes provider behavior into domain outputs
- the API analytics module persists generated insights and forecasts

## Request Flow

1. Web or mobile sends a request to `/api/v1/...`
2. NestJS controller validates input with shared Zod schemas
3. Guarded routes verify JWT access tokens
4. Application services coordinate use-case logic
5. Repositories read and write MongoDB via Mongoose models
6. Analytics requests can call into `@spendwise/ai`
7. A response interceptor wraps successful payloads in a consistent envelope

## Feature Modules

### Auth

- JWT access token + refresh token flow
- password hashing with `bcryptjs`
- logout invalidates the stored refresh token hash

### Users

- protected profile lookup

### Categories

- system or user-defined categories

### Expenses

- create, edit, delete, list
- month and category filtering

### Budgets

- upsert category budgets
- compare monthly spending against limits

### Analytics

- dashboard aggregation
- persisted insights and forecasts
- provider-driven AI layer integration

## Cross-Package Sharing

`@spendwise/shared` is the main contract package. It contains:

- entity types
- auth and API types
- Zod validation schemas
- constants
- formatting helpers

This allows API and client code to reuse the same source of truth.

## Scalability Notes

- API versioning is enabled with URI versioning
- repositories keep data access isolated from use-case services
- AI logic is not embedded directly inside controllers or repositories
- the mobile and web apps can evolve independently while keeping shared domain code
- feature folders provide a natural path for adding tests per module

## Recommended Next Steps

- wire the web and mobile forms to the live API
- add token storage and cookie handling strategy
- introduce refresh handling on the client
- add role support if admin workflows appear later
- expand analytics prompts and provider adapters
- add integration tests for auth and expense flows
