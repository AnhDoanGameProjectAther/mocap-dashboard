import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, getCharacterFieldMapping } from '@/lib/csv-parser';
import { createCharacter, initTursoDb } from '@/lib/db/turso';

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
    const fieldMapping = getCharacterFieldMapping(headers);

    // Check required fields
    if (fieldMapping['name'] === undefined) {
      return NextResponse.json(
        { error: 'Could not find Character Name column. Expected headers like: Character Name, Name' },
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
        const name = row[fieldMapping['name']]?.trim();
        if (!name) continue; // Skip empty rows

        await createCharacter({
          sessionId,
          name,
          imageUrl: fieldMapping['imageUrl'] !== undefined ? row[fieldMapping['imageUrl']]?.trim() || '' : '',
          description: fieldMapping['description'] !== undefined ? row[fieldMapping['description']]?.trim() || '' : '',
          weaponName: fieldMapping['weaponName'] !== undefined ? row[fieldMapping['weaponName']]?.trim() || '' : '',
          weaponImageUrl: fieldMapping['weaponImageUrl'] !== undefined ? row[fieldMapping['weaponImageUrl']]?.trim() || '' : '',
        });

        results.imported++;
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to import characters:', error);
    return NextResponse.json(
      { error: 'Failed to import characters' },
      { status: 500 }
    );
  }
}
