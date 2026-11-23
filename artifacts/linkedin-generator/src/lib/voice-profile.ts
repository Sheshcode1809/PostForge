export interface VoiceProfile {
  enabled: boolean;
  name: string;
  description: string;
  samplePost: string;
  updatedAt: number;
}

const STORAGE_KEY = "postforge_voice_profile";

export function loadVoiceProfile(): VoiceProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Unable to load voice profile from localStorage:", err);
  }

  return {
    enabled: false,
    name: "My Professional Voice",
    description: "Concise, operator-oriented, authentic. Uses punchy hooks, concrete details, and avoids corporate fluff.",
    samplePost: "",
    updatedAt: Date.now(),
  };
}

export function saveVoiceProfile(profile: VoiceProfile): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, updatedAt: Date.now() }));
    return true;
  } catch (err) {
    console.warn("Unable to save voice profile to localStorage:", err);
    return false;
  }
}

export function clearVoiceProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Unable to clear voice profile:", err);
  }
}
