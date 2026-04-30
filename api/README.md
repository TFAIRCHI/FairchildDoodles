# DoodleSite API

This folder contains the Azure Functions backend for DoodleSite.

## Initial Scope

The API is being introduced in phases:

1. scaffold the Functions app
2. add auth-aware admin endpoints
3. add storage-backed content and image management

## First Endpoint

The first endpoint is `GET /api/manage/me`.

Its job is to confirm:

- the Functions app is deployed correctly
- the Static Web Apps API integration is working
- authenticated user information is available
- admin allowlist logic can be added cleanly

The next verification endpoint is `GET /api/manage/storage-status`.

Its job is to confirm:

- Azure environment variables are available to the API
- the configured blob containers exist
- admin-only storage checks are wired correctly

The table verification endpoint is `GET /api/manage/table-status`.

Its job is to confirm:

- Azure table environment variables are available to the API
- the configured tables are reachable
- the metadata storage layer is wired before CRUD endpoints are added

## First CRUD Endpoints

The first content CRUD surface is for litters.

- `GET /api/manage/litters`
- `POST /api/manage/litters`
- `GET /api/manage/litters/{id}`
- `PUT /api/manage/litters/{id}`

These endpoints establish the table-backed admin pattern that puppies, text blocks, and images will follow next.

The next CRUD surface is for puppies.

- `GET /api/manage/puppies`
- `POST /api/manage/puppies`
- `GET /api/manage/puppies/{id}`
- `PUT /api/manage/puppies/{id}`

`GET /api/manage/puppies` also supports an optional `litterId` query parameter to filter puppies by litter.

## Image Layer

Admin image management endpoints:

- `GET /api/manage/images`
- `POST /api/manage/images`
- `GET /api/manage/images/{id}`
- `PUT /api/manage/images/{id}`

`GET /api/manage/images` supports optional `ownerType`, `ownerId`, and `sectionKey` query filters.

The current upload contract is JSON-based and expects:

- `ownerType`
- `ownerId` where applicable
- `fileName`
- `contentType`
- `base64Data`

This is acceptable for initial admin uploads and internal testing. A later optimization can replace direct API uploads with SAS-based browser uploads for larger files.

## Text Block Layer

Structured text block endpoints for About and Contact content:

- `GET /api/manage/text-blocks`
- `POST /api/manage/text-blocks`
- `GET /api/manage/text-blocks/{id}`
- `PUT /api/manage/text-blocks/{id}`

`GET /api/manage/text-blocks` supports optional `pageKey` and `sectionKey` query filters.

## Local Setup

Install dependencies:

```powershell
cd api
npm install
```

When local development begins, create `local.settings.json` from `local.settings.example.json` and fill in the real values.
