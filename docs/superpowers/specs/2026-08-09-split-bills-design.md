# Split Bills — Design Spec

## Goal

Add multi-person split bill support to the fare calculator. Each person has independent plate counts and a per-person subtotal. A copy-to-clipboard button generates a ready-to-paste message showing each person's amount.

## User Stories

1. As a user dining with friends, I want to count plates per person so I know who owes what.
2. As a user, I want to tap a button to copy a formatted split bill message to send in a group chat.
3. As a single user, the calculator works exactly as before, with one deliberate exception: a minimal "+ 新增" affordance is shown so a 2nd person can be added (otherwise split bills are unreachable). Everything else stays unchanged until a 2nd person is added.

## Data Model

### State (in `useFareCalculator`)

```ts
interface Person {
  name: string;
  selectedTiers: Map<number, number>;  // price → qty
}

people: Map<string, Person>;   // key = personId (e.g. crypto.randomUUID())
activePersonId: string;        // ALWAYS points to a real person. No "All" tab.
```

There is no "All" / combined view tab. `activePersonId` always selects a real person. Combined totals are derived and shown in FareSummary, FareBottomBar, and the copy message.

### Migration

On mount, the persisted state has two possible shapes:

- **New shape:** has `people` (array of `[id, { name, selectedTiers }]` tuples) → use directly.
- **Old shape:** has `selectedTiers` as flat `[price, qty][]` tuples → migrate to:
```ts
people = new Map([[crypto.randomUUID(), { name: "你", selectedTiers: new Map(saved.selectedTiers) }]]);
```

### Derived Values

**Per person** (for each personId):
- `subtotal` = Σ(price × qty)
- `serviceCharge` = round(subtotal × 0.1)
- `personTotal` = subtotal + serviceCharge
- `totalItems` = Σ(qty)

**Combined** — derived by summing per-person values so amounts always stay consistent:
- `subtotal` = Σ(person.subtotal)
- `serviceCharge` = Σ(person.serviceCharge)
- `total` = Σ(person.personTotal)   ← NOT round(totalSubtotal × 0.1); this is what keeps the copy message arithmetic correct
- `totalItems` = Σ(person.totalItems)

### Operations

All tier operations (`addTier`, `incrementTier`, `decrementTier`, `removeTier`) target `activePersonId`. Since there is no "All" view, tier ops never need a disabled/read-only mode.

New operations:
- `addPerson(name: string): string` — creates a new person, returns their ID
- `removePerson(id: string): void` — removes person and their plates; **if `id === activePersonId`, switch `activePersonId` to the first remaining person**
- `renamePerson(id: string, name: string): void` — empty names revert to previous name
- `setActivePerson(id: string): void`

## Components

### `PersonTabs` (new)

Horizontal tab bar rendered above the TierGrid.

```
[ 你 ] [ Alice ] [ Bob ] [ + 新增 ]  [ 編輯 ]
```

- First person defaults to "你". Added people default to "成員 N" (N increments).
- Each person tab shows their name and per-person total as a subtitle.
- Tap to switch active person.
- "+ 新增" creates a new person and switches to them.
- "編輯" toggles edit mode. In edit mode, each person tab shows a ✎ (rename → inline input) and 🗑 (remove, with a confirm step) control.
- At exactly 1 person, PersonTabs renders only the dashed "+ 新增" button — no person tabs, no 編輯 — so a 2nd person can be added while preserving the single-person experience. Hidden entirely only when there are no people.
- Scrolls horizontally on mobile if many people.

### `TierGrid` (modified)

No structural changes. It receives `quantities` (the active person's `Map<number, number>`). No disabled state needed — tier ops always apply to the active person.

### `FareSummary` (no change to props interface)

Shows **combined** totals (the whole table's bill):
- 目標價格 / 實際賬單 — the table's target budget (global, unchanged semantics)
- 目前金額 — combined subtotal
- 尚餘 — combined total vs table budget

Per-person totals are shown in the PersonTabs subtitles, not here.

### `FareBottomBar` (modified)

Shows the combined total and the combined expandable list (all people's entries). When 2+ people exist, add a CTA button (rendered even before any plates are counted, so it's available right after adding the 2nd person):
```
[ 📋 複製分帳 ]
```

### Copy Message

Format (per-person totals, summing exactly to the combined total):
```
🍣 壽司郎分帳
你: $132
Alice: $85
總額 (含服務費): $217
```

On tap:
1. Generate the message string
2. Write to clipboard via `navigator.clipboard.writeText()`
3. Show toast "已複製到剪貼簿"
4. Fallback: `document.execCommand('copy')` for older browsers

Message is only available when 2+ people exist.

## localStorage Persistence

Extend `PersistedState`:
```ts
interface PersistedState {
  people: [string, { name: string; selectedTiers: [number, number][] }][];
  activePersonId: string;
  targetBudget: number;
  actualBill: number;
  customTiers: PriceTier[];
}
```

Migration: detect old format (`selectedTiers` as flat tuple array, no `people`) → convert to single-person format named "你".

## Edge Cases

- **Remove last person:** Not allowed. Must always have at least 1 person. The 🗑 control is hidden when only 1 person exists.
- **Remove active person:** Switch `activePersonId` to the first remaining person.
- **Rename to empty:** Revert to previous name.
- **Person with 0 plates:** Subtotal $0. Still appears in the copy message as "$0".
- **Single person:** Tabs hidden; only the dashed "+ 新增" affordance shows. Works like the current calculator otherwise.
- **Round-trip persistence:** Per-person totals sum to combined total by construction (combined = Σ per-person), so the copy message is always arithmetically correct.

## UI Layout

```
┌─────────────────────────────────────┐
│  [ 你 ]  [ Alice ]  [ + ]  [ 編輯 ] │  ← PersonTabs (minimal "+ 新增" if 1 person)
├─────────────────────────────────────┤
│  FareSummary (combined, 4-cell)     │
├─────────────────────────────────────┤
│  TierGrid                           │
│  (active person's counters)         │
├─────────────────────────────────────┤
│  FareBottomBar (combined total)     │
│  [ 📋 複製分帳 ]  ← CTA (2+ ppl)   │
└─────────────────────────────────────┘
```

## Scope

| Area | Files | Est. Lines |
|------|-------|-----------|
| Hook refactor | `useFareCalculator.ts` | ~150 |
| Person tabs | `PersonTabs.tsx` (new) | ~90 |
| FareBottomBar update | `FareBottomBar.tsx` | ~40 |
| Copy message util | `splitMessage.ts` (new) | ~30 |
| localStorage migration | `FareCalculator.tsx` | ~40 |
| Tests | 3 test files | ~150 |
| **Total** | | **~500** |

## Out of Scope

- Drag-and-drop plate assignment (approach C from brainstorming)
- Per-person target budgets (budget stays global = table budget)
- Custom split amounts (e.g., Alice pays $50, Bob pays $70 regardless of plates)
- Currency selection (stays HKD)
- Export to CSV/PDF
