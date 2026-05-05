import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { pixels, label } = await request.json();

    if (!pixels || label === undefined) {
      return NextResponse.json({ error: 'Missing pixels or label' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), '..', 'custom_training_data.json');
    
    let customData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      customData = JSON.parse(fileContent);
    }

    // Add new sample
    customData.push({
      pixels,
      label: parseInt(label),
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(filePath, JSON.stringify(customData, null, 2));

    return NextResponse.json({ success: true, count: customData.length });
  } catch (error: any) {
    console.error('Save training data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
