import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { AmbientBlobs } from '../../components/ui/AmbientBlobs'
import { TabBar } from '../../components/ui/TabBar'
import { Spinner } from '../../components/ui/Spinner'
import { DebtRow } from '../../components/debts/DebtRow'
import { useDebts } from '../../hooks/useDebts'
import { useKhipuPayment } from '../../hooks/useKhipuPayment'
import { formatCLP } from '../../utils/formatCLP'

export default function DebtsPage() {
  const navigate = useNavigate()
  const { debts, balance, isLoading } = useDebts()
  const { createPayment, openPayment } = useKhipuPayment()

  const owedToMe = debts.filter(d => d.net_amount > 0)
  const iOwe = debts.filter(d => d.net_amount < 0)

  async function handlePay(debt: typeof debts[0]) {
    try {
      const result = await createPayment({
        expense_id: '', // Would come from detailed debt view
        amount: Math.abs(debt.net_amount),
        subject: `Pago a ${debt.with_user_name}`,
      })
      openPayment(result.payment_url)
    } catch {
      // Error shown via hook
    }
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)] relative">
      {/* Header */}
      <div
        className="relative overflow-hidden px-[22px] pt-[52px] pb-6"
        style={{ background: 'var(--header-gradient)' }}
      >
        <AmbientBlobs />
        <div className="relative z-10">
          <h2 className="font-ui text-h2 text-white mb-4">Deudas</h2>

          {/* Balance summary */}
          {balance && (
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-pill bg-white/[0.14] border border-white/20 backdrop-blur-[12px]">
                <p className="font-ui text-micro text-white/50 mb-0.5">Te deben</p>
                <p className="font-ui text-title text-[#72EDBA]">
                  {formatCLP(balance.total_owed_to_user)}
                </p>
              </div>
              <div className="flex-1 px-3 py-2.5 rounded-pill bg-white/[0.14] border border-white/20 backdrop-blur-[12px]">
                <p className="font-ui text-micro text-white/50 mb-0.5">Debes</p>
                <p className="font-ui text-title text-[#FFB4B4]">
                  {formatCLP(balance.total_user_owes)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-24" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle size={32} strokeWidth={1.5} className="text-[var(--text-3)] mb-3" />
            <p className="font-ui text-title text-[var(--text-2)] mb-1">Todo al dia</p>
            <p className="font-ui text-body-sm text-[var(--text-3)]">
              No tienes deudas pendientes
            </p>
          </div>
        ) : (
          <>
            {/* Owed to me */}
            {owedToMe.length > 0 && (
              <>
                <h3 className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-2">
                  Te deben
                </h3>
                <div className="mb-6">
                  {owedToMe.map(d => (
                    <DebtRow
                      key={d.with_user_id}
                      userName={d.with_user_name}
                      avatarUrl={d.with_user_avatar}
                      amount={d.net_amount}
                      expenseCount={d.expense_count}
                    />
                  ))}
                </div>
              </>
            )}

            {/* I owe */}
            {iOwe.length > 0 && (
              <>
                <h3 className="font-ui text-caption uppercase text-[var(--text-3)] tracking-[0.8px] mb-2">
                  Debes
                </h3>
                <div>
                  {iOwe.map(d => (
                    <DebtRow
                      key={d.with_user_id}
                      userName={d.with_user_name}
                      avatarUrl={d.with_user_avatar}
                      amount={d.net_amount}
                      expenseCount={d.expense_count}
                      onPay={() => handlePay(d)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <TabBar onFabPress={() => navigate('/gasto/nuevo')} />
    </div>
  )
}
