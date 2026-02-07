# 🤖 AI Agent Workflow

Este proyecto utiliza un sistema de automatización "GitOps for AI" que permite resolver tareas de forma autónoma mediante GitHub Actions.

## 🚀 Cómo activar al agente

El agente se activa exclusivamente a través de **GitHub Issues**. Sigue estos pasos:

1.  **Crea una Issue**: Describe el problema o la tarea (puedes usar el contenido de `docs/tasks/TEMPLATE.md`).
2.  **Asigna la Etiqueta**: Añade la etiqueta `ai-agent` a la Issue.
3.  **Ejecución**: El workflow `.github/workflows/ai-coder.yml` se activará automáticamente.
4.  **Revisión**: En unos minutos, el agente creará una **Pull Request (PR)** vinculada a la Issue.

## 🛠️ Arquitectura del Sistema

- **Trigger**: GitHub Actions (evento `issues` con label `ai-agent`).
- **Entorno**: Ubuntu Runner con Python y la herramienta [Aider](https://aider.chat/).
- **Cerebro**: LLM (Gemini 1.5 Pro o GPT-4o) configurado mediante Secretos de GitHub.
- **Salida**: Rama de Git dedicada y Pull Request automatizada.

## ⚙️ Configuración Requerida (Una sola vez)

Para que el agente funcione, debes configurar los siguientes **Secrets** en tu repositorio de GitHub (**Settings > Secrets and variables > Actions**):

- `GEMINI_API_KEY`: Tu clave de Google AI Studio (recomendado).
- O `OPENAI_API_KEY`: Si prefieres usar modelos de OpenAI.

## 📋 Reglas de Oro para el Agente

- El agente siempre trabajará en una rama nueva `feature/issue-ID`.
- El agente lee el contexto global del repositorio antes de proponer cambios.
- Todas las PRs creadas por la IA deben ser revisadas y probadas por un humano antes del merge.
- Si el agente falla, revisa los logs en la pestaña **Actions** de GitHub.

## 🔄 Sincronización con el sistema local

Las tareas en `docs/tasks/01_TODO` sirven como backlog local. Para que el agente las procese:
1. Copia el contenido del archivo `.md` a una nueva Issue de GitHub.
2. Añade la etiqueta `ai-agent`.
3. Una vez aceptada la PR, mueve el archivo local a `03_DONE`.
