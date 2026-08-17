import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesProvider, useNotes } from './NotesContext';
import * as api from '../api/notes';
import type { Note } from '../types/note';

vi.mock('../api/notes');

const mockedApi = vi.mocked(api);

function buildNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: '제목',
    content: '내용',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    ...overrides,
  };
}

describe('NotesContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('updateNote (AC-1.3 후반부 — 새로고침 후 유지)', () => {
    it('should reflect the server response tags in notes state after updateNote resolves', async () => {
      const initialNote = buildNote({ tags: [] });
      mockedApi.fetchNotes.mockResolvedValue([initialNote]);
      mockedApi.updateNote.mockResolvedValue(buildNote({ tags: ['react'] }));

      const { result } = renderHook(() => useNotes(), { wrapper: NotesProvider });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateNote('n1', { title: '제목', content: '내용', tags: ['react'] });
      });

      const updatedNote = result.current.notes.find((n) => n.id === 'n1');
      expect(updatedNote?.tags).toEqual(['react']);
    });
  });

  describe('createNote (이슈 #8 — tags 전달)', () => {
    it('should forward tags to api.createNote and reflect them in notes state', async () => {
      mockedApi.fetchNotes.mockResolvedValue([]);
      mockedApi.createNote.mockResolvedValue(buildNote({ id: 'n2', tags: ['bug-fix'] }));

      const { result } = renderHook(() => useNotes(), { wrapper: NotesProvider });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.createNote('제목', '내용', ['bug-fix']);
      });

      expect(mockedApi.createNote).toHaveBeenCalledWith({
        title: '제목',
        content: '내용',
        tags: ['bug-fix'],
      });
      expect(result.current.notes.find((n) => n.id === 'n2')?.tags).toEqual(['bug-fix']);
    });
  });

  describe('새로고침 후 유지 (AC-1.3 후반부, 재마운트 시뮬레이션)', () => {
    it('should keep the updated tags after the provider remounts and refetches', async () => {
      mockedApi.fetchNotes.mockResolvedValueOnce([buildNote({ tags: [] })]);
      mockedApi.updateNote.mockResolvedValue(buildNote({ tags: ['react'] }));

      const first = renderHook(() => useNotes(), { wrapper: NotesProvider });
      await waitFor(() => expect(first.result.current.isLoading).toBe(false));

      await act(async () => {
        await first.result.current.updateNote('n1', {
          title: '제목',
          content: '내용',
          tags: ['react'],
        });
      });

      first.unmount();

      mockedApi.fetchNotes.mockResolvedValueOnce([buildNote({ tags: ['react'] })]);

      const second = renderHook(() => useNotes(), { wrapper: NotesProvider });
      await waitFor(() => expect(second.result.current.isLoading).toBe(false));

      const reloadedNote = second.result.current.notes.find((n) => n.id === 'n1');
      expect(reloadedNote?.tags).toEqual(['react']);
    });
  });
});
