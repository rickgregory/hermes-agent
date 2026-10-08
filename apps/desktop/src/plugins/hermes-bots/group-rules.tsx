/**
 * What an empty group chat shows: the room's turn-taking rules in four lines,
 * so the @mention / pass / round-cap / stop behavior is learned before the
 * first send rather than inferred from the activity feed.
 */

import { Codicon } from '@hermes/plugin-sdk'

import { GROUP_CHAT_MAX_MESSAGES, GROUP_CHAT_MAX_ROUNDS } from './group-chat'
import { useBots } from './i18n'

export function GroupRulesCard() {
  const b = useBots()

  const rules: [string, string][] = [
    ['mention', b.room.ruleMention],
    ['comment-discussion', b.room.ruleOrder],
    ['debug-step-over', b.room.ruleRounds(GROUP_CHAT_MAX_ROUNDS, GROUP_CHAT_MAX_MESSAGES)],
    ['debug-pause', b.room.ruleStop]
  ]

  return (
    <div className="mx-auto my-4 grid w-full max-w-md gap-2 px-2 text-[0.75rem]">
      <div className="font-medium text-(--ui-text-secondary)">{b.room.rulesTitle}</div>
      <ul className="grid gap-1.5">
        {rules.map(([icon, text]) => (
          <li className="flex items-start gap-2 text-(--ui-text-tertiary)" key={icon}>
            <Codicon className="mt-0.5 shrink-0 text-[0.8rem]" name={icon} />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
