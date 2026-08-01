# Fare Calculator UX Refactor — Design Spec

**Date:** 2026-08-01
**Status:** Approved
**Scope:** UX fixes for 7 identified issues

---

## Problem

1. Meaningless status text in summary panel
2. Redundant labels on tier cards — should show plate color names
3. Keypad duplication on mobile
4. Ambiguous remaining-label
5. +/- toggles duplicated in TierGrid and SelectedList
6. Uninformative empty state text
7. Total amount not visible during scrolling

---

## Issue 1: Remove redundant status banner

Remove green info banner. Redundant with remaining card.

## Issue 2: Tier labels → plate color names

Replace price-per-item subtitle with Chinese plate color names for main plate tiers.

## Issue 3: Fix keypad duplication

When in-app keypad is active, set inputMode=none.

## Issue 4: Clarify remaining label

Update to show it is relative to target price.

## Issue 5: Remove SelectedList → sticky bottom bar

Delete SelectedList.tsx. Add FareBottomBar.tsx.

## Issue 6: Remove empty state card

Remove it entirely.

## Issue 7: Floating total bar

Covered by Issue 5.