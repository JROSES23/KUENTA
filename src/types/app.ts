import type { Tables } from './database'

export type UserProfile = Tables<'users'>
export type Group = Tables<'groups'>
export type GroupMember = Tables<'group_members'>
export type Expense = Tables<'expenses'>
export type ExpenseSplit = Tables<'expense_splits'>
export type FeedEvent = Tables<'activity_feed'>
export type PlanUsage = Tables<'plan_usage'>

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[]
}

export interface DebtSummary {
  with_user_id: string
  with_user_name: string
  with_user_avatar: string | null
  net_amount: number
  expense_count: number
}

export interface UserBalance {
  total_owed_to_user: number
  total_user_owes: number
  net_balance: number
}
