import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoteEditor } from './NoteEditor';
import { useNotes } from '../context/NotesContext';
import type { Note } from '../types/note';

vi.mock('../context/NotesContext', () => ({
  useNotes: vi.fn(),
}));

const mockedUseNotes = vi.mocked(useNotes);

// TAG-1(이슈 #1) 시점에는 Note 타입에 tags가 없다 — docs/features/tag/issue-1.md에서 승인된
// 시그니처를 기준으로 미리 tags를 채운 mock 데이터를 쓴다 (Green 단계에서 타입이 맞춰짐).
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

function setupNotesMock(notes: Note[], updateNote = vi.fn().mockResolvedValue(undefined)) {
  mockedUseNotes.mockReturnValue({
    notes,
    isLoading: false,
    error: null,
    createNote: vi.fn().mockResolvedValue(undefined),
    updateNote,
    deleteNote: vi.fn().mockResolvedValue(undefined),
  });
  return { updateNote };
}

describe('NoteEditor', () => {
  beforeEach(() => {
    mockedUseNotes.mockReset();
  });

  describe('태그 추가 (AC-1.1)', () => {
    it('should render a chip when a tag is entered and Enter is pressed', async () => {
      const user = userEvent.setup();
      const note = buildNote({ tags: [] });
      setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      const tagInput = screen.getByPlaceholderText('태그 추가');
      await user.type(tagInput, 'react{Enter}');

      expect(screen.getByText('react')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('should not add a chip when a non-Enter key is pressed', async () => {
      const user = userEvent.setup();
      const note = buildNote({ tags: [] });
      setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      const tagInput = screen.getByPlaceholderText('태그 추가');
      await user.type(tagInput, 'react{Tab}');

      expect(screen.queryByText('react')).not.toBeInTheDocument();
      expect(tagInput).toHaveValue('react');
    });
  });

  describe('저장 전 로컬 상태 (AC-1.2)', () => {
    it('should not call updateNote when a tag is added but save has not been clicked', async () => {
      const user = userEvent.setup();
      const note = buildNote({ tags: [] });
      const { updateNote } = setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      const tagInput = screen.getByPlaceholderText('태그 추가');
      await user.type(tagInput, 'react{Enter}');

      expect(updateNote).not.toHaveBeenCalled();
    });
  });

  describe('저장 (AC-1.3)', () => {
    it('should call updateNote with the tags array when save is clicked', async () => {
      const user = userEvent.setup();
      const note = buildNote({ id: 'n1', title: '제목', content: '내용', tags: [] });
      const { updateNote } = setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      const tagInput = screen.getByPlaceholderText('태그 추가');
      await user.type(tagInput, 'react{Enter}');
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(updateNote).toHaveBeenCalledWith('n1', {
        title: '제목',
        content: '내용',
        tags: ['react'],
      });
    });
  });

  describe('마이그레이션 이전 데이터 방어 (AC-1.4)', () => {
    it('should render an empty tag area without throwing when tags field is missing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const noteWithoutTags = buildNote();
      delete (noteWithoutTags as { tags?: string[] }).tags;
      setupNotesMock([noteWithoutTags]);

      render(
        <NoteEditor selectedNoteId={noteWithoutTags.id} isCreating={false} onDone={vi.fn()} />,
      );

      expect(screen.getByPlaceholderText('태그 추가')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('태그 삭제 (AC-2.1)', () => {
    it('should remove the chip immediately when its delete button is clicked', async () => {
      const user = userEvent.setup();
      const note = buildNote({ tags: ['react', 'typescript'] });
      setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'react 삭제' }));

      expect(screen.queryByText('react')).not.toBeInTheDocument();
      expect(screen.getByText('typescript')).toBeInTheDocument();
    });
  });

  describe('저장 전 로컬 상태 (AC-2.2)', () => {
    it('should not call updateNote when a tag is removed but save has not been clicked', async () => {
      const user = userEvent.setup();
      const note = buildNote({ tags: ['react', 'typescript'] });
      const { updateNote } = setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'react 삭제' }));

      expect(updateNote).not.toHaveBeenCalled();
    });
  });

  describe('저장 (AC-2.3)', () => {
    it('should call updateNote with tags excluding the removed tag when save is clicked', async () => {
      const user = userEvent.setup();
      const note = buildNote({
        id: 'n1',
        title: '제목',
        content: '내용',
        tags: ['react', 'typescript'],
      });
      const { updateNote } = setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'react 삭제' }));
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(updateNote).toHaveBeenCalledWith('n1', {
        title: '제목',
        content: '내용',
        tags: ['typescript'],
      });
    });
  });

  describe('마지막 태그 삭제 (AC-2.4)', () => {
    it('should save an empty tags array when the last remaining tag is removed', async () => {
      const user = userEvent.setup();
      const note = buildNote({ id: 'n1', title: '제목', content: '내용', tags: ['react'] });
      const { updateNote } = setupNotesMock([note]);

      render(<NoteEditor selectedNoteId={note.id} isCreating={false} onDone={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'react 삭제' }));
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(updateNote).toHaveBeenCalledWith('n1', {
        title: '제목',
        content: '내용',
        tags: [],
      });
    });
  });

  describe('노트 전환 시 태그 재동기화', () => {
    it('should show the other note tags when the selected note changes', () => {
      const noteA = buildNote({ id: 'n1', tags: ['react'] });
      const noteB = buildNote({ id: 'n2', tags: ['typescript'] });
      setupNotesMock([noteA, noteB]);

      const { rerender } = render(
        <NoteEditor selectedNoteId={noteA.id} isCreating={false} onDone={vi.fn()} />,
      );
      expect(screen.getByText('react')).toBeInTheDocument();

      rerender(<NoteEditor selectedNoteId={noteB.id} isCreating={false} onDone={vi.fn()} />);

      expect(screen.queryByText('react')).not.toBeInTheDocument();
      expect(screen.getByText('typescript')).toBeInTheDocument();
    });
  });
});
