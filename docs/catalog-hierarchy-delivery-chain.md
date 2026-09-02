# Catalog hierarchy delivery chain

This document tracks the review-only integration chain for the Catalog hierarchy and Keyboard First work.

## Delivery model

- Strategy: Feature Branch Chain
- Integration branch: `feat/catalog-hierarchy-chain`
- Default branch: `master`
- Review budget: at most 400 authored changed lines per functional child PR
- Documentation exceptions must be declared explicitly

Each child PR targets its immediate predecessor. The tracker PR stays in draft until every child has been reviewed and integrated.

## Ordered slices

```text
#2  Catalog route and minimal shell
#3  Catalog presentation
#15 Static creation dialog
#4  Keyboard arbitration
#5  Pure spatial navigation
#23 Spatial DOM adapter
#6  Shell navigation
#24 Keyboard controller core
#7  Keyboard help integration
#25 Keyboard test hardening
#8  Canonical keyboard documentation
#9  Catalog read contracts
#16 Catalog list sequencing
#17 Catalog stale and retry recovery
#10 Connected Convex transport
#11 Catalog read states
#18 Catalog browser evidence
#12 Class creation contract
#19 Class creation dialog behavior
#20 Class completion, refetch, and notification
#13 Family and Type creation contracts
#21 Family and Type dialogs
#22 Dependent creation evidence
#26 Contextual creation UX
#27 Bounded success notification lifecycle
#28 Semantic hierarchy traversal
#29 Global shortcut discovery
#30 Header discovery-control centering
#14 Final Catalog evidence
```

## Reconstruction disclosure

The original implementation was produced in a mixed uncommitted tree without issue-addressable commits or replayable patches. This chain reconstructs the verified final state into bounded review units. It does not claim to reproduce the historical implementation chronology.

The initial route and shell work has no durable historical RED artifact. That limitation must remain disclosed; no PR may fabricate missing Strict TDD evidence.

## Excluded material

- OpenPencil design documents and generated `.op` files
- PNG design evidence
- `recovery/**`
- Resource, update, activation, deactivation, and lifecycle behavior
- Real backend mutations from browser tests

## Completion rule

The tracker can leave draft status only after every child PR has a clean immediate-parent diff, the required issue and type label, passing automated checks, and an explicit rollback boundary.
