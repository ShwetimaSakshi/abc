import { useCallback, useState, useEffect } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams, Transaction as TransactionType } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const [localTransactions, setLocalTransactions] = useState<TransactionType[]>(transactions ?? [])
  const { fetchWithoutCache, loading } = useCustomFetch()

  useEffect(() => {
    setLocalTransactions(transactions ?? [])
  }, [transactions])

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      setLocalTransactions((prevTransactions) =>
        prevTransactions.map((transaction) =>
          transaction.id === transactionId ? { ...transaction, approved: newValue } : transaction
        )
      )

      try {
        await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
          transactionId,
          value: newValue,
        })
      } catch (error) {
        console.error("Error setting transaction approval:", error)
        setLocalTransactions((prevTransactions) =>
          prevTransactions.map((transaction) =>
            transaction.id === transactionId ? { ...transaction, approved: !newValue } : transaction
          )
        )
      }
    },
    [fetchWithoutCache]
  )

  if (localTransactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {localTransactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
