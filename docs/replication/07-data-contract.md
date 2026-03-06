# 07 - Contrato de Datos (Contenido)

## 1. Estructura de una Quest
Para crear una nueva misión, se debe definir un objeto en `src/content/quests/` siguiendo este contrato:

### 1.1 Metadata de la Quest (`index.js`)
Cada misión es un objeto autónomo que define su propia información de presentación para el Hub:

```javascript
{
  "id": "quest-id",
  "title": "Título de la Misión",
  "description": "Explicación narrativa y del problema técnico (Code Smell).",
  "estimatedDuration": "15 min",
  "progress": 0, // Nivel de avance en esta misión (0-100)
  "badge": "Nombre de la Habilidad a obtener",
  "prerequisites": ["quest-anterior-id"],
  "status": "available" | "coming_soon"
}
```

### 1.2 Configuración del Capítulo (`chapters.js`)
El esquema permite orquestar la evolución visual y secuencial:

```javascript
{
  "chapter-id": {
    "backgrounds": [
      { "id": "corrupt", "style": "url(...)", "condition": "default" },
      { "id": "healed", "style": "url(...)", "condition": "all_interactions_done" }
    ],
    "heroOverrides": {
      "onEnter": { "outfit": "base" },
      "onReward": { "outfit": "advanced_armor" }
    },
    "entities": [
      {
        "id": "npc-1",
        "type": "npc",
        "position": { "x": 30, "y": 50 },
        "visibility": "always",
        "deck": [
          { "type": "narration", "text": "Bienvenido..." },
          { "type": "code-comparison", "before": "...", "after": "..." }
        ]
      },
      {
        "id": "npc-2",
        "type": "npc",
        "position": { "x": 70, "y": 20 },
        "visibility": "after:npc-1" // Aparece cuando npc-1 termina
      }
    ],
    "rewards": [
      {
        "id": "main-reward",
        "position": { "x": 50, "y": 50 },
        "visibility": "all_interactions_done"
      }
    ],
    "exitZone": { "x": 90, "y": 50, "width": 10, "height": 20 }
  }
}
```
