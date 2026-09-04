// Check current row counts per model
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const models = [
  'user', 'category', 'technology', 'tag', 'article', 'articleRevision', 'interviewQuestion',
  'interviewAttempt', 'interviewAnswer', 'learningPath', 'learningPathItem', 'pathEnrollment',
  'articleRead', 'articleBookmark', 'questionBookmark', 'like', 'comment', 'note',
  'achievement', 'userAchievement', 'userActivity', 'notification', 'dailyProgress',
  'searchHistory', 'aIConversation', 'aIMessage', 'media', 'analyticsEvent',
];

async function main() {
  for (const m of models) {
    console.log(m.padEnd(22), (db as any)[m] ? await (db as any)[m].count() : 'N/A');
  }
  await db.$disconnect();
}
main();
