import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagFilterBar } from './TagFilterBar';
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

describe('TagFilterBar', () => {
  beforeEach(() => {
    mockedUseNotes.mockReset();
  });

  describe('고유 태그 렌더링 (AC-1.1)', () => {
    it('should render unique tags in alphabetical order with an all chip when notes have tags', () => {
      setupNotesMock([
        buildNote({ id: 'n1', tags: ['work'] }),
        buildNote({ id: 'n2', tags: ['ideas'] }),
        buildNote({ id: 'n3', tags: ['work'] }),
      ]);

      render(<TagFilterBar selectedTag={null} onSelectTag={vi.fn()} />);

      const chipLabels = screen.getAllByRole('button').map((btn) => btn.textContent);
      expect(chipLabels).toEqual(['전체', 'ideas', 'work']);
    });
  });

  describe('태그 없음 (AC-1.2)', () => {
    it('should render nothing when no notes have tags', () => {
      const noteWithoutTagsField = buildNote({ id: 'n2' });
      delete (noteWithoutTagsField as { tags?: string[] }).tags;
      setupNotesMock([buildNote({ id: 'n1', tags: [] }), noteWithoutTagsField]);

      const { container } = render(<TagFilterBar selectedTag={null} onSelectTag={vi.fn()} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('태그 선택 (AC-1.3)', () => {
    it('should call onSelectTag with the tag name when an unselected chip is clicked', async () => {
      const user = userEvent.setup();
      setupNotesMock([
        buildNote({ id: 'n1', tags: ['work'] }),
        buildNote({ id: 'n2', tags: ['ideas'] }),
      ]);
      const onSelectTag = vi.fn();

      render(<TagFilterBar selectedTag={null} onSelectTag={onSelectTag} />);
      await user.click(screen.getByRole('button', { name: 'work' }));

      expect(onSelectTag).toHaveBeenCalledWith('work');
      expect(onSelectTag).toHaveBeenCalledTimes(1);
    });
  });

  describe('토글 해제 (AC-1.4)', () => {
    it('should call onSelectTag with null when the already-selected chip is clicked again', async () => {
      const user = userEvent.setup();
      setupNotesMock([buildNote({ id: 'n1', tags: ['work'] })]);
      const onSelectTag = vi.fn();

      render(<TagFilterBar selectedTag="work" onSelectTag={onSelectTag} />);
      await user.click(screen.getByRole('button', { name: 'work' }));

      expect(onSelectTag).toHaveBeenCalledWith(null);
    });
  });

  describe('전체 클릭 (AC-1.5)', () => {
    it('should call onSelectTag with null when the all chip is clicked', async () => {
      const user = userEvent.setup();
      setupNotesMock([buildNote({ id: 'n1', tags: ['work'] })]);
      const onSelectTag = vi.fn();

      render(<TagFilterBar selectedTag="work" onSelectTag={onSelectTag} />);
      await user.click(screen.getByRole('button', { name: '전체' }));

      expect(onSelectTag).toHaveBeenCalledWith(null);
    });
  });

  describe('활성 표시 (AC-1.4 후반부)', () => {
    it('should mark the selected chip as pressed and others as not pressed', () => {
      setupNotesMock([
        buildNote({ id: 'n1', tags: ['work'] }),
        buildNote({ id: 'n2', tags: ['ideas'] }),
      ]);

      render(<TagFilterBar selectedTag="work" onSelectTag={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'work' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'ideas' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('should mark the all chip as pressed when selectedTag is null', () => {
      setupNotesMock([buildNote({ id: 'n1', tags: ['work'] })]);

      render(<TagFilterBar selectedTag={null} onSelectTag={vi.fn()} />);

      expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'work' })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('태그 전환 (FR-2)', () => {
    it('should call onSelectTag with the new tag when a different chip is clicked while one is selected', async () => {
      const user = userEvent.setup();
      setupNotesMock([
        buildNote({ id: 'n1', tags: ['react'] }),
        buildNote({ id: 'n2', tags: ['work'] }),
      ]);
      const onSelectTag = vi.fn();

      render(<TagFilterBar selectedTag="react" onSelectTag={onSelectTag} />);
      await user.click(screen.getByRole('button', { name: 'work' }));

      expect(onSelectTag).toHaveBeenCalledWith('work');
    });
  });
});
