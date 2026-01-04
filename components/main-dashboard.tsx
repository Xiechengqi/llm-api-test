"use client"

import type React from "react"
import { HistoryChatCard } from "@/components/history-chat-card"
import { ModelHistoryCard } from "@/components/model-history-card"
import { ParametersCard } from "@/components/parameters-card"
import { RequestResponseDetails } from "@/components/request-response-details"

type Props = {
  modelHistoryProps: React.ComponentProps<typeof ModelHistoryCard>
  parametersProps: React.ComponentProps<typeof ParametersCard>
  historyChatProps: React.ComponentProps<typeof HistoryChatCard>
  requestResponseProps: React.ComponentProps<typeof RequestResponseDetails>
}

export function MainDashboard({ modelHistoryProps, parametersProps, historyChatProps, requestResponseProps }: Props) {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <ModelHistoryCard {...modelHistoryProps} />
        <ParametersCard {...parametersProps} />
        <HistoryChatCard {...historyChatProps} />
        <RequestResponseDetails {...requestResponseProps} />
      </div>
    </div>
  )
}

