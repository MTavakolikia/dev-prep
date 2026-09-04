// ============================================================
// Dev Prep seed — deterministic synthetic community users
// Expands the platform to 100+ accounts so leaderboards,
// enrollments and engagement look alive. Same scrypt password
// ('Password-2026!') as the existing synthetic users.
// ============================================================

function hash(n: number, mod: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return Math.abs(Math.floor((x - Math.floor(x)) * mod)) % mod;
}

const FIRST_NAMES = [
  'Aiden', 'Beatriz', 'Chloe', 'Daniel', 'Emma', 'Felix', 'Grace', 'Hugo', 'Iris', 'Jonas',
  'Kira', 'Liam', 'Maya', 'Noah', 'Olivia', 'Pedro', 'Quinn', 'Rosa', 'Sam', 'Tara',
  'Umar', 'Vera', 'Wren', 'Xiu', 'Yara', 'Zane', 'Alba', 'Boris', 'Camille', 'Dev',
];
const LAST_NAMES = [
  'Alvarez', 'Bennett', 'Carter', 'Dubois', 'Eriksson', 'Fischer', 'Garcia', 'Haddad', 'Ivanov', 'Johnson',
  'Kim', 'Laurent', 'Moreau', 'Nakamura', 'Ortega', 'Petrov', 'Quintero', 'Rossi', 'Santos', 'Tan',
  'Ueda', 'Vargas', 'Weber', 'Xu', 'Young', 'Zhang', 'Ademi', 'Bakker', 'Costa', 'Dias',
];
const AVATARS = ['violet', 'emerald', 'rose', 'cyan', 'amber', 'teal', 'orange', 'fuchsia', 'sky', 'lime'];

const HEADLINES = [
  'Frontend Developer',
  'Full-Stack Developer',
  'Software Engineer',
  'Junior Developer breaking into tech',
  'Senior Engineer · Platform team',
  'Freelance Web Developer',
  'CS student & aspiring frontend dev',
  'React Developer at a product startup',
  'Backend engineer expanding to the frontend',
  'Career switcher — from marketing to code',
];

const BIOS = [
  'Learning in public and reading one article a day.',
  'Currently preparing for my first senior interview.',
  'Building side projects and practicing interview questions.',
  'Here for the system design content and the streaks.',
  'Trying to close the fundamentals gaps bootcamps skipped.',
  'Shipping a SaaS on nights and weekends.',
  'Interviewing in 2026 — wish me luck.',
  'Frontend by day, algorithms by night.',
];

export interface SynthUser {
  email: string; name: string; avatarColor: string; headline: string; bio: string;
  createdAtOffsetDays: number; xp: number; level: number;
  streakCount: number; longestStreak: number;
}

/**
 * Deterministic: generateSynthUsers(90) always returns the same list.
 */
export function generateSynthUsers(count: number): SynthUser[] {
  const users: SynthUser[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[hash(i * 7 + 3, FIRST_NAMES.length)];
    const last = LAST_NAMES[hash(i * 13 + 5, LAST_NAMES.length)];
    const xp = 80 + hash(i * 29 + 11, 2600);
    const level = Math.max(1, Math.min(8, Math.floor(xp / 320) + 1));
    const streakCount = hash(i * 17 + 2, 15);
    users.push({
      email: `${first}.${last}.${i + 1}@example.com`.toLowerCase(),
      name: `${first} ${last}`,
      avatarColor: AVATARS[hash(i * 19 + 7, AVATARS.length)],
      headline: HEADLINES[hash(i * 23 + 1, HEADLINES.length)],
      bio: BIOS[hash(i * 31 + 4, BIOS.length)],
      createdAtOffsetDays: 1 + hash(i * 37 + 9, 300),
      xp,
      level,
      streakCount,
      longestStreak: streakCount + hash(i * 41 + 6, 10),
    });
  }
  return users;
}
