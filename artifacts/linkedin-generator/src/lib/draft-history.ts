export interface SavedDraft {
  id: string;
  title: string;
  topic: string;
  post: string;
  hashtags: string[];
  tone: string;
  length: string;
  format?: string;
  audience?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "postforge_draft_history";
const MAX_HISTORY_ITEMS = 30;

export function loadDraftHistory(): SavedDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        return items;
      }
    }
  } catch (err) {
    console.warn("Failed to load draft history from localStorage:", err);
  }
  return [];
}

export function saveDraftToHistory(draft: Omit<SavedDraft, "id" | "createdAt" | "updatedAt"> & { id?: string }): SavedDraft[] {
  const history = loadDraftHistory();
  const now = Date.now();
  const id = draft.id || `draft-${now}-${Math.random().toString(36).substring(2, 7)}`;

  const existingIndex = history.findIndex((d) => d.id === id);

  const newDraft: SavedDraft = {
    ...draft,
    id,
    title: draft.title || (draft.topic.slice(0, 48) + (draft.topic.length > 48 ? "..." : "")),
    createdAt: existingIndex >= 0 ? history[existingIndex].createdAt : now,
    updatedAt: now,
  };

  let updatedList: SavedDraft[];
  if (existingIndex >= 0) {
    updatedList = [newDraft, ...history.filter((_, idx) => idx !== existingIndex)];
  } else {
    updatedList = [newDraft, ...history].slice(0, MAX_HISTORY_ITEMS);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn("Failed to persist draft history in localStorage:", err);
  }

  return updatedList;
}

export function deleteDraftFromHistory(id: string): SavedDraft[] {
  const history = loadDraftHistory();
  const filtered = history.filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to update draft history:", err);
  }
  return filtered;
}

export function renameDraftInHistory(id: string, newTitle: string): SavedDraft[] {
  const history = loadDraftHistory();
  const updated = history.map((d) => (d.id === id ? { ...d, title: newTitle.trim(), updatedAt: Date.now() } : d));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to rename draft:", err);
  }
  return updated;
}

export function clearAllDraftHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear draft history:", err);
  }
}
