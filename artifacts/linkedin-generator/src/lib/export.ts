export function exportDraftAsFile(
  filename: string,
  content: string,
  format: "txt" | "md"
): void {
  const extension = format === "md" ? ".md" : ".txt";
  const blob = new Blob([content], {
    type: format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(extension) ? filename : `${filename}${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatMarkdownExport(post: string, topic: string, hashtags: string[], metadata?: Record<string, string>): string {
  const frontmatter = [
    "---",
    `title: "${topic.replace(/"/g, '\\"')}"`,
    `date: "${new Date().toISOString().split("T")[0]}"`,
    `platform: "LinkedIn"`,
    metadata?.tone ? `tone: "${metadata.tone}"` : null,
    metadata?.length ? `length: "${metadata.length}"` : null,
    metadata?.format ? `format: "${metadata.format}"` : null,
    "---",
    "",
  ].filter(Boolean).join("\n");

  const tagsBlock = hashtags.length > 0 ? `\n\n${hashtags.join(" ")}` : "";
  return `${frontmatter}\n${post.trim()}${tagsBlock}\n`;
}

export function generateCalendarScheduleLink(post: string, scheduledDate: Date): string {
  const title = encodeURIComponent("Publish LinkedIn Post");
  const details = encodeURIComponent(`${post.slice(0, 800)}...\n\n(Generated with PostForge)`);
  const startTime = scheduledDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const endTime = new Date(scheduledDate.getTime() + 15 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startTime}/${endTime}`;
}
