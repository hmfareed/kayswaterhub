/**
 * Admin Panel Greetings Engine
 * Parsed from Admin Panel/admingreetings.md
 */

export const ALL_ADMIN_GREETINGS = [
  "{name} returns!",
  "Back at it, {name}",
  "Back at it!",
  "Coffee and Claude time?",
  "Evening",
  "Evening, {name}",
  "Good afternoon",
  "Good afternoon, {name}",
  "Good evening",
  "Good evening, {name}",
  "Good morning",
  "Good morning, {name}",
  "Greetings, whoever you are",
  "Happy Friday",
  "Happy Friday, {name}",
  "Happy Monday",
  "Happy Monday, {name}",
  "Happy Saturday, {name}",
  "Happy Saturday!",
  "Happy Sunday",
  "Happy Sunday, {name}",
  "Happy Thursday",
  "Happy Thursday, {name}",
  "Happy Tuesday",
  "Happy Tuesday, {name}",
  "Happy Wednesday",
  "Happy Wednesday, {name}",
  "Hello, night owl",
  "Hey there",
  "Hey there, {name}",
  "Hi {name}, how are you?",
  "Hi, how are you?",
  "How was your day, {name}?",
  "How was your day?",
  "How’s it going, {name}?",
  "How’s it going?",
  "Let’s chat incognito",
  "Sunday session, {name}?",
  "Sunday session?",
  "That Friday feeling",
  "That Friday feeling, {name}",
  "Welcome",
  "Welcome to the weekend",
  "Welcome to the weekend, {name}",
  "Welcome, {name}",
  "What’s new, {name}?",
  "What’s new?",
  "What’s on your mind tonight?",
  "What’s on your mind, {name}?",
  "What’s on your mind?",
  "You’re incognito",
] as const;

/**
 * Returns a randomized, context-aware greeting from admingreetings.md
 * @param name Admin user's name (defaults to "Khadijah")
 */
export function getRandomAdminGreeting(name: string = "Khadijah"): string {
  const cleanName = (name || "Khadijah").split(" ")[0].trim() || "Khadijah";
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const hour = now.getHours(); // 0-23

  const candidatePool: string[] = [];

  // 1. Day of the week specific greetings
  if (day === 1) {
    // Monday
    candidatePool.push("Happy Monday", "Happy Monday, {name}");
  } else if (day === 2) {
    // Tuesday
    candidatePool.push("Happy Tuesday", "Happy Tuesday, {name}");
  } else if (day === 3) {
    // Wednesday
    candidatePool.push("Happy Wednesday", "Happy Wednesday, {name}");
  } else if (day === 4) {
    // Thursday
    candidatePool.push("Happy Thursday", "Happy Thursday, {name}");
  } else if (day === 5) {
    // Friday
    candidatePool.push(
      "Happy Friday",
      "Happy Friday, {name}",
      "That Friday feeling",
      "That Friday feeling, {name}",
      "Welcome to the weekend",
      "Welcome to the weekend, {name}"
    );
  } else if (day === 6) {
    // Saturday
    candidatePool.push(
      "Happy Saturday!",
      "Happy Saturday, {name}",
      "Welcome to the weekend",
      "Welcome to the weekend, {name}"
    );
  } else if (day === 0) {
    // Sunday
    candidatePool.push(
      "Happy Sunday",
      "Happy Sunday, {name}",
      "Sunday session?",
      "Sunday session, {name}?"
    );
  }

  // 2. Time of day specific greetings
  if (hour >= 4 && hour < 12) {
    candidatePool.push(
      "Good morning",
      "Good morning, {name}",
      "Coffee and Claude time?",
      "Back at it, {name}",
      "Back at it!"
    );
  } else if (hour >= 12 && hour < 17) {
    candidatePool.push(
      "Good afternoon",
      "Good afternoon, {name}",
      "How was your day, {name}?",
      "How was your day?",
      "How’s it going, {name}?",
      "How’s it going?"
    );
  } else if (hour >= 17 && hour < 22) {
    candidatePool.push(
      "Good evening",
      "Good evening, {name}",
      "Evening",
      "Evening, {name}",
      "What’s on your mind tonight?",
      "How was your day, {name}?"
    );
  } else {
    // Late night (22:00 - 04:00)
    candidatePool.push(
      "Hello, night owl",
      "What’s on your mind tonight?",
      "Evening, {name}",
      "What’s on your mind?"
    );
  }

  // 3. Add evergreen general greetings
  candidatePool.push(
    "{name} returns!",
    "Back at it, {name}",
    "Back at it!",
    "Hey there",
    "Hey there, {name}",
    "Hi {name}, how are you?",
    "Hi, how are you?",
    "Welcome",
    "Welcome, {name}",
    "What’s new, {name}?",
    "What’s new?",
    "What’s on your mind, {name}?",
    "What’s on your mind?"
  );

  // Pick a random template from candidate pool
  const selectedTemplate =
    candidatePool[Math.floor(Math.random() * candidatePool.length)] ||
    "Welcome, {name}";

  return selectedTemplate.replace(/\{name\}/g, cleanName);
}
