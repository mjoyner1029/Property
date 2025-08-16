# Asset Anchor API Documentation

## Overview

The Asset Anchor API provides a comprehensive set of endpoints to manage properties, tenants, leases, transactions, and other core entities. This documentation covers authentication, common patterns, error handling, and detailed endpoint specifications.

## Base URL

- **Production**: `https://api.assetanchor.io/v1`
- **Staging**: `https://staging-api.assetanchor.io/v1`
- **Development**: `https://dev-api.assetanchor.io/v1`

## Authentication

### Authentication Methods

Asset Anchor API supports the following authentication methods:

1. **JWT Bearer Token** (preferred)
2. **API Key** (for server-to-server integrations)

### JWT Authentication

Most API requests require authentication using a JWT bearer token:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

To obtain a token, use the login endpoint:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### API Key Authentication

For server-to-server integrations, use API key authentication:

```http
X-API-Key: your_api_key_here
```

API keys can be generated in the account settings page.

### Token Refresh

When an access token expires, use the refresh token to obtain a new one:

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer your_refresh_token_here

{}
```

Response:

```json
{
  "access_token": "new_access_token_here",
  "refresh_token": "new_refresh_token_here",
  "token_type": "bearer",
  "expires_in": 900
}
```

## Common Patterns

### Request Format

Most endpoints accept JSON payloads:

```http
POST /properties
Content-Type: application/json
Authorization: Bearer your_access_token

{
  "name": "Sunset Apartments",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "property_type": "residential"
}
```

### Response Format

All responses follow a consistent format:

```json
{
  "data": {
    // Resource data here
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

For collection endpoints:

```json
{
  "data": [
    // Array of resources
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "pages": 5,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/properties?page=1&per_page=20",
    "first": "/properties?page=1&per_page=20",
    "prev": null,
    "next": "/properties?page=2&per_page=20",
    "last": "/properties?page=5&per_page=20"
  }
}
```

### Error Format

Errors follow a standard format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid",
    "details": {
      "name": ["This field is required"],
      "zip_code": ["Invalid format"]
    },
    "request_id": "req_1234567890"
  }
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource was successfully created |
| 400 | Bad Request - Invalid request or validation error |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Authenticated but lacks permission |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Pagination

Collection endpoints support pagination using the following query parameters:

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

Example:

```http
GET /properties?page=2&per_page=50
```

### Filtering

Most collection endpoints support filtering:

```http
GET /properties?status=active&city=San%20Francisco
```

### Sorting

Use the `sort` parameter for sorting:

```http
GET /properties?sort=created_at:desc,name:asc
```

### Field Selection

Use the `fields` parameter to select specific fields:

```http
GET /properties?fields=id,name,address
```

### Relationships

Use the `include` parameter to include related resources:

```http
GET /properties?include=owner,leases.tenant
```

## API Endpoints

### Authentication

#### Login

```http
POST /auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:

```json
{
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin"
    }
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Refresh Token

```http
POST /auth/refresh
```

Request headers:

```
Authorization: Bearer your_refresh_token
```

Response:

```json
{
  "data": {
    "access_token": "new_access_token_here",
    "refresh_token": "new_refresh_token_here",
    "token_type": "bearer",
    "expires_in": 900
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Logout

```http
POST /auth/logout
```

Request headers:

```
Authorization: Bearer your_access_token
```

Response:

```json
{
  "data": {
    "message": "Successfully logged out"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

### Users

#### Get Current User

```http
GET /users/me
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "phone": "+15551234567",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### List Users

```http
GET /users
```

Parameters:

- `page` (optional): Page number
- `per_page` (optional): Items per page
- `role` (optional): Filter by role
- `search` (optional): Search by name or email
- `fields` (optional): Select specific fields
- `sort` (optional): Sort by fields

Response:

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "admin",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-06-01T12:34:56Z"
    },
    // More users...
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "pages": 5,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/users?page=1&per_page=20",
    "first": "/users?page=1&per_page=20",
    "prev": null,
    "next": "/users?page=2&per_page=20",
    "last": "/users?page=5&per_page=20"
  }
}
```

#### Get User

```http
GET /users/{id}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "phone": "+15551234567",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Create User

```http
POST /users
```

Request body:

```json
{
  "email": "new.user@example.com",
  "password": "secure_password",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "manager",
  "phone": "+15559876543"
}
```

Response:

```json
{
  "data": {
    "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "email": "new.user@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "manager",
    "phone": "+15559876543",
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Update User

```http
PUT /users/{id}
```

Request body:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+15551234567"
}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "admin",
    "phone": "+15551234567",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:35:00Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

#### Delete User

```http
DELETE /users/{id}
```

Response:

```json
{
  "data": {
    "message": "User successfully deleted"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

### Properties

#### List Properties

```http
GET /properties
```

Parameters:

- `page` (optional): Page number
- `per_page` (optional): Items per page
- `status` (optional): Filter by status
- `property_type` (optional): Filter by type
- `city` (optional): Filter by city
- `state` (optional): Filter by state
- `search` (optional): Search by name or address
- `fields` (optional): Select specific fields
- `sort` (optional): Sort by fields
- `include` (optional): Include related resources

Response:

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Sunset Apartments",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94107",
      "property_type": "residential",
      "status": "active",
      "bedrooms": 2,
      "bathrooms": 1.5,
      "square_feet": 1200,
      "year_built": 1985,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-06-01T12:34:56Z"
    },
    // More properties...
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "pages": 5,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/properties?page=1&per_page=20",
    "first": "/properties?page=1&per_page=20",
    "prev": null,
    "next": "/properties?page=2&per_page=20",
    "last": "/properties?page=5&per_page=20"
  }
}
```

#### Get Property

```http
GET /properties/{id}
```

Parameters:

- `include` (optional): Include related resources

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Sunset Apartments",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94107",
    "property_type": "residential",
    "status": "active",
    "bedrooms": 2,
    "bathrooms": 1.5,
    "square_feet": 1200,
    "year_built": 1985,
    "description": "Bright and spacious apartment with a view.",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z",
    "owner": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "owner@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Create Property

```http
POST /properties
```

Request body:

```json
{
  "name": "Sunset Apartments",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94107",
  "property_type": "residential",
  "bedrooms": 2,
  "bathrooms": 1.5,
  "square_feet": 1200,
  "year_built": 1985,
  "description": "Bright and spacious apartment with a view."
}
```

Response:

```json
{
  "data": {
    "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "name": "Sunset Apartments",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94107",
    "property_type": "residential",
    "status": "active",
    "bedrooms": 2,
    "bathrooms": 1.5,
    "square_feet": 1200,
    "year_built": 1985,
    "description": "Bright and spacious apartment with a view.",
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z",
    "owner_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Update Property

```http
PUT /properties/{id}
```

Request body:

```json
{
  "name": "Sunset Luxury Apartments",
  "status": "active",
  "description": "Updated description with new amenities."
}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Sunset Luxury Apartments",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94107",
    "property_type": "residential",
    "status": "active",
    "bedrooms": 2,
    "bathrooms": 1.5,
    "square_feet": 1200,
    "year_built": 1985,
    "description": "Updated description with new amenities.",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:35:00Z",
    "owner_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

#### Delete Property

```http
DELETE /properties/{id}
```

Response:

```json
{
  "data": {
    "message": "Property successfully deleted"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

### Tenants

#### List Tenants

```http
GET /tenants
```

Parameters:

- `page` (optional): Page number
- `per_page` (optional): Items per page
- `search` (optional): Search by name or email
- `fields` (optional): Select specific fields
- `sort` (optional): Sort by fields

Response:

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice@example.com",
      "phone": "+15551234567",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-06-01T12:34:56Z"
    },
    // More tenants...
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "per_page": 20,
    "pages": 3,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/tenants?page=1&per_page=20",
    "first": "/tenants?page=1&per_page=20",
    "prev": null,
    "next": "/tenants?page=2&per_page=20",
    "last": "/tenants?page=3&per_page=20"
  }
}
```

#### Get Tenant

```http
GET /tenants/{id}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@example.com",
    "phone": "+15551234567",
    "ssn_last_four": "1234",
    "date_of_birth": "1985-06-15",
    "credit_score": 720,
    "income": 75000,
    "background_check_status": "passed",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Create Tenant

```http
POST /tenants
```

Request body:

```json
{
  "first_name": "Bob",
  "last_name": "Smith",
  "email": "bob@example.com",
  "phone": "+15559876543",
  "ssn_last_four": "5678",
  "date_of_birth": "1990-03-20",
  "income": 85000
}
```

Response:

```json
{
  "data": {
    "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "first_name": "Bob",
    "last_name": "Smith",
    "email": "bob@example.com",
    "phone": "+15559876543",
    "ssn_last_four": "5678",
    "date_of_birth": "1990-03-20",
    "credit_score": null,
    "income": 85000,
    "background_check_status": null,
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Update Tenant

```http
PUT /tenants/{id}
```

Request body:

```json
{
  "phone": "+15551112222",
  "credit_score": 750,
  "background_check_status": "passed"
}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@example.com",
    "phone": "+15551112222",
    "ssn_last_four": "1234",
    "date_of_birth": "1985-06-15",
    "credit_score": 750,
    "income": 75000,
    "background_check_status": "passed",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:35:00Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

#### Delete Tenant

```http
DELETE /tenants/{id}
```

Response:

```json
{
  "data": {
    "message": "Tenant successfully deleted"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

### Leases

#### List Leases

```http
GET /leases
```

Parameters:

- `page` (optional): Page number
- `per_page` (optional): Items per page
- `status` (optional): Filter by status
- `property_id` (optional): Filter by property
- `tenant_id` (optional): Filter by tenant
- `fields` (optional): Select specific fields
- `sort` (optional): Sort by fields
- `include` (optional): Include related resources

Response:

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "start_date": "2023-01-01",
      "end_date": "2023-12-31",
      "rent_amount": 2500,
      "security_deposit": 2500,
      "payment_day": 1,
      "status": "active",
      "auto_renew": false,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-06-01T12:34:56Z"
    },
    // More leases...
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "per_page": 20,
    "pages": 2,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/leases?page=1&per_page=20",
    "first": "/leases?page=1&per_page=20",
    "prev": null,
    "next": "/leases?page=2&per_page=20",
    "last": "/leases?page=2&per_page=20"
  }
}
```

#### Get Lease

```http
GET /leases/{id}
```

Parameters:

- `include` (optional): Include related resources

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "start_date": "2023-01-01",
    "end_date": "2023-12-31",
    "rent_amount": 2500,
    "security_deposit": 2500,
    "payment_day": 1,
    "status": "active",
    "auto_renew": false,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z",
    "property": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Sunset Apartments",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA"
    },
    "tenant": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice@example.com",
      "phone": "+15551234567"
    }
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Create Lease

```http
POST /leases
```

Request body:

```json
{
  "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "start_date": "2023-07-01",
  "end_date": "2024-06-30",
  "rent_amount": 2700,
  "security_deposit": 2700,
  "payment_day": 1,
  "auto_renew": true
}
```

Response:

```json
{
  "data": {
    "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "start_date": "2023-07-01",
    "end_date": "2024-06-30",
    "rent_amount": 2700,
    "security_deposit": 2700,
    "payment_day": 1,
    "status": "active",
    "auto_renew": true,
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Update Lease

```http
PUT /leases/{id}
```

Request body:

```json
{
  "rent_amount": 2800,
  "end_date": "2024-12-31",
  "status": "extended"
}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "start_date": "2023-01-01",
    "end_date": "2024-12-31",
    "rent_amount": 2800,
    "security_deposit": 2500,
    "payment_day": 1,
    "status": "extended",
    "auto_renew": false,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:35:00Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

#### Delete Lease

```http
DELETE /leases/{id}
```

Response:

```json
{
  "data": {
    "message": "Lease successfully deleted"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

### Transactions

#### List Transactions

```http
GET /transactions
```

Parameters:

- `page` (optional): Page number
- `per_page` (optional): Items per page
- `lease_id` (optional): Filter by lease
- `type` (optional): Filter by type (rent, deposit, fee, maintenance)
- `status` (optional): Filter by status
- `start_date` (optional): Filter by date range start
- `end_date` (optional): Filter by date range end
- `fields` (optional): Select specific fields
- `sort` (optional): Sort by fields
- `include` (optional): Include related resources

Response:

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "lease_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "amount": 2500,
      "type": "rent",
      "status": "completed",
      "due_date": "2023-06-01",
      "payment_date": "2023-06-01",
      "payment_method": "credit_card",
      "reference_number": "txn_1234567890",
      "created_at": "2023-06-01T00:00:00Z",
      "updated_at": "2023-06-01T12:34:56Z"
    },
    // More transactions...
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "pages": 8,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/transactions?page=1&per_page=20",
    "first": "/transactions?page=1&per_page=20",
    "prev": null,
    "next": "/transactions?page=2&per_page=20",
    "last": "/transactions?page=8&per_page=20"
  }
}
```

#### Get Transaction

```http
GET /transactions/{id}
```

Parameters:

- `include` (optional): Include related resources

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "lease_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 2500,
    "type": "rent",
    "status": "completed",
    "due_date": "2023-06-01",
    "payment_date": "2023-06-01",
    "payment_method": "credit_card",
    "reference_number": "txn_1234567890",
    "notes": "Monthly rent payment",
    "created_at": "2023-06-01T00:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z",
    "lease": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    }
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Create Transaction

```http
POST /transactions
```

Request body:

```json
{
  "lease_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 2500,
  "type": "rent",
  "status": "pending",
  "due_date": "2023-07-01",
  "notes": "Monthly rent payment"
}
```

Response:

```json
{
  "data": {
    "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "lease_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 2500,
    "type": "rent",
    "status": "pending",
    "due_date": "2023-07-01",
    "payment_date": null,
    "payment_method": null,
    "reference_number": null,
    "notes": "Monthly rent payment",
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Update Transaction

```http
PUT /transactions/{id}
```

Request body:

```json
{
  "status": "completed",
  "payment_date": "2023-07-01",
  "payment_method": "bank_transfer",
  "reference_number": "bank_123456"
}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "lease_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 2500,
    "type": "rent",
    "status": "completed",
    "due_date": "2023-06-01",
    "payment_date": "2023-07-01",
    "payment_method": "bank_transfer",
    "reference_number": "bank_123456",
    "notes": "Monthly rent payment",
    "created_at": "2023-06-01T00:00:00Z",
    "updated_at": "2023-06-01T12:35:00Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

#### Delete Transaction

```http
DELETE /transactions/{id}
```

Response:

```json
{
  "data": {
    "message": "Transaction successfully deleted"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

### Documents

#### List Documents

```http
GET /documents
```

Parameters:

- `page` (optional): Page number
- `per_page` (optional): Items per page
- `entity_type` (optional): Filter by entity type
- `entity_id` (optional): Filter by entity ID
- `is_confidential` (optional): Filter by confidential status
- `fields` (optional): Select specific fields
- `sort` (optional): Sort by fields

Response:

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Lease Agreement",
      "description": "Signed lease agreement",
      "file_type": "application/pdf",
      "file_size": 1024000,
      "entity_type": "lease",
      "entity_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "is_confidential": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-06-01T12:34:56Z"
    },
    // More documents...
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 20,
    "pages": 3,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/documents?page=1&per_page=20",
    "first": "/documents?page=1&per_page=20",
    "prev": null,
    "next": "/documents?page=2&per_page=20",
    "last": "/documents?page=3&per_page=20"
  }
}
```

#### Get Document

```http
GET /documents/{id}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Lease Agreement",
    "description": "Signed lease agreement",
    "file_path": "documents/leases/3fa85f64-5717-4562-b3fc-2c963f66afa6.pdf",
    "file_type": "application/pdf",
    "file_size": 1024000,
    "entity_type": "lease",
    "entity_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uploader_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "is_confidential": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z",
    "download_url": "https://api.assetanchor.io/v1/documents/3fa85f64-5717-4562-b3fc-2c963f66afa6/download"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Upload Document

```http
POST /documents
Content-Type: multipart/form-data
```

Form fields:

- `file`: The file to upload
- `name`: Document name
- `description` (optional): Document description
- `entity_type`: Entity type (property, lease, tenant, transaction)
- `entity_id`: ID of the related entity
- `is_confidential` (optional): Whether the document is confidential

Response:

```json
{
  "data": {
    "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "name": "Property Photos",
    "description": "Recent photos of the property",
    "file_path": "documents/properties/4fa85f64-5717-4562-b3fc-2c963f66afa7.zip",
    "file_type": "application/zip",
    "file_size": 5242880,
    "entity_type": "property",
    "entity_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "uploader_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "is_confidential": false,
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z",
    "download_url": "https://api.assetanchor.io/v1/documents/4fa85f64-5717-4562-b3fc-2c963f66afa7/download"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Download Document

```http
GET /documents/{id}/download
```

Response:

Binary file content with appropriate Content-Type header.

#### Delete Document

```http
DELETE /documents/{id}
```

Response:

```json
{
  "data": {
    "message": "Document successfully deleted"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

### Maintenance Requests

#### List Maintenance Requests

```http
GET /maintenance-requests
```

Parameters:

- `page` (optional): Page number
- `per_page` (optional): Items per page
- `property_id` (optional): Filter by property
- `tenant_id` (optional): Filter by tenant
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `fields` (optional): Select specific fields
- `sort` (optional): Sort by fields
- `include` (optional): Include related resources

Response:

```json
{
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Leaking faucet",
      "description": "The kitchen faucet is leaking constantly.",
      "priority": "medium",
      "status": "open",
      "created_at": "2023-06-01T10:00:00Z",
      "updated_at": "2023-06-01T12:34:56Z"
    },
    // More maintenance requests...
  ],
  "meta": {
    "total": 35,
    "page": 1,
    "per_page": 20,
    "pages": 2,
    "timestamp": "2023-06-01T12:34:56Z"
  },
  "links": {
    "self": "/maintenance-requests?page=1&per_page=20",
    "first": "/maintenance-requests?page=1&per_page=20",
    "prev": null,
    "next": "/maintenance-requests?page=2&per_page=20",
    "last": "/maintenance-requests?page=2&per_page=20"
  }
}
```

#### Get Maintenance Request

```http
GET /maintenance-requests/{id}
```

Parameters:

- `include` (optional): Include related resources

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Leaking faucet",
    "description": "The kitchen faucet is leaking constantly.",
    "priority": "medium",
    "status": "open",
    "assigned_to": null,
    "estimated_cost": null,
    "actual_cost": null,
    "scheduled_date": null,
    "completed_date": null,
    "created_at": "2023-06-01T10:00:00Z",
    "updated_at": "2023-06-01T12:34:56Z",
    "property": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Sunset Apartments",
      "address": "123 Main St"
    },
    "tenant": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice@example.com",
      "phone": "+15551234567"
    }
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Create Maintenance Request

```http
POST /maintenance-requests
```

Request body:

```json
{
  "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Broken window",
  "description": "The bedroom window is cracked and needs replacement.",
  "priority": "high"
}
```

Response:

```json
{
  "data": {
    "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Broken window",
    "description": "The bedroom window is cracked and needs replacement.",
    "priority": "high",
    "status": "open",
    "assigned_to": null,
    "estimated_cost": null,
    "actual_cost": null,
    "scheduled_date": null,
    "completed_date": null,
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

#### Update Maintenance Request

```http
PUT /maintenance-requests/{id}
```

Request body:

```json
{
  "status": "assigned",
  "assigned_to": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "estimated_cost": 150.00,
  "scheduled_date": "2023-06-05T09:00:00Z"
}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Leaking faucet",
    "description": "The kitchen faucet is leaking constantly.",
    "priority": "medium",
    "status": "assigned",
    "assigned_to": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "estimated_cost": 150.00,
    "actual_cost": null,
    "scheduled_date": "2023-06-05T09:00:00Z",
    "completed_date": null,
    "created_at": "2023-06-01T10:00:00Z",
    "updated_at": "2023-06-01T12:35:00Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

#### Delete Maintenance Request

```http
DELETE /maintenance-requests/{id}
```

Response:

```json
{
  "data": {
    "message": "Maintenance request successfully deleted"
  },
  "meta": {
    "timestamp": "2023-06-01T12:35:00Z"
  }
}
```

## Webhooks

### Webhook Events

Asset Anchor can send webhook notifications for the following events:

| Event | Description |
|-------|-------------|
| `user.created` | A new user is created |
| `property.created` | A new property is created |
| `property.updated` | A property is updated |
| `tenant.created` | A new tenant is created |
| `lease.created` | A new lease is created |
| `lease.updated` | A lease is updated |
| `lease.expiring` | A lease is approaching expiration |
| `transaction.created` | A new transaction is created |
| `transaction.updated` | A transaction is updated |
| `maintenance.created` | A new maintenance request is created |
| `maintenance.status_changed` | A maintenance request status is changed |

### Webhook Payload

```json
{
  "id": "evt_1234567890",
  "event": "lease.created",
  "created": "2023-06-01T12:34:56Z",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tenant_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "start_date": "2023-07-01",
    "end_date": "2024-06-30",
    "rent_amount": 2500,
    "status": "active"
  }
}
```

### Configure Webhooks

```http
POST /webhooks
```

Request body:

```json
{
  "url": "https://example.com/webhooks/asset-anchor",
  "events": ["lease.created", "transaction.created", "maintenance.created"],
  "description": "Main integration webhook",
  "active": true
}
```

Response:

```json
{
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "url": "https://example.com/webhooks/asset-anchor",
    "events": ["lease.created", "transaction.created", "maintenance.created"],
    "description": "Main integration webhook",
    "active": true,
    "secret": "whsec_abcdefghijklmnopqrstuvwxyz123456",
    "created_at": "2023-06-01T12:34:56Z",
    "updated_at": "2023-06-01T12:34:56Z"
  },
  "meta": {
    "timestamp": "2023-06-01T12:34:56Z"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated requests

When rate limited, the API returns a 429 Too Many Requests status code with headers indicating the limit and remaining requests:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1686052800
```

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS) for browser-based applications. The following headers are included in responses:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key
Access-Control-Max-Age: 86400
```

## Versioning

The API is versioned via the URL path. The current version is `v1`.

When breaking changes are introduced, a new API version will be released. We maintain backward compatibility for at least one year after a new version is released.

## SDK Libraries

Official client libraries are available for:

- JavaScript/TypeScript: [assetanchor-js](https://github.com/assetanchor/assetanchor-js)
- Python: [assetanchor-python](https://github.com/assetanchor/assetanchor-python)
- PHP: [assetanchor-php](https://github.com/assetanchor/assetanchor-php)

Example usage (JavaScript):

```javascript
import { AssetAnchor } from 'assetanchor';

const api = new AssetAnchor({
  apiKey: 'your_api_key', // Or use token authentication
  environment: 'production' // 'production', 'staging', or 'development'
});

// Get properties
api.properties.list()
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

// Create a property
api.properties.create({
  name: 'Sunset Apartments',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94107',
  property_type: 'residential'
})
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
```
