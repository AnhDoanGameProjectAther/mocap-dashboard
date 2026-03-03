// CSV Parser utility for importing data

export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of cell
      currentLine.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      // End of line
      if (currentCell || currentLine.length > 0) {
        currentLine.push(currentCell.trim());
        if (currentLine.some(cell => cell.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentCell = '';
      }
      // Skip \r\n sequence
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentCell += char;
    }
  }

  // Don't forget the last cell/line
  if (currentCell || currentLine.length > 0) {
    currentLine.push(currentCell.trim());
    if (currentLine.some(cell => cell.length > 0)) {
      lines.push(currentLine);
    }
  }

  return lines;
}

// Map CSV headers to field names
export function mapHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, ''));

  normalizedHeaders.forEach((header, index) => {
    mapping[header] = index;
  });

  return mapping;
}

// Animation field mappings (flexible header matching)
export function getAnimationFieldMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  normalizedHeaders.forEach((header, index) => {
    // Character / Char
    if (header.includes('character') || header === 'char') {
      mapping['character'] = index;
    }
    // Shot ID / Shot
    else if (header.includes('shot') || header === 'shotid') {
      mapping['shotId'] = index;
    }
    // Move Name / Move / Animation / Anim Name
    else if (header.includes('move') || header.includes('anim') || header === 'name') {
      mapping['moveName'] = index;
    }
    // Duration
    else if (header.includes('duration') || header.includes('time')) {
      mapping['duration'] = index;
    }
    // Description / Desc
    else if (header.includes('desc')) {
      mapping['description'] = index;
    }
    // Performer Notes / Notes / Instructions
    else if (header.includes('performer') || header.includes('instruction') ||
             (header.includes('note') && !header.includes('key'))) {
      mapping['performerNotes'] = index;
    }
    // Key Poses / Poses
    else if (header.includes('pose') || header.includes('key')) {
      mapping['keyPoses'] = index;
    }
    // Talent Required / Talent
    else if (header.includes('talent')) {
      mapping['talentRequired'] = index;
    }
    // Props
    else if (header.includes('prop')) {
      mapping['props'] = index;
    }
    // Reference / Ref
    else if (header.includes('ref') || header === 'link' || header === 'url') {
      mapping['referenceUrl'] = index;
    }
    // Priority
    else if (header.includes('priority') || header.includes('level')) {
      mapping['priority'] = index;
    }
  });

  return mapping;
}

// Character field mappings
export function getCharacterFieldMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  normalizedHeaders.forEach((header, index) => {
    // Character Name / Name
    if ((header.includes('character') && header.includes('name')) ||
        header === 'name' || header === 'charname') {
      mapping['name'] = index;
    }
    // Character Image / Image / CharacterImage
    else if ((header.includes('character') && header.includes('image')) ||
             header === 'image' || header === 'imageurl' || header === 'charimage') {
      mapping['imageUrl'] = index;
    }
    // Description / Desc
    else if (header.includes('desc')) {
      mapping['description'] = index;
    }
    // Weapon Name / Weapon
    else if (header.includes('weapon') && !header.includes('image')) {
      mapping['weaponName'] = index;
    }
    // Weapon Image
    else if (header.includes('weapon') && header.includes('image')) {
      mapping['weaponImageUrl'] = index;
    }
  });

  return mapping;
}

// Callsheet field mappings
export function getCallsheetFieldMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  normalizedHeaders.forEach((header, index) => {
    // Producer
    if (header.includes('producer')) {
      mapping['producer'] = index;
    }
    // Director
    else if (header.includes('director')) {
      mapping['director'] = index;
    }
    // Contact Phone / Phone
    else if (header.includes('phone') || header.includes('contact')) {
      mapping['contactPhone'] = index;
    }
    // Parking Info / Parking
    else if (header.includes('park')) {
      mapping['parkingInfo'] = index;
    }
    // Call Time
    else if (header.includes('call') && header.includes('time')) {
      mapping['callTime'] = index;
    }
    // Wrap Time
    else if (header.includes('wrap')) {
      mapping['wrapTime'] = index;
    }
    // Special Instructions / Instructions
    else if (header.includes('instruction') || header.includes('special')) {
      mapping['specialInstructions'] = index;
    }
  });

  return mapping;
}
