'use client';

// Lucide dynamic icon resolver — maps string icon names from the
// database to lucide-react components with a safe fallback.
import { lazy, Suspense } from 'react';
import {
  Braces, FileCode2, Atom, Triangle, FileCode, Paintbrush, Wind, Boxes, RefreshCw, Gauge,
  FlaskConical, Accessibility, Globe, LayoutDashboard, Shapes, PenTool, ShieldCheck, Hexagon,
  Webhook, Network, KeyRound, Database, Container, ShipWheel, GitPullRequest, Github, Terminal,
  Cloud, Smartphone, TabletSmartphone, Brain, Library, BotMessageSquare, MessageSquareText,
  PlugZap, GitBranch, Sparkles, Binary, GitFork, Gem, LayoutTemplate, Route, Zap, Briefcase,
  Layers, Shuffle, TrendingUp, CalendarCheck, Award, BookOpen, Swords, Flame, Rocket, Target,
  Map, Mountain, PencilLine, Bookmark, GraduationCap, ListChecks, Inbox, Footprints, Server,
  UserX, FileText, MessageSquare,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  braces: Braces, 'file-code-2': FileCode2, atom: Atom, triangle: Triangle, 'file-code': FileCode,
  paintbrush: Paintbrush, wind: Wind, boxes: Boxes, 'refresh-cw': RefreshCw, gauge: Gauge,
  'flask-conical': FlaskConical, 'universal-access': Accessibility, globe: Globe,
  'layout-dashboard': LayoutDashboard, shapes: Shapes, 'pen-tool': PenTool, 'shield-check': ShieldCheck,
  hexagon: Hexagon, webhook: Webhook, network: Network, 'key-round': KeyRound, database: Database,
  container: Container, 'ship-wheel': ShipWheel, 'git-pull-request': GitPullRequest, github: Github,
  terminal: Terminal, cloud: Cloud, smartphone: Smartphone, 'tablet-smartphone': TabletSmartphone,
  brain: Brain, 'brain-circuit': Brain, library: Library, 'bot-message-square': BotMessageSquare,
  'message-square-text': MessageSquareText, 'plug-zap': PlugZap, 'git-branch': GitBranch,
  sparkles: Sparkles, binary: Binary, 'git-fork': GitFork, gem: Gem, 'layout-template': LayoutTemplate,
  route: Route, zap: Zap, briefcase: Briefcase, layers: Layers, shuffle: Shuffle,
  'trending-up': TrendingUp, 'calendar-check': CalendarCheck, award: Award, 'book-open': BookOpen,
  swords: Swords, flame: Flame, rocket: Rocket, target: Target, map: Map, mountain: Mountain,
  'pencil-line': PencilLine, bookmark: Bookmark, 'graduation-cap': GraduationCap,
  'list-checks': ListChecks, inbox: Inbox, footprints: Footprints, server: Server,
  'user-x': UserX, 'file-text': FileText, 'message-square': MessageSquare,
};

export function dynamicIconImport(name: string | null | undefined, className?: string, strokeWidth = 2) {
  const Icon = ICONS[name ?? ''] ?? Shapes;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}

// Suspense wrapper kept for API-compatibility if we switch to lazy imports later
export function SafeIcon({ name, className }: { name: string; className?: string }) {
  return <Suspense fallback={null}>{dynamicIconImport(name, className)}</Suspense>;
}

void lazy;
