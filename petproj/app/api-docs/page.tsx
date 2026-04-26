'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import Link from 'next/link';

export default function ApiDocs() {
  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <div style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #374151',
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600' }}>
            Paltuu API Documentation
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
            OpenAPI 3.0 Specification
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href="/api/v1/swagger.json"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
          >
            📥 Download Spec
          </a>
          <Link
            href="/"
            style={{
              padding: '8px 16px',
              backgroundColor: '#8b1538',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#a21a42')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8b1538')}
          >
            Home
          </Link>
        </div>
      </div>

      {/* Swagger UI */}
      <SwaggerUI
        url="/api/v1/swagger.json"
        deepLinking={true}
        layout="BaseLayout"
      />
    </div>
  );
}
