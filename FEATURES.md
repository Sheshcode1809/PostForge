# PostForge Feature Roadmap

## Current capabilities

PostForge currently supports topic suggestions, tone and length controls, an optional target audience, post formats, hashtag and emoji options, multiple post variations, direct editing and targeted rewrites, templates, a local voice profile, local draft history, post statistics, copying, and Markdown export. Draft history is currently stored in the browser and is not available across devices.

## Next: accounts and synced draft history

Add signup and login so users can access their saved post history from any device. Keep the existing local history usable for signed-out users.

### Account access

- Provide clear Sign up, Log in, Log out, and password reset flows.
- Validate email and password fields and show useful loading, success, and error states.
- Keep the user signed in across page refreshes using a secure session.
- Show account state in the app header and provide an obvious way to open account and history views.
- Protect account-only routes and return users to their intended destination after login.

### Synced history

- Save each signed-in user's drafts to persistent server-side storage, including title, topic, post text, hashtags, tone, format, audience, and created/updated times.
- Let users view, search or sort, reopen, rename, and delete their own saved drafts.
- Sync saved drafts across browsers and devices after login.
- Keep the current local browser history available when signed out.
- When a user with local drafts signs in, offer an explicit option to import them into the account. Do not upload local drafts without the user's consent.
- Clearly distinguish local drafts from account-synced drafts where both are shown.
- Provide a way to delete account-synced drafts and explain what happens to saved data when an account is deleted.

### Security and implementation requirements

- Use a maintained authentication provider or a secure server-side authentication flow that fits the project. Do not store passwords, session tokens, or credentials in browser local storage.
- Enforce authentication and per-user ownership on the server for every history operation. A user must never be able to read, modify, or delete another user's drafts by changing an ID or request.
- Use secure, HTTP-only session cookies where applicable, and protect state-changing requests against CSRF.
- Persist account and draft data using the project's configured database and migrations. Confirm the database is available in this workspace before depending on it.
- Keep authentication secrets in server environment variables. Never expose them to the frontend bundle.
- Update the frontend, API routes, request validation, API specification, and database schema together. Keep generation available to signed-out users unless product requirements change.
- Handle expired sessions and network failures without losing the draft currently being edited.

## Later opportunities

### Cloud-synced voice profiles and templates

- Let signed-in users sync their voice profile and custom templates across devices.
- Keep personal examples private to the user's account and provide edit and delete controls.
- Preserve the existing local experience for users who do not sign in.

### Publishing integrations

Explore scheduling or direct LinkedIn publishing only after validating demand and confirming the available API access, permissions, and review requirements. Continue to make copying and export available as reliable publishing workflows.

## Suggested delivery order

| Order | Feature | Why |
| --- | --- | --- |
| 1 | Signup, login, logout, and password reset | Establishes a reliable way to identify users and access account features. |
| 2 | Account-scoped draft history | Makes saved posts available across sessions and devices while protecting user data. |
| 3 | Explicit import of local drafts | Helps existing users carry their browser history into their account safely. |
| 4 | Cloud-synced voice profiles and templates | Extends personalization across devices after account storage is established. |
| 5 | Scheduling or publishing integration | Extends the product beyond writing and depends on external platform access. |

## Acceptance criteria for the account and history release

- A new user can sign up, log in, log out, and reset a forgotten password.
- A signed-in user can see their own saved history after refreshing the page and on another device.
- A signed-out user can continue generating posts and using local draft history.
- Local drafts are imported only after the user explicitly chooses to import them.
- Draft create, read, rename, and delete operations are scoped to the authenticated account on the server.
- Authentication and history errors are clear, recoverable, and do not discard the draft currently being edited.
- Passwords and session credentials are not stored in local storage or exposed to client-side code.

## Product-wide requirements

- Keep the app usable on mobile and desktop, with keyboard-accessible controls and visible focus states.
- Preserve a user's current topic, settings, and unsaved text when generation or network requests fail.
- Show clear loading, success, empty, and error states for new actions.
- Keep generation and copying available without requiring an account.
