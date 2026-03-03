import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, getCallsheetFieldMapping } from '@/lib/csv-parser';
import { updateCallsheet, initTursoDb } from '@/lib/db/turso';

export async function POST(request: NextRequest) {
  try {
    await initTursoDb();
    const { csvText, sessionId } = await request.json();

    if (!csvText || !sessionId) {
      return NextResponse.json(
        { error: 'CSV text and sessionId are required' },
        { status: 400 }
      );
    }

    const lines = parseCSV(csvText);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    const headers = lines[0];
    const fieldMapping = getCallsheetFieldMapping(headers);

    // Use the first data row for callsheet (usually single row)
    const row = lines[1];

    await updateCallsheet(sessionId, {
      producer: fieldMapping['producer'] !== undefined ? row[fieldMapping['producer']]?.trim() || '' : '',
      director: fieldMapping['director'] !== undefined ? row[fieldMapping['director']]?.trim() || '' : '',
      contactPhone: fieldMapping['contactPhone'] !== undefined ? row[fieldMapping['contactPhone']]?.trim() || '' : '',
      parkingInfo: fieldMapping['parkingInfo'] !== undefined ? row[fieldMapping['parkingInfo']]?.trim() || '' : '',
      callTime: fieldMapping['callTime'] !== undefined ? row[fieldMapping['callTime']]?.trim() || '' : '',
      wrapTime: fieldMapping['wrapTime'] !== undefined ? row[fieldMapping['wrapTime']]?.trim() || '' : '',
      specialInstructions: fieldMapping['specialInstructions'] !== undefined ? row[fieldMapping['specialInstructions']]?.trim() || '' : '',
    });

    return NextResponse.json({ imported: 1 });
  } catch (error) {
    console.error('Failed to import callsheet:', error);
    return NextResponse.json(
      { error: 'Failed to import callsheet' },
      { status: 500 }
    );
  }
}
