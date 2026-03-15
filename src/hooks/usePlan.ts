import { FREEMIUM_ENABLED, PLANS } from '../constants'
import { useAuthStore } from '../store/authStore'
import type { PlanId, PlanLimits } from '../constants/plans'

export function usePlan() {
  const { profile } = useAuthStore()

  const planId: PlanId = FREEMIUM_ENABLED
    ? ((profile?.plan as PlanId) ?? 'free')
    : 'premium'

  const limits: PlanLimits = PLANS[planId]

  return {
    planId,
    limits,
    isPremium: planId === 'premium',
    canCreateGroup: (currentActive: number) =>
      currentActive < limits.maxActiveGroups,
    canScanReceipt: (scansThisMonth: number) =>
      scansThisMonth < limits.maxScansPerMonth,
    canAddMember: (currentMembers: number) =>
      currentMembers < limits.maxMembersPerGroup,
  }
}
