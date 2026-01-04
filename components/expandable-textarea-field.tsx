"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp } from "lucide-react"

type Props = {
  id: string
  label: string
  description: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows: number
  expanded: boolean
  setExpanded: (value: boolean) => void
}

export function ExpandableTextareaField({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  rows,
  expanded,
  setExpanded,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor={id}>{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-4 w-4" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" />
              展开
            </>
          )}
        </Button>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={expanded ? "" : "max-h-32 overflow-y-auto"}
      />
    </>
  )
}

