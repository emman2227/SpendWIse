# API Notes

## Base URL

Local default:

```text
http://localhost:4000/api/v1
```

Health check:

```text
GET /api/health
```

## Response Envelope

Successful responses are wrapped like this:

```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-04-02T00:00:00.000Z",
    "path": "/api/v1/example"
  }
}
```

## Auth Endpoints

### Register

`POST /auth/register`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

### Login

`POST /auth/login`

### Refresh

`POST /auth/refresh`

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### Logout

`POST /auth/logout`

Requires an access token in the `Authorization: Bearer <token>` header.

## User Endpoint

### Current user profile

`GET /users/me`

## Expense Endpoints

### Create expense

`POST /expenses`

```json
{
  "amount": 420,
  "categoryId": "food-category-id",
  "description": "Weekly market run",
  "paymentMethod": "debit_card",
  "date": "2026-04-02T10:00:00.000Z",
  "notes": "Optional note"
}
```

### List expenses

`GET /expenses?month=4&year=2026`

### Update expense

`PATCH /expenses/:expenseId`

### Delete expense

`DELETE /expenses/:expenseId`

## Budget Endpoints

### Upsert budget

`POST /budgets`

```json
{
  "categoryId": "food-category-id",
  "limitAmount": 5000,
  "month": 4,
  "year": 2026
}
```

### Monthly summary

`GET /budgets/summary?month=4&year=2026`

## Analytics Endpoints

### Dashboard

`GET /analytics/dashboard`

Returns:

- total expenses
- transaction count
- monthly budget summary
- recent transactions
- category breakdown
- latest insights
- latest forecast

### Generate AI outputs

`POST /analytics/generate`

This uses the provider abstraction in `@spendwise/ai`. The starter defaults to the mock provider.

## Validation

Shared validation schemas live in `packages/shared/src/schemas`.

This keeps request contracts reusable across:

- API controllers
- web forms
- mobile forms
- future SDK or client packages
