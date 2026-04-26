import { getApiDocs } from '@/lib/swagger';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const docs = getApiDocs();
    return NextResponse.json(docs, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating Swagger docs:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
