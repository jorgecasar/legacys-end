# 🤖 AI Agent Workflow (Professional)

Este proyecto utiliza un sistema de triaje para delegar tareas a agentes de IA de forma segura y controlada.

## 🚀 Cómo activar al agente

1.  **Crea una Issue**: Usa la plantilla **📋 Task** para describir la tarea.
2.  **Triaje (Opcional)**: Como mantenedor, puedes añadir etiquetas de contexto o prioridad.
3.  **Asignación**: Cuando decidas que la tarea debe ser resuelta por la IA, añade la etiqueta:
    *   `ai-agent`
4.  **Elección de Modelo (Opcional)**: Por defecto se usará `gemini-2.0-flash`. Si quieres un modelo específico, añade una etiqueta con el formato `model:NOMBRE`:
    *   `model:gemini-3-pro` (Máxima capacidad)
    *   `model:gemini-2.5-flash`
    *   `model:gemini-2.0-flash-lite`
5.  **Ejecución**: El agente se activará inmediatamente al recibir la etiqueta `ai-agent`.

## 🛠️ Comandos Manuales

Si quieres forzar la ejecución de una Issue específica sin quitar/poner etiquetas:
1. Ve a **Actions** > **AI Agent Developer**.
2. Pulsa **Run workflow**.
3. Introduce el número de la Issue.

## 📋 Reglas para el Mantenedor

- Las PRs generadas por la IA llevan la etiqueta `automated-pr`.
- Revisa siempre los cambios antes de fusionar.
- Si el agente no realiza cambios, el pipeline fallará en rojo para avisarte.