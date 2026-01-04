"use client"

import { CustomProviderFieldsPanel } from "@/components/custom-provider-editor"
import { NavbarControls } from "@/components/navbar-controls"
import { ProbeStatusIndicator } from "@/components/probe-status-indicator"
import type { CerebrasModel, ModelScopeModel, OpenRouterModel } from "@/lib/llm/types"
import { Zap } from "lucide-react"

type ProbeStatus = "idle" | "success" | "error"

type ProviderOption = {
  id: string
  name: string
  endpoint?: string
}

type Props = {
  probeStatus: ProbeStatus
  probeDuration: number | null
  isProbeTesting: boolean
  canProbeTest: boolean
  runProbeTest: () => void

  provider: string
  providerOptions: ProviderOption[]
  selectedProviderName: string
  handleProviderChange: (providerId: string) => void

  canCurrentProviderUseCustomFields: boolean
  isEditingCustomProvider: boolean
  toggleCustomProviderEditing: () => void

  isCustomModel: boolean
  setIsCustomModel: (value: boolean) => void
  model: string
  setModel: (value: string) => void
  isLoadingModels: boolean
  selectedModelDisplayName: string
  modelSearchQuery: string
  setModelSearchQuery: (value: string) => void
  filteredOpenRouterModels: OpenRouterModel[]
  filteredCerebrasModels: CerebrasModel[]
  filteredModelScopeModels: ModelScopeModel[]

  apiKey: string
  setApiKey: (value: string) => void
  showApiKey: boolean
  setShowApiKey: (value: boolean) => void
  handleReset: () => void

  shouldRenderCustomProviderFields: boolean
  customProviderName: string
  setCustomProviderName: (value: string) => void
  customProviderError: string
  setCustomProviderError: (value: string) => void
  setCustomProviderSaved: (value: boolean) => void
  customProviderStatusMessage: string
  setCustomProviderStatusMessage: (value: string) => void
  baseURL: string
  setBaseURL: (value: string) => void
  apiPath: string
  setApiPath: (value: string) => void
  handleSaveCustomProvider: () => void
  handleDeleteCustomProvider: () => void
  selectedSavedProvider: unknown
}

export function Navbar({
  probeStatus,
  probeDuration,
  isProbeTesting,
  canProbeTest,
  runProbeTest,
  provider,
  providerOptions,
  selectedProviderName,
  handleProviderChange,
  canCurrentProviderUseCustomFields,
  isEditingCustomProvider,
  toggleCustomProviderEditing,
  isCustomModel,
  setIsCustomModel,
  model,
  setModel,
  isLoadingModels,
  selectedModelDisplayName,
  modelSearchQuery,
  setModelSearchQuery,
  filteredOpenRouterModels,
  filteredCerebrasModels,
  filteredModelScopeModels,
  apiKey,
  setApiKey,
  showApiKey,
  setShowApiKey,
  handleReset,
  shouldRenderCustomProviderFields,
  customProviderName,
  setCustomProviderName,
  customProviderError,
  setCustomProviderError,
  setCustomProviderSaved,
  customProviderStatusMessage,
  setCustomProviderStatusMessage,
  baseURL,
  setBaseURL,
  apiPath,
  setApiPath,
  handleSaveCustomProvider,
  handleDeleteCustomProvider,
  selectedSavedProvider,
}: Props) {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-8">
        {/* CHANGE: Removed "LLM API 测试工具" text, keeping only the icon */}
        <div className="flex items-center gap-2">
          <Zap className="size-6 text-primary" />
          <ProbeStatusIndicator
            status={probeStatus}
            duration={probeDuration}
            isTesting={isProbeTesting}
            canTest={canProbeTest}
            onTest={runProbeTest}
          />
        </div>

        <NavbarControls
          provider={provider}
          providerOptions={providerOptions}
          selectedProviderName={selectedProviderName}
          handleProviderChange={handleProviderChange}
          canCurrentProviderUseCustomFields={canCurrentProviderUseCustomFields}
          isEditingCustomProvider={isEditingCustomProvider}
          toggleCustomProviderEditing={toggleCustomProviderEditing}
          isCustomModel={isCustomModel}
          setIsCustomModel={setIsCustomModel}
          model={model}
          setModel={setModel}
          isLoadingModels={isLoadingModels}
          selectedModelDisplayName={selectedModelDisplayName}
          modelSearchQuery={modelSearchQuery}
          setModelSearchQuery={setModelSearchQuery}
          filteredOpenRouterModels={filteredOpenRouterModels}
          filteredCerebrasModels={filteredCerebrasModels}
          filteredModelScopeModels={filteredModelScopeModels}
          apiKey={apiKey}
          setApiKey={setApiKey}
          showApiKey={showApiKey}
          setShowApiKey={setShowApiKey}
          handleReset={handleReset}
        />
      </div>

      <CustomProviderFieldsPanel
        shouldRenderFields={shouldRenderCustomProviderFields}
        customProviderName={customProviderName}
        onCustomProviderNameChange={(value) => {
          setCustomProviderName(value)
          if (customProviderError) setCustomProviderError("")
          setCustomProviderSaved(false)
          setCustomProviderStatusMessage("")
        }}
        baseURL={baseURL}
        onBaseURLChange={(value) => {
          setBaseURL(value)
          setCustomProviderSaved(false)
          setCustomProviderStatusMessage("")
        }}
        apiPath={apiPath}
        onApiPathChange={(value) => {
          setApiPath(value)
          setCustomProviderSaved(false)
          setCustomProviderStatusMessage("")
        }}
        onSave={handleSaveCustomProvider}
        onDelete={handleDeleteCustomProvider}
        canDelete={!!selectedSavedProvider}
        errorMessage={customProviderError}
        statusMessage={customProviderStatusMessage}
      />
    </nav>
  )
}
