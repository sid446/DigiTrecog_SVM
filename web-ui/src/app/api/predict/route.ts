import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { pixels } = data;

    if (!pixels || !Array.isArray(pixels)) {
      return NextResponse.json({ error: 'Missing pixel data' }, { status: 400 });
    }

    // Path to the python prediction script
    const scriptPath = path.join(process.cwd(), '..', 'predict_service.py');
    
    // Call python script and pass pixels as JSON via stdin
    const input = JSON.stringify({ pixels });
    
    // Use 'python' or 'python3' depending on environment. On Windows 'python' is usually correct.
    const output = execSync(`python "${scriptPath}"`, {
      input: input,
      encoding: 'utf-8',
    });

    const result = JSON.parse(output);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Prediction error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
