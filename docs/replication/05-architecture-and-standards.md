# 05 - Arquitectura y Estándares de Código

## 1. Clean Architecture (The Desirable Pattern)
El proyecto se basa en un flujo de dependencia unidireccional (hacia adentro). Se prohíbe el uso de "signals" para la lógica de negocio central.

### 1.1 Las 4 Capas
1.  **Dominio (`src/core`)**:
    -   Contiene entidades puras (`HeroState`, `Quest`) y la lógica de errores.
    -   **Result Pattern**: Obligatorio. Las funciones nunca lanzan excepciones; devuelven un objeto de resultado `{ success, value, error }`.
2.  **Casos de Uso (`src/use-cases`)**:
    -   Orquestan las reglas de negocio (ej: `EvaluateChapterTransition.js`).
    -   Son independientes de los frameworks y la infraestructura.
3.  **Infraestructura (`src/services`)**:
    -   Adaptadores para el mundo exterior (Gemini AI, Almacenamiento, Audio).
    -   Implementan interfaces para que el sistema sea agnóstico al proveedor.
4.  **UI / Presentación (`src/components` & `src/controllers`)**:
    -   **Dumb Components**: Los elementos Lit solo reciben `@property` y emiten eventos. No conocen la lógica de negocio.
    -   **Controllers**: Conectan la UI con los Casos de Uso mediante **Inyección de Dependencias** utilizando `@lit/context`.

## 2. Estándares de Código ("Jorge Casar Persona")
- **Decoradores TC39**: Uso obligatorio de `accessor` en campos decorados (ej: `@state() accessor name = ""`).
- **Separación de Estilos**: Siempre en archivos independientes `[ComponentName].styles.js`.
- **Inmutabilidad**: Los estados solo se modifican a través de controladores autorizados para preservar la integridad del dominio.
