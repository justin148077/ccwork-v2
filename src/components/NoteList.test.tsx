import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteList } from './NoteList';
import { useNotes } from '../context/NotesContext';
import type { Note } from '../types/note';

vi.mock('../context/NotesContext', () => ({
  useNotes: vi.fn(),
}));

const mockedUseNotes = vi.mocked(useNotes);

function buildNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '제목',
    content: '내용',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    ...overrides,
  } as Note;
}

function setupNotesMock(notes: Note[]) {
  mockedUseNotes.mockReturnValue({
    notes,
    isLoading: false,
    error: null,
    createNote: vi.fn().mockResolvedValue(undefined),
    updateNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
  });
}

describe('NoteList', () => {
  beforeEach(() => {
    mockedUseNotes.mockReset();
  });

  describe('태그 필터링 (AC-1.3, FR-3)', () => {
    it('should render only notes with the selected tag and update the count', () => {
      setupNotesMock([
        buildNote({ id: 'n1', title: 'react 노트', tags: ['react'] }),
        buildNote({ id: 'n2', title: 'work 노트', tags: ['work'] }),
        buildNote({ id: 'n3', title: '태그 없는 노트', tags: [] }),
      ]);

      render(<NoteList selectedNoteId={null} onSelect={vi.fn()} selectedTag="react" />);

      expect(screen.getByText('react 노트')).toBeInTheDocument();
      expect(screen.queryByText('work 노트')).not.toBeInTheDocument();
      expect(screen.queryByText('태그 없는 노트')).not.toBeInTheDocument();
      expect(screen.getByText('노트 1개')).toBeInTheDocument();
    });
  });

  describe('필터 없음 (회귀)', () => {
    it('should render all notes and the full count when selectedTag is null', () => {
      setupNotesMock([
        buildNote({ id: 'n1', title: 'react 노트', tags: ['react'] }),
        buildNote({ id: 'n2', title: 'work 노트', tags: ['work'] }),
        buildNote({ id: 'n3', title: '태그 없는 노트', tags: [] }),
      ]);

      render(<NoteList selectedNoteId={null} onSelect={vi.fn()} selectedTag={null} />);

      expect(screen.getByText('react 노트')).toBeInTheDocument();
      expect(screen.getByText('work 노트')).toBeInTheDocument();
      expect(screen.getByText('태그 없는 노트')).toBeInTheDocument();
      expect(screen.getByText('노트 3개')).toBeInTheDocument();
    });
  });
});
