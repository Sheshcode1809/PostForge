export interface PostTemplate {
  id: string;
  title: string;
  category: "Growth & Career" | "Product & Tech" | "Leadership" | "Team & Hiring" | "Industry Insight";
  description: string;
  topicPrompt: string;
  recommendedTone: "professional" | "inspirational" | "storytelling" | "humorous" | "bold" | "educational";
  recommendedLength: "short" | "medium" | "long";
  recommendedFormat: "lesson_learned" | "practical_list" | "opinion" | "personal_story" | "announcement" | "question_led";
  targetAudience?: string;
}

export const POST_TEMPLATES: PostTemplate[] = [
  {
    id: "product-launch",
    title: "Product or Version Launch",
    category: "Product & Tech",
    description: "Announce a major release by focusing on the customer pain point solved rather than just features.",
    topicPrompt: "Launching our new AI workflow builder: why we scrapped our first version after 4 months and built this instead",
    recommendedTone: "storytelling",
    recommendedLength: "medium",
    recommendedFormat: "announcement",
    targetAudience: "Founders & Product Teams",
  },
  {
    id: "career-lesson",
    title: "Hard-Won Career Milestone",
    category: "Growth & Career",
    description: "Reflect on a counterintuitive turning point or uncomfortable realization in your career.",
    topicPrompt: "The hardest lesson I learned transitioning from individual contributor to engineering manager",
    recommendedTone: "inspirational",
    recommendedLength: "medium",
    recommendedFormat: "lesson_learned",
    targetAudience: "Aspiring Leaders",
  },
  {
    id: "hiring-announcement",
    title: "Culture-Driven Hiring",
    category: "Team & Hiring",
    description: "Share open positions by telling a compelling story about how your team actually works day to day.",
    topicPrompt: "We are hiring our first 3 design engineers. Here is what we care about (and what we ignore)",
    recommendedTone: "bold",
    recommendedLength: "medium",
    recommendedFormat: "announcement",
    targetAudience: "Designers & Engineers",
  },
  {
    id: "project-retro",
    title: "Project Retrospective & Mistakes",
    category: "Leadership",
    description: "Honest breakdown of a high-stakes failure or costly pivot and the 3 principles adopted since.",
    topicPrompt: "A mistake that cost our company 3 months of dev velocity and 40k in server bills",
    recommendedTone: "educational",
    recommendedLength: "long",
    recommendedFormat: "practical_list",
    targetAudience: "Technical Leaders & Operators",
  },
  {
    id: "contrarian-take",
    title: "Industry Contrarian Take",
    category: "Industry Insight",
    description: "Challenge an overused buzzword, industry standard, or popular misconception with reasoning.",
    topicPrompt: "Why 90% of dashboard analytics tools create anxiety instead of accountability",
    recommendedTone: "bold",
    recommendedLength: "short",
    recommendedFormat: "opinion",
    targetAudience: "Executive Decision Makers",
  },
  {
    id: "framework-breakdown",
    title: "Step-by-Step Tactical Framework",
    category: "Growth & Career",
    description: "Teach one high-impact habit, operational routine, or decision framework in clear steps.",
    topicPrompt: "The 30-minute weekly time audit that doubled our team's deep work output",
    recommendedTone: "educational",
    recommendedLength: "medium",
    recommendedFormat: "practical_list",
    targetAudience: "Knowledge Workers",
  },
];
