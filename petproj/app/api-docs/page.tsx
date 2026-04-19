'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <SwaggerUI url="/api/docs" />
    </div>
  );
}
