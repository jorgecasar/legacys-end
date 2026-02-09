# 🤖 AI Agent Workflow (Professional)

Este proyecto utiliza un sistema de triaje para delegar tareas a agentes de IA de forma segura y controlada.

## 🚀 Cómo activar al agente

1.  **Crea una Issue**: Usa la plantilla **📋 Task** para describir la tarea.
2.  **Triaje (Opcional)**: Como mantenedor, puedes añadir etiquetas de contexto o prioridad.
3.  **Ejecución**: Menciona al agente en un comentario con `@gemini-cli` seguido de las instrucciones. El agente analizará la Issue y propondrá una solución.

## 🛠️ Comandos Manuales

Si quieres forzar la ejecución de una Issue específica:
1. Ve a **Actions** > **Gemini Autonomous Agent**.
2. Pulsa **Run workflow**.
3. Introduce el número de la Issue.

## 📋 Reglas para el Mantenedor

- Las PRs generadas por la IA llevan la etiqueta `automated-pr`.
- Revisa siempre los cambios antes de fusionar.
- Si el agente no realiza cambios, el pipeline fallará en rojo para avisarte.