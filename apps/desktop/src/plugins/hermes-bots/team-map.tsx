/**
 * Team map: every bot on a ring, each group chat between the bots it seats,
 * and arrows for the bot-to-bot messages this window has seen. Opened from
 * the roster toolbar; clicking a bot or room opens it, like its roster row.
 */

import {
  Button,
  cn,
  Codicon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  relativeTime,
  Tip,
  useValue
} from '@hermes/plugin-sdk'
import { type KeyboardEvent, useMemo, useState } from 'react'

import { avatarColor, botAppearance, BotFace } from './avatar'
import { isBackfilledFacePng } from './avatar-image'
import { $botMeta, botRosterKey } from './data'
import { $groupChats } from './group-chat'
import { openGroupChat } from './group-chat-view'
import { groupChatMemberBots, groupChatNames } from './group-membership'
import { useBots } from './i18n'
import { displayName } from './labels'
import { openRosterBot } from './roster-actions'
import { botRosterMeta } from './routing'
import { $botMessages, deriveTeamGraph, layoutTeamGraph, type Point, type TeamGraph } from './team-map-data'
import type { RosterRow } from './types'

const SIZE = 440
const FACE = 40
const RECENT_LIMIT = 8

/** Shorten a→b by `pad` at both ends, bowed sideways so A→B and B→A don't overlap. */
function arcPath(a: Point, b: Point, pad: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const start = { x: a.x + ux * pad, y: a.y + uy * pad }
  const end = { x: b.x - ux * pad, y: b.y - uy * pad }
  const bend = Math.min(36, length * 0.18)
  const control = { x: (start.x + end.x) / 2 - uy * bend, y: (start.y + end.y) / 2 + ux * bend }

  return `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`
}

function activateOnKey(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action()
    }
  }
}

interface TeamMapCanvasProps {
  graph: TeamGraph
  labelOf: (key: string) => string
  onOpenBot: (bot: RosterRow) => void
  onOpenGroup: (name: string) => void
}

function TeamMapCanvas({ graph, labelOf, onOpenBot, onOpenGroup }: TeamMapCanvasProps) {
  const b = useBots()
  const allMeta = useValue($botMeta)
  const at = useMemo(() => layoutTeamGraph(graph, SIZE), [graph])

  return (
    <svg
      aria-label={b.team.title}
      className="mx-auto block h-auto w-full max-w-[440px] text-(--ui-text-secondary)"
      role="group"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
    >
      <defs>
        {(['ok', 'failed'] as const).map(kind => (
          <marker
            id={`team-arrow-${kind}`}
            key={kind}
            markerHeight="7"
            markerWidth="7"
            orient="auto-start-reverse"
            refX="6"
            refY="3.5"
          >
            <path
              className={kind === 'failed' ? 'fill-destructive' : 'fill-(--ui-accent)'}
              d="M0,0 L7,3.5 L0,7 z"
            />
          </marker>
        ))}
      </defs>
      {graph.groups.flatMap(group =>
        group.memberKeys.map(key => {
          const a = at.get(group.key)!
          const p = at.get(key)!

          return (
            <line
              className="stroke-(--ui-stroke-secondary)"
              key={`${group.key}~${key}`}
              strokeDasharray="3 4"
              x1={a.x}
              x2={p.x}
              y1={a.y}
              y2={p.y}
            />
          )
        })
      )}
      {graph.links.map(link => (
        <path
          className={cn('fill-none', link.failed ? 'stroke-destructive' : 'stroke-(--ui-accent)')}
          d={arcPath(at.get(link.from)!, at.get(link.to)!, FACE / 2 + 6)}
          key={`${link.from}>${link.to}`}
          markerEnd={`url(#team-arrow-${link.failed ? 'failed' : 'ok'})`}
          strokeOpacity={0.85}
          strokeWidth={1.25 + Math.min(link.count, 4) * 0.5}
        >
          <title>{`${labelOf(link.from)} → ${labelOf(link.to)} · ${link.count} · ${relativeTime(link.lastAt)}`}</title>
        </path>
      ))}
      {graph.groups.map(group => {
        const p = at.get(group.key)!

        return (
          <g
            aria-label={b.team.openGroup(group.name)}
            className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-(--ui-accent)"
            key={group.key}
            onClick={() => onOpenGroup(group.name)}
            onKeyDown={activateOnKey(() => onOpenGroup(group.name))}
            role="button"
            tabIndex={0}
          >
            <title>{b.team.groupMembers(group.name, group.memberKeys.length)}</title>
            <rect
              className="fill-(--ui-widget-surface-background) stroke-(--ui-stroke-secondary)"
              height={22}
              rx={6}
              width={22}
              x={p.x - 11}
              y={p.y - 11}
            />
            <foreignObject height={22} width={22} x={p.x - 11} y={p.y - 11}>
              <div className="flex size-full items-center justify-center text-[0.8rem] text-(--ui-text-tertiary)">
                <Codicon name="organization" />
              </div>
            </foreignObject>
            <text className="fill-current text-[10px]" textAnchor="middle" x={p.x} y={p.y + 24}>
              {group.name.length > 18 ? `${group.name.slice(0, 17)}…` : group.name}
            </text>
          </g>
        )
      })}
      {graph.bots.map(bot => {
        const key = botRosterKey(bot)
        const p = at.get(key)!
        const { shape, color, image } = botAppearance(bot.name, botRosterMeta(bot, allMeta))
        const label = labelOf(key)

        return (
          <g
            aria-label={b.team.openChat(label)}
            className="cursor-pointer outline-none focus-visible:[&_text]:fill-(--ui-accent)"
            key={key}
            onClick={() => onOpenBot(bot)}
            onKeyDown={activateOnKey(() => onOpenBot(bot))}
            role="button"
            tabIndex={0}
          >
            <title>{label}</title>
            <foreignObject height={FACE} width={FACE} x={p.x - FACE / 2} y={p.y - FACE / 2}>
              <BotFace
                color={avatarColor(color, bot.name)}
                image={image && !isBackfilledFacePng(image) ? image : null}
                name={bot.name}
                shape={shape}
                size={FACE}
              />
            </foreignObject>
            <text
              className="fill-current text-[11px] font-medium"
              textAnchor="middle"
              x={p.x}
              y={p.y + FACE / 2 + 13}
            >
              {label.length > 16 ? `${label.slice(0, 15)}…` : label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Legend() {
  const b = useBots()

  const swatch = (className: string, dashed?: boolean) => (
    <svg aria-hidden className="shrink-0" height="8" width="20">
      <line className={className} strokeDasharray={dashed ? '3 3' : undefined} strokeWidth="2" x1="0" x2="20" y1="4" y2="4" />
    </svg>
  )

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.7rem] text-(--ui-text-tertiary)">
      <span className="flex items-center gap-1.5">
        {swatch('stroke-(--ui-stroke-secondary)', true)}
        {b.team.legendGroup}
      </span>
      <span className="flex items-center gap-1.5">
        {swatch('stroke-(--ui-accent)')}
        {b.team.legendMessage}
      </span>
      <span className="flex items-center gap-1.5">
        {swatch('stroke-destructive')}
        {b.team.legendFailed}
      </span>
    </div>
  )
}

interface TeamMapDialogProps {
  onClose: () => void
  open: boolean
  roster: RosterRow[]
}

export function TeamMapDialog({ open, onClose, roster }: TeamMapDialogProps) {
  const b = useBots()
  const allMeta = useValue($botMeta)
  const rooms = useValue($groupChats)
  const messages = useValue($botMessages)

  const graph = useMemo(() => {
    const groups = groupChatNames(allMeta, rooms).map(name => ({
      name,
      members: groupChatMemberBots(name, roster, allMeta)
    }))

    return deriveTeamGraph(roster, groups, messages)
  }, [allMeta, rooms, messages, roster])

  const labels = useMemo(
    () => new Map(graph.bots.map(bot => [botRosterKey(bot), displayName(bot, botRosterMeta(bot, allMeta))])),
    [graph, allMeta]
  )

  const labelOf = (key: string) => labels.get(key) || key.split('::').pop() || key

  const openBot = (bot: RosterRow) => {
    onClose()
    void openRosterBot(bot)
  }

  const openGroup = (name: string) => {
    onClose()
    openGroupChat(name)
  }

  const recent = graph.messages.slice(0, RECENT_LIMIT)

  return (
    <Dialog onOpenChange={value => !value && onClose()} open={open}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{b.team.title}</DialogTitle>
          <DialogDescription>{b.team.description}</DialogDescription>
        </DialogHeader>
        {graph.bots.length ? (
          <div className="grid gap-3">
            <TeamMapCanvas graph={graph} labelOf={labelOf} onOpenBot={openBot} onOpenGroup={openGroup} />
            <Legend />
            <div className="grid gap-1.5">
              <div className="text-xs font-medium text-(--ui-text-secondary)">{b.team.recentTitle}</div>
              {recent.length ? (
                <ul className="grid gap-1">
                  {recent.map(message => (
                    <li
                      className="flex min-w-0 items-baseline gap-1.5 text-[0.75rem]"
                      key={`${message.fromKey}>${message.toKey}@${message.at}`}
                    >
                      <span className={cn('shrink-0 font-medium', message.status === 'failed' && 'text-destructive')}>
                        {`${labelOf(message.fromKey)} → ${labelOf(message.toKey)}`}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-(--ui-text-tertiary)">
                        {message.status === 'failed' ? b.team.failed : message.preview}
                      </span>
                      <span className="shrink-0 tabular-nums text-(--ui-text-quaternary)">
                        {relativeTime(message.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[0.75rem] text-(--ui-text-tertiary)">{b.team.recentEmpty}</div>
              )}
              <div className="text-[0.7rem] text-(--ui-text-quaternary)">{b.team.sessionNote}</div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="text-sm font-medium">{b.team.emptyTitle}</div>
            <div className="text-xs text-(--ui-text-tertiary)">{b.team.emptyDesc}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Roster toolbar entry point. */
export function TeamMapButton({ roster }: { roster: RosterRow[] }) {
  const b = useBots()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tip label={b.team.open}>
        <Button
          aria-label={b.team.open}
          className="rounded-md text-(--ui-text-tertiary) hover:text-foreground"
          onClick={() => setOpen(true)}
          size="icon-xs"
          variant="ghost"
        >
          <Codicon name="type-hierarchy" />
        </Button>
      </Tip>
      {open ? <TeamMapDialog onClose={() => setOpen(false)} open={open} roster={roster} /> : null}
    </>
  )
}
