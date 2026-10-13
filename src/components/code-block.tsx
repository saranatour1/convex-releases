import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'

export function CodeBlock({ code, file }: { code: string; file: string }) {
  const [html, setHtml] = useState<string>()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let live = true
    setHtml(undefined)
    import('shiki/bundle/web')
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang: 'ts',
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        }),
      )
      .then((h) => live && setHtml(h))
    return () => {
      live = false
    }
  }, [code])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy. Select the code and copy it manually.')
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{file}</span>
        <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy code">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      {html ? (
        <div
          className="max-h-[32rem] overflow-auto p-4 text-[13px] leading-relaxed [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="max-h-[32rem] overflow-auto p-4 font-mono text-[13px] leading-relaxed">
          {code}
        </pre>
      )}
    </div>
  )
}
