"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CerebrasModel, ModelScopeModel, OpenRouterModel } from "@/lib/llm/types"
import { RotateCcw } from "lucide-react"
import { ApiKeyInput } from "@/components/api-key-input"
import { CustomProviderToggleButton } from "@/components/custom-provider-editor"
import { ModelPicker } from "@/components/model-picker"
import { ProviderSelector } from "@/components/provider-selector"

type ProviderOption = {
  id: string
  name: string
  endpoint?: string
}

type CatalogProvider = "openrouter" | "cerebras" | "modelscope"

function isCatalogProvider(provider: string): provider is CatalogProvider {
  return provider === "openrouter" || provider === "cerebras" || provider === "modelscope"
}

type Props = {
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
}

export function NavbarControls({
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
}: Props) {
  return (
    <div className="ml-auto flex items-center gap-3">
      <ProviderSelector
        provider={provider}
        onProviderChange={handleProviderChange}
        providerOptions={providerOptions}
        selectedProviderName={selectedProviderName}
      />
      <CustomProviderToggleButton
        visible={canCurrentProviderUseCustomFields}
        isEditing={isEditingCustomProvider}
        onToggle={toggleCustomProviderEditing}
      />

      {isCatalogProvider(provider) ? (
        <ModelPicker
          provider={provider}
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
        />
      ) : (
        <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="eg: gpt-3.5-turbo" className="w-[200px]" />
      )}

      <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} showApiKey={showApiKey} setShowApiKey={setShowApiKey} />
      <Button variant="outline" size="sm" onClick={handleReset}>
        <RotateCcw className="mr-2 size-4" />
        重置
      </Button>
    </div>
  )
}

