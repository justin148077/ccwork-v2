import { useState, useEffect } from 'react';
import { useNotes } from '../context/NotesContext';

interface NoteEditorProps {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}

export function NoteEditor({ selectedNoteId, isCreating, onDone }: NoteEditorProps) {
  const { notes, createNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // 선택된 노트가 바뀔 때 폼 동기화
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setTags(selectedNote.tags ?? []);
    } else if (isCreating) {
      setTitle('');
      setContent('');
      setTags([]);
    }
  }, [selectedNoteId, isCreating]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const trimmed = tagInput.trim();
    if (!trimmed) {
      console.error('태그를 입력해주세요');
      return;
    }
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      console.error('이미 추가된 태그입니다');
      return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      console.error('제목을 입력해주세요');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        await createNote(title, content, tags);
      } else if (selectedNoteId) {
        await updateNote(selectedNoteId, { title, content, tags });
      }
      onDone();
    } catch (e) {
      console.error('저장에 실패했습니다', e);
    } finally {
      setIsSaving(false);
    }
  };

  // 아무것도 선택 안 된 상태
  if (!isCreating && !selectedNoteId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <p className="text-5xl">📝</p>
          <p className="text-muted-foreground text-sm">노트를 선택하거나 새 노트를 만드세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl px-8 sm:px-12 py-8 shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-border max-w-2xl">
      {/* 섹션 라벨 */}
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-6">
        {isCreating ? '새 노트' : '노트 편집'}
      </p>

      {/* 제목 입력 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full text-xl font-bold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-4"
      />

      {/* 구분선 */}
      <div className="h-px bg-border mb-4" />

      {/* 내용 입력 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요..."
        rows={14}
        className="w-full text-base text-foreground/70 bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
      />

      {/* 태그 영역 */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-[#dbe4e7] text-[#586064] rounded-full pl-3 pr-2 py-1 text-sm flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              aria-label={`${tag} 삭제`}
              className="hover:text-destructive transition-colors cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="태그 추가"
          className="bg-card border border-[#abb3b7]/15 focus:border-[#0053dc] outline-none rounded-full px-3 py-1 text-sm placeholder:text-muted-foreground/50"
        />
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3 mt-6 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-foreground text-card px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-75 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={onDone}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted hover:bg-border transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}
