/**
 * New Bot form sections: the role row with Title + Description, and the
 * collapsed Appearance studio. Both keep their small UI state locally — the
 * dialog unmounts its content on close, which resets them with the rest.
 */

import { Button, DisclosureCaret, Input, Textarea } from '@hermes/plugin-sdk'
import { type ComponentProps, useState } from 'react'

import { avatarColor, BotFace } from './avatar'
import { AvatarPicker } from './avatar-picker'
import { labeled } from './dialog-parts'
import { useBots } from './i18n'
import { applyRoleTemplate, ROLE_IDS, type RoleFields, type RoleId } from './role-templates'

interface BotRoleFieldsProps {
  fields: RoleFields
  onChange: (fields: RoleFields) => void
}

/** Role quick-picks above Title and Description. A pick fills the fields it
 *  owns (see applyRoleTemplate); typing keeps the pick highlighted only while
 *  the text still matches it. */
export function BotRoleFields({ fields, onChange }: BotRoleFieldsProps) {
  const b = useBots()
  const [role, setRole] = useState<null | RoleId>(null)
  const templates = b.roles.templates

  const pick = (next: null | RoleId) => {
    onChange(applyRoleTemplate(fields, role, next, templates))
    setRole(next)
  }

  const chip = (id: null | RoleId, label: string) => (
    <Button
      aria-pressed={role === id}
      key={id ?? 'custom'}
      onClick={() => pick(id)}
      size="xs"
      variant={role === id ? 'secondary' : 'outline'}
    >
      {label}
    </Button>
  )

  return (
    <>
      {labeled(
        b.roles.label,
        <div className="grid gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {ROLE_IDS.map(id => chip(id, templates[id].label))}
            {chip(null, b.roles.custom)}
          </div>
          <div className="text-[0.7rem] leading-5 text-(--ui-text-tertiary)">{b.roles.hint}</div>
        </div>
      )}
      {labeled(
        b.editor.title,
        <Input
          onChange={event => onChange({ ...fields, title: event.target.value })}
          placeholder="Inbox Triage"
          value={fields.title}
        />
      )}
      {labeled(
        b.editor.description,
        <div className="grid gap-1">
          <Textarea
            className="min-h-16"
            onChange={event => onChange({ ...fields, description: event.target.value })}
            placeholder={b.bot.helpPromptPlaceholder}
            value={fields.description}
          />
          <div className="text-[0.7rem] leading-5 text-(--ui-text-tertiary)">{b.roles.purposeHint}</div>
        </div>
      )}
    </>
  )
}

type AvatarPickerProps = ComponentProps<typeof AvatarPicker>

interface AppearanceSectionProps extends Omit<AvatarPickerProps, 'generateSeed'> {
  slug: string
  title: string
  description: string
}

/** The face preview stays up top; the avatar studio (shapes, generate,
 *  upload, pet) folds behind "Appearance" so it doesn't lead the form. */
export function AppearanceSection({ slug, title, description, ...picker }: AppearanceSectionProps) {
  const b = useBots()
  const [open, setOpen] = useState(false)
  const seed = slug || 'agent'

  return (
    <>
      <div className="flex justify-center py-1">
        <BotFace
          color={avatarColor(picker.color, seed)}
          image={picker.image}
          name={seed}
          shape={picker.shape}
          size={56}
        />
      </div>
      <Button
        aria-expanded={open}
        className="flex items-center gap-1 text-xs font-medium text-(--ui-text-tertiary) hover:text-(--ui-text-secondary)"
        onClick={() => setOpen(value => !value)}
        size="inline"
        variant="text"
      >
        <DisclosureCaret open={open} />
        {b.roles.appearance}
      </Button>
      {open ? <AvatarPicker {...picker} generateSeed={{ name: seed, title, description }} /> : null}
    </>
  )
}
