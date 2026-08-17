import { useNotes } from '../context/NotesContext';

interface TagFilterBarProps {
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilterBar({ selectedTag, onSelectTag }: TagFilterBarProps) {
  const { notes } = useNotes();
  const uniqueTags = [...new Set(notes.flatMap((n) => n.tags ?? []))].sort((a, b) =>
    a.localeCompare(b),
  );

  if (uniqueTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelectTag(null)}
        aria-pressed={selectedTag === null}
        className={`rounded-full px-3 py-1 text-sm ${
          selectedTag === null ? 'bg-[#dbe4e7]' : 'bg-[#e2e9ec]'
        } text-[#586064]`}
      >
        전체
      </button>
      {uniqueTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onSelectTag(tag === selectedTag ? null : tag)}
          aria-pressed={tag === selectedTag}
          className={`rounded-full px-3 py-1 text-sm ${
            tag === selectedTag ? 'bg-[#dbe4e7]' : 'bg-[#e2e9ec]'
          } text-[#586064]`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
