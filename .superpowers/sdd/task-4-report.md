# Task 4: Register API Route — Report

## What Was Implemented

Created `api/register.ts` — a POST endpoint that saves push subscriptions to Vercel KV.

**Endpoint:** `POST /api/register`

**Behavior:**
- CORS headers on all responses, OPTIONS preflight handled
- Rejects non-POST methods with 405
- Validates required fields: `subscription.endpoint`, `storeId`, `ticketNumber`
- Validates `storeId` and `ticketNumber` are positive integers
- Generates deterministic subscription ID via SHA-256 hash (first 16 hex chars) of the endpoint URL
- Saves registration to KV at `notification:{subId}` with 4-hour TTL metadata
- Updates store index at `notification:store:{storeId}` (deduplicates)
- Updates global index at `notification:index` (deduplicates)
- Returns `{ success: true, registrationId: string }`
- Chinese error messages for consistency with existing codebase

## Test Results

- `npx tsc --noEmit` — PASS (no errors)
- `npm run lint` — PASS (tsc --noEmit)

## Files Changed

| File | Action |
|------|--------|
| `api/register.ts` | Created |

## Commits

- `a491ae9` — `feat: add POST /api/register endpoint for push subscriptions`

## Concerns

None. The implementation follows the plan exactly and matches the existing `api/queue.ts` pattern.
