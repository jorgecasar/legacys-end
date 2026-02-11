# 🏗️ Autonomous System Architecture

Este sistema implementa un ciclo de vida de desarrollo autónomo basado en agentes de IA y herramientas nativas de GitHub.

## 🔄 El Ciclo de Vida (Triage -> Orchestration -> Worker)

### 1. Triaje (Triage)
- **Workflow**: `.github/workflows/ai-triage.yml`
- **Rol**: Analista de issues.
- **Acción**: Cuando se abre una issue, el agente:
    - Evalúa la complejidad (Low, Medium, High).
    - Asigna prioridad (**Bugs** siempre P0/P1).
    - Clasifica mediante etiquetas (`bug`, `feature`, `refactor`).
    - Descompone en sub-issues si la complejidad es alta.

### 2. Orquestación (Orchestration)
- **Workflow**: `.github/workflows/ai-orchestrator.yml`
- **Rol**: Planificador de flujo.
- **Acción**: Se ejecuta cada hora (o manualmente) para:
    - Seleccionar la tarea más urgente (Pausadas -> Bugs -> P0).
    - Verificar que la tarea no esté bloqueada.
    - Lanzar el **Worker Agent**.

### 3. Ejecución (Worker)
- **Workflow**: `.github/workflows/ai-worker.yml`
- **Rol**: Desarrollador Senior.
- **Acción**: 
    - Crea una rama `task/issue-{id}`.
    - Aplica metodologías TDD/BDD/DDD.
    - Realiza un *Self-Review* de calidad.
    - Abre una Pull Request y la vincula a la issue original.

## 🛠️ Herramientas de Calidad
- **Vitest**: Testing de componentes y lógica de aplicación.
- **Node Test Runner**: Testing de infraestructura con 100% de cobertura.
- **Stryker**: Mutation Testing para asegurar la efectividad de los tests.
- **Playwright**: Tests E2E y visual regression.
