# 03 - Mecánicas de Juego Avanzadas

## 1. Motor de Interacción y Proximidad
El juego utiliza una lógica matemática simple pero potente para gestionar el movimiento y las acciones.

### 1.1 Coordenadas Relativas (%)
- Todas las posiciones (`Hero`, `NPCs`, `Rewards`, `ExitZones`) se definen en una escala de **0.0 a 100.0**.
- Esto permite que el juego sea **100% responsivo**. Si el contenedor cambia de tamaño, las posiciones no necesitan recalcularse, solo renderizarse en el nuevo % del espacio.

### 1.2 Detección de Colisiones (Proximidad)
- No hay motor de física. Se usa la **Distancia Euclidiana**:
  `distancia = sqrt((x2-x1)^2 + (y2-y1)^2)`
- **Radio de Acción**: Si la distancia es menor a un umbral (ej: 5%), la interacción se habilita automáticamente o mediante una tecla.

## 2. Motor de Condiciones y Visibilidad
El mundo es dinámico y reacciona al estado del juego (`QuestState`).

### 2.1 Aparición Secuencial de Entidades
- **Multi-NPC**: Un capítulo puede tener varios NPCs.
- **Condiciones de Visibilidad**: Las entidades pueden aparecer o desaparecer basándose en predicados:
    - `always`: Siempre visible.
    - `after:interaction_id`: Aparece solo cuando terminó un diálogo específico.
    - `sequential`: Los NPCs aparecen uno después de otro conforme se avanza en la trama del nivel.

### 2.2 Mundo Reactivo
- **Background Dinámico**: El fondo de un capítulo puede cambiar tras una interacción (ej: de un bosque gris a uno colorido).
- **Evolución del Escenario**: Elementos decorativos pueden añadirse o eliminarse para reflejar que el código ha sido "sanado".

## 3. Lógica de Recompensas y Salida
Existe una dependencia estricta para terminar un nivel:
1.  **Interacciones**: El jugador debe completar todas las interacciones obligatorias.
2.  **Aparición de Reward**: Solo cuando se cumplen las interacciones, el objeto **Reward aparece visualmente** en el mapa.
3.  **Recolección**: El héroe debe recoger el objeto. Esto puede disparar un cambio de vestimenta o aura.
4.  **Habilitación de Salida**: La `ExitZone` (zona de salida) solo se activa y se hace visible **tras obtener la recompensa**.
