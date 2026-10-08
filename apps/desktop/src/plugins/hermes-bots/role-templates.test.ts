import { describe, expect, it } from 'vitest'

import { applyRoleTemplate, rolesEn } from './role-templates'

const t = rolesEn.templates
const empty = { name: '', title: '', description: '' }

describe('applyRoleTemplate', () => {
  it('fills empty fields from the picked role, seeding the name', () => {
    expect(applyRoleTemplate(empty, null, 'coder', t)).toEqual({
      name: 'coder',
      title: t.coder.title,
      description: t.coder.description
    })
  })

  it('swaps fields that still hold the previous role verbatim', () => {
    const coder = applyRoleTemplate(empty, null, 'coder', t)

    expect(applyRoleTemplate(coder, 'coder', 'writer', t)).toEqual({
      name: 'writer',
      title: t.writer.title,
      description: t.writer.description
    })
  })

  it('never overwrites text the user typed', () => {
    const edited = { name: 'inbox', title: 'Inbox Triage', description: 'Sorts my mail.' }

    expect(applyRoleTemplate(edited, null, 'reviewer', t)).toEqual(edited)
    expect(applyRoleTemplate({ ...applyRoleTemplate(empty, null, 'coder', t), title: 'Lead' }, 'coder', 'writer', t))
      .toMatchObject({ title: 'Lead', description: t.writer.description })
  })

  it('Custom clears only what the previous role filled', () => {
    const coder = { ...applyRoleTemplate(empty, null, 'coder', t), name: 'my-coder' }

    expect(applyRoleTemplate(coder, 'coder', null, t)).toEqual({ name: 'my-coder', title: '', description: '' })
  })
})
