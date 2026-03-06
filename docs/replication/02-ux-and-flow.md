# 02 - UX y Flujo de Navegación

Este documento detalla la estructura visual, los componentes de interfaz y el flujo lógico de navegación de **Legacy's End**.

---

## 1. Pantalla Inicial: El "Quest Hub" (Centro de Mando)

El Hub no es una simple lista; es el tablero donde el usuario percibe su progreso real. La información aquí presentada es dinámica y se genera por cada curso (misión).

### 1.1 Estructura de la Interfaz del Hub
La página inicial debe seguir este layout jerárquico:

1.  **Cabecera de Marca (Game Brand)**:
    -   Muestra el logo de "LEGACY'S END".
    -   Acceso a configuraciones globales (Idioma, Sonido, Perfil).

2.  **Sección de Información de Misión Activa (Dynamic Hero)**:
    -   Si el usuario tiene una misión en curso, se destaca en la parte superior.
    -   **Título de la Quest**: Nombre épico de la misión.
    -   **Descripción Narrativa**: El contexto literario y el problema técnico (Code Smell).
    -   **Nivel de Avance**: Indicador porcentual o visual (ej: "Capítulo 2 de 5").
    -   **Duración Estimada**: Tiempo proyectado para completar los capítulos restantes.
    -   **Botón de Acción**: "Continuar Misión" (lleva al último punto guardado).

3.  **Catálogo de Cursos (Quest Grid)**:
    -   Un sistema de rejilla que organiza las misiones en dos categorías:
        -   **Cursos Disponibles**: Misiones que el jugador puede iniciar ahora mismo.
        -   **Cursos Pendientes / Coming Soon**: Misiones bloqueadas visualmente (ej: en escala de grises o con un icono de candado).

### 1.2 Anatomía de una "Quest Card"
Cada tarjeta de misión en el catálogo debe mostrar obligatoriamente:
-   **Miniatura**: Arte representativo del nivel de corrupción.
-   **Título**: Atractivo y técnico (ej: "El Pantano del Scope Global").
-   **Descripción Corta**: El objetivo pedagógico.
-   **Meta-info**: Duración estimada total y badge a obtener.
-   **Estado de Bloqueo**: Si está pendiente, debe indicar qué misión previa es necesaria.

---

## 2. Pantalla de Acción: El "Game Viewport"

Al entrar en una misión, la UI cambia a un modo inmersivo de pantalla completa (o contenedor dedicado) con los siguientes componentes:

### 2.1 El Escenario (Stage)
-   **Renderizado**: Área donde Alarion se desplaza.
-   **Fondo (Background)**: Imagen dinámica que puede cambiar según el estado de la misión.
-   **Sprites**: Representación visual del héroe, NPCs y Rewards en coordenadas %.

### 2.2 El HUD (Heads-Up Display)
Superposición de información persistente:
-   **Quest Progress Bar**: Barra que se llena conforme se completan las interacciones obligatorias del nivel.
-   **Botón de Pausa/Menú**: Permite volver al Hub o ajustar opciones sin perder el progreso del capítulo.
-   **Indicador de Habilidades**: Iconos de los Rewards recolectados en el capítulo actual.

### 2.3 Sistema de Diálogos (Interaction Overlay)
-   **Posición**: Panel inferior o centrado.
-   **Componentes**: Retrato del interlocutor, nombre y caja de texto.
-   **Control de Flujo**: Indicador visual (flecha parpadeante) que indica que hay más mensajes. El usuario debe hacer click o pulsar tecla para avanzar.

---

## 3. El Camino de Aprendizaje (The Path)

La navegación no es libre; sigue una lógica de negocio de **progresión dirigida**.

### 3.1 Desbloqueo Jerárquico
-   **Condición de Activación**: La misión `N+1` solo pasa de "Pendiente" a "Disponible" cuando el motor de persistencia marca la misión `N` como `completed`.
-   **Dependencia de Recompensas**: Algunas misiones en el Path pueden requerir que el héroe porte un "Outfit" o habilidad específica obtenida en un curso lateral.

### 3.2 Flujo de Transición
1.  **Hub -> Game**: Al pulsar "Empezar", se carga el bundle de la misión y se sitúa al héroe en `startPos`.
2.  **Capítulo N -> Capítulo N+1**: Ocurre automáticamente al entrar en la `ExitZone` (solo tras recoger el Reward).
3.  **Game -> Hub**: Se produce al finalizar el último capítulo de una Quest o al abandonar manualmente. Al volver, la Home se actualiza para mostrar el nuevo nivel de avance y desbloquear el siguiente curso.

### 3.3 Persistencia del Estado (Autosave)
-   Cada vez que un diálogo termina o un Reward es recogido, el `QuestController` debe invocar al `StorageService`.
-   Esto garantiza que, si la página se refresca, el usuario no tenga que volver a hablar con NPCs que ya "completó".
