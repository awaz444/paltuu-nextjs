/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Auto-generated summary for /api/docs
 *     tags: [Auto-Generated]
 */

import { createSwaggerSpec } from 'next-swagger-doc';
import { NextResponse } from 'next/server';

export async function GET() {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // Scans the app/api directory
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Paltuu API Documentation',
        version: '1.0.0',
        description: 'Comprehensive API documentation for the Paltuu backend system.',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
  });

  return NextResponse.json(spec);
}
