import { Router, type IRouter } from "express";
import {
  GeneratePostBody,
  GeneratePostResponse,
  RewritePostBody,
  RewritePostResponse,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const lengthGuide: Record<string, string> = {
  short: "around 60-100 words, punchy and direct",
  medium: "around 140-200 words, with a clear hook, body, and closing line",
  long: "around 240-320 words, with a strong hook, layered insights, and a memorable closing thought",
};

const toneGuide: Record<string, string> = {
  professional:
    "polished, confident, and credible — like a senior operator sharing a hard-won insight",
  inspirational:
    "warm and motivating — sincere, never cheesy, draws the reader toward action",
  storytelling:
    "narrative-driven — open with a small specific moment, then zoom out to a broader lesson",
  humorous:
    "witty and self-aware — a smile, not slapstick. Land the insight underneath the joke",
  bold:
    "contrarian and pointed — challenge a common belief and back it with reasoning",
  educational:
    "clear and useful — teach one tangible idea with concrete examples or a tiny framework",
};

const formatGuide: Record<string, string> = {
  lesson_learned: "a hard-won lesson learned from a real obstacle or turning point",
  practical_list: "a clear, numbered list of actionable practices or takeaways",
  opinion: "a thoughtful, contrarian opinion challenging an industry norm",
  personal_story: "an authentic personal narrative from the trenches",
  announcement: "an exciting milestone or product announcement framed around value for the community",
  question_led: "a thought-provoking question leading into an exploratory breakdown",
};

function generateFallbackVariations(body: {
  topic: string;
  tone: string;
  length: string;
  format?: string;
  audience?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  voiceProfile?: string;
}): { post: string; hashtags: string[]; variations: Array<{ id: string; title: string; post: string; hashtags: string[] }> } {
  const e1 = body.includeEmojis ? "💡 " : "";
  const e2 = body.includeEmojis ? "📌 " : "";
  const e3 = body.includeEmojis ? "🚀 " : "";
  const audienceNote = body.audience ? ` for ${body.audience}` : "";
  const cleanTopic = body.topic.trim().replace(/[.?]+$/, "");

  // Base hashtags
  const baseWords = cleanTopic
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .map((w) => `#${w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()}`);
  const toneTag = `#${body.tone.charAt(0).toUpperCase() + body.tone.slice(1)}`;
  const defaultTags = ["#Leadership", "#Productivity", "#Strategy"];
  const mergedTags = Array.from(new Set([...baseWords, toneTag, ...defaultTags])).slice(0, 4);
  const hashtags = body.includeHashtags !== false ? mergedTags : [];

  // Angle 1: Direct Insight / Contrarian
  const var1Post = [
    `Most people treat ${cleanTopic.toLowerCase()} like a formula. In reality, it's a test of focus.`,
    `Over the past few quarters, we noticed the teams making real headway${audienceNote} weren't doing more things. They were eliminating the 80% that didn't matter.`,
    `${e1}Here are the 3 non-negotiables that move the needle:\n\n1. Speed of feedback beats volume of planning.\n2. One clear constraint forces more creativity than ten open brainstorms.\n3. Protect quiet momentum over public consensus.`,
    `What is one thing your team stopped doing that made everything move faster?`,
  ].join("\n\n");

  // Angle 2: Narrative / Turning Point
  const var2Post = [
    `A year ago, our approach to ${cleanTopic.toLowerCase()} looked great on paper. Then reality hit.`,
    `We expected linear progress, but within 60 days our core assumptions fell apart. Instead of pushing harder on the wrong path, we paused and rebuilt our assumptions from first principles.`,
    `${e2}The biggest revelation? When things stall, don't ask "How do we work faster?" Ask "What are we afraid to simplify?"`,
    `${e3}The moment we made that mental shift, our team gained back 15 hours a week of high-leverage focus.`,
    `Have you ever had a project failure turn into your most valuable operating model?`,
  ].join("\n\n");

  // Angle 3: Practical Framework / Step-by-Step
  const var3Post = [
    `A practical 3-step framework for mastering ${cleanTopic.toLowerCase()}${audienceNote}:`,
    `${e1}Phase 1: Define the single metric that matters\nIf you have three top priorities, you have none. Align every decision against one undeniable benchmark.`,
    `${e2}Phase 2: Remove friction before adding resources\nAdding more people or tools to a broken workflow only magnifies chaos. Simplify handoffs first.`,
    `${e3}Phase 3: Turn individual intuition into shared muscle\nDocument the operating playbook so everyone operates with senior-level judgment.`,
    `Save this for your next sprint retrospective. Which phase is currently your biggest bottleneck?`,
  ].join("\n\n");

  const variations = [
    {
      id: "var-1",
      title: "Angle 1: Direct Insight",
      post: var1Post,
      hashtags,
    },
    {
      id: "var-2",
      title: "Angle 2: Story & Real-world Lesson",
      post: var2Post,
      hashtags,
    },
    {
      id: "var-3",
      title: "Angle 3: Practical Framework",
      post: var3Post,
      hashtags,
    },
  ];

  return {
    post: var1Post,
    hashtags,
    variations,
  };
}

router.post("/posts/generate", async (req, res, next) => {
  try {
    const body = GeneratePostBody.parse(req.body);

    const audienceLine = body.audience
      ? `Write for this audience specifically: ${body.audience}.`
      : "Write for an ambitious, thoughtful LinkedIn audience.";

    const formatLine = body.format
      ? `Format requirement: Structure this post as ${formatGuide[body.format] || body.format}.`
      : "";

    const voiceLine = body.voiceProfile
      ? `Voice profile to match: ${body.voiceProfile}. Adopt the tone, vocabulary, and cadence described.`
      : "";

    const hashtagsLine = body.includeHashtags
      ? "Include 3-6 relevant, specific hashtags (not generic like #motivation). Return them in the JSON `hashtags` array, NOT inside the `post` text."
      : "Do NOT include any hashtags. Return an empty array for `hashtags`.";

    const emojiLine = body.includeEmojis
      ? "Tasteful, sparing emojis are welcome (no more than 3-4 total). They should accent meaning, not decorate every line."
      : "Do NOT use any emojis.";

    const system = `You are a senior LinkedIn ghostwriter known for posts that get saved and reshared. You write with restraint and specificity — concrete details over vague claims, honest perspective over performative positivity.

You always:
- Open with a strong, specific hook on its own line. No "In today's fast-paced world" openings.
- Use short paragraphs and intentional line breaks (LinkedIn renders single line breaks).
- End with a thought, question, or invitation that actually invites a response.
- Avoid corporate cliches, buzzwords, em-dash overuse, and obvious AI tells.
- Never wrap the post in quotes or markdown.

Generate the primary post AND 2 alternative variations offering distinct angles (e.g., one contrarian insight, one personal story, one practical framework).
Return ONLY valid JSON matching:
{
  "post": string,
  "hashtags": string[],
  "variations": [
    { "id": "var-1", "title": string, "post": string, "hashtags": string[] },
    { "id": "var-2", "title": string, "post": string, "hashtags": string[] },
    { "id": "var-3", "title": string, "post": string, "hashtags": string[] }
  ]
}`;

    const user = `Write a LinkedIn post about: ${body.topic}

Tone: ${toneGuide[body.tone]}.
Length: ${lengthGuide[body.length]}.
${formatLine}
${audienceLine}
${voiceLine}
${hashtagsLine}
${emojiLine}

Return ONLY the JSON object.`;

    let post = "";
    let hashtags: string[] = [];
    let variations: Array<{ id: string; title: string; post: string; hashtags: string[] }> = [];

    const hasApiKey = Boolean(
      (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "" && process.env.OPENAI_API_KEY !== "dummy-key") ||
      (process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_API_KEY.trim() !== "" && process.env.AI_GATEWAY_API_KEY !== "dummy-key")
    );

    if (hasApiKey) {
      try {
        const model = process.env.OPENAI_MODEL || (process.env.AI_GATEWAY_BASE_URL ? "gpt-5.4" : "gpt-4o-mini");
        const completion = await openai.chat.completions.create({
          model,
          max_completion_tokens: 8192,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });

        const raw = completion.choices[0]?.message?.content ?? "{}";
        const parsed = JSON.parse(raw);
        if (typeof parsed.post === "string" && parsed.post.trim().length > 0) {
          post = parsed.post.trim();
          if (Array.isArray(parsed.hashtags)) {
            hashtags = parsed.hashtags
              .filter((h: unknown): h is string => typeof h === "string")
              .map((h: string) => (h.startsWith("#") ? h : `#${h}`));
          }
          if (Array.isArray(parsed.variations)) {
            variations = parsed.variations
              .filter((v: any) => v && typeof v.post === "string")
              .map((v: any, idx: number) => ({
                id: v.id || `var-${idx + 1}`,
                title: v.title || `Angle ${idx + 1}`,
                post: v.post.trim(),
                hashtags: Array.isArray(v.hashtags)
                  ? v.hashtags.map((h: string) => (h.startsWith("#") ? h : `#${h}`))
                  : hashtags,
              }));
          }
        }
      } catch (err) {
        console.warn("OpenAI API call failed, generating variations via local synthesis:", err);
      }
    }

    if (!post || variations.length === 0) {
      const fallback = generateFallbackVariations(body);
      post = post || fallback.post;
      hashtags = hashtags.length > 0 ? hashtags : fallback.hashtags;
      variations = variations.length > 0 ? variations : fallback.variations;
    }

    // Ensure variations include primary post if not present
    if (variations.length > 0 && variations[0].post !== post) {
      variations[0].post = post;
    }

    const data = GeneratePostResponse.parse({ post, hashtags, variations });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Feature 5: Targeted rewrite tools
router.post("/posts/rewrite", async (req, res, next) => {
  try {
    const body = RewritePostBody.parse(req.body);
    const original = body.post.trim();
    let rewritten = "";

    const actionPrompts: Record<string, string> = {
      strengthen_hook: "Strengthen the opening hook of this LinkedIn post. Make line 1 arresting, counterintuitive, or emotionally compelling. Keep the remainder of the post intact with natural paragraph breaks.",
      make_clearer: "Improve the clarity of this LinkedIn post. Remove jargon, simplify phrasing, and sharpen sentence flow while preserving all original insights and paragraph breaks.",
      make_shorter: "Condense this LinkedIn post by approximately 25-30%. Cut filler, redundancies, and preamble while preserving the core insight, hook, and closing.",
      make_warmer: "Make this LinkedIn post warmer, more conversational, and more sincere. Keep it credible and professional without feeling corporate or distant.",
      stronger_closing: "Replace the closing line with a high-engagement question or compelling closing thought that invites authentic responses in the comments.",
    };

    const hasApiKey = Boolean(
      (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "" && process.env.OPENAI_API_KEY !== "dummy-key") ||
      (process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_API_KEY.trim() !== "" && process.env.AI_GATEWAY_API_KEY !== "dummy-key")
    );

    if (hasApiKey) {
      try {
        const model = process.env.OPENAI_MODEL || (process.env.AI_GATEWAY_BASE_URL ? "gpt-5.4" : "gpt-4o-mini");
        const completion = await openai.chat.completions.create({
          model,
          max_completion_tokens: 4096,
          messages: [
            {
              role: "system",
              content: "You are a senior LinkedIn ghostwriter. Rewrite the provided post strictly following the instructions. Preserve line breaks. Return ONLY the rewritten post text with no commentary or quotes.",
            },
            {
              role: "user",
              content: `${actionPrompts[body.action] || "Improve this post."}\n\nOriginal Post:\n${original}`,
            },
          ],
        });

        const choice = completion.choices[0]?.message?.content?.trim();
        if (choice && choice.length > 10) {
          rewritten = choice;
        }
      } catch (err) {
        console.warn("OpenAI rewrite failed; using local rewrite engine:", err);
      }
    }

    if (!rewritten) {
      // Local fallback transformations
      const paragraphs = original.split(/\n+/).filter(Boolean);
      switch (body.action) {
        case "strengthen_hook":
          const restOfPost = paragraphs.slice(1).join("\n\n");
          const strongHook = `Here is the uncomfortable truth most leaders realize too late:`;
          rewritten = `${strongHook}\n\n${restOfPost || paragraphs[0]}`;
          break;

        case "make_shorter":
          // Take first hook + condensed middle + closing
          if (paragraphs.length > 2) {
            rewritten = [paragraphs[0], paragraphs[1], paragraphs[paragraphs.length - 1]].join("\n\n");
          } else {
            rewritten = original.replace(/In other words,?\s*/gi, "").replace(/Needless to say,?\s*/gi, "");
          }
          break;

        case "make_clearer":
          rewritten = original
            .replace(/\butilize\b/gi, "use")
            .replace(/\bleverage\b/gi, "apply")
            .replace(/\bin order to\b/gi, "to")
            .replace(/\bat the end of the day\b/gi, "ultimately");
          break;

        case "make_warmer":
          const warmOpening = "I've been thinking about this a lot lately, and I wanted to share an honest reflection:";
          rewritten = `${warmOpening}\n\n${original}`;
          break;

        case "stronger_closing":
          const withoutLast = paragraphs.slice(0, Math.max(1, paragraphs.length - 1)).join("\n\n");
          const powerfulClosing = "Curious to hear from others in the trenches: how are you navigating this balance right now?";
          rewritten = `${withoutLast}\n\n${powerfulClosing}`;
          break;

        default:
          rewritten = original;
      }
    }

    const data = RewritePostResponse.parse({
      post: rewritten,
      action: body.action,
      previousPost: original,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
