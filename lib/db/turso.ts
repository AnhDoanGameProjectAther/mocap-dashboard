import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import type { Session, Animation, ChecklistItem, CallsheetInfo, Character } from '@/types';

// Turso database client
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/mocap.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize schema
export async function initTursoDb() {
  // Sessions table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT CHECK(status IN ('planned', 'confirmed', 'completed', 'cancelled')) DEFAULT 'planned',
      notes TEXT DEFAULT '',
      team TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Animations table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS animations (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      character TEXT NOT NULL,
      shotId TEXT NOT NULL,
      moveName TEXT NOT NULL,
      duration TEXT DEFAULT '',
      description TEXT DEFAULT '',
      performerNotes TEXT DEFAULT '',
      keyPoses TEXT DEFAULT '',
      talentRequired TEXT DEFAULT '',
      props TEXT DEFAULT '',
      referenceType TEXT CHECK(referenceType IN ('link', 'file')) DEFAULT 'link',
      referenceUrl TEXT DEFAULT '',
      priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
      "order" INTEGER DEFAULT 0
    )
  `);

  // Checklist items table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS checklist (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      category TEXT CHECK(category IN ('equipment', 'talent', 'location', 'files')) NOT NULL,
      task TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      owner TEXT DEFAULT ''
    )
  `);

  // Callsheet table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS callsheets (
      sessionId TEXT PRIMARY KEY,
      producer TEXT DEFAULT '',
      director TEXT DEFAULT '',
      contactPhone TEXT DEFAULT '',
      parkingInfo TEXT DEFAULT '',
      callTime TEXT DEFAULT '',
      wrapTime TEXT DEFAULT '',
      specialInstructions TEXT DEFAULT ''
    )
  `);

  // Characters table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      name TEXT NOT NULL,
      imageUrl TEXT DEFAULT '',
      description TEXT DEFAULT '',
      weaponName TEXT DEFAULT '',
      weaponImageUrl TEXT DEFAULT '',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Sessions
export async function getAllSessions(): Promise<Session[]> {
  const result = await turso.execute('SELECT * FROM sessions ORDER BY date, startTime');
  return result.rows.map(row => ({
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    startTime: row.startTime as string,
    endTime: row.endTime as string,
    location: row.location as string,
    status: row.status as Session['status'],
    notes: row.notes as string,
    team: JSON.parse((row.team as string) || '[]'),
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }));
}

export async function getSessionsByMonth(year: number, month: number): Promise<Session[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const result = await turso.execute(
    'SELECT * FROM sessions WHERE date >= ? AND date < ? ORDER BY date, startTime',
    [startDate, endDate]
  );
  return result.rows.map(row => ({
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    startTime: row.startTime as string,
    endTime: row.endTime as string,
    location: row.location as string,
    status: row.status as Session['status'],
    notes: row.notes as string,
    team: JSON.parse((row.team as string) || '[]'),
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }));
}

export async function getSession(id: string): Promise<Session | null> {
  const result = await turso.execute('SELECT * FROM sessions WHERE id = ?', [id]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    startTime: row.startTime as string,
    endTime: row.endTime as string,
    location: row.location as string,
    status: row.status as Session['status'],
    notes: row.notes as string,
    team: JSON.parse((row.team as string) || '[]'),
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export async function getSessionWithDetails(id: string) {
  const session = await getSession(id);
  if (!session) return null;

  const [animationsResult, checklistResult, callsheetResult, charactersResult] = await Promise.all([
    turso.execute('SELECT * FROM animations WHERE sessionId = ? ORDER BY "order"', [id]),
    turso.execute('SELECT * FROM checklist WHERE sessionId = ? ORDER BY category, task', [id]),
    turso.execute('SELECT * FROM callsheets WHERE sessionId = ?', [id]),
    turso.execute('SELECT * FROM characters WHERE sessionId = ? ORDER BY name', [id]),
  ]);

  const animations: Animation[] = animationsResult.rows.map(row => ({
    id: row.id as string,
    sessionId: row.sessionId as string,
    character: row.character as string,
    shotId: row.shotId as string,
    moveName: row.moveName as string,
    duration: row.duration as string,
    description: row.description as string,
    performerNotes: row.performerNotes as string,
    keyPoses: row.keyPoses as string,
    talentRequired: row.talentRequired as string,
    props: row.props as string,
    referenceType: row.referenceType as Animation['referenceType'],
    referenceUrl: row.referenceUrl as string,
    priority: row.priority as Animation['priority'],
    order: row.order as number,
  }));

  const checklist: ChecklistItem[] = checklistResult.rows.map(row => ({
    id: row.id as string,
    sessionId: row.sessionId as string,
    category: row.category as ChecklistItem['category'],
    task: row.task as string,
    completed: Boolean(row.completed),
    owner: row.owner as string,
  }));

  const callsheetRow = callsheetResult.rows[0];
  const callsheet: CallsheetInfo | null = callsheetRow ? {
    sessionId: callsheetRow.sessionId as string,
    producer: callsheetRow.producer as string,
    director: callsheetRow.director as string,
    contactPhone: callsheetRow.contactPhone as string,
    parkingInfo: callsheetRow.parkingInfo as string,
    callTime: callsheetRow.callTime as string,
    wrapTime: callsheetRow.wrapTime as string,
    specialInstructions: callsheetRow.specialInstructions as string,
  } : null;

  const characters: Character[] = charactersResult.rows.map(row => ({
    id: row.id as string,
    sessionId: row.sessionId as string,
    name: row.name as string,
    imageUrl: row.imageUrl as string,
    description: row.description as string,
    weaponName: row.weaponName as string,
    weaponImageUrl: row.weaponImageUrl as string,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }));

  return {
    ...session,
    animations,
    checklist,
    callsheet,
    characters,
  };
}

export async function createSession(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
  const id = uuidv4();
  const now = new Date().toISOString();

  await turso.execute({
    sql: `INSERT INTO sessions (id, title, date, startTime, endTime, location, status, notes, team, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
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
      now,
    ],
  });

  // Create default callsheet
  await turso.execute({
    sql: 'INSERT INTO callsheets (sessionId) VALUES (?)',
    args: [id],
  });

  // Create default checklist items
  const defaultChecklist = [
    { category: 'equipment', task: 'Mocap suits cleaned and charged' },
    { category: 'equipment', task: 'Cameras calibrated' },
    { category: 'talent', task: 'Talent confirmed availability' },
    { category: 'talent', task: 'Wardrobe fitted' },
    { category: 'location', task: 'Studio booked and accessible' },
    { category: 'files', task: 'Animation list finalized' },
  ];

  for (const item of defaultChecklist) {
    await turso.execute({
      sql: 'INSERT INTO checklist (id, sessionId, category, task, completed) VALUES (?, ?, ?, ?, ?)',
      args: [uuidv4(), id, item.category, item.task, 0],
    });
  }

  return (await getSession(id))!;
}

export async function updateSession(id: string, data: Partial<Session>): Promise<Session> {
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

  await turso.execute({
    sql: `UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`,
    args: values,
  });

  return (await getSession(id))!;
}

export async function deleteSession(id: string): Promise<void> {
  await turso.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [id] });
}

// Animations
export async function createAnimation(data: Omit<Animation, 'id'>): Promise<Animation> {
  const id = uuidv4();

  const animationData = {
    character: data.character || '',
    shotId: data.shotId || '',
    moveName: data.moveName || '',
    duration: data.duration || '',
    description: data.description || '',
    performerNotes: data.performerNotes || '',
    keyPoses: data.keyPoses || '',
    talentRequired: data.talentRequired || '',
    props: data.props || '',
    referenceType: data.referenceType || 'link',
    referenceUrl: data.referenceUrl || '',
    priority: data.priority || 'Medium',
    order: data.order ?? 0,
    sessionId: data.sessionId,
  };

  await turso.execute({
    sql: `INSERT INTO animations (id, sessionId, character, shotId, moveName, duration, description, performerNotes, keyPoses, talentRequired, props, referenceType, referenceUrl, priority, "order")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      animationData.sessionId,
      animationData.character,
      animationData.shotId,
      animationData.moveName,
      animationData.duration,
      animationData.description,
      animationData.performerNotes,
      animationData.keyPoses,
      animationData.talentRequired,
      animationData.props,
      animationData.referenceType,
      animationData.referenceUrl,
      animationData.priority,
      animationData.order,
    ],
  });

  return { ...animationData, id };
}

export async function updateAnimation(id: string, data: Partial<Animation>): Promise<Animation> {
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

  await turso.execute({
    sql: `UPDATE animations SET ${sets.join(', ')} WHERE id = ?`,
    args: values,
  });

  const result = await turso.execute('SELECT * FROM animations WHERE id = ?', [id]);
  const row = result.rows[0];
  return {
    id: row.id as string,
    sessionId: row.sessionId as string,
    character: row.character as string,
    shotId: row.shotId as string,
    moveName: row.moveName as string,
    duration: row.duration as string,
    description: row.description as string,
    performerNotes: row.performerNotes as string,
    keyPoses: row.keyPoses as string,
    talentRequired: row.talentRequired as string,
    props: row.props as string,
    referenceType: row.referenceType as Animation['referenceType'],
    referenceUrl: row.referenceUrl as string,
    priority: row.priority as Animation['priority'],
    order: row.order as number,
  };
}

export async function deleteAnimation(id: string): Promise<void> {
  await turso.execute({ sql: 'DELETE FROM animations WHERE id = ?', args: [id] });
}

// Checklist
export async function toggleChecklistItem(id: string, completed: boolean): Promise<void> {
  await turso.execute({
    sql: 'UPDATE checklist SET completed = ? WHERE id = ?',
    args: [completed ? 1 : 0, id],
  });
}

export async function addChecklistItem(sessionId: string, category: ChecklistItem['category'], task: string, owner?: string): Promise<ChecklistItem> {
  const id = uuidv4();

  await turso.execute({
    sql: 'INSERT INTO checklist (id, sessionId, category, task, completed, owner) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, sessionId, category, task, 0, owner || ''],
  });

  return {
    id,
    sessionId,
    category,
    task,
    completed: false,
    owner,
  };
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await turso.execute({ sql: 'DELETE FROM checklist WHERE id = ?', args: [id] });
}

// Callsheet
export async function updateCallsheet(sessionId: string, data: Partial<CallsheetInfo>): Promise<CallsheetInfo> {
  const existing = await turso.execute('SELECT * FROM callsheets WHERE sessionId = ?', [sessionId]);

  if (existing.rows.length === 0) {
    await turso.execute({
      sql: `INSERT INTO callsheets (sessionId, producer, director, contactPhone, parkingInfo, callTime, wrapTime, specialInstructions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        sessionId,
        data.producer || '',
        data.director || '',
        data.contactPhone || '',
        data.parkingInfo || '',
        data.callTime || '',
        data.wrapTime || '',
        data.specialInstructions || '',
      ],
    });
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

    await turso.execute({
      sql: `UPDATE callsheets SET ${sets.join(', ')} WHERE sessionId = ?`,
      args: values,
    });
  }

  const result = await turso.execute('SELECT * FROM callsheets WHERE sessionId = ?', [sessionId]);
  const row = result.rows[0];
  return {
    sessionId: row.sessionId as string,
    producer: row.producer as string,
    director: row.director as string,
    contactPhone: row.contactPhone as string,
    parkingInfo: row.parkingInfo as string,
    callTime: row.callTime as string,
    wrapTime: row.wrapTime as string,
    specialInstructions: row.specialInstructions as string,
  };
}

// Characters
export async function getCharactersBySession(sessionId: string): Promise<Character[]> {
  const result = await turso.execute('SELECT * FROM characters WHERE sessionId = ? ORDER BY name', [sessionId]);
  return result.rows.map(row => ({
    id: row.id as string,
    sessionId: row.sessionId as string,
    name: row.name as string,
    imageUrl: row.imageUrl as string,
    description: row.description as string,
    weaponName: row.weaponName as string,
    weaponImageUrl: row.weaponImageUrl as string,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }));
}

export async function createCharacter(data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
  const id = uuidv4();
  const now = new Date().toISOString();

  await turso.execute({
    sql: `INSERT INTO characters (id, sessionId, name, imageUrl, description, weaponName, weaponImageUrl, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.sessionId, data.name, data.imageUrl || '', data.description || '', data.weaponName || '', data.weaponImageUrl || '', now, now],
  });

  return {
    id,
    sessionId: data.sessionId,
    name: data.name,
    imageUrl: data.imageUrl || '',
    description: data.description || '',
    weaponName: data.weaponName || '',
    weaponImageUrl: data.weaponImageUrl || '',
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
  const sets: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.imageUrl !== undefined) { sets.push('imageUrl = ?'); values.push(data.imageUrl); }
  if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
  if (data.weaponName !== undefined) { sets.push('weaponName = ?'); values.push(data.weaponName); }
  if (data.weaponImageUrl !== undefined) { sets.push('weaponImageUrl = ?'); values.push(data.weaponImageUrl); }

  sets.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);

  await turso.execute({
    sql: `UPDATE characters SET ${sets.join(', ')} WHERE id = ?`,
    args: values,
  });

  const result = await turso.execute('SELECT * FROM characters WHERE id = ?', [id]);
  const row = result.rows[0];
  return {
    id: row.id as string,
    sessionId: row.sessionId as string,
    name: row.name as string,
    imageUrl: row.imageUrl as string,
    description: row.description as string,
    weaponName: row.weaponName as string,
    weaponImageUrl: row.weaponImageUrl as string,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  };
}

export async function deleteCharacter(id: string): Promise<void> {
  await turso.execute({ sql: 'DELETE FROM characters WHERE id = ?', args: [id] });
}
