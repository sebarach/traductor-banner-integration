# Tabs de Integraciones: notas tecnicas

## Problema detectado
- En `BannerIntegrations` el listado de integraciones usa `<Tabs>` para mostrar una cuadrícula (`showGrid`) y el detalle de un módulo.
- El estado `showGrid` solo cambiaba dentro de `handleModuleSelect`, que está atado a `Tabs` vía `onValueChange`.
- Shadcn Tabs solo invoca `onValueChange` cuando el valor cambia; por lo tanto, al hacer click otra vez sobre la tab ya seleccionada, no se ejecutaba el handler y la UI se quedaba en modo “grid”.

## Ajuste aplicado
1. Se introdujo `handleModuleClick`, que recibe el `value` del trigger y, si coincide con la tab actualmente activa (`activeTab`), fuerza `setShowGrid(false)` para abrir el detalle.
2. Cada `TabsTrigger` ahora tiene `onClick={() => handleModuleClick(module.value)}` además del `value` ya existente, de manera que podemos reaccionar a interacciones repetidas aun cuando `onValueChange` no se dispare.

### Extracto relevante (`src/pages/BannerIntegrations.tsx`)
```tsx
const handleModuleClick = (value: string) => {
  if (value === activeTab) {
    setShowGrid(false);
  }
};

...

<TabsTrigger
  key={module.value}
  value={module.value}
  onClick={() => handleModuleClick(module.value)}
  className="flex h-full w-full flex-col ..."
>
```

Con este cambio, las tabs activas vuelven a ser clicables y la transición a la vista detallada se garantiza sin necesidad de manipular el componente `Tabs` de terceros.
