import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), '..', 'digit_recognition_svm.py');
    
    console.log('Starting retraining process...');
    
    // Execute the training script
    const output = execSync(`python "${scriptPath}"`, {
      encoding: 'utf-8',
    });

    console.log('Retraining output:', output);

    return NextResponse.json({ success: true, output });
  } catch (error: any) {
    console.error('Retrain error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
