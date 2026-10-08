import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { translateBots } from './i18n-test-helper'

const openRosterBot = vi.fn()
const openGroupChat = vi.fn()

vi.mock('@hermes/plugin-sdk', async () => {
  const { pluginSdkMock, createGroupGateway } = await import('./group-test-utils')
  const base = await pluginSdkMock(createGroupGateway().host)
  const Pass = ({ children }: { children?: ReactNode }) => <>{children}</>

  return {
    ...base,
    Button: ({ children, onClick, ...rest }: { children?: ReactNode; onClick?: () => void }) => (
      <button onClick={onClick} {...rest}>
        {children}
      </button>
    ),
    cn: (...values: unknown[]) => values.filter(Boolean).join(' '),
    Codicon: () => null,
    Dialog: ({ children, open }: { children?: ReactNode; open?: boolean }) => (open ? <>{children}</> : null),
    DialogContent: Pass,
    DialogDescription: Pass,
    DialogHeader: Pass,
    DialogTitle: Pass,
    Tip: Pass,
    relativeTime: () => 'now',
    useI18n: () => ({ t: { common: { cancel: 'Cancel' } } }),
    usePluginI18n: () => translateBots
  }
})
vi.mock('./avatar', () => ({ avatarColor: () => '#888', botAppearance: () => ({}), BotFace: () => null }))
vi.mock('./roster-actions', () => ({ openRosterBot }))
vi.mock('./group-chat-view', () => ({ openGroupChat }))

beforeEach(async () => {
  const { $botMessages } = await import('./team-map-data')
  const { $groupChats } = await import('./group-chat')
  $botMessages.set([])
  $groupChats.set({})
  openRosterBot.mockClear()
  openGroupChat.mockClear()
})
afterEach(cleanup)

const roster = [{ name: 'ana' }, { name: 'bo' }]

it('draws each bot and room, lists recent messages, and opens what is clicked', async () => {
  const { $botMessages } = await import('./team-map-data')
  const { $groupChats } = await import('./group-chat')
  const { TeamMapDialog } = await import('./team-map')

  $groupChats.set({ Launch: { log: [], members: roster } } as never)
  $botMessages.set([
    { at: 1, from: { handle: 'ana' }, preview: 'draft is ready', status: 'delivered', to: { name: 'bo' } }
  ])

  const onClose = vi.fn()
  render(<TeamMapDialog onClose={onClose} open roster={roster} />)

  expect(screen.getByRole('button', { name: 'Open chat with Ana' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Open Launch' })).toBeTruthy()
  expect(screen.getByText('Ana → Bo')).toBeTruthy()
  expect(screen.getByText('draft is ready')).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: 'Open chat with Bo' }))
  expect(onClose).toHaveBeenCalled()
  expect(openRosterBot).toHaveBeenCalledWith(roster[1])

  fireEvent.keyDown(screen.getByRole('button', { name: 'Open Launch' }), { key: 'Enter' })
  expect(openGroupChat).toHaveBeenCalledWith('Launch')
})

it('says when no bots have messaged each other yet', async () => {
  const { TeamMapDialog } = await import('./team-map')

  render(<TeamMapDialog onClose={() => undefined} open roster={roster} />)

  expect(screen.getByText(/When one bot messages another/)).toBeTruthy()
})

it('an empty group chat explains how the room works', async () => {
  const { GroupRulesCard } = await import('./group-rules')

  render(<GroupRulesCard />)

  expect(screen.getByText('How this group chat works')).toBeTruthy()
  expect(screen.getByText(/after 3 rounds or 10 messages/)).toBeTruthy()
})
