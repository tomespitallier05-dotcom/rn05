import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

interface EmptyStateProps extends React.ComponentProps<"div"> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

// État vide standard : chaque écran/carte doit en afficher un plutôt
// qu'une zone blanche (critère d'acceptation lot 1).
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="mb-1 size-8 text-texte-2" aria-hidden="true" />}
      <p className="text-sm font-medium text-texte">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-texte-2">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
