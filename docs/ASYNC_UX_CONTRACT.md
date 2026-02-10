# Async UX Contract

This contract standardizes how async flows behave across the frontend.

## Core states

Every async action should expose:

- `idle`
- `pending`
- `success`
- `error`

Use `src/shared/hooks/useAsyncAction.ts` as the default primitive for actions triggered by user intent.

## Mutation rules

For submit/create/update/delete actions:

1. Disable the initiating control while `pending`.
2. Show a deterministic pending label (for example `Creating...`).
3. Keep pending visible for at least 250ms to avoid flicker.
4. Surface failure in two places:
   - inline message close to the action controls,
   - toast (only when the action owns toast responsibility).
5. Never fire duplicate success/error toasts from both component and API layer.

## Loading rules (queries)

For page/data fetches:

1. Prefer skeletons for structural loading (tables/cards/forms).
2. Avoid layout shifts between loading and loaded states.
3. Show empty state only after loading resolves with no data.

## Error rules

Use normalized error messages from `src/shared/utils/asyncError.ts` so API/network/runtime errors render consistently.

Fallback message:

- `Something went wrong. Please try again.`

## Toast ownership

Exactly one layer owns toast side effects:

- API client owns toasts: components use inline state only.
- Component owns toasts: API client is silent.

Do not mix both in the same flow.

## Reference usage

```tsx
const { run, isPending, isError, errorMessage, reset } = useAsyncAction();

const handleSubmit = async () => {
  await run(() => save(payload), {
    // false if API layer already emits toasts
    errorToast: false,
    successToast: false,
    fallbackErrorMessage: "Failed to save changes.",
  });
};
```
