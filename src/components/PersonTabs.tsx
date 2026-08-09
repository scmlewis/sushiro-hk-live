import React, { useRef, useState } from 'react';
import { UserPlus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Person } from '../hooks/useFareCalculator';
import { formatCurrency } from '../utils/formatCurrency';

interface PersonTabsProps {
  people: Map<string, Person>;
  activePersonId: string;
  personTotals: Map<string, number>;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export const PersonTabs: React.FC<PersonTabsProps> = ({
  people,
  activePersonId,
  personTotals,
  onSelect,
  onAdd,
  onRemove,
  onRename,
}) => {
  const [editing, setEditing] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const memberCounter = useRef(people.size + 1);

  if (people.size <= 1) return null;

  const handleAdd = () => {
    onAdd(`成員 ${memberCounter.current}`);
    memberCounter.current += 1;
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = (id: string) => {
    onRename(id, renameValue);
    setRenamingId(null);
  };

  const handleRemove = (id: string) => {
    if (confirmingRemoveId === id) {
      onRemove(id);
      setConfirmingRemoveId(null);
    } else {
      setConfirmingRemoveId(id);
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {Array.from(people.entries()).map(([id, person]) => {
        const isActive = id === activePersonId;

        if (renamingId === id) {
          return (
            <div key={id} className="shrink-0">
              <div className="flex items-center gap-1 rounded-xl border-2 border-[#aa151b] bg-white dark:bg-neutral-900 px-2 py-1.5">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  aria-label="成員名稱"
                  autoFocus
                  className="w-20 bg-transparent text-sm font-black text-neutral-900 dark:text-white outline-none"
                />
                <button
                  onClick={() => commitRename(id)}
                  aria-label="確認改名"
                  className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRenamingId(null)}
                  aria-label="取消改名"
                  className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={id} className="shrink-0">
            <div
              className={`flex items-center rounded-xl border-2 transition-all ${
                isActive
                  ? 'bg-[#aa151b] border-[#aa151b]'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <button
                onClick={() => onSelect(id)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-3 py-2 ${
                  isActive ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <span className="text-sm font-black whitespace-nowrap">{person.name}</span>
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    isActive ? 'text-white/80' : 'text-neutral-400'
                  }`}
                >
                  {formatCurrency(personTotals.get(id) ?? 0)}
                </span>
              </button>
              {editing && (
                <span className="flex items-center gap-0.5 pr-1.5">
                  <button
                    onClick={() => startRename(id, person.name)}
                    aria-label={`重新命名 ${person.name}`}
                    className={`p-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'text-white/80 hover:bg-white/20'
                        : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemove(id)}
                    aria-label={
                      confirmingRemoveId === id
                        ? `確認刪除 ${person.name}`
                        : `刪除 ${person.name}`
                    }
                    className={`flex items-center gap-1 p-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'text-white/80 hover:bg-white/20'
                        : 'text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                    }`}
                  >
                    {confirmingRemoveId === id ? (
                      <span className="text-[10px] font-black text-red-500">確認?</span>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </span>
              )}
            </div>
          </div>
        );
      })}

      <button
        onClick={handleAdd}
        aria-label="新增成員"
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm font-black transition-all hover:border-[#aa151b] hover:text-[#aa151b] active:scale-95"
      >
        <UserPlus className="w-4 h-4" />
        <span>新增</span>
      </button>

      <button
        onClick={() => setEditing((v) => !v)}
        aria-pressed={editing}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-sm font-black transition-all hover:border-[#aa151b] hover:text-[#aa151b] active:scale-95"
      >
        <Pencil className="w-4 h-4" />
        <span>編輯</span>
      </button>
    </div>
  );
};
