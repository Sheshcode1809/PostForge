# PostForge UI/UX Redesign Prompt

Redesign the existing PostForge web app, a focused LinkedIn post generator, to feel clear, polished, and quick to use. Keep the current product scope: users enter a topic, choose a tone and post length, optionally specify an audience, toggle hashtags and emojis, generate a draft, then copy or regenerate it.

## Product goals

- Make the first step obvious: start with the post idea, then move through the optional writing controls.
- Help users understand what each setting changes without adding friction.
- Make the generated draft feel like the main result and make copying it effortless.
- Keep the interface calm and credible for professionals who use LinkedIn.

## Visual direction

- Use a clean editorial workspace with a warm off-white background, dark ink text, and a restrained LinkedIn-blue accent.
- Use generous but purposeful spacing, clear type hierarchy, subtle borders, and modest shadows. Avoid excessive gradients, glass effects, decorative blobs, and oversized empty areas.
- Make the composer and post preview feel like two parts of one writing workspace. On wide screens, show them side by side; on small screens, stack them in the order users need them.
- Use a consistent icon style and reserve animation for feedback that helps users understand a state change.

## Layout and content

- Give the page a concise header with the PostForge name and a short description of the tool.
- Present the composer as a clearly labeled form. Make the topic field the most prominent input, with a useful example and a small set of clickable topic suggestions when the field is empty.
- Group tone and length as compact, easy-to-scan controls. Keep audience optional and label it clearly.
- Put hashtag and emoji preferences together in a clearly named options group.
- Make the primary action prominent and label its loading state in plain language.
- In the result area, show a LinkedIn-style preview with readable line length and paragraph spacing. Visually distinguish the post text from its hashtags.
- Keep Copy and Regenerate actions near the preview. Show a character count and clear confirmation after copying.
- In the initial empty state, explain what will appear after generation and provide a restrained visual cue. Do not make the empty state compete with the composer.

## Interaction and states

- Preserve the existing generation behavior, fields, validation, API integration, and topic suggestions.
- Clearly show the generating state and prevent accidental duplicate submissions while a request is running.
- Keep entered values available after generation and regeneration.
- Make errors understandable and actionable, with the topic and settings left intact so the user can retry.
- Ensure the hashtag toggle consistently controls whether hashtags appear in the preview and copied text.
- Provide visible focus, hover, selected, disabled, loading, success, and error states for interactive controls.
- Ensure buttons and topic suggestions are keyboard operable and have descriptive accessible names. Associate labels, descriptions, and validation messages with their fields.
- Respect reduced-motion preferences and avoid relying on animation or color alone to communicate status.

## Responsive and accessibility requirements

- Support narrow mobile screens through desktop widths without horizontal scrolling or clipped controls.
- On mobile, put the composer before the preview and keep the primary action easy to reach.
- Maintain readable text sizes, sufficient contrast, comfortable touch targets, and logical keyboard navigation.
- Use semantic headings and form labels, and retain clear focus indicators.

## Implementation constraints

- Work within the existing React, TypeScript, Tailwind CSS, shadcn-style UI components, and Framer Motion setup.
- Keep changes focused on the frontend experience. Do not add authentication, persistence, analytics, or new backend capabilities.
- Preserve the existing API contract and current features. Avoid introducing new dependencies unless a required interaction cannot be built with the current stack.
- Keep the design coherent with the existing Plus Jakarta Sans and Bricolage Grotesque typography, or update typography deliberately as part of a consistent system.

Before finishing, review the initial, loading, successful, and error states at mobile and desktop widths. The finished interface should make it immediately clear what to enter, what will happen next, and how to use the generated post.
