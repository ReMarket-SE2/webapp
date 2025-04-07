"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  id?: string
}

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder = "Write your description here using markdown...",
  maxLength = 2000,
  disabled = false,
  id = "markdown-editor",
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("write")

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <Tabs
        defaultValue="write"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-1 flex flex-col"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {label && <Label htmlFor={id}>{label}</Label>}

            <p className="text-xs text-muted-foreground">
              {value.length}/{maxLength} characters. Write a longer description to help buyers make an informed decision. Markdown formatting is supported.
            </p>
          </div>

          <TabsList className="mb-2">
            <TabsTrigger className="cursor-pointer" value="write">Write</TabsTrigger>
            <TabsTrigger className="cursor-pointer" value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="mt-0 flex-1">
          <Textarea
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            maxLength={maxLength}
            rows={8}
            className="resize-none min-h-[200px] h-full"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 flex-1">
          <div className="border rounded-md p-4 min-h-[200px] h-full overflow-y-auto">
            {value ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({ ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-xl font-bold my-3" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-lg font-bold my-2" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc pl-6 my-2" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal pl-6 my-2" {...props} />,
                    li: ({ ...props }) => <li className="my-1" {...props} />,
                    a: ({ ...props }) => <a className="text-blue-500 hover:underline" {...props} />
                  }}
                >
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground mt-1">
        <p>
          <strong>Formatting tips: </strong>
          Use **bold**, *italic*, # headings, - lists, [links](url), and more.
        </p>
      </div>
    </div>
  )
} 