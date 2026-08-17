import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App } from './App';
import * as api from './api/notes';

vi.mock('./api/notes');

const mockedApi = vi.mocked(api);

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('태그 필터 통합 흐름 (AC-1.3~1.5)', () => {
    it('should filter by a clicked chip, toggle it off, and reset via the all chip', async () => {
      const user = userEvent.setup();
      mockedApi.fetchNotes.mockResolvedValue([
        {
          id: 'n1',
          title: 'react 노트',
          content: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tags: ['react'],
        },
        {
          id: 'n2',
          title: 'work 노트',
          content: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tags: ['work'],
        },
        {
          id: 'n3',
          title: '태그 없는 노트',
          content: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tags: [],
        },
      ]);

      render(<App />);

      await screen.findByText('노트 3개');

      await user.click(screen.getByRole('button', { name: 'react' }));
      expect(await screen.findByText('노트 1개')).toBeInTheDocument();
      expect(screen.queryByText('work 노트')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'react' }));
      expect(await screen.findByText('노트 3개')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'react' }));
      expect(await screen.findByText('노트 1개')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '전체' }));
      expect(await screen.findByText('노트 3개')).toBeInTheDocument();
    });
  });
});
