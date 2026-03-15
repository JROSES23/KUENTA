export type PlanId = 'free' | 'premium'

export interface PlanLimits {
  maxActiveGroups: number
  maxScansPerMonth: number
  maxMembersPerGroup: number
  hasAdvancedStats: boolean
  hasAutoReminders: boolean
  hasExcelExport: boolean
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    maxActiveGroups: 3,
    maxScansPerMonth: 5,
    maxMembersPerGroup: 10,
    hasAdvancedStats: false,
    hasAutoReminders: false,
    hasExcelExport: false,
  },
  premium: {
    maxActiveGroups: Infinity,
    maxScansPerMonth: Infinity,
    maxMembersPerGroup: 50,
    hasAdvancedStats: true,
    hasAutoReminders: true,
    hasExcelExport: true,
  },
}

export const PLAN_PRICE_CLP = 2500
