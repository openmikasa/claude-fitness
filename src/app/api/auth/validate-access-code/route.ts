import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();

    // Get the valid access code from environment variables
    const validAccessCode = process.env.SIGNUP_ACCESS_CODE;

    if (!validAccessCode) {
      console.error('SIGNUP_ACCESS_CODE environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Validate the access code
    if (accessCode !== validAccessCode) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 403 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error validating access code:', error);
    return NextResponse.json(
      { error: 'Failed to validate access code' },
      { status: 500 }
    );
  }
}
