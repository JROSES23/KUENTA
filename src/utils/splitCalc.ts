export interface SplitParticipant {
  user_id: string
  amount_owed: number
}

export function splitEqual(total: number, userIds: string[]): SplitParticipant[] {
  if (!userIds.length) return []
  const base = Math.floor(total / userIds.length)
  const remainder = total - base * userIds.length

  return userIds.map((user_id, i) => ({
    user_id,
    amount_owed: i === 0 ? base + remainder : base,
  }))
}

export function splitByPercent(
  total: number,
  participants: { user_id: string; percent: number }[]
): SplitParticipant[] {
  const sumPercent = participants.reduce((s, p) => s + p.percent, 0)
  if (Math.abs(sumPercent - 100) > 0.01) throw new Error('Los porcentajes no suman 100')

  const splits = participants.map(p => ({
    user_id: p.user_id,
    amount_owed: Math.floor(total * p.percent / 100),
  }))

  const sumSplits = splits.reduce((s, p) => s + p.amount_owed, 0)
  splits[0].amount_owed += total - sumSplits

  return splits
}

export function splitByExact(
  total: number,
  participants: { user_id: string; amount: number }[]
): SplitParticipant[] {
  const sum = participants.reduce((s, p) => s + p.amount, 0)
  if (sum !== total) throw new Error(`La suma ${sum} no coincide con el total ${total}`)
  return participants.map(p => ({ user_id: p.user_id, amount_owed: p.amount }))
}

export interface ItemAssignment {
  itemIndex: number
  name: string
  total_price: number
  assigned_to: string[] // user_ids — empty means unassigned
}

export function splitByItems(
  assignments: ItemAssignment[]
): SplitParticipant[] {
  const totals = new Map<string, number>()

  for (const item of assignments) {
    if (item.assigned_to.length === 0) continue
    const perPerson = Math.floor(item.total_price / item.assigned_to.length)
    const remainder = item.total_price - perPerson * item.assigned_to.length

    item.assigned_to.forEach((uid, i) => {
      const amt = i === 0 ? perPerson + remainder : perPerson
      totals.set(uid, (totals.get(uid) ?? 0) + amt)
    })
  }

  return Array.from(totals.entries()).map(([user_id, amount_owed]) => ({
    user_id,
    amount_owed,
  }))
}
