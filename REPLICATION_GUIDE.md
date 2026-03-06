# 🎮 Legacy's End: The Complete Replication Blueprint & Master Specification

Este documento es la única fuente de verdad necesaria para comprender, diseñar y replicar **Legacy's End** desde cero. Combina la visión del producto, las reglas de negocio detalladas, la arquitectura técnica y los estándares de ingeniería.

---

## 1. Definición del Producto (The Vision)

### 1.1 Propósito Pedagógico
**Legacy's End** es un RPG educativo de "Aventura Arquitectónica". Su misión es transformar el aprendizaje de la ingeniería de software en una experiencia épica. El jugador aprende **Arquitectura Limpia**, **Desacoplamiento** y **Web Components** no leyendo manuales, sino salvando un mundo digital ("El Monolito") consumido por el código legado, el acoplamiento extremo y el espagueti de CSS.

### 1.2 El Protagonista Evolutivo (Alarion)
- **Alarion**: Un "Acólito de Código" en formación. Su progreso se mide por **Habilidades Arquitectónicas** (Encapsulación, Inyección de Dependencias, etc.).
- **Evolución del Ser**: Alarion no es un sprite estático. Su apariencia (sprites, vestimenta, aura) evoluciona dinámicamente según las misiones completadas y los objetos recolectados. Puede cambiar de vestimenta al interactuar con elementos de la escena.
- **Atributos**: El héroe puede modificar aspectos de su ser que afectan la jugabilidad y la percepción del mundo.

---

## 2. Experiencia de Usuario (UX) y Flujo de Pantallas

### 2.1 Página Inicial: El "Quest Hub"
Es el centro de mando y persistencia. Debe contener obligatoriamente:
- **Hero Section**: 
    - Título "LEGACY'S END".
    - Descripción narrativa envolvente.
    - Botón de acción dinámico ("Empezar Aventura" o "Continuar Viaje").
- **Dashboard de Información**: 
    - Nivel de avance global.
    - Duración estimada del viaje.
    - Habilidades técnicas desbloqueadas.
- **Catálogo de Cursos (Misiones)**:
    - **Listado de Cursos Disponibles**: Misiones que el jugador puede iniciar. Muestran título, problema técnico a resolver y objetivos.
    - **Listado de Cursos Pendientes / Coming Soon**: Misiones futuras bloqueadas por el "Path" de aprendizaje para generar expectativa.

### 2.2 Pantalla de Acción: El "Game Viewport"
Una interfaz inmersiva compuesta por:
- **Área de Juego (Stage)**: Renderizado responsivo con pixel art.
- **HUD**: Acceso a pausa, inventario de habilidades y progreso del capítulo.
- **Sistema de Diálogos (Overlay)**: Panel inferior para la narrativa y la enseñanza técnica.

---

## 3. Mecánicas de Juego y Reglas de Negocio

### 3.1 Progresión y "The Path"
- **Acceso Jerárquico**: Existe un camino (Path) definido. El nivel `N+1` solo es accesible si el nivel `N` ha sido completado.
- **Desbloqueo por Habilidades**: Ciertas misiones requieren haber obtenido una "Recompensa" específica previamente.
- **Persistencia**: Autosave en tiempo real del estado global (misiones, vestimenta, configuración).

### 3.2 Lógica Interna del Capítulo (Gameplay Loop)
Cada nivel sigue una secuencia lógica estricta e inquebrantable:
1.  **Exploración e Interacción**:
    - El jugador puede interactuar con **Elementos** (NPCs, objetos) o entrar en **Zonas de Interacción** (triggers invisibles).
    - Un capítulo puede tener múltiples NPCs que aparecen todos a la vez o uno después de otro según condiciones.
2.  **Sistema de Diálogos y Decks (Composeable Slides)**:
    - Al interactuar, se abre un cuadro de diálogo que consume una "Baraja" (Deck) de diapositivas.
    - **Slides por Contenido**: Cada tipo de contenido (narración, comparación de código, diagramas) tiene su propio componente de slide.
    - **Secuencialidad**: El usuario debe avanzar manualmente los mensajes. La interacción solo se marca como "Completada" al llegar al final de la deck.
3.  **Mundo Reactivo**: El fondo (`background`) y los elementos de la escena pueden cambiar dinámicamente tras una interacción.
4.  **Trigger de Recompensa**: El objeto Reward **aparece visualmente** en el mapa solo cuando **TODAS las interacciones obligatorias** del nivel se han completado.
5.  **Habilitación de Salida**: 
    - La Zona de Salida (Exit Zone) se habilita **únicamente tras recoger físicamente la recompensa**.
    - Al entrar en la salida, se pasa al siguiente capítulo o se termina el nivel regresando al Hub.

---

## 4. Arquitectura del Sistema (Clean Architecture)

Se prohíbe el acoplamiento directo y el uso de "signals" en la lógica de dominio.

### 4.1 Capas de Responsabilidad
1.  **Dominio (`src/core`)**: 
    - Entidades puras (`Hero`, `Quest`).
    - **Result Pattern**: Obligatorio. Las funciones devuelven `{ success, value, error }`. **Sin excepciones.**
2.  **Casos de Uso (`src/use-cases`)**: 
    - Encapsulan la lógica de negocio (ej: `EvaluateChapterTransition`, `UpdateHeroAppearance`).
3.  **Infraestructura (`src/services`)**: 
    - Adaptadores para IA Gemini, Almacenamiento, Audio. Intercambiables mediante interfaces.
4.  **UI (`src/components` & `src/controllers`)**:
    - **Dumb Components**: Usan Lit y Web Awesome. Reciben datos y emiten eventos.
    - **Controladores**: Inyectan Casos de Uso mediante **Inyección de Dependencias** (`@lit/context`).

---

## 5. Especificaciones Técnicas y Motor

### 5.1 Motor de Interacción
- **Coordenadas Relativas (%)**: Posicionamiento 0-100 para ser 100% responsivo en cualquier resolución.
- **Detección de Proximidad**: Cálculo de Distancia Euclidiana entre el Héroe y las entidades.

### 5.2 Estándares de Código ("Jorge Casar Persona")
- **Decoradores TC39**: Uso obligatorio del keyword `accessor` (`@state() accessor name`).
- **Separación de Estilos**: Siempre en archivos `[ComponentName].styles.js`.
- **Simplicidad**: Código autodescriptivo con JSDoc.

### 5.3 Calidad y Validación
- **TDD/BDD**: Cobertura del 100% en Domain y Use Cases con **Vitest**.
- **Navegadores Reales**: Validación obligatoria con **Playwright** (Chromium, Firefox, WebKit).
- **Visual Regression**: Snapshots para validar la "sanación" visual del mundo.

---

## 6. Optimización y Activos

- **Bundle**: Modern-only (es2022+), minificado y con **Code Splitting** por misión.
- **Compresión**: Brotli/Gzip para carga instantánea.
- **Pixel Art**: 32x32px escalados con `image-rendering: pixelated;`.
- **Audio**: WebP/MP3 optimizados.

---

## 7. Data Contract: Definición de Capítulos

```javascript
{
  "chapter-id": {
    "backgrounds": [
      { "id": "default", "style": "url(...)", "condition": "initial" },
      { "id": "clean", "style": "url(...)", "condition": "after:interaction-1" }
    ],
    "entities": [
      {
        "id": "npc-1",
        "type": "npc",
        "position": { "x": 30, "y": 50 },
        "slides": [ /* Deck de slides personalizado */ ]
      }
    ],
    "rewards": [
      {
        "id": "reward-1",
        "position": { "x": 50, "y": 50 },
        "visibility": "all_interactions_done"
      }
    ]
  }
}
```
