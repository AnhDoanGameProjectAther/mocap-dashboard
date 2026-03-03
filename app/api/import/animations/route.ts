import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, getAnimationFieldMapping } from '@/lib/csv-parser';
import { createAnimation, initTursoDb } from '@/lib/db/turso';

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
    const fieldMapping = getAnimationFieldMapping(headers);

    // Check required fields
    if (fieldMapping['moveName'] === undefined) {
      return NextResponse.json(
        { error: 'Could not find Move Name column. Expected headers like: Move Name, Animation, Name' },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      errors: [] as string[],
    };

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      try {
        const moveName = row[fieldMapping['moveName']]?.trim();
        if (!moveName) continue; // Skip empty rows

        await createAnimation({
          sessionId,
          character: fieldMapping['character'] !== undefined ? row[fieldMapping['character']]?.trim() || '' : '',
          shotId: fieldMapping['shotId'] !== undefined ? row[fieldMapping['shotId']]?.trim() || '' : '',
          moveName,
          duration: fieldMapping['duration'] !== undefined ? row[fieldMapping['duration']]?.trim() || '' : '',
          description: fieldMapping['description'] !== undefined ? row[fieldMapping['description']]?.trim() || '' : '',
          performerNotes: fieldMapping['performerNotes'] !== undefined ? row[fieldMapping['performerNotes']]?.trim() || '' : '',
          keyPoses: fieldMapping['keyPoses'] !== undefined ? row[fieldMapping['keyPoses']]?.trim() || '' : '',
          talentRequired: fieldMapping['talentRequired'] !== undefined ? row[fieldMapping['talentRequired']]?.trim() || '' : '',
          props: fieldMapping['props'] !== undefined ? row[fieldMapping['props']]?.trim() || '' : '',
          referenceType: 'link',
          referenceUrl: fieldMapping['referenceUrl'] !== undefined ? row[fieldMapping['referenceUrl']]?.trim() || '' : '',
          priority: (fieldMapping['priority'] !== undefined ? row[fieldMapping['priority']]?.trim() : 'Medium') as 'Low' | 'Medium' | 'High' || 'Medium',
          order: i - 1,
        });

        results.imported++;
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to import animations:', error);
    return NextResponse.json(
      { error: 'Failed to import animations' },
      { status: 500 }
    );
  }
}
