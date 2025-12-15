# Integracion de remoto `bannerIntegration`

Esta guia documenta los pasos iniciales para conectar este repositorio local con `https://github.com/sebarach/traductor-banner-integration`.

## 1. Revisar el estado local

1. Asegurate de conocer los cambios pendientes antes de sincronizar:
   ```bash
   git status -sb
   ```
2. Si lo necesitas, guardalos en un commit o stashead antes de continuar.

## 2. Agregar el remoto de integracion

Comando ejecutado:
```bash
git remote add bannerIntegration https://github.com/sebarach/traductor-banner-integration.git
```
- `bannerIntegration` es el alias para este remoto externo.
- Confirmalo con:
  ```bash
  git remote -v
  ```

## 3. Traer referencias del remoto

1. Actualiza las referencias sin mezclar aun:
   ```bash
   git fetch bannerIntegration
   ```
2. Lista las ramas remotas disponibles cuando sea necesario:
   ```bash
   git branch -r
   ```

## 4. Preparar ramas de trabajo

1. Para trabajar sobre una rama existente del remoto:
   ```bash
   git checkout -b nombre-local bannerIntegration/nombre-remoto
   ```
2. Para una rama nueva basada en `main` o `develop` locales:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/banner-integration
   ```

## 5. Subir cambios al remoto de integracion

Cuando la rama local este lista:
```bash
git push -u bannerIntegration feature/banner-integration
```
- `-u` deja configurada la relacion de seguimiento para futuros `push` y `pull`.

## 6. Buenas practicas

- Mantene el listado de remotos ordenado; elimina los que no uses con `git remote remove nombre`.
- Borra las ramas remotas fusionadas con `git push bannerIntegration --delete rama`.
- Actualiza este documento cada vez que ajustemos el flujo de trabajo.
