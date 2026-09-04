import { AlertTriangleIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

interface ErrorStateProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
  onRetry?: () => void
}

// État d'erreur standard : chaque écran doit pouvoir afficher un échec de
// chargement plutôt que de rester bloqué sur un état de chargement infini.
function ErrorState({
  title = "Une erreur est survenue",
  description = "Le chargement a échoué. Réessayez dans quelques instants.",
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center",
        className
      )}
      {...props}
    >
      <AlertTriangleIcon className="mb-1 size-8 text-erreur" aria-hidden="true" />
      <p className="text-sm font-medium text-texte">{title}</p>
      <p className="max-w-sm text-sm text-texte-2">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Réessayer
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
