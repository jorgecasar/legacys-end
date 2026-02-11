# 🔧 Mantenimiento del Sistema Autónomo

Guía para los mantenedores humanos sobre cómo supervisar y ajustar el comportamiento de los agentes.

## 📈 Gestión de Cobertura
La cobertura es evolutiva. Si el sistema bloquea un commit por falta de cobertura:
1. Revisa `tooling/manage-coverage.js`.
2. Asegura que los umbrales en `vite.config.js` y el tooling reflejen la realidad del proyecto.
3. El sistema busca un incremento del 5% en áreas críticas cuando la cobertura es baja.

## 🐛 Depuración de Agentes
Si un workflow falla o el agente entra en un bucle:
- **Triage**: Revisa los logs de GitHub Actions. Asegúrate de que los tokens tienen permisos de `write` en Projects.
- **Worker**: Comprueba si hay conflictos de git que el agente no pudo resolver.
- **Orquestador**: Verifica que el `PROJECT_NUMBER` en los scripts coincide con tu proyecto de GitHub.

## ⚙️ Configuración de IA
- **Modelos**: Se pueden ajustar en `.github/workflows/ai-worker.yml` (input `gemini_model`). Si se omite, usa el default del CLI.
  - Para la lista actualizada de modelos disponibles, consulta la skill `gemini-api-dev` en `.rulesync/skills/gemini-api-dev/SKILL.md`
- **Reglas**: Modifica `.rulesync/rules/` para cambiar los estándares de codificación que siguen los agentes.
