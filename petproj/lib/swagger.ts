export const getApiDocs = () => {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Paltuu API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Paltuu - Pet adoption, marketplace, and veterinary services platform',
      contact: {
        name: 'Paltuu Support',
        email: 'support@paltuu.pk',
        url: 'https://paltuu.pk',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
    servers: [
      {
        url: 'https://paltuu.pk',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'HTTP-only cookie containing JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', description: 'Unique user identifier' },
            name: { type: 'string', description: 'User full name' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            role: {
              type: 'string',
              enum: ['user', 'vet', 'shop admin', 'shelter admin', 'admin'],
              description: 'User role/type',
            },
            profile_image_url: { type: 'string', description: 'Profile image URL' },
            phone_number: { type: 'string', description: 'User phone number' },
            created_at: { type: 'string', format: 'date-time', description: 'Account creation date' },
          },
          required: ['user_id', 'name', 'email', 'role'],
        },
        Pet: {
          type: 'object',
          properties: {
            pet_id: { type: 'integer', description: 'Unique pet identifier' },
            owner_id: { type: 'integer', description: 'Owner user ID' },
            pet_name: { type: 'string', description: 'Pet name' },
            pet_type: { type: 'string', description: 'Type of pet (dog, cat, etc)' },
            pet_breed: { type: 'string', description: 'Pet breed' },
            age_months: { type: 'integer', description: 'Pet age in months' },
            description: { type: 'string', description: 'Pet description' },
            adoption_status: {
              type: 'string',
              enum: ['available', 'adopted', 'fostered'],
              description: 'Current adoption status',
            },
            approved: { type: 'boolean', description: 'Admin approval status' },
            city_id: { type: 'integer', description: 'City ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation date' },
          },
          required: ['pet_id', 'pet_name', 'pet_type', 'owner_id'],
        },
        Vet: {
          type: 'object',
          properties: {
            vet_id: { type: 'integer', description: 'Unique vet identifier' },
            user_id: { type: 'integer', description: 'Associated user ID' },
            clinic_name: { type: 'string', description: 'Clinic name' },
            license_number: { type: 'string', description: 'Veterinary license number' },
            profile_verified: { type: 'boolean', description: 'Verification status' },
            minimum_fee: { type: 'integer', description: 'Minimum consultation fee' },
          },
          required: ['vet_id', 'user_id'],
        },
        Product: {
          type: 'object',
          properties: {
            product_id: { type: 'integer', description: 'Unique product identifier' },
            product_name: { type: 'string', description: 'Product name' },
            category_id: { type: 'integer', description: 'Product category' },
            price: { type: 'number', description: 'Product price' },
            description: { type: 'string', description: 'Product description' },
            quantity: { type: 'integer', description: 'Available quantity' },
            image_url: { type: 'string', description: 'Product image URL' },
          },
          required: ['product_id', 'product_name', 'price'],
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            status: { type: 'integer', description: 'HTTP status code' },
          },
        },
      },
    },
    paths: {
      '/api/v1/auth/login': {
        post: {
          summary: 'User login',
          description: 'Authenticate user with email and password',
          tags: ['v1 Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string', description: 'JWT token' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
            },
          },
        },
      },
      '/api/v1/pets': {
        get: {
          summary: 'Get all pets',
          description: 'Retrieve a list of all available pets with filtering',
          tags: ['v1 Pets'],
          parameters: [
            {
              in: 'query',
              name: 'city_id',
              schema: { type: 'integer' },
              description: 'Filter by city ID',
            },
          ],
          responses: {
            200: {
              description: 'List of pets',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Pet' },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'v1 Auth',
        description: 'Authentication endpoints - Login, registration, token verification',
      },
      {
        name: 'v1 Pets',
        description: 'Pet listing and management - Browse, create, update pet listings',
      },
      {
        name: 'v1 Admin',
        description: 'Admin panel operations - Manage users, pets, listings, vets',
      },
      {
        name: 'v1 Bazaar',
        description: 'Marketplace operations - Products, cart, orders, payments',
      },
      {
        name: 'v1 Vets',
        description: 'Veterinary service endpoints - Clinic info, vet profiles, schedules',
      },
      {
        name: 'v1 Users',
        description: 'User profile and account management',
      },
    ],
  };

  return swaggerSpec;
}
