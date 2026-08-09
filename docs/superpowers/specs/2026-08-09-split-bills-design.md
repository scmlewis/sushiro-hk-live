# Split Bills — Design Spec

## Goal

Add multi-person split bill support to the fare calculator. Each person has independent plate counts and a per-person subtotal. A copy-to-clipboard button generates a ready-to-paste message showing each person's amount.

## User Stories

1. As a user dining with friends, I want to count plates per person so I know who owes what.
2. As a user, I want to tap a button to copy a formatted split bill message to send in a group chat.
3. As a single user, the calculator works exactly as before — no visible change until a 2nd person is added.

## Data Model

### State (in `useFareCalculator`)

```ts
interface Person {
  name: string;
  selectedTiers: Map<number, number>;  // price → qty
}

// New state shape
people: Map<string, Person>;           // key = personId (nanoid or timestamp)
activePersonId: string | null;         // null = "All" view (combined)
```

### Migration

On mount, if the existing `selectedTiers` format is detected (array of `[price, qty]` tuples without `people`), migrate to:
```ts
people = new Map([["1", { name: "你", selectedTiers: new Map(saved.selectedTiers) }]]);
activePersonId = null;  // "All" view
```

### Derived Values

**Per person** (for each personId):
- `subtotal` = Σ(price × qty)
- `serviceCharge` = round(subtotal × 0.1)
- `personTotal` = subtotal + serviceCharge
- `totalItems` = Σ(qty)

**Combined** (for "All" view and bottom bar):
- `totalSubtotal` = Σ(person.subtotal)
- `totalServiceCharge` = round(totalSubtotal × 0.1)
- `total` = totalSubtotal + totalServiceCharge
- `totalItems` = Σ(person.totalItems)

### Operations

All tier operations (`addTier`, `incrementTier`, `decrementTier`, `removeTier`) target the **active person**. When `activePersonId` is null ("All" view), tier operations are disabled (read-only combined view).

New operations:
- `addPerson(name: string): string` — creates a new person, returns their ID
- `removePerson(id: string): void` — removes person and their plates
- `renamePerson(id: string, name: string): void`
- `setActivePerson(id: string | null): void` — null = "All"

## Components

### `PersonTabs` (new)

Horizontal tab bar rendered above the TierGrid.

```
[ All ] [ Alice ] [ Bob ] [ + 新增 ]
```

- "All" tab is always first. Shows combined total as a subtitle.
- Each person tab shows their name and per-person total as subtitle.
- Tap to switch active person.
- Long-press or double-tap to open rename/remove menu.
- "+ 新增" tab at the end creates a new person ("Person N") and switches to them.
- Hidden when there's only 1 person (no tabs visible).
- Scrolls horizontally on mobile if many people.

### `TierGrid` (modified)

No structural changes. It receives `quantities` (a `Map<number, number>`) which is now the active person's slice. When "All" is selected, the combined map is passed but increment/decrement buttons are disabled (read-only).

### `FareSummary` (minor tweak)

When "All" is selected, optionally show a per-person breakdown below the 4-cell grid:
```
Alice: $132 | Bob: $94
```

When a specific person is selected, show only their values.

### `FareBottomBar` (modified)

Shows the combined total. When 2+ people exist, add a CTA button:
```
[ 📋 複製分帳 ]
```

### Copy Message

Format:
```
🍣 壽司郎分帳
Alice: $132
Bob: $94
總額 (含服務費): $226
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
  activePersonId: string | null;
  targetBudget: number;
  actualBill: number;
  customTiers: PriceTier[];
}
```

Migration: detect old format (has `selectedTiers` as flat tuple array) → convert to `people` format with one person named "你".

## Edge Cases

- **Remove last person:** Not allowed. Must always have at least 1 person.
- **Rename to empty:** Disallowed. Revert to previous name.
- **All view + tier ops:** Disabled. Show a toast "請選擇一位成員再調整數量" if user taps +/- in All view.
- **Person with 0 plates:** Their subtotal is $0. They still appear in the copy message as "$0".
- **Single person:** Tabs are hidden. Works exactly like the current calculator.

## UI Layout

```
┌─────────────────────────────────────┐
│  [ All ]  [ Alice ]  [ Bob ]  [ + ] │  ← PersonTabs (hidden if 1 person)
├─────────────────────────────────────┤
│  FareSummary (4-cell grid)          │
│  + per-person breakdown (in All)    │
├─────────────────────────────────────┤
│  TierGrid                           │
│  (active person's counters)         │
├─────────────────────────────────────┤
│  FareBottomBar                      │
│  [ 📋 複製分帳 ]  ← CTA (2+ ppl)   │
└─────────────────────────────────────┘
```

## Scope

| Area | Files | Est. Lines |
|------|-------|-----------|
| Hook refactor | `useFareCalculator.ts` | ~150 |
| Person tabs | `PersonTabs.tsx` (new) | ~80 |
| FareBottomBar update | `FareBottomBar.tsx` | ~40 |
| Copy message util | `splitMessage.ts` (new) | ~30 |
| FareSummary tweak | `FareSummary.tsx` | ~20 |
| localStorage migration | `FareCalculator.tsx` | ~40 |
| Tests | 3 test files | ~150 |
| **Total** | | **~510** |

## Out of Scope

- Drag-and-drop plate assignment (approach C from brainstorming)
- Custom split amounts (e.g., Alice pays $50, Bob pays $70 regardless of plates)
- Currency selection (stays HKD)
- Export to CSV/PDF
