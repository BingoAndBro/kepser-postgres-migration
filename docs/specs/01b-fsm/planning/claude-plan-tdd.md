# Test Stubs — Spec 01b: FSM

## Tests for: Step 1 — Types

### Happy Path
- [ ] StatusDokumen type accepts all 6 valid statuses
- [ ] CurrentStep type accepts 'PPK' | 'BENDAHARA' | null
- [ ] RevisionTarget type accepts 'USER' | 'PPK' | null
- [ ] FSMAction type accepts all 7 actions
- [ ] TransitionResult interface has correct shape

### Type Safety
- [ ] Invalid status string is a TypeScript error
- [ ] Invalid action string is a TypeScript error

## Tests for: Step 2 — FSM Function

### Happy Path — All 9 Transitions
- [ ] DRAFT + SUBMIT → IN_PPK_VALIDATION, currentStep='PPK', stepUrutan=1
- [ ] IN_PPK_VALIDATION + APPROVE → IN_BENDAHARA_APPROVAL, stepUrutan=2
- [ ] IN_PPK_VALIDATION + REJECT (USER) → NEED_REVISION, target='USER', stepUrutan=1
- [ ] IN_BENDAHARA_APPROVAL + APPROVE → COMPLETED, stepUrutan=2
- [ ] IN_BENDAHARA_APPROVAL + REJECT (PPK) → NEED_REVISION, target='PPK', stepUrutan=1
- [ ] NEED_REVISION + RESUBMIT (USER) → IN_PPK_VALIDATION, stepUrutan=1
- [ ] NEED_REVISION + RESUBMIT_PPK (PPK) → IN_BENDAHARA_APPROVAL, stepUrutan=2
- [ ] COMPLETED + ARCHIVE → ARCHIVED, stepUrutan=null
- [ ] COMPLETED + SKIP → COMPLETED (stays), stepUrutan=null

### Actor Validation
- [ ] SUBMIT by PEGAWAI → success
- [ ] SUBMIT by PPK → error
- [ ] SUBMIT by BENDAHARA → error
- [ ] SUBMIT by ARSIPARIS → error
- [ ] APPROVE by PPK on IN_PPK_VALIDATION → success
- [ ] APPROVE by BENDAHARA on IN_PPK_VALIDATION → error
- [ ] APPROVE by BENDAHARA on IN_BENDAHARA_APPROVAL → success
- [ ] REJECT by PPK on IN_PPK_VALIDATION → success
- [ ] REJECT by BENDAHARA on IN_BENDAHARA_APPROVAL → success
- [ ] RESUBMIT by PEGAWAI → success
- [ ] RESUBMIT by PPK → error
- [ ] RESUBMIT_PPK by PPK → success
- [ ] RESUBMIT_PPK by PEGAWAI → error
- [ ] ARCHIVE by ARSIPARIS → success
- [ ] ARCHIVE by PPK → error
- [ ] SKIP by ARSIPARIS → success

### REJECT RevisionTarget Validation
- [ ] REJECT without revisionTarget → error
- [ ] REJECT with USER target from PPK step → success
- [ ] REJECT with PPK target from Bendahara step → success

### RESUBMIT Validation
- [ ] RESUBMIT with USER target → success
- [ ] RESUBMIT with PPK target → error
- [ ] RESUBMIT_PPK with PPK target → success
- [ ] RESUBMIT_PPK with USER target → error

### Invalid Status + Action Combinations
- [ ] DRAFT + APPROVE → error
- [ ] DRAFT + REJECT → error
- [ ] COMPLETED + SUBMIT → error
- [ ] ARCHIVED + any action → error
- [ ] NEED_REVISION + APPROVE → error
- [ ] NEED_REVISION + REJECT → error

### Error Return Shape
- [ ] All failures return `{ success: false, newStatus: original, newCurrentStep: null, newRevisionTarget: null, stepUrutan: null, error: string }`
- [ ] All failures preserve original status
