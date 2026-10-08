/**
 * Starting roles for New Bot. A role pre-fills Title and Description, which
 * composeSoul() turns into the SOUL's **Role** and **Mission** lines, and which
 * Kanban's decomposer routes tasks by. Pure copy plus one fill rule: a pick
 * never overwrites text the user typed themselves.
 */

export const ROLE_IDS = ['researcher', 'coder', 'reviewer', 'writer', 'assistant'] as const

export type RoleId = (typeof ROLE_IDS)[number]

type RoleTemplateText = {
  label: string
  title: string
  description: string
}

export type RoleMessages = {
  label: string
  hint: string
  custom: string
  purposeHint: string
  appearance: string
  templates: Record<RoleId, RoleTemplateText>
}

export interface RoleFields {
  name: string
  title: string
  description: string
}

/**
 * Fields after switching from role `prev` (null = none) to `next` (null =
 * Custom). A field is replaced only when it is empty or still holds `prev`'s
 * text verbatim; anything else is the user's own writing and stays. The role
 * id seeds an empty name the same way.
 */
export function applyRoleTemplate(
  fields: RoleFields,
  prev: null | RoleId,
  next: null | RoleId,
  templates: Record<RoleId, RoleTemplateText>
): RoleFields {
  const before = prev ? templates[prev] : null
  const after = next ? templates[next] : null
  const untouched = (value: string, previous: string | undefined) => !value.trim() || value === previous

  return {
    name: untouched(fields.name, prev ?? undefined) ? (next ?? '') : fields.name,
    title: untouched(fields.title, before?.title) ? (after?.title ?? '') : fields.title,
    description: untouched(fields.description, before?.description) ? (after?.description ?? '') : fields.description
  }
}

export const rolesEn: RoleMessages = {
  label: 'Role',
  hint: 'Pick a starting role, or write your own below.',
  custom: 'Custom',
  purposeHint: 'Your other bots see this, and Kanban uses it to decide which bot gets a task.',
  appearance: 'Appearance',
  templates: {
    researcher: {
      label: 'Researcher',
      title: 'Researcher',
      description: 'Finds, reads, and summarizes sources, and says where each claim came from.'
    },
    coder: {
      label: 'Coder',
      title: 'Coder',
      description: 'Writes and fixes code in my projects, runs the tests, and explains what changed.'
    },
    reviewer: {
      label: 'Reviewer',
      title: 'Reviewer',
      description: 'Checks drafts and code for mistakes and risks, and suggests concrete fixes.'
    },
    writer: {
      label: 'Writer',
      title: 'Writer',
      description: 'Drafts and edits clear, plain-language documents, emails, and posts.'
    },
    assistant: {
      label: 'Assistant',
      title: 'Assistant',
      description: 'Keeps track of tasks, schedules, and reminders, and handles routine errands.'
    }
  }
}

export const rolesJa: RoleMessages = {
  label: '役割',
  hint: '出発点となる役割を選ぶか、下に自分で書いてください。',
  custom: 'カスタム',
  purposeHint: 'ほかのボットにも表示され、Kanban がタスクの担当ボットを決めるときにも使われます。',
  appearance: '外観',
  templates: {
    researcher: {
      label: 'リサーチャー',
      title: 'リサーチャー',
      description: '情報源を探して読み、要約し、それぞれの主張の出典を示します。'
    },
    coder: {
      label: 'コーダー',
      title: 'コーダー',
      description: 'プロジェクトのコードを書いて修正し、テストを実行し、変更内容を説明します。'
    },
    reviewer: {
      label: 'レビュアー',
      title: 'レビュアー',
      description: '下書きやコードの誤りとリスクを確認し、具体的な修正案を出します。'
    },
    writer: {
      label: 'ライター',
      title: 'ライター',
      description: '分かりやすい文書、メール、投稿を下書きし、推敲します。'
    },
    assistant: {
      label: 'アシスタント',
      title: 'アシスタント',
      description: 'タスク、予定、リマインダーを管理し、定型的な用事をこなします。'
    }
  }
}

export const rolesZh: RoleMessages = {
  label: '角色',
  hint: '选择一个起始角色，或在下方自行填写。',
  custom: '自定义',
  purposeHint: '其他机器人会看到这段描述，Kanban 也用它来决定把任务交给哪个机器人。',
  appearance: '外观',
  templates: {
    researcher: {
      label: '研究员',
      title: '研究员',
      description: '查找、阅读并总结资料，并注明每个结论的出处。'
    },
    coder: {
      label: '程序员',
      title: '程序员',
      description: '在我的项目中编写和修复代码，运行测试，并说明改动内容。'
    },
    reviewer: {
      label: '审阅者',
      title: '审阅者',
      description: '检查草稿和代码中的错误与风险，并给出具体的修改建议。'
    },
    writer: {
      label: '写作者',
      title: '写作者',
      description: '起草并修改清晰易懂的文档、邮件和帖子。'
    },
    assistant: {
      label: '助理',
      title: '助理',
      description: '跟踪任务、日程和提醒，并处理日常事务。'
    }
  }
}

export const rolesZhHant: RoleMessages = {
  label: '角色',
  hint: '選擇一個起始角色，或在下方自行填寫。',
  custom: '自訂',
  purposeHint: '其他機器人會看到這段描述，Kanban 也用它來決定把任務交給哪個機器人。',
  appearance: '外觀',
  templates: {
    researcher: {
      label: '研究員',
      title: '研究員',
      description: '查找、閱讀並摘要資料，並註明每個結論的出處。'
    },
    coder: {
      label: '程式設計師',
      title: '程式設計師',
      description: '在我的專案中撰寫與修正程式碼，執行測試，並說明改動內容。'
    },
    reviewer: {
      label: '審閱者',
      title: '審閱者',
      description: '檢查草稿與程式碼中的錯誤和風險，並提出具體的修改建議。'
    },
    writer: {
      label: '寫作者',
      title: '寫作者',
      description: '起草並修改清楚易懂的文件、郵件與貼文。'
    },
    assistant: {
      label: '助理',
      title: '助理',
      description: '追蹤任務、行程與提醒，並處理日常事務。'
    }
  }
}
