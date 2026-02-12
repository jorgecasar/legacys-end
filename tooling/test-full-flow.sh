#!/bin/bash
# test-full-flow.sh - Prueba de integración completa del sistema de agentes

set -e # Detener en caso de error

echo "🚀 Iniciando prueba de flujo completo..."

# 1. CREAR ISSUE DE PRUEBA
echo ">>> 1. Creando issue de prueba..."
ISSUE_JSON=$(gh issue create --title "AI Test: Hello World Integration" --body "Implement a helloWorld function in src/hello-test-flow.js and a test in src/hello-test-flow.test.js following TDD." --label "bug" --json number)
export ISSUE_NUMBER=$(echo $ISSUE_JSON | jq -r '.number')
echo "✅ Issue #$ISSUE_NUMBER creado."

# 2. TRIAJE
echo ">>> 2. Ejecutando Triaje..."
export GITHUB_ISSUE_NUMBER=$ISSUE_NUMBER
node --env-file=.env tooling/gemini-triage.js
echo "✅ Triaje completado."

# 3. ORQUESTACIÓN (Simulada para este issue específico)
# En lugar de buscar en el tablero, forzamos la orquestación del issue actual
echo ">>> 3. Orquestando issue #$ISSUE_NUMBER..."
# (Opcional: aquí podríamos llamar a ai-orchestrator.js si el issue ya está en el tablero)
echo "✅ Orquestación lista."

# 4. PLANIFICACIÓN
echo ">>> 4. Generando Plan Técnico..."
export ISSUE_TITLE="AI Test: Hello World Integration"
export ISSUE_BODY="Implement a helloWorld function in src/hello-test-flow.js and a test in src/hello-test-flow.test.js following TDD."
node --env-file=.env tooling/ai-worker-plan.js
echo "✅ Planificación completada."

# 5. DESARROLLO
echo ">>> 5. Implementando solución..."
# Recuperamos variables del plan si fuera necesario, o las fijamos para el test
export METHODOLOGY="TDD"
export FILES="src/hello-test-flow.js src/hello-test-flow.test.js"
node --env-file=.env tooling/ai-worker-develop.js
echo "✅ Desarrollo completado."

# 6. VERIFICACIÓN DE ARCHIVOS
echo ">>> 6. Verificando archivos creados..."
ls -l src/hello-test-flow.js src/hello-test-flow.test.js
echo "✅ Archivos verificados."

# 7. CREACIÓN DE PR
echo ">>> 7. Creando Pull Request..."
# Configuramos git para el commit
git add src/hello-test-flow.js src/hello-test-flow.test.js
git commit -m "feat(ai): full flow test implementation for #$ISSUE_NUMBER" || echo "No changes to commit"
git push -u origin HEAD

gh pr create --title "feat: full flow test result for #$ISSUE_NUMBER" --body "Automated PR from full-flow-test.sh. Verified agents: Triage, Planning, Develop."
echo "✅ Pull Request creado exitosamente."

echo "🏁 ¡Flujo completo verificado con éxito!"
