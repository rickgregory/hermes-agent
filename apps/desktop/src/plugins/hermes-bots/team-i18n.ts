/**
 * Bot Mode copy for the team map and the group-chat "how it works" card.
 * Split from `i18n.ts` to keep that file under the code-health line cap;
 * merged into BotsMessages as `team` and `room`.
 */

export type TeamMessages = {
  open: string
  title: string
  description: string
  legendGroup: string
  legendMessage: string
  legendFailed: string
  recentTitle: string
  recentEmpty: string
  sessionNote: string
  emptyTitle: string
  emptyDesc: string
  failed: string
  groupMembers: (group: string, count: number) => string
  openChat: (name: string) => string
  openGroup: (name: string) => string
}

export type RoomMessages = {
  rulesTitle: string
  ruleMention: string
  ruleOrder: string
  ruleRounds: (rounds: number, messages: number) => string
  ruleStop: string
  settled: string
  capped: (rounds: number, messages: number) => string
}

export const teamEn: TeamMessages = {
  open: 'Team map',
  title: 'Team map',
  description: 'Your bots, the group chats they share, and who has messaged whom.',
  legendGroup: 'In a group chat',
  legendMessage: 'Sent a message',
  legendFailed: 'Delivery failed',
  recentTitle: 'Recent messages between bots',
  recentEmpty: 'None yet. When one bot messages another, it shows up here.',
  sessionNote: 'Messages are shown from when this window opened.',
  emptyTitle: 'No bots yet',
  emptyDesc: 'Create a bot to see your team here.',
  failed: 'failed',
  groupMembers: (group, count) => `${group} · ${count} ${count === 1 ? 'member' : 'members'}`,
  openChat: name => `Open chat with ${name}`,
  openGroup: name => `Open ${name}`
}

export const roomEn: RoomMessages = {
  rulesTitle: 'How this group chat works',
  ruleMention: '@mention a bot to address it. With no mention, every bot gets a turn.',
  ruleOrder: 'Bots answer one at a time. A bot can pass when it has nothing to add.',
  ruleRounds: (rounds, messages) =>
    `A run ends when everyone passes, or after ${rounds} rounds or ${messages} messages. Send again to continue.`,
  ruleStop: 'Stop pauses the whole room. @mention a bot or send "@all resume" to continue.',
  settled: 'Done — every bot had its say',
  capped: (rounds, messages) => `Paused at the limit (${rounds} rounds or ${messages} messages) — send a message to continue`
}

export const teamJa: TeamMessages = {
  open: 'チームマップ',
  title: 'チームマップ',
  description: 'ボット、ボットが参加しているグループチャット、そして誰が誰にメッセージを送ったか。',
  legendGroup: 'グループチャットに参加',
  legendMessage: 'メッセージを送信',
  legendFailed: '配信に失敗',
  recentTitle: 'ボット間の最近のメッセージ',
  recentEmpty: 'まだありません。ボットがほかのボットにメッセージを送ると、ここに表示されます。',
  sessionNote: 'このウィンドウを開いてからのメッセージを表示しています。',
  emptyTitle: 'ボットはまだありません',
  emptyDesc: 'ボットを作成すると、ここにチームが表示されます。',
  failed: '失敗',
  groupMembers: (group, count) => `${group} · メンバー ${count} 人`,
  openChat: name => `${name} とのチャットを開く`,
  openGroup: name => `${name} を開く`
}

export const roomJa: RoomMessages = {
  rulesTitle: 'このグループチャットの仕組み',
  ruleMention: '@メンションしたボットに話しかけます。メンションがなければ、すべてのボットが順番に答えます。',
  ruleOrder: 'ボットは一体ずつ答えます。付け加えることがなければパスできます。',
  ruleRounds: (rounds, messages) =>
    `全員がパスするか、${rounds} ラウンドまたは ${messages} 件のメッセージに達すると止まります。続けるにはもう一度送信してください。`,
  ruleStop: '停止するとルーム全体が一時停止します。続けるにはボットを @メンションするか「@all resume」と送信してください。',
  settled: '完了 — すべてのボットが発言しました',
  capped: (rounds, messages) =>
    `上限（${rounds} ラウンドまたは ${messages} 件）で一時停止 — 続けるにはメッセージを送信してください`
}

export const teamZh: TeamMessages = {
  open: '团队地图',
  title: '团队地图',
  description: '你的机器人、它们共同所在的群聊，以及谁给谁发过消息。',
  legendGroup: '在同一群聊中',
  legendMessage: '发送了消息',
  legendFailed: '投递失败',
  recentTitle: '机器人之间的最近消息',
  recentEmpty: '暂无。一个机器人给另一个机器人发消息后，会显示在这里。',
  sessionNote: '显示的是打开此窗口以来的消息。',
  emptyTitle: '还没有机器人',
  emptyDesc: '创建一个机器人后，你的团队会显示在这里。',
  failed: '失败',
  groupMembers: (group, count) => `${group} · ${count} 名成员`,
  openChat: name => `打开与 ${name} 的聊天`,
  openGroup: name => `打开 ${name}`
}

export const roomZh: RoomMessages = {
  rulesTitle: '这个群聊如何运作',
  ruleMention: '@提及某个机器人即可与它对话；没有提及时，每个机器人都会轮流发言。',
  ruleOrder: '机器人逐个回答；没有补充时可以跳过。',
  ruleRounds: (rounds, messages) => `所有机器人都跳过，或达到 ${rounds} 轮或 ${messages} 条消息时，本轮结束。再次发送即可继续。`,
  ruleStop: '停止会暂停整个群聊。@提及某个机器人或发送“@all resume”即可继续。',
  settled: '完成 — 每个机器人都已发言',
  capped: (rounds, messages) => `已达到上限（${rounds} 轮或 ${messages} 条消息）而暂停 — 发送消息即可继续`
}

export const teamZhHant: TeamMessages = {
  open: '團隊地圖',
  title: '團隊地圖',
  description: '你的機器人、它們共同所在的群組聊天，以及誰傳訊息給誰。',
  legendGroup: '在同一群組聊天中',
  legendMessage: '傳送了訊息',
  legendFailed: '傳送失敗',
  recentTitle: '機器人之間的最近訊息',
  recentEmpty: '目前沒有。一個機器人傳訊息給另一個機器人後，會顯示在這裡。',
  sessionNote: '顯示的是開啟此視窗以來的訊息。',
  emptyTitle: '還沒有機器人',
  emptyDesc: '建立機器人後，你的團隊會顯示在這裡。',
  failed: '失敗',
  groupMembers: (group, count) => `${group} · ${count} 位成員`,
  openChat: name => `開啟與 ${name} 的聊天`,
  openGroup: name => `開啟 ${name}`
}

export const roomZhHant: RoomMessages = {
  rulesTitle: '這個群組聊天如何運作',
  ruleMention: '@提及某個機器人即可與它對話；沒有提及時，每個機器人都會輪流發言。',
  ruleOrder: '機器人逐一回答；沒有補充時可以略過。',
  ruleRounds: (rounds, messages) => `所有機器人都略過，或達到 ${rounds} 輪或 ${messages} 則訊息時，本輪結束。再次傳送即可繼續。`,
  ruleStop: '停止會暫停整個群組聊天。@提及某個機器人或傳送「@all resume」即可繼續。',
  settled: '完成 — 每個機器人都已發言',
  capped: (rounds, messages) => `已達到上限（${rounds} 輪或 ${messages} 則訊息）而暫停 — 傳送訊息即可繼續`
}
