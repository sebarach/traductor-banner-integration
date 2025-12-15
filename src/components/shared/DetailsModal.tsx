import { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

/**
 * Props para DetailsModal
 *
 * @interface DetailsModalProps
 * @property {boolean} open - Estado del modal (abierto/cerrado)
 * @property {() => void} onOpenChange - Callback para cambiar el estado del modal
 * @property {string} title - Título del modal
 * @property {string} [description] - Descripción opcional debajo del título
 * @property {ReactNode} [icon] - Icono opcional para el header
 * @property {DetailSection[]} sections - Array de secciones a mostrar
 * @property {string} [maxHeight] - Altura máxima del contenido scrollable (default: '60vh')
 */
interface DetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon?: ReactNode
  sections: DetailSection[]
  maxHeight?: string
}

/**
 * Sección de detalles dentro del modal
 *
 * @interface DetailSection
 * @property {string} title - Título de la sección
 * @property {DetailItem[]} items - Array de items a mostrar en esta sección
 * @property {string} [variant] - Variante visual de la sección
 */
export interface DetailSection {
  /** Título de la sección (ej: "Información General", "Atributos") */
  title: string

  /** Items a mostrar en esta sección */
  items: DetailItem[]

  /** Variante visual: 'default' | 'badges' | 'list' */
  variant?: 'default' | 'badges' | 'list'
}

/**
 * Item individual de detalle
 *
 * @interface DetailItem
 * @property {string} label - Etiqueta del campo
 * @property {string | number | ReactNode} value - Valor a mostrar
 * @property {string} [badgeVariant] - Variante del badge si se usa variant='badges'
 * @property {ReactNode} [icon] - Icono opcional para el item
 */
export interface DetailItem {
  /** Etiqueta del campo (ej: "Código", "Descripción") */
  label: string

  /** Valor del campo (puede ser string, número o componente React) */
  value: string | number | ReactNode

  /** Variante del badge (solo para variant='badges') */
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'

  /** Icono opcional para mostrar junto al valor */
  icon?: ReactNode
}

/**
 * DetailsModal - Modal reutilizable para mostrar detalles estructurados
 *
 * Componente modal profesional que muestra información organizada en secciones.
 * Soporta diferentes variantes de visualización (default, badges, list).
 *
 * @example
 * // Uso básico con badges
 * const [open, setOpen] = useState(false)
 *
 * <DetailsModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Atributos del Edificio"
 *   description="Edificio Central - Campus Principal"
 *   icon={<Building className="h-5 w-5" />}
 *   sections={[
 *     {
 *       title: "Atributos",
 *       variant: "badges",
 *       items: [
 *         { label: "Tipo", value: "Académico", badgeVariant: "default" },
 *         { label: "Estado", value: "Activo", badgeVariant: "outline" }
 *       ]
 *     }
 *   ]}
 * />
 *
 * @example
 * // Uso con lista de valores
 * <DetailsModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Información Detallada"
 *   sections={[
 *     {
 *       title: "Datos Generales",
 *       variant: "default",
 *       items: [
 *         { label: "Código", value: "EDI-001" },
 *         { label: "Capacidad", value: "1500 personas" }
 *       ]
 *     }
 *   ]}
 * />
 */
export function DetailsModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  sections,
  maxHeight = '60vh',
}: DetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-2 border-border shadow-2xl backdrop-blur-sm">
        {/* Header del modal */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Contenido scrollable */}
        <ScrollArea className="pr-4" style={{ maxHeight }}>
          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {/* Separador entre secciones (excepto la primera) */}
                {sectionIndex > 0 && <Separator className="my-6" />}

                {/* Título de la sección */}
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  {section.title}
                </h3>

                {/* Renderizado según variante */}
                {section.variant === 'badges' ? (
                  // Variante: Badges minimalistas en lista vertical
                  <div className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                            {item.label}
                          </p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : section.variant === 'list' ? (
                  // Variante: Lista vertical
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        {item.icon && (
                          <span className="text-primary">{item.icon}</span>
                        )}
                        <span className="text-muted-foreground">{item.label}:</span>
                        <span className="font-medium">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  // Variante: Default (key-value pairs)
                  <dl className="grid grid-cols-1 gap-3">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0"
                      >
                        <dt className="text-sm text-muted-foreground flex items-center gap-2">
                          {item.icon}
                          {item.label}
                        </dt>
                        <dd className="text-sm font-medium text-right">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook helper para manejar el estado del modal
 *
 * @example
 * const modal = useDetailsModal()
 *
 * // Abrir modal
 * <Button onClick={modal.open}>Ver detalles</Button>
 *
 * // Modal
 * <DetailsModal
 *   open={modal.isOpen}
 *   onOpenChange={modal.setIsOpen}
 *   {...otherProps}
 * />
 */
export function useDetailsModal() {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }
}

// Import necesario para el hook
import { useState } from 'react'
