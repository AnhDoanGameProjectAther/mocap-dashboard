export interface Session {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  team: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Animation {
  id: string;
  sessionId: string;
  character: string;
  shotId: string;
  moveName: string;
  duration: string;
  description: string;
  performerNotes: string;
  keyPoses: string;
  talentRequired: string;
  props: string;
  referenceType: 'link' | 'file';
  referenceUrl: string;
  priority: 'Low' | 'Medium' | 'High';
  order: number;
}

export interface ChecklistItem {
  id: string;
  sessionId: string;
  category: 'equipment' | 'talent' | 'location' | 'files';
  task: string;
  completed: boolean;
  owner?: string;
}

export interface CallsheetInfo {
  sessionId: string;
  producer: string;
  director: string;
  contactPhone: string;
  parkingInfo: string;
  callTime: string;
  wrapTime: string;
  specialInstructions: string;
}

export type SessionWithDetails = Session & {
  animations: Animation[];
  checklist: ChecklistItem[];
  callsheet: CallsheetInfo | null;
};
