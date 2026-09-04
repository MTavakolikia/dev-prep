// ============================================================
// Dev Prep — shared domain types (client & server safe)
// ============================================================

export type Role = 'USER' | 'AUTHOR' | 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN';
export const ALL_ROLES: Role[] = ['USER', 'AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'];
export const ROLE_ORDER: Record<Role, number> = { USER: 0, AUTHOR: 1, EDITOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };
export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Member', AUTHOR: 'Author', EDITOR: 'Editor', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin',
};

export type ArticleStatus = 'DRAFT' | 'IN_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
export const ARTICLE_STATUSES: ArticleStatus[] = ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export type Seniority = 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF';
export const SENIORITIES: Seniority[] = ['JUNIOR', 'MID', 'SENIOR', 'STAFF'];

export type QuestionCategory =
  | 'CONCEPTUAL' | 'CODING' | 'DEBUGGING' | 'ARCHITECTURE' | 'SYSTEM_DESIGN'
  | 'BEHAVIORAL' | 'PERFORMANCE' | 'SECURITY' | 'PRACTICAL';

export type InterviewMode = 'quick' | 'standard' | 'full' | 'random' | 'senior' | 'staff' | 'daily' | 'quiz';

export interface SessionUser {
  id: string; email: string; name: string; role: Role; avatarColor: string;
  headline: string | null; xp: number; level: number; streakCount: number; longestStreak: number;
}

// ---- serialized entities (as returned by server actions) ----
export interface UserDTO {
  id: string; name: string; email: string; role: Role; avatarColor: string;
  headline: string | null; bio: string | null; xp: number; level: number;
  streakCount: number; longestStreak: number; createdAt: string;
  deletedAt?: string | null;
  articleCount?: number;
}

export interface ArticleDTO {
  id: string; title: string; slug: string; excerpt: string; coverStyle: string;
  difficulty: Difficulty; status: ArticleStatus; readingTime: number; views: number;
  interviewRelevant: boolean; featured: boolean; publishedAt: string | null;
  scheduledAt: string | null; createdAt: string; updatedAt: string;
  author: { id: string; name: string; avatarColor: string; headline: string | null };
  technology: { id: string; name: string; slug: string; icon: string; color: string } | null;
  category: { id: string; name: string; slug: string; color: string } | null;
  tags: string[];
  likeCount?: number; bookmarkCount?: number;
  liked?: boolean; bookmarked?: boolean; readPercent?: number | null;
}

export interface ArticleDetailDTO extends ArticleDTO {
  content: string;
  tldr: string[] | null;
  cheatSheet: { title: string; points: string[] } | null;
  seoTitle: string | null; seoDescription: string | null; seoKeywords: string | null;
  prev?: { title: string; slug: string } | null;
  next?: { title: string; slug: string } | null;
  relatedQuestions: QuestionDTO[];
  relatedArticles: ArticleDTO[];
}

export interface TechnologyDTO {
  id: string; name: string; slug: string; description: string; longDescription: string | null;
  icon: string; color: string; difficulty: string; popularity: number; related: string[];
  categorySlug: string; categoryName: string;
  articleCount: number; questionCount: number;
  userProgress?: { percent: number; completed: number; total: number } | null;
}

export interface QuestionDTO {
  id: string; question: string; shortAnswer: string; detailedAnswer: string;
  topic: string; category: QuestionCategory; difficulty: string; seniority: Seniority;
  expectedMinutes: number; tags: string[];
  technology: { name: string; slug: string; icon: string; color: string };
  bookmarked?: boolean;
}

export interface AttemptSummaryDTO {
  id: string; mode: string; level: string; score: number; totalQuestions: number;
  knownCount: number; difficultCount: number; skippedCount: number;
  durationSeconds: number; status: string; createdAt: string;
  strongTopics: string[]; weakTopics: string[];
  technology: { name: string; slug: string; icon: string; color: string } | null;
}

export interface PathDTO {
  id: string; title: string; slug: string; description: string; longDescription: string | null;
  icon: string; color: string; level: string; estimatedHours: number; careerGoal: string | null;
  technology: { name: string; slug: string; icon: string; color: string } | null;
  itemCount: number; enrolledCount: number;
  enrollment?: { startedAt: string; completedAt: string | null } | null;
  progress?: { completed: number; percent: number };
  items?: PathItemDTO[];
}

export interface PathItemDTO {
  id: string; sortOrder: number; title: string; description: string | null;
  estimatedHours: number; milestone: boolean;
  article: { title: string; slug: string; readingTime: number } | null;
  technology: { name: string; slug: string; icon: string; color: string } | null;
  completed?: boolean;
}

export interface NotificationDTO {
  id: string; type: string; title: string; body: string | null; link: string | null;
  read: boolean; createdAt: string;
}

export interface ActivityDTO {
  id: string; type: string; title: string | null; xp: number; createdAt: string;
  refType?: string | null; refId?: string | null;
}

export interface DashboardDTO {
  user: SessionUser;
  stats: {
    articlesRead: number; completedArticles: number; bookmarks: number;
    questionsAnswered: number; attempts: number; avgScore: number;
    readiness: number; notes: number;
  };
  skillGraph: { slug: string; name: string; icon: string; color: string; percent: number }[];
  activityByDay: { day: string; xp: number; articles: number; questions: number }[];
  recentAttempts: AttemptSummaryDTO[];
  recommendations: { articles: ArticleDTO[]; questions: QuestionDTO[]; reason: string };
  achievements: { key: string; title: string; description: string; icon: string; tier: string; earned: boolean; earnedAt: string | null }[];
  recentActivity: ActivityDTO[];
  notifications: NotificationDTO[];
  enrolledPaths: PathDTO[];
  daily: { challengeCompleted: boolean; articlesRead: number; questionsAnswered: number; day: string } | null;
}

export interface AdminOverviewDTO {
  totals: {
    users: number; activeUsers: number; articles: number; published: number;
    drafts: number; views: number; questions: number; attempts: number;
    bookmarks: number; comments: number; avgScore: number;
  };
  viewsByDay: { day: string; views: number; articles: number }[];
  signups: { day: string; count: number }[];
  topArticles: { id: string; title: string; slug: string; views: number; likes: number; technology: string }[];
  techPopularity: { name: string; articles: number; color: string }[];
  statusBreakdown: { status: string; count: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  interviewStats: { mode: string; count: number; avgScore: number }[];
  recentActivity: { id: string; type: string; user: string; title: string; createdAt: string }[];
}

// ---- helpers ----
export function parseJsonArray<T = string>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try { const v = JSON.parse(value); return Array.isArray(v) ? v as T[] : fallback; } catch { return fallback; }
}
