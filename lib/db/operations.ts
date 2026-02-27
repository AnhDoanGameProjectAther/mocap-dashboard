import db from './index';
import type { Session, Animation, ChecklistItem, CallsheetInfo, SessionWithDetails } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to parse JSON fields
function parseSession(row: any): Session {
  return {
    ...row,
    team: JSON.parse(row.team || '[]'),
  };
}

// Sessions
export function getAllSessions(): Session[] {
  const stmt = db.prepare('SELECT * FROM sessions ORDER BY date, startTime');
  return stmt.all().map(parseSession);
}

export function getSessionsByMonth(year: number, month: number): Session[] {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const stmt = db.prepare(
    'SELECT * FROM sessions WHERE date >= ? AND date < ? ORDER BY date, startTime'
  );
  return stmt.all(startDate, endDate).map(parseSession);
}

export function getSession(id: string): Session | null {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const row = stmt.get(id);
  return row ? parseSession(row) : null;
}

export function getSessionWithDetails(id: string): SessionWithDetails | null {
  const session = getSession(id);
  if (!session) return null;

  const animationsStmt = db.prepare('SELECT * FROM animations WHERE sessionId = ? ORDER BY "order"');
  const checklistStmt = db.prepare('SELECT * FROM checklist WHERE sessionId = ? ORDER BY category, task');
  const callsheetStmt = db.prepare('SELECT * FROM callsheets WHERE sessionId = ?');

  const animations = animationsStmt.all(id) as Animation[];
  const checklist = checklistStmt.all(id).map((row: any) => ({
    ...row,
    completed: Boolean(row.completed),
  })) as ChecklistItem[];
  const callsheet = callsheetStmt.get(id) as CallsheetInfo | null;

  return { ...session, animations, checklist, callsheet };
}

export function createSession(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Session {
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, title, date, startTime, endTime, location, status, notes, team, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.title,
    data.date,
    data.startTime,
    data.endTime,
    data.location,
    data.status,
    data.notes,
    JSON.stringify(data.team),
    now,
    now
  );

  // Create default callsheet
  const callsheetStmt = db.prepare(`
    INSERT INTO callsheets (sessionId) VALUES (?)
  `);
  callsheetStmt.run(id);

  // Create default checklist items
  const defaultChecklist = [
    { category: 'equipment', task: 'Mocap suits cleaned and charged' },
    { category: 'equipment', task: 'Cameras calibrated' },
    { category: 'talent', task: 'Talent confirmed availability' },
    { category: 'talent', task: 'Wardrobe fitted' },
    { category: 'location', task: 'Studio booked and accessible' },
    { category: 'files', task: 'Animation list finalized' },
  ];

  const checklistStmt = db.prepare(`
    INSERT INTO checklist (id, sessionId, category, task, completed)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const item of defaultChecklist) {
    checklistStmt.run(uuidv4(), id, item.category, item.task, 0);
  }

  return getSession(id)!;
}

export function updateSession(id: string, data: Partial<Session>): Session {
  const sets: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.date !== undefined) { sets.push('date = ?'); values.push(data.date); }
  if (data.startTime !== undefined) { sets.push('startTime = ?'); values.push(data.startTime); }
  if (data.endTime !== undefined) { sets.push('endTime = ?'); values.push(data.endTime); }
  if (data.location !== undefined) { sets.push('location = ?'); values.push(data.location); }
  if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
  if (data.notes !== undefined) { sets.push('notes = ?'); values.push(data.notes); }
  if (data.team !== undefined) { sets.push('team = ?'); values.push(JSON.stringify(data.team)); }

  sets.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const stmt = db.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getSession(id)!;
}

export function deleteSession(id: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  stmt.run(id);
}

// Animations
export function createAnimation(data: Omit<Animation, 'id'>): Animation {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO animations (id, sessionId, character, shotId, moveName, duration, description, performerNotes, keyPoses, talentRequired, props, referenceType, referenceUrl, priority, "order")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.sessionId,
    data.character,
    data.shotId,
    data.moveName,
    data.duration,
    data.description,
    data.performerNotes,
    data.keyPoses,
    data.talentRequired,
    data.props,
    data.referenceType,
    data.referenceUrl,
    data.priority,
    data.order
  );

  return { ...data, id };
}

export function updateAnimation(id: string, data: Partial<Animation>): Animation {
  const sets: string[] = [];
  const values: any[] = [];

  if (data.character !== undefined) { sets.push('character = ?'); values.push(data.character); }
  if (data.shotId !== undefined) { sets.push('shotId = ?'); values.push(data.shotId); }
  if (data.moveName !== undefined) { sets.push('moveName = ?'); values.push(data.moveName); }
  if (data.duration !== undefined) { sets.push('duration = ?'); values.push(data.duration); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.performerNotes !== undefined) { sets.push('performerNotes = ?'); values.push(data.performerNotes); }
  if (data.keyPoses !== undefined) { sets.push('keyPoses = ?'); values.push(data.keyPoses); }
  if (data.talentRequired !== undefined) { sets.push('talentRequired = ?'); values.push(data.talentRequired); }
  if (data.props !== undefined) { sets.push('props = ?'); values.push(data.props); }
  if (data.referenceType !== undefined) { sets.push('referenceType = ?'); values.push(data.referenceType); }
  if (data.referenceUrl !== undefined) { sets.push('referenceUrl = ?'); values.push(data.referenceUrl); }
  if (data.priority !== undefined) { sets.push('priority = ?'); values.push(data.priority); }
  if (data.order !== undefined) { sets.push('"order" = ?'); values.push(data.order); }

  values.push(id);

  const stmt = db.prepare(`UPDATE animations SET ${sets.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  const selectStmt = db.prepare('SELECT * FROM animations WHERE id = ?');
  return selectStmt.get(id) as Animation;
}

export function deleteAnimation(id: string): void {
  const stmt = db.prepare('DELETE FROM animations WHERE id = ?');
  stmt.run(id);
}

// Checklist
export function toggleChecklistItem(id: string, completed: boolean): void {
  const stmt = db.prepare('UPDATE checklist SET completed = ? WHERE id = ?');
  stmt.run(completed ? 1 : 0, id);
}

export function addChecklistItem(sessionId: string, category: ChecklistItem['category'], task: string, owner?: string): ChecklistItem {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO checklist (id, sessionId, category, task, completed, owner)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, sessionId, category, task, 0, owner || '');

  return {
    id,
    sessionId,
    category,
    task,
    completed: false,
    owner,
  };
}

export function deleteChecklistItem(id: string): void {
  const stmt = db.prepare('DELETE FROM checklist WHERE id = ?');
  stmt.run(id);
}

// Callsheet
export function updateCallsheet(sessionId: string, data: Partial<CallsheetInfo>): CallsheetInfo {
  const existing = db.prepare('SELECT * FROM callsheets WHERE sessionId = ?').get(sessionId);

  if (!existing) {
    const stmt = db.prepare(`
      INSERT INTO callsheets (sessionId, producer, director, contactPhone, parkingInfo, callTime, wrapTime, specialInstructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      sessionId,
      data.producer || '',
      data.director || '',
      data.contactPhone || '',
      data.parkingInfo || '',
      data.callTime || '',
      data.wrapTime || '',
      data.specialInstructions || ''
    );
  } else {
    const sets: string[] = [];
    const values: any[] = [];

    if (data.producer !== undefined) { sets.push('producer = ?'); values.push(data.producer); }
    if (data.director !== undefined) { sets.push('director = ?'); values.push(data.director); }
    if (data.contactPhone !== undefined) { sets.push('contactPhone = ?'); values.push(data.contactPhone); }
    if (data.parkingInfo !== undefined) { sets.push('parkingInfo = ?'); values.push(data.parkingInfo); }
    if (data.callTime !== undefined) { sets.push('callTime = ?'); values.push(data.callTime); }
    if (data.wrapTime !== undefined) { sets.push('wrapTime = ?'); values.push(data.wrapTime); }
    if (data.specialInstructions !== undefined) { sets.push('specialInstructions = ?'); values.push(data.specialInstructions); }

    values.push(sessionId);

    const stmt = db.prepare(`UPDATE callsheets SET ${sets.join(', ')} WHERE sessionId = ?`);
    stmt.run(...values);
  }

  return db.prepare('SELECT * FROM callsheets WHERE sessionId = ?').get(sessionId) as CallsheetInfo;
}
