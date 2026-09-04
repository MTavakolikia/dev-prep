// ============================================================
// Dev Prep seed — generated achievements
// Extends the 16 hand-curated achievements (keys first-steps,
// bookworm-10, into-the-arena, sharp-mind, on-fire are earned by
// the demo user and MUST keep existing) with deterministic
// milestone sets across all five categories.
// ============================================================
import type { SeedAchievement } from './paths';

type Cat = SeedAchievement['category'];
type Tier = SeedAchievement['tier'];

const A = (
  key: string, title: string, description: string, icon: string,
  tier: Tier, xpReward: number, category: Cat,
): SeedAchievement => ({ key, title, description, icon, tier, xpReward, category });

export const generatedAchievements: SeedAchievement[] = [
  // ---------- learning: reading milestones ----------
  A('reader-3', 'Page Turner', 'Read 3 articles', 'book-open', 'bronze', 20, 'learning'),
  A('reader-25', 'Devoted Reader', 'Read 25 articles', 'book-marked', 'bronze', 60, 'learning'),
  A('reader-150', 'Avid Reader', 'Read 150 articles', 'book-copy', 'silver', 180, 'learning'),
  A('reader-250', 'Volume Reader', 'Read 250 articles', 'books', 'silver', 240, 'learning'),
  A('reader-500', 'Human Library', 'Read 500 articles', 'library-big', 'gold', 400, 'learning'),
  A('deep-diver', 'Deep Diver', 'Read 25 expert-level articles', 'anchor', 'silver', 140, 'learning'),
  A('marathon-reader', 'Marathon Reader', 'Read 5 articles in a single day', 'timer', 'bronze', 60, 'learning'),
  A('polymath', 'Polymath', 'Read articles across all six categories', 'globe', 'silver', 180, 'learning'),

  // ---------- learning: paths ----------
  A('path-enroll-3', 'Explorer', 'Enroll in 3 learning paths', 'map', 'bronze', 50, 'learning'),
  A('path-enroll-5', 'Grand Tourer', 'Enroll in 5 learning paths', 'map-pinned', 'silver', 90, 'learning'),
  A('path-complete-2', 'Committed Learner', 'Complete 2 learning paths', 'milestone', 'silver', 140, 'learning'),
  A('path-complete-5', 'Path Master', 'Complete 5 learning paths', 'mountain-snow', 'gold', 300, 'learning'),
  A('path-complete-10', 'Grandmaster of Paths', 'Complete 10 learning paths', 'crown', 'gold', 500, 'learning'),

  // ---------- learning: notes, challenges, search ----------
  A('note-10', 'Field Notes', 'Create 10 personal notes', 'pencil-ruler', 'bronze', 40, 'learning'),
  A('note-50', 'Research Journal', 'Create 50 personal notes', 'notebook-pen', 'silver', 120, 'learning'),
  A('challenge-1', 'Challenge Accepted', 'Complete your first daily challenge', 'calendar-check', 'bronze', 25, 'learning'),
  A('challenge-10', 'Challenge Regular', 'Complete 10 daily challenges', 'calendar-check-2', 'bronze', 80, 'learning'),
  A('challenge-25', 'Challenge Machine', 'Complete 25 daily challenges', 'calendar-range', 'silver', 160, 'learning'),
  A('challenge-50', 'Half Century of Challenges', 'Complete 50 daily challenges', 'calendar-days', 'silver', 240, 'learning'),
  A('challenge-75', 'Challenge Virtuoso', 'Complete 75 daily challenges', 'calendar-heart', 'gold', 300, 'learning'),
  A('challenge-100', 'Challenge Legend', 'Complete 100 daily challenges', 'trophy', 'gold', 380, 'learning'),
  A('researcher', 'Researcher', 'Run 10 searches', 'search', 'bronze', 30, 'learning'),
  A('cheat-sheet-fan', 'Cheat Sheet Collector', 'View 25 cheat sheets', 'scroll-text', 'bronze', 50, 'learning'),

  // ---------- interview: sessions ----------
  A('session-2', 'Warm-Up Done', 'Complete 2 interview sessions', 'dumbbell', 'bronze', 40, 'interview'),
  A('session-5', 'Regular in the Arena', 'Complete 5 interview sessions', 'sword', 'bronze', 70, 'interview'),
  A('session-25', 'Arena Veteran', 'Complete 25 interview sessions', 'shield-half', 'silver', 160, 'interview'),
  A('session-50', 'Loop Ready', 'Complete 50 interview sessions', 'shield-check', 'silver', 220, 'interview'),
  A('session-100', 'Centurion of the Arena', 'Complete 100 interview sessions', 'shield', 'gold', 350, 'interview'),

  // ---------- interview: scores ----------
  A('score-60', 'Passing Grade', 'Score 60% or higher in a session', 'circle-check', 'bronze', 40, 'interview'),
  A('score-70', 'Solid Performance', 'Score 70% or higher in a session', 'circle-check-big', 'bronze', 60, 'interview'),
  A('score-90', 'Elite Candidate', 'Score 90% or higher in a session', 'star', 'gold', 220, 'interview'),
  A('score-100', 'Flawless Session', 'Score 100% in a session', 'sparkle', 'gold', 400, 'interview'),
  A('perfectionist', 'Perfectionist', 'Finish 10 sessions at 90% or higher', 'gem', 'gold', 260, 'interview'),

  // ---------- interview: volume ----------
  A('question-250', 'Two Fifty', 'Answer 250 interview questions', 'list-ordered', 'bronze', 90, 'interview'),
  A('question-500', 'Five Hundred Answers', 'Answer 500 interview questions', 'list-checks', 'silver', 240, 'interview'),
  A('question-1000', 'Thousand-Question Club', 'Answer 1,000 interview questions', 'list-todo', 'gold', 400, 'interview'),
  A('interview-marathon', 'Interview Marathon', 'Answer 50 questions in a single day', 'infinity', 'silver', 130, 'interview'),

  // ---------- interview: modes ----------
  A('mode-quick', 'Quick Draw', 'Complete a Quick 5 session', 'zap', 'bronze', 25, 'interview'),
  A('mode-full', 'Endurance Runner', 'Complete a Full 30 session', 'timer', 'silver', 90, 'interview'),
  A('mode-senior', 'Senior Circuit', 'Complete a Senior-track session', 'briefcase-business', 'silver', 80, 'interview'),
  A('mode-staff', 'Staff-Level Gauntlet', 'Complete a Staff-track session', 'building-2', 'gold', 150, 'interview'),

  // ---------- interview: category mastery (6 categories x 3 tiers) ----------
  A('mastery-frontend-1', 'Frontend Apprentice', 'Answer 25 Frontend questions correctly', 'atom', 'bronze', 60, 'mastery'),
  A('mastery-frontend-2', 'Frontend Adept', 'Answer 75 Frontend questions correctly', 'atom', 'silver', 140, 'mastery'),
  A('mastery-frontend-3', 'Frontend Master', 'Answer 200 Frontend questions correctly', 'atom', 'gold', 300, 'mastery'),
  A('mastery-backend-1', 'Backend Apprentice', 'Answer 25 Backend questions correctly', 'server', 'bronze', 60, 'mastery'),
  A('mastery-backend-2', 'Backend Adept', 'Answer 75 Backend questions correctly', 'server', 'silver', 140, 'mastery'),
  A('mastery-backend-3', 'Backend Master', 'Answer 200 Backend questions correctly', 'server', 'gold', 300, 'mastery'),
  A('mastery-devops-1', 'DevOps Apprentice', 'Answer 25 DevOps questions correctly', 'container', 'bronze', 60, 'mastery'),
  A('mastery-devops-2', 'DevOps Adept', 'Answer 75 DevOps questions correctly', 'container', 'silver', 140, 'mastery'),
  A('mastery-devops-3', 'DevOps Master', 'Answer 200 DevOps questions correctly', 'container', 'gold', 300, 'mastery'),
  A('mastery-mobile-1', 'Mobile Apprentice', 'Answer 25 Mobile questions correctly', 'smartphone', 'bronze', 60, 'mastery'),
  A('mastery-mobile-2', 'Mobile Adept', 'Answer 75 Mobile questions correctly', 'smartphone', 'silver', 140, 'mastery'),
  A('mastery-mobile-3', 'Mobile Master', 'Answer 200 Mobile questions correctly', 'smartphone', 'gold', 300, 'mastery'),
  A('mastery-ai-1', 'AI Apprentice', 'Answer 25 AI & ML questions correctly', 'brain-circuit', 'bronze', 60, 'mastery'),
  A('mastery-ai-2', 'AI Adept', 'Answer 75 AI & ML questions correctly', 'brain-circuit', 'silver', 140, 'mastery'),
  A('mastery-ai-3', 'AI Master', 'Answer 200 AI & ML questions correctly', 'brain-circuit', 'gold', 300, 'mastery'),
  A('mastery-engineering-1', 'Engineering Apprentice', 'Answer 25 Software Engineering questions correctly', 'git-branch', 'bronze', 60, 'mastery'),
  A('mastery-engineering-2', 'Engineering Adept', 'Answer 75 Software Engineering questions correctly', 'git-branch', 'silver', 140, 'mastery'),
  A('mastery-engineering-3', 'Engineering Master', 'Answer 200 Software Engineering questions correctly', 'git-branch', 'gold', 300, 'mastery'),

  // ---------- streak ----------
  A('streak-3', 'Warming Up', 'Maintain a 3-day learning streak', 'flame', 'bronze', 30, 'streak'),
  A('streak-14', 'Two-Week Streak', 'Maintain a 14-day learning streak', 'flame-kindling', 'silver', 140, 'streak'),
  A('streak-60', 'Habit Formed', 'Maintain a 60-day learning streak', 'flame', 'gold', 300, 'streak'),
  A('streak-100', 'Century of Consistency', 'Maintain a 100-day learning streak', 'medal', 'gold', 450, 'streak'),
  A('streak-saver', 'Streak Saver', 'Complete the daily challenge late in the evening to save your streak', 'alarm-clock', 'bronze', 45, 'streak'),
  A('comeback', 'The Comeback', 'Return to learning after a 7-day break', 'rotate-ccw', 'bronze', 40, 'streak'),

  // ---------- community ----------
  A('bookmark-25', 'Collector', 'Bookmark 25 articles', 'bookmark', 'bronze', 90, 'community'),
  A('bookmark-100', 'Grand Library', 'Bookmark 100 articles', 'bookmark-check', 'gold', 220, 'community'),
  A('comment-1', 'First Words', 'Write your first comment', 'message-circle', 'bronze', 20, 'community'),
  A('comment-10', 'Community Voice', 'Write 10 comments', 'messages-square', 'bronze', 70, 'community'),
  A('comment-50', 'Conversation Starter', 'Write 50 comments', 'message-square-share', 'silver', 160, 'community'),
  A('like-1', 'Encourager', 'Like your first article', 'heart', 'bronze', 15, 'community'),
  A('like-25', 'Cheerleader', 'Like 25 articles', 'heart-handshake', 'bronze', 60, 'community'),
  A('like-100', 'Superfan', 'Like 100 articles', 'heart', 'silver', 140, 'community'),

  // ---------- progression: XP & levels ----------
  A('xp-500', 'Rising Star', 'Reach 500 XP', 'trending-up', 'bronze', 50, 'mastery'),
  A('xp-1000', 'Force to Reckon With', 'Reach 1,000 XP', 'trending-up', 'bronze', 100, 'mastery'),
  A('xp-5000', 'XP Machine', 'Reach 5,000 XP', 'rocket', 'silver', 200, 'mastery'),
  A('xp-10000', 'Legend in the Making', 'Reach 10,000 XP', 'rocket', 'silver', 300, 'mastery'),
  A('xp-25000', 'Platform Legend', 'Reach 25,000 XP', 'crown', 'gold', 450, 'mastery'),
  A('xp-50000', 'Beyond Limits', 'Reach 50,000 XP', 'crown', 'gold', 600, 'mastery'),
  A('level-5', 'Level 5 — Intermediate', 'Reach level 5', 'chevrons-up', 'bronze', 60, 'mastery'),
  A('level-10', 'Level 10 — Advanced', 'Reach level 10', 'chevrons-up-up', 'silver', 150, 'mastery'),
  A('level-15', 'Level 15 — Expert', 'Reach level 15', 'badge-check', 'gold', 280, 'mastery'),
  A('level-20', 'Level 20 — Master', 'Reach level 20', 'award', 'gold', 450, 'mastery'),

  // ---------- fun & habits ----------
  A('night-owl', 'Night Owl', 'Complete a session after midnight', 'moon', 'bronze', 30, 'streak'),
  A('early-bird', 'Early Bird', 'Complete a session before 6 AM', 'sunrise', 'bronze', 30, 'streak'),
  A('weekend-warrior', 'Weekend Warrior', 'Complete a session on a weekend', 'party-popper', 'bronze', 40, 'streak'),
  A('speed-demon', 'Speed Demon', 'Finish a Quick 5 session in under 5 minutes', 'gauge', 'bronze', 50, 'interview'),
  A('ai-curious', 'AI Curious', 'Start your first AI assistant conversation', 'bot', 'bronze', 20, 'learning'),
  A('all-modes', 'Full Repertoire', 'Try every interview mode at least once', 'layers', 'silver', 120, 'interview'),
  A('tech-tourist', 'Tech Tourist', 'Read articles across 10 different technologies', 'compass', 'bronze', 80, 'learning'),
  A('interview-ready-pro', 'Interview-Ready Pro', 'Reach 95% interview readiness', 'target', 'gold', 350, 'interview'),
];
