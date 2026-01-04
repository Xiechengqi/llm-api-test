"use client"

import type React from "react"
import { Card, CardHeader } from "@/components/ui/card"
import { ParametersCardHeader } from "@/components/parameters-card-header"
import { ParametersContent } from "@/components/parameters-content"

type ParametersContentProps = React.ComponentProps<typeof ParametersContent>

type Props = ParametersContentProps & {
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
  handleResetParameters: () => void
  loading: boolean
  handleInterruptTest: () => void
  handleStartTest: () => void
}

export function ParametersCard({
  isExpanded,
  setIsExpanded,
  handleResetParameters,
  loading,
  handleInterruptTest,
  handleStartTest,
  ...contentProps
}: Props) {
  const { isTimerRunning, stopTimer } = contentProps

  return (
    <Card>
      <CardHeader>
        <ParametersCardHeader
          isExpanded={isExpanded}
          toggleExpanded={() => setIsExpanded(!isExpanded)}
          handleResetParameters={handleResetParameters}
          isTimerRunning={isTimerRunning}
          stopTimer={stopTimer}
          loading={loading}
          handleInterruptTest={handleInterruptTest}
          handleStartTest={handleStartTest}
        />
      </CardHeader>
      {isExpanded && <ParametersContent {...contentProps} />}
    </Card>
  )
}
