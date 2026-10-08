/**
 * Team map contracts: a message seen twice (relay, then roster preview) is one
 * message; endpoints resolve to the right roster row across connections; a
 * link reports its latest outcome; the layout keeps every node apart.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import {
  $botMessages,
  type BotMessage,
  deriveTeamGraph,
  layoutTeamGraph,
  noteBotMessage,
  noteRosterMessages
} from './team-map-data'
import type { RosterRow } from './types'

const ana: RosterRow = { name: 'ana' }
const bo: RosterRow = { name: 'bo' }
const cyRemote: RosterRow = { name: 'cy', connectionId: 'mini', remoteSource: true }

const msg = (over: Partial<BotMessage> = {}): BotMessage => ({
  at: 1_000_000,
  from: { handle: 'ana' },
  preview: 'can you review the draft?',
  status: 'delivered',
  to: { name: 'bo' },
  ...over
})

beforeEach(() => $botMessages.set([]))

describe('noteBotMessage / noteRosterMessages', () => {
  it('records a teammate delivery from a roster preview once, without its prefix', () => {
    const roster: RosterRow[] = [
      ana,
      {
        ...bo,
        canonical_session: {
          id: 's1',
          last_active: 1_700_000_000,
          preview: 'Message from 🤖 ana (@ana): can you review the draft?'
        }
      } as RosterRow
    ]

    noteRosterMessages(roster)
    noteRosterMessages(roster)

    expect($botMessages.get()).toEqual([
      expect.objectContaining({
        at: 1_700_000_000_000,
        from: { handle: 'ana' },
        preview: 'can you review the draft?',
        to: { name: 'bo' }
      })
    ])
  })

  it('ignores previews the human wrote', () => {
    noteRosterMessages([{ ...bo, canonical_session: { id: 's', last_active: 5, preview: 'hi bo' } } as RosterRow])

    expect($botMessages.get()).toEqual([])
  })

  it('treats the relay record and the later roster preview of one delivery as one message', () => {
    noteBotMessage(msg({ from: { connectionId: 'local', handle: 'ana', name: 'ana' } }))
    noteBotMessage(msg({ at: 1_000_000 + 40_000 }))
    noteBotMessage(msg({ at: 1_000_000 + 10 * 60_000 }))

    expect($botMessages.get()).toHaveLength(2)
  })
})

describe('deriveTeamGraph', () => {
  it('resolves handles to roster rows and drops messages to unknown or self', () => {
    const graph = deriveTeamGraph(
      [ana, bo],
      [],
      [msg(), msg({ to: { name: 'ghost' } }), msg({ from: { handle: 'bo' } })]
    )

    expect(graph.links).toEqual([{ count: 1, failed: false, from: 'legacy::ana', lastAt: 1_000_000, to: 'legacy::bo' }])
    expect(graph.messages.map(m => [m.fromKey, m.toKey])).toEqual([['legacy::ana', 'legacy::bo']])
  })

  it('prefers the sender on the recipient’s own machine when names collide', () => {
    const anaRemote: RosterRow = { name: 'ana', connectionId: 'mini', remoteSource: true }

    const graph = deriveTeamGraph(
      [ana, anaRemote, cyRemote],
      [],
      [msg({ to: { connectionId: 'mini', name: 'cy' } })]
    )

    expect(graph.links[0]).toMatchObject({ from: 'mini::ana', to: 'mini::cy' })
  })

  it('shows a link’s latest outcome, so a retry that landed clears an old failure', () => {
    const failedThenOk = deriveTeamGraph([ana, bo], [], [msg({ status: 'failed' }), msg({ at: 2_000_000 })])
    const okThenFailed = deriveTeamGraph([ana, bo], [], [msg(), msg({ at: 2_000_000, status: 'failed' })])

    expect(failedThenOk.links[0]).toMatchObject({ count: 2, failed: false })
    expect(okThenFailed.links[0]).toMatchObject({ count: 2, failed: true })
  })

  it('keeps group chats with seated bots and drops empty ones', () => {
    const graph = deriveTeamGraph([ana, bo], [
      { name: 'Launch', members: [ana, bo] },
      { name: 'Empty', members: [] }
    ], [])

    expect(graph.groups).toEqual([{ key: 'group:Launch', memberKeys: ['legacy::ana', 'legacy::bo'], name: 'Launch' }])
  })
})

describe('layoutTeamGraph', () => {
  it('places every bot and room inside the canvas and apart from each other', () => {
    const bots: RosterRow[] = Array.from({ length: 7 }, (_, i) => ({ name: `bot${i}` }))

    const groups = [
      { name: 'A', members: bots.slice(0, 3) },
      { name: 'B', members: bots.slice(0, 3) },
      { name: 'C', members: bots }
    ]

    const at = layoutTeamGraph(deriveTeamGraph(bots, groups, []), 400)
    const points = [...at.values()]

    expect(points).toHaveLength(10)

    for (const p of points) {
      expect(p.x).toBeGreaterThan(0)
      expect(p.x).toBeLessThan(400)
      expect(p.y).toBeGreaterThan(0)
      expect(p.y).toBeLessThan(400)
    }

    for (const [i, p] of points.entries()) {
      for (const q of points.slice(i + 1)) {
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(20)
      }
    }
  })
})
