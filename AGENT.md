# AGENT.md — Backend Architecture Blueprint

````md
# AGENT.md

# Project Name
Scalable URL Shortener Platform

---

# Objective

Build a production-grade scalable URL shortener backend system focused on:

- Backend engineering
- High-scale architecture
- Low latency redirects
- Async processing
- DevOps learning
- Distributed systems fundamentals
- Observability
- Caching strategies
- Queue-based analytics processing

This project is NOT a CRUD project.

This project should simulate:
- real-world backend architecture
- scalable infrastructure patterns
- production engineering workflows

---

# Primary Engineering Goals

The backend must teach and implement:

- Fast low-latency redirects
- Cache-aside architecture
- Redis-based caching
- Queue-driven async processing
- Background workers
- PostgreSQL relational modeling
- API modularization
- Dockerized development
- CI/CD workflows
- Reverse proxy architecture
- Monitoring and observability
- Horizontal scalability
- Event-driven architecture principles

---

# Core Engineering Philosophy

The system must follow:

```txt
working
→ reliable
→ scalable
→ observable
→ distributed
````

DO NOT prematurely optimize.

DO NOT introduce distributed systems complexity before stable monolith completion.

---

# High-Level Architecture

```txt
Client
↓
Nginx Reverse Proxy
↓
Fastify Backend API
↓
Redis Cache
↓
PostgreSQL
```

Async Pipeline:

```txt
Fastify API
↓
BullMQ Queue
↓
Redis
↓
Workers
↓
PostgreSQL Analytics Storage
```

---

# Primary Tech Stack

# Backend Framework

Fastify

Reason:

* high performance
* schema-first architecture
* modern TypeScript support
* plugin-based modularity
* structured backend engineering

---

# Language

TypeScript

Reason:

* shared types
* safer APIs
* scalable codebase
* maintainability

---

# Database

PostgreSQL

Reason:

* relational consistency
* transactions
* indexing
* analytics querying
* production-grade architecture

---

# ORM

Prisma

Reason:

* developer experience
* migrations
* schema management
* TypeScript integration

---

# Cache Layer

Redis

Reason:

* ultra-fast reads
* rate limiting
* caching
* queue backend

---

# Queue System

BullMQ

Reason:

* Redis-backed
* retries
* delayed jobs
* async analytics processing

---

# Reverse Proxy

Nginx

Reason:

* load balancing
* SSL termination
* compression
* request routing

---

# Containerization

Docker
Docker Compose

Reason:

* environment consistency
* service orchestration
* DevOps learning

---

# Monitoring

Prometheus
Grafana

Reason:

* observability
* metrics
* production monitoring

---

# Logging

Pino

Reason:

* structured logs
* low overhead
* production-grade logging

---

# Project Architecture Principles

# 1. Feature-Based Modular Architecture

DO NOT structure by:

```txt
controllers/
services/
routes/
```

globally.

Instead:

```txt
modules/url/
modules/auth/
modules/analytics/
```

This improves:

* scalability
* ownership
* maintainability

---

# 2. Separation of Concerns

Controllers:

* request handling only

Services:

* business logic only

Repositories:

* DB interaction only

Workers:

* async processing only

Utilities:

* pure reusable functions only

---

# 3. Reusability

DO NOT duplicate:

* validation logic
* DB access patterns
* error handling
* response formatting
* Redis access logic
* queue initialization

Create shared abstractions.

---

# 4. Stateless APIs

Backend instances must remain stateless.

NO in-memory session storage.

Use:

* Redis
* PostgreSQL

for persistence.

This enables:

* horizontal scaling
* load balancing

---

# Backend Folder Structure

```txt
backend/
├── src/
│
│   ├── modules/
│   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── url/
│   │   │   ├── url.controller.ts
│   │   │   ├── url.service.ts
│   │   │   ├── url.repository.ts
│   │   │   ├── url.routes.ts
│   │   │   ├── url.schema.ts
│   │   │   ├── short-code.generator.ts
│   │   │   └── redirect.service.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── analytics.repository.ts
│   │   │   ├── analytics.queue.ts
│   │   │   ├── analytics.worker.ts
│   │   │   └── analytics.schema.ts
│   │   │
│   │   ├── users/
│   │   │
│   │   └── health/
│   │
│   ├── plugins/
│   │   ├── prisma.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   ├── swagger.ts
│   │   └── env.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── request-logger.middleware.ts
│   │
│   ├── queues/
│   │   ├── analytics.queue.ts
│   │   └── cleanup.queue.ts
│   │
│   ├── workers/
│   │   ├── analytics.worker.ts
│   │   └── cleanup.worker.ts
│   │
│   ├── common/
│   │   ├── constants/
│   │   ├── exceptions/
│   │   ├── helpers/
│   │   ├── logger/
│   │   ├── responses/
│   │   ├── validators/
│   │   └── types/
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── redis.config.ts
│   │   ├── queue.config.ts
│   │   └── db.config.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│
├── docker/
│
├── Dockerfile
├── docker-compose.yml
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

---

# Core System Design

# Redirect Flow

Critical requirement:
Redirect latency must remain extremely low.

Redirect path must avoid:

* heavy DB writes
* analytics processing
* aggregation logic

---

# Redirect Flow Architecture

```txt
Client Request
↓
Redis Lookup
↓
Cache HIT → Immediate Redirect
↓
Cache MISS → PostgreSQL Lookup
↓
Store in Redis
↓
Immediate Redirect
```

Analytics processing must NEVER block redirect response.

---

# Async Analytics Pipeline

After redirect:

```txt
Emit Analytics Event
↓
BullMQ Queue
↓
Worker Consumption
↓
Analytics Storage
```

This ensures:

* low latency
* scalability
* async processing

---

# Redis Responsibilities

Redis should handle:

* URL cache
* queue backend
* rate limiting
* temporary counters
* hot-path optimization

Redis is NOT the source of truth.

PostgreSQL remains primary persistence layer.

---

# PostgreSQL Responsibilities

PostgreSQL stores:

* users
* short URLs
* analytics events
* teams
* permissions
* historical data

PostgreSQL is authoritative storage.

---

# Database Design Principles

# 1. Proper Indexing

Critical indexes:

```sql
short_code UNIQUE INDEX
user_id INDEX
created_at INDEX
click_count INDEX
```

---

# 2. Avoid Over-Normalization Initially

Keep schema practical.

Optimize later only when bottlenecks appear.

---

# 3. Analytics Tables

Analytics tables will grow rapidly.

Design for:

* pagination
* batching
* aggregation

Potential future migration:

* ClickHouse
* TimescaleDB

NOT required initially.

---

# API Principles

# Version APIs

Use:

```txt
/api/v1/
```

Examples:

```txt
/api/v1/auth
/api/v1/urls
/api/v1/analytics
```

---

# API Standards

All APIs must:

* validate input
* return typed responses
* use centralized error handling
* use consistent response format

---

# Validation Strategy

Use:
Zod

Validation layers:

* request body
* query params
* response schemas

DO NOT manually validate inputs repeatedly.

Create reusable validators.

---

# Logging Standards

Use:
Pino

Every request should include:

* request ID
* route
* latency
* status code

Logs must be structured JSON.

NO console.log usage.

---

# Error Handling Standards

Centralize all errors.

Use:

* custom exceptions
* Fastify error handlers

DO NOT duplicate try/catch patterns unnecessarily.

---

# Queue Architecture

BullMQ queues should handle:

* analytics processing
* cleanup tasks
* scheduled jobs
* email processing (future)

Workers must:

* retry safely
* support concurrency
* support dead-letter handling

---

# Redis Cache Strategy

Use:
Cache Aside Pattern

Flow:

```txt
Check Redis
↓
MISS → Query PostgreSQL
↓
Store in Redis
↓
Return response
```

---

# Cache Rules

* Cache only hot data
* Use TTLs
* Avoid stale cache problems
* Use namespaced keys

Example:

```txt
url:abc123
analytics:top-links
rate-limit:ip:123
```

---

# Rate Limiting

Use Redis-based rate limiting.

Protect:

* URL creation endpoints
* auth endpoints
* redirect abuse

Recommended:
Sliding window algorithm.

---

# Authentication

Use:
JWT Access Tokens
Refresh Tokens

Passwords:
bcrypt hashing only.

DO NOT store raw tokens.

---

# Docker Standards

Every service must be containerized.

Containers:

* backend
* postgres
* redis
* workers

Use Docker Compose for local orchestration.

---

# Environment Standards

NEVER hardcode:

* secrets
* DB URLs
* Redis URLs
* JWT secrets

Use:
.env files

Provide:
.env.example

---

# Development Phases

# PHASE 1 — Core Backend MVP

Goal:
Working backend monolith.

Features:

* Fastify setup
* Prisma setup
* PostgreSQL integration
* URL shortening
* redirects
* auth
* Dockerized local DB

DO NOT:

* add Redis
* add queues
* add microservices

Focus:
correct architecture first.

---

# PHASE 2 — Redis Integration

Goal:
Introduce caching.

Features:

* Redis setup
* cache-aside strategy
* redirect optimization
* Redis key management

Learn:

* low-latency systems
* cache invalidation
* read-heavy optimization

---

# PHASE 3 — Async Analytics

Goal:
Queue-based processing.

Features:

* BullMQ
* analytics workers
* retry strategies
* dead-letter handling

Learn:

* async architecture
* eventual consistency
* worker systems

---

# PHASE 4 — Observability

Goal:
Production visibility.

Features:

* structured logging
* Prometheus metrics
* Grafana dashboards
* request tracing

Learn:

* production monitoring
* debugging distributed systems

---

# PHASE 5 — CI/CD

Goal:
Deployment automation.

Features:

* GitHub Actions
* lint pipelines
* test pipelines
* Docker builds

Learn:

* DevOps workflows
* automated deployments

---

# PHASE 6 — Reverse Proxy + Scaling

Goal:
Horizontal scalability.

Features:

* Nginx
* multiple backend instances
* load balancing

Learn:

* stateless scaling
* reverse proxies
* traffic routing

---

# PHASE 7 — Distributed Architecture

Goal:
Service separation.

Possible services:

* redirect service
* analytics service
* auth service

ONLY after monolith stability.

---

# Coding Standards

# MUST FOLLOW

* strict TypeScript
* no duplicated logic
* reusable abstractions
* feature modularity
* centralized configs
* centralized logging
* centralized errors

---

# MUST NOT

* duplicate validation
* duplicate Redis logic
* duplicate Prisma queries
* use massive utility god-files
* tightly couple services
* create premature microservices

---

# Engineering Mindset

This project exists to teach:

* scalable backend architecture
* production engineering
* distributed systems fundamentals
* DevOps practices
* async processing
* observability

The project should evolve incrementally.

DO NOT prematurely optimize.

DO NOT introduce complexity before operational need.

Build:

* stable systems first
* scalable systems second
* distributed systems last

```
```
