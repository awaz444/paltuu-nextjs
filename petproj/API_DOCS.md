# Swagger API Documentation

This project uses **Swagger/OpenAPI 3.0** for comprehensive API documentation. The API docs are automatically generated from JSDoc comments in the route handlers.

## Accessing the Documentation

### 1. **Interactive Swagger UI**
Visit: **http://localhost:3000/api-docs**

The Swagger UI provides:
- ✅ Browse all API endpoints
- ✅ View request/response schemas
- ✅ Try out endpoints directly from the browser
- ✅ Authorization token support
- ✅ Download OpenAPI spec

### 2. **Raw OpenAPI Spec (JSON)**
Visit: **http://localhost:3000/api/swagger.json**

Raw JSON OpenAPI 3.0 specification that can be imported into:
- Postman
- Insomnia
- Other API clients
- API documentation generators

## API Documentation Structure

The API is organized by feature areas:

### Main Categories

| Category | Description | Example Endpoints |
|----------|-------------|-------------------|
| **v1 Auth** | Authentication, login, registration | `/api/v1/auth/login`, `/api/v1/auth/register` |
| **v1 Pets** | Pet listings, adoption, foster | `/api/v1/pets`, `/api/v1/browse-pets` |
| **v1 Admin** | Admin panel operations | `/api/v1/admin/users`, `/api/v1/admin/pets` |
| **v1 Bazaar** | Marketplace, products, orders | `/api/v1/bazaar/products`, `/api/v1/bazaar/orders` |
| **v1 Vets** | Veterinary services | `/api/v1/vets`, `/api/v1/vet-panel` |
| **v1 Users** | User profiles | `/api/v1/users/profile` |

## Adding Swagger Documentation

Each API endpoint should include a JSDoc comment with Swagger/OpenAPI annotations.

### Example Endpoint Documentation

```typescript
/**
 * @swagger
 * /api/v1/pets:
 *   get:
 *     summary: Get all pets
 *     description: Retrieve a list of all available pets with filtering and sorting
 *     tags: [v1 Pets]
 *     parameters:
 *       - in: query
 *         name: city_id
 *         schema:
 *           type: integer
 *         description: Filter by city
 *       - in: query
 *         name: pet_type
 *         schema:
 *           type: string
 *         description: Filter by pet type (dog, cat, etc)
 *     responses:
 *       200:
 *         description: List of pets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pet'
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new pet listing
 *     description: Create a new pet listing (requires authentication)
 *     tags: [v1 Pets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pet_name:
 *                 type: string
 *               pet_type:
 *                 type: string
 *               pet_breed:
 *                 type: string
 *               age_months:
 *                 type: integer
 *             required:
 *               - pet_name
 *               - pet_type
 *     responses:
 *       201:
 *         description: Pet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pet'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  // Implementation
}

export async function POST(req: NextRequest) {
  // Implementation
}
```

## Best Practices

### 1. **Always Include Summaries**
```typescript
summary: 'Get all users'  // Short, concise
```

### 2. **Provide Descriptions**
```typescript
description: 'Retrieve a paginated list of users with role filtering'
```

### 3. **Document Response Schemas**
```typescript
responses:
  200:
    description: Success
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
```

### 4. **Include Error Responses**
```typescript
responses:
  400:
    description: Invalid input
  401:
    description: Unauthorized
  404:
    description: Not found
  500:
    description: Server error
```

### 5. **Mark Security Requirements**
```typescript
security:
  - bearerAuth: []     // JWT token required
  - cookieAuth: []     // Or cookie auth
```

### 6. **Document All Parameters**
```typescript
parameters:
  - in: path
    name: userId
    required: true
    schema:
      type: integer
    description: The user ID
  - in: query
    name: role
    schema:
      type: string
    description: Filter by user role
```

## Common Schema References

The API defines reusable schemas in `/lib/swagger.ts`:

### User Schema
```json
{
  "user_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "profile_image_url": "https://...",
  "created_at": "2026-04-22T10:00:00Z"
}
```

### Pet Schema
```json
{
  "pet_id": 1,
  "pet_name": "Max",
  "pet_type": "dog",
  "pet_breed": "Labrador",
  "age_months": 24,
  "adoption_status": "available",
  "approved": true
}
```

## Authentication

The API supports two authentication methods:

### 1. **JWT Bearer Token**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://paltuu.pk/api/v1/user
```

### 2. **HTTP-Only Cookie**
```bash
curl -b "token=YOUR_JWT_TOKEN" https://paltuu.pk/api/v1/user
```

## Importing Into Postman

1. Open Postman
2. Click **Import** button
3. Go to **Link** tab
4. Paste: `http://localhost:3000/api/swagger.json`
5. Click **Import**

All endpoints will be imported with:
- ✅ Full request/response schemas
- ✅ Example values
- ✅ Authorization headers pre-configured
- ✅ Descriptions and tags

## Updating Documentation

After adding new endpoints or modifying existing ones:

1. **Add/Update JSDoc comments** in the route file
2. **Refresh the Swagger UI** page (it auto-updates)
3. The OpenAPI spec is cached for 1 hour
   - For immediate refresh, hard-refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

## Configuration

The Swagger setup is configured in:
- **Setup**: `/lib/swagger.ts`
- **Route**: `/app/api/swagger.json/route.ts`
- **UI**: `/app/api-docs/page.tsx`

### Key Configuration Options
- **OpenAPI Version**: 3.0.0
- **API Title**: Paltuu API
- **API Version**: 1.0.0
- **Servers**: Production (paltuu.pk) and Development (localhost:3000)

## Troubleshooting

### Swagger UI not loading?
- Ensure `swagger-ui-react` is installed: `npm list swagger-ui-react`
- Clear browser cache and refresh
- Check browser console for errors

### Endpoints not appearing in documentation?
- Verify JSDoc comments are correctly formatted
- Ensure comments are **above** the export function
- Check that tags match existing tags in `/lib/swagger.ts`

### Spec not updating?
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh Swagger UI page (Ctrl+Shift+R)
- The spec is cached for 1 hour in production

## Resources

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Swagger UI Documentation](https://github.com/swagger-api/swagger-ui)
- [next-swagger-doc](https://github.com/jellyfish-robo/next-swagger-doc)

## Support

For questions about the API documentation:
- Check the Swagger UI at: `/api-docs`
- Review raw spec at: `/api/swagger.json`
- Check route implementations in `/app/api/v1/`
