import { Note } from '../types/note';

const API_URL = 'http://localhost:3001';

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${API_URL}/notes`);
  if (!res.ok) throw new Error('노트를 불러오는데 실패했습니다');
  return res.json();
}

export async function createNote(
  note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'tags'> & { tags?: string[] },
): Promise<Note> {
  const now = new Date().toISOString();
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...note, tags: note.tags ?? [], createdAt: now, updatedAt: now }),
  });
  if (!res.ok) throw new Error('노트 생성에 실패했습니다');
  return res.json();
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error('노트 수정에 실패했습니다');
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('노트 삭제에 실패했습니다');
}
