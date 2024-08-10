import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isFilteredByEmployee, setIsFilteredByEmployee] = useState(false)
  const [employeesLoading, setEmployeesLoading] = useState(true)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    setEmployeesLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    try {
      await employeeUtils.fetchAll()
    } finally {
      setEmployeesLoading(false)
    }

    try {
      await paginatedTransactionsUtils.fetchAll()
    } finally {
      setIsLoading(false)
    }

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const handleViewMore = async () => {
    if (paginatedTransactionsUtils.loading || isLoading) return
    setIsLoading(true)

    try {
      await paginatedTransactionsUtils.fetchAll()
    } catch (error) {
      console.error("Error fetching more transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsFilteredByEmployee(true)
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  const handleEmployeeChange = async (newValue: Employee | null) => {
    if (newValue === null) {
      setIsFilteredByEmployee(false)
      await loadAllTransactions()
    } else if (newValue.firstName === "All") {
      setIsFilteredByEmployee(false)
      await loadAllTransactions()
    } else {
      setIsFilteredByEmployee(true)
      await loadTransactionsByEmployee(newValue.id)
    }
  }

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={handleEmployeeChange}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && !isFilteredByEmployee && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
