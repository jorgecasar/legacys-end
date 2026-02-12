#!/bin/bash
# ai-agent-e2e.sh (formerly execute-task-39.sh)
# End-to-End flow for the AI Agent system.

set -e

# Configuración por defecto
SKIP_AI=${SKIP_AI:-false}
SKIP_TRIAGE=${SKIP_TRIAGE:-false}
SKIP_ORCHESTRATION=${SKIP_ORCHESTRATION:-false}
SKIP_PLANNING=${SKIP_PLANNING:-false}
SKIP_DEVELOP=${SKIP_DEVELOP:-false}
SKIP_VERIFICATION=${SKIP_VERIFICATION:-false}

# Parsear argumentos
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --issue) export ISSUE_NUMBER="$2"; shift ;;
        --skip-ai) SKIP_AI=true ;;
        --skip-triage) SKIP_TRIAGE=true ;;
        --skip-orchestration) SKIP_ORCHESTRATION=true ;;
        --skip-planning) SKIP_PLANNING=true ;;
        --skip-develop) SKIP_DEVELOP=true ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "🚀 Starting AI Agent E2E Flow"
echo "--------------------------------"

# 1. TRIAJE
if [ "$SKIP_TRIAGE" = "true" ] || [ "$SKIP_AI" = "true" ]; then
    echo "⏭️ Skipping Triage phase."
else
    echo ">>> Phase 1: Triage"
    node --env-file=.env tooling/gemini-triage.js
    echo "✅ Triage completed."
fi

# 2. ORQUESTACIÓN (Si no se indica un issue específico)
if [ -z "$ISSUE_NUMBER" ]; then
    if [ "$SKIP_ORCHESTRATION" = "true" ]; then
        echo "❌ Error: No issue number provided and orchestration skipped."
        exit 1
    fi
    echo ">>> Phase 2: Orchestration"
    # Run orchestrator in local mode to get the issue number
    ORCH_OUTPUT=$(LOCAL_EXECUTION=true node --env-file=.env tooling/ai-orchestrator.js)
    
    export ISSUE_NUMBER=$(echo "$ORCH_OUTPUT" | grep "LOCAL_SELECTED_ISSUE=" | cut -d'=' -f2)
    export ISSUE_TITLE=$(echo "$ORCH_OUTPUT" | grep "LOCAL_SELECTED_TITLE=" | cut -d'=' -f2)
    
    if [ -z "$ISSUE_NUMBER" ]; then
        echo "ℹ️ No pending tasks found by orchestrator. Exiting."
        exit 0
    fi
    echo "🎯 Orchestrator selected Issue #$ISSUE_NUMBER: $ISSUE_TITLE"
else
    echo "🎯 Using specified Issue #$ISSUE_NUMBER"
    # Fetch details if not present
    if [ -z "$ISSUE_TITLE" ]; then
        DETAILS=$(gh issue view "$ISSUE_NUMBER" --json title,body)
        export ISSUE_TITLE=$(echo "$DETAILS" | jq -r '.title')
        export ISSUE_BODY=$(echo "$DETAILS" | jq -r '.body')
    fi
fi

# 3. PLANIFICACIÓN
if [ "$SKIP_PLANNING" = "true" ] || [ "$SKIP_AI" = "true" ]; then
    echo "⏭️ Skipping Planning phase."
    # Si saltamos la IA, el usuario debería haber seteado METHODOLOGY y FILES manualmente si quiere seguir
else
    echo ">>> Phase 3: Planning"
    PLAN_OUTPUT=$(node --env-file=.env tooling/ai-worker-plan.js)
    echo "$PLAN_OUTPUT"
    
    # Extraer variables del plan para la siguiente fase (si el script no las exportó al shell)
    # Nota: ai-worker-plan.js escribe en GITHUB_OUTPUT, aquí simulamos captura si fuera necesario
    # pero como usamos variables de entorno en el mismo proceso de shell, el script las lee del .js
    echo "✅ Planning completed."
fi

# 4. DESARROLLO
if [ "$SKIP_DEVELOP" = "true" ] || [ "$SKIP_AI" = "true" ]; then
    echo "⏭️ Skipping Development phase."
else
    echo ">>> Phase 4: Development"
    # Asegurar que tenemos variables mínimas para el desarrollador
    export METHODOLOGY=${METHODOLOGY:-"Manual"}
    # FILES se leerá del entorno o se puede forzar aquí si se conoce
    node --env-file=.env tooling/ai-worker-develop.js
    echo "✅ Development completed."
fi

# 5. VERIFICACIÓN
if [ "$SKIP_VERIFICATION" = "true" ]; then
    echo "⏭️ Skipping Verification phase."
else
    echo ">>> Phase 5: Verification"
    npm run test:tooling || echo "⚠️ Warning: Tests failed but continuing flow."
    echo "✅ Verification finished."
fi

echo "--------------------------------"
echo "🏁 Full Flow completed for Issue #$ISSUE_NUMBER"
echo "Review the changes and create a PR if everything looks good."
