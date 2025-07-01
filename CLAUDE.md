## General codebase rules
- NEVER update the translations within the locales/ folder. That will be updated automatically
- When creating data types, always use Types over Interface
- NEVER EVER use `Any` as a type under any circumstance
- When creating/updating a queryKey in a useMutation, ALWAYS double check whether the queryKey is part of existing mutationKeys in the codebase. Almost always the mutationKeys are the names of the functions.
- react patterns moving forward:
    - Uls are a _thin_ wrapper over data, you should avoid using local state (like usestate unless you have to, and it's
    independent of the business logic
    - even then, consider if you can flatten the ui state into a basic calculation. useState is only necessary if it's truly
    reactive
    - choose state machines over multiple useStates, makes the code harder to reason about
    - choose to create a new component abstraction when you're nesting conditional logic, or top level if/else
    statements. ternaries are reserved for small, easily readable logic
    - avoid putting dependent logic in useEffects, it causes misdirection of what the logic is going. choose to
    explicitly define logic rather than depend on implicit reactive behavior
    - avoid setTimeouts since they are flaky and usually a _hack_. provide a comment on _why_