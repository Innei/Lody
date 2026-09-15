import { describe, expect, it } from 'vitest';
import { buildLiveActivityConversationItems } from '../src/live-activity-summary';
import type { SessionMeta } from '../src/schema';

const labels = { permission: 'P', question: 'Q', running: 'R', unread: 'U' };
const now = Date.now();

function session(meta: Partial<SessionMeta>): SessionMeta {
  return {
    id: 'session' as SessionMeta['id'],
    machineId: 'machine' as SessionMeta['machineId'],
    createdAt: new Date(now - 3_600_000).toISOString(),
    userId: 'user',
    cliType: 'builtin',
    agentType: 'claude',
    ...meta,
  } as SessionMeta;
}

function updatedAtOf(meta: Partial<SessionMeta>) {
  const [item] = buildLiveActivityConversationItems({
    sessions: [session(meta)],
    currentUserId: 'user',
    defaultTitle: 'New Task',
    statusLabels: labels,
    formatUpdatedAt: () => '',
  });
  return item;
}

describe('live activity updatedAt', () => {
  it('starts a running turn at lastRunningSeen instead of the previous message', () => {
    const item = updatedAtOf({
      status: { type: 'running' },
      lastRunningSeen: now - 5_000,
      lastMessageAt: now - 600_000,
    });
    expect(item?.status).toBe('running');
    expect(item?.updatedAt).toBe(now - 5_000);
  });

  it('falls back to lastMessageAt when lastRunningSeen belongs to an earlier turn', () => {
    const item = updatedAtOf({
      status: { type: 'running' },
      lastRunningSeen: now - 5_000,
      lastMessageAt: now - 1_000,
    });
    expect(item?.updatedAt).toBe(now - 1_000);
  });

  it('keeps lastMessageAt for completed rows', () => {
    const item = updatedAtOf({
      status: { type: 'idle' },
      lastRunningSeen: now - 600_000,
      lastMessageAt: now - 1_000,
    });
    expect(item?.status).toBe('unread');
    expect(item?.updatedAt).toBe(now - 1_000);
  });
});
