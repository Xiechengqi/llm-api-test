"use client"

import { CardContent } from "@/components/ui/card"
import { ExpandableTextareaField } from "@/components/expandable-textarea-field"
import { ExternalTextSourceSection } from "@/components/external-text-source-section"
import { ImageAttachmentsSection } from "@/components/image-attachments-section"
import { RunParametersSection } from "@/components/run-parameters-section"
import type { MessageImage } from "@/lib/llm/types"

type Props = {
  enablePromptFile: boolean
  userMessage: string
  setUserMessage: (value: string) => void
  isPromptExpanded: boolean
  setIsPromptExpanded: (value: boolean) => void

  showImageUrlInput: boolean
  setShowImageUrlInput: (value: boolean) => void
  imageUrl: string
  setImageUrl: (value: string) => void
  isAddingImageUrl: boolean
  handleAddImageUrl: () => void
  handleImageFileUpload: () => void
  autoReloadImages: boolean
  setAutoReloadImages: (value: boolean) => void
  messageImages: MessageImage[]
  setZoomedImage: (img: MessageImage) => void
  handleRemoveImage: (imageId: string) => void

  autoReloadPrompt: boolean
  setAutoReloadPrompt: (value: boolean) => void
  setEnablePromptFile: (value: boolean) => void
  promptFilePath: string
  onPromptFilePathChange: (value: string) => void
  loadedPromptContent: string
  isPromptFromLocalFile: boolean
  canReloadPromptLocalFile: boolean
  reloadPromptLocalFile: () => void
  isExternalPromptExpanded: boolean
  setIsExternalPromptExpanded: (value: boolean) => void
  pickPromptLocalFile: () => void

  enableSystemPromptFile: boolean
  systemPrompt: string
  setSystemPrompt: (value: string) => void
  isSystemPromptExpanded: boolean
  setIsSystemPromptExpanded: (value: boolean) => void

  autoReloadSystemPrompt: boolean
  setAutoReloadSystemPrompt: (value: boolean) => void
  setEnableSystemPromptFile: (value: boolean) => void
  systemPromptFilePath: string
  onSystemPromptFilePathChange: (value: string) => void
  loadedSystemPromptContent: string
  isSystemPromptFromLocalFile: boolean
  canReloadSystemPromptLocalFile: boolean
  reloadSystemPromptLocalFile: () => void
  isExternalSystemPromptExpanded: boolean
  setIsExternalSystemPromptExpanded: (value: boolean) => void
  pickSystemPromptLocalFile: () => void

  timerEnabled: boolean
  setTimerEnabled: (value: boolean) => void
  timerInterval: number
  setTimerInterval: (value: number) => void
  isTimerRunning: boolean
  stopTimer: () => void

  maxTokens: number
  setMaxTokens: (value: number) => void
  maxTokensLimit: number
  setMaxTokensLimit: (value: number) => void

  temperature: number
  setTemperature: (value: number) => void
  topP: number
  setTopP: (value: number) => void
  frequencyPenalty: number
  setFrequencyPenalty: (value: number) => void
  presencePenalty: number
  setPresencePenalty: (value: number) => void

  error: string
}

export function ParametersContent({
  enablePromptFile,
  userMessage,
  setUserMessage,
  isPromptExpanded,
  setIsPromptExpanded,
  showImageUrlInput,
  setShowImageUrlInput,
  imageUrl,
  setImageUrl,
  isAddingImageUrl,
  handleAddImageUrl,
  handleImageFileUpload,
  autoReloadImages,
  setAutoReloadImages,
  messageImages,
  setZoomedImage,
  handleRemoveImage,
  autoReloadPrompt,
  setAutoReloadPrompt,
  setEnablePromptFile,
  promptFilePath,
  onPromptFilePathChange,
  loadedPromptContent,
  isPromptFromLocalFile,
  canReloadPromptLocalFile,
  reloadPromptLocalFile,
  isExternalPromptExpanded,
  setIsExternalPromptExpanded,
  pickPromptLocalFile,
  enableSystemPromptFile,
  systemPrompt,
  setSystemPrompt,
  isSystemPromptExpanded,
  setIsSystemPromptExpanded,
  autoReloadSystemPrompt,
  setAutoReloadSystemPrompt,
  setEnableSystemPromptFile,
  systemPromptFilePath,
  onSystemPromptFilePathChange,
  loadedSystemPromptContent,
  isSystemPromptFromLocalFile,
  canReloadSystemPromptLocalFile,
  reloadSystemPromptLocalFile,
  isExternalSystemPromptExpanded,
  setIsExternalSystemPromptExpanded,
  pickSystemPromptLocalFile,
  timerEnabled,
  setTimerEnabled,
  timerInterval,
  setTimerInterval,
  isTimerRunning,
  stopTimer,
  maxTokens,
  setMaxTokens,
  maxTokensLimit,
  setMaxTokensLimit,
  temperature,
  setTemperature,
  topP,
  setTopP,
  frequencyPenalty,
  setFrequencyPenalty,
  presencePenalty,
  setPresencePenalty,
  error,
}: Props) {
  return (
    <CardContent className="space-y-4">
      <div className="space-y-4">
        {!enablePromptFile && (
          <ExpandableTextareaField
            id="userMessage"
            label="用户消息"
            description="输入测试用的消息内容"
            value={userMessage}
            onChange={setUserMessage}
            placeholder="输入你的提示词..."
            rows={3}
            expanded={isPromptExpanded}
            setExpanded={setIsPromptExpanded}
          />
        )}

        <ImageAttachmentsSection
          showImageUrlInput={showImageUrlInput}
          setShowImageUrlInput={setShowImageUrlInput}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          isAddingImageUrl={isAddingImageUrl}
          handleAddImageUrl={handleAddImageUrl}
          handleImageFileUpload={handleImageFileUpload}
          autoReloadImages={autoReloadImages}
          setAutoReloadImages={setAutoReloadImages}
          messageImages={messageImages}
          setZoomedImage={setZoomedImage}
          handleRemoveImage={handleRemoveImage}
        />

        <ExternalTextSourceSection
          label="从外部加载用户消息"
          enabledId="enablePromptFile"
          enabled={enablePromptFile}
          setEnabled={setEnablePromptFile}
          autoReloadId="autoReloadPrompt"
          autoReload={autoReloadPrompt}
          setAutoReload={setAutoReloadPrompt}
          filePathInputId="promptFilePath"
          filePath={promptFilePath}
          onFilePathChange={onPromptFilePathChange}
          placeholder="https://example.com/prompt.txt 或点击选择本地文件"
          onPickLocalFile={pickPromptLocalFile}
          helpText={'支持 HTTP/HTTPS 链接或本地文件。点击"选择文件"按钮可直接选择本地 .txt 或 .md 文件。'}
          loadedContent={loadedPromptContent}
          previewLabel="外部加载的消息预览"
          isFromLocalFile={isPromptFromLocalFile}
          canReloadLocalFile={canReloadPromptLocalFile}
          onReloadLocalFile={reloadPromptLocalFile}
          previewExpanded={isExternalPromptExpanded}
          setPreviewExpanded={setIsExternalPromptExpanded}
        />

        <div className="space-y-4">
          {!enableSystemPromptFile && (
            <ExpandableTextareaField
              id="systemPrompt"
              label="系统提示词"
              description="为AI设置角色或行为指令"
              value={systemPrompt}
              onChange={setSystemPrompt}
              placeholder="例如: 你是一个乐于助人的助手。"
              rows={2}
              expanded={isSystemPromptExpanded}
              setExpanded={setIsSystemPromptExpanded}
            />
          )}

          <ExternalTextSourceSection
            label="从外部加载系统提示词"
            enabledId="enableSystemPromptFile"
            enabled={enableSystemPromptFile}
            setEnabled={setEnableSystemPromptFile}
            autoReloadId="autoReloadSystemPrompt"
            autoReload={autoReloadSystemPrompt}
            setAutoReload={setAutoReloadSystemPrompt}
            filePathInputId="systemPromptFilePath"
            filePath={systemPromptFilePath}
            onFilePathChange={onSystemPromptFilePathChange}
            placeholder="https://example.com/system-prompt.txt 或点击选择本地文件"
            onPickLocalFile={pickSystemPromptLocalFile}
            helpText={'支持 HTTP/HTTPS 链接或本地文件。点击"选择文件"按钮可直接选择本地 .txt 或 .md 文件。'}
            loadedContent={loadedSystemPromptContent}
            previewLabel="外部加载的系统提示词预览"
            isFromLocalFile={isSystemPromptFromLocalFile}
            canReloadLocalFile={canReloadSystemPromptLocalFile}
            onReloadLocalFile={reloadSystemPromptLocalFile}
            previewExpanded={isExternalSystemPromptExpanded}
            setPreviewExpanded={setIsExternalSystemPromptExpanded}
          />
        </div>
      </div>

      <RunParametersSection
        timerEnabled={timerEnabled}
        setTimerEnabled={setTimerEnabled}
        timerInterval={timerInterval}
        setTimerInterval={setTimerInterval}
        isTimerRunning={isTimerRunning}
        stopTimer={stopTimer}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        maxTokensLimit={maxTokensLimit}
        setMaxTokensLimit={setMaxTokensLimit}
        temperature={temperature}
        setTemperature={setTemperature}
        topP={topP}
        setTopP={setTopP}
        frequencyPenalty={frequencyPenalty}
        setFrequencyPenalty={setFrequencyPenalty}
        presencePenalty={presencePenalty}
        setPresencePenalty={setPresencePenalty}
        error={error}
      />
    </CardContent>
  )
}

