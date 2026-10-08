/**
 * Team map data: the bot-to-bot messages this window has seen, and the pure
 * graph + layout the map draws from the roster, group chats and those messages.
 *
 * Messages come from two places that already exist: a roster refresh whose
 * canonical-chat preview opens with the delivery prefix (a same-gateway
 * `message_agent` / `hermes -p … chat`), and the cross-connection relay's
 * deliveries. Neither is a full history — the backend keeps that in each bot's
 * Bot Chat — so the store is window-lifetime and the map says so.
 */

import { atom } from '@hermes/plugin-sdk'

import { botActivitySession, botHandle, botRosterKey } from './data'
import { previewKind } from './row-helpers'
import type { RosterRow } from './types'

export interface BotMessage {
  /** Epoch milliseconds. */
  at: number
  from: { connectionId?: string; handle: string; name?: string }
  preview: string
  status: 'delivered' | 'failed'
  to: { connectionId?: string; name: string }
}

const MAX_MESSAGES = 200

export const $botMessages = atom<BotMessage[]>([])

const SAME_MESSAGE_WINDOW_MS = 5 * 60_000

/** One delivery can be seen twice: by the relay as it happens, then by the
 *  next roster poll as the target's preview (stamped by the target's clock).
 *  Same recipient + same opening text + close in time = the same message. */
function sameMessage(a: BotMessage, b: BotMessage) {
  return (
    a.to.name === b.to.name &&
    (a.to.connectionId || '') === (b.to.connectionId || '') &&
    a.preview.slice(0, 60) === b.preview.slice(0, 60) &&
    Math.abs(a.at - b.at) < SAME_MESSAGE_WINDOW_MS
  )
}

export function noteBotMessage(message: BotMessage) {
  const list = $botMessages.get()

  if (list.some(m => sameMessage(m, message))) {
    return
  }

  $botMessages.set([...list, message].sort((a, b) => a.at - b.at).slice(-MAX_MESSAGES))
}

const PREFIX_RE = /^Message from [^:]*:\s*/i

/** Roster refresh: a bot whose latest canonical-chat message is a teammate's
 *  delivery records that edge (re-seeing the same preview is a no-op). */
export function noteRosterMessages(roster: RosterRow[]) {
  for (const bot of roster) {
    const activity = botActivitySession(bot)
    const preview = (activity?.preview || '').trim()
    const { fromBot } = previewKind(preview)

    if (!fromBot || !activity?.last_active) {
      continue
    }

    noteBotMessage({
      at: activity.last_active * 1000,
      from: { handle: fromBot, ...(bot.connectionId ? { connectionId: bot.connectionId } : {}) },
      preview: preview.replace(PREFIX_RE, ''),
      status: 'delivered',
      to: { name: bot.name, ...(bot.connectionId ? { connectionId: bot.connectionId } : {}) }
    })
  }
}

// ── graph ─────────────────────────────────────────────────────────────────────

export interface TeamGroupInput {
  members: RosterRow[]
  name: string
}

export interface TeamLink {
  count: number
  failed: boolean
  from: string
  lastAt: number
  to: string
}

export interface TeamMessageRow extends BotMessage {
  fromKey: string
  toKey: string
}

export interface TeamGraph {
  bots: RosterRow[]
  groups: { key: string; memberKeys: string[]; name: string }[]
  links: TeamLink[]
  /** Resolved messages, newest first. */
  messages: TeamMessageRow[]
}

/** Find the roster row a message endpoint names. An explicit connection wins;
 *  otherwise prefer a row on `nearConnection` (the other endpoint's machine),
 *  then any row with that name or handle. */
function resolveEndpoint(
  roster: RosterRow[],
  ref: { connectionId?: string; handle?: string; name?: string },
  nearConnection?: string
): RosterRow | undefined {
  const matches = roster.filter(bot =>
    ref.name ? bot.name === ref.name : botHandle(bot.name, bot).toLowerCase() === (ref.handle || '').toLowerCase()
  )

  return (
    (ref.connectionId && matches.find(bot => bot.connectionId === ref.connectionId)) ||
    (nearConnection !== undefined && matches.find(bot => (bot.connectionId || '') === nearConnection)) ||
    matches.find(bot => !bot.remoteSource) ||
    matches[0]
  )
}

export function deriveTeamGraph(roster: RosterRow[], groups: TeamGroupInput[], messages: BotMessage[]): TeamGraph {
  const bots = roster.filter(bot => !bot.ghost)
  const keys = new Set(bots.map(botRosterKey))
  const links = new Map<string, TeamLink>()
  const rows: TeamMessageRow[] = []

  for (const message of messages) {
    const to = resolveEndpoint(bots, message.to)
    const from = to && resolveEndpoint(bots, message.from, to.connectionId || '')

    if (!to || !from || from === to) {
      continue
    }

    const fromKey = botRosterKey(from)
    const toKey = botRosterKey(to)
    const id = `${fromKey}>${toKey}`
    const link = links.get(id) || { count: 0, failed: false, from: fromKey, lastAt: 0, to: toKey }
    link.count += 1
    link.lastAt = Math.max(link.lastAt, message.at)
    // The link shows the LATEST outcome: a later success clears an old failure.
    link.failed = message.at >= link.lastAt ? message.status === 'failed' : link.failed
    links.set(id, link)
    rows.push({ ...message, fromKey, toKey })
  }

  return {
    bots,
    groups: groups
      .map(group => ({
        key: `group:${group.name}`,
        memberKeys: group.members.map(botRosterKey).filter(key => keys.has(key)),
        name: group.name
      }))
      .filter(group => group.memberKeys.length > 0),
    links: [...links.values()],
    messages: rows.sort((a, b) => b.at - a.at)
  }
}

// ── layout ────────────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

/** Bots evenly on a ring (first at 12 o'clock); each group chat at its
 *  members' centroid pulled toward the middle, so a room sits between the
 *  bots it connects. A room whose spot is already taken (by a bot or another
 *  room) walks out along a sunflower spiral to the first clear spot. */
export function layoutTeamGraph(graph: TeamGraph, size: number): Map<string, Point> {
  const center = size / 2
  const radius = graph.bots.length > 1 ? size * 0.36 : 0
  const at = new Map<string, Point>()

  graph.bots.forEach((bot, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(graph.bots.length, 1)) * Math.PI * 2
    at.set(botRosterKey(bot), { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) })
  })

  const clearance = size * 0.09
  const margin = size * 0.06
  const clamp = (value: number) => Math.min(size - margin, Math.max(margin, value))
  const isClear = (point: Point) => [...at.values()].every(p => Math.hypot(p.x - point.x, p.y - point.y) >= clearance)

  for (const group of graph.groups) {
    const points = group.memberKeys.map(key => at.get(key)!).filter(Boolean)
    const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length
    const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length
    const base = { x: center + (cx - center) * 0.45, y: center + (cy - center) * 0.45 }
    let point = base

    for (let step = 1; step < 80 && !isClear(point); step += 1) {
      const r = size * 0.045 * Math.sqrt(step)
      point = { x: clamp(base.x + r * Math.cos(step * 2.4)), y: clamp(base.y + r * Math.sin(step * 2.4)) }
    }

    at.set(group.key, point)
  }

  return at
}
