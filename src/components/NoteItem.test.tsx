import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

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

describe('NoteItem', () => {
  describe('태그 표시 (AC-2.1)', () => {
    it('should render tag chips in the stored order when tags exist', () => {
      const note = buildNote({ tags: ['react', 'work'] });

      render(<NoteItem note={note} isSelected={false} onSelect={vi.fn()} onDelete={vi.fn()} />);

      const tagContainer = screen.getByTestId('note-tags');
      const texts = within(tagContainer)
        .getAllByText(/^(react|work)$/)
        .map((el) => el.textContent);

      expect(texts).toEqual(['react', 'work']);
    });
  });

  describe('태그 영역 생략 (AC-2.2)', () => {
    it('should not render the tag area when tags is an empty array', () => {
      const note = buildNote({ tags: [] });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<NoteItem note={note} isSelected={false} onSelect={vi.fn()} onDelete={vi.fn()} />);

      expect(screen.queryByTestId('note-tags')).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not render the tag area when the tags field itself is missing on a legacy note', () => {
      const note = buildNote();
      delete (note as { tags?: string[] }).tags;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<NoteItem note={note} isSelected={false} onSelect={vi.fn()} onDelete={vi.fn()} />);

      expect(screen.queryByTestId('note-tags')).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
