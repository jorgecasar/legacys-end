# 04 - Sistema de Diálogos y Slides

## 1. El Concepto de "Slide Deck"
En **Legacy's End**, los diálogos no son simples cadenas de texto. Son **barajas de diapositivas (Slide Decks)** compuestas por componentes especializados según el tipo de contenido.

## 2. Composición del Deck
Cada interacción con un NPC o zona dispara una secuencia de diapositivas que el usuario debe avanzar manualmente.

### 2.1 Tipos de Diapositivas (Componentes Slide)
Para cada tipo de contenido educativo existe un componente Lit específico:
- **NarrationSlide**: Pantalla de texto atmosférico con el retrato del NPC. Foco en la historia.
- **CodeComparisonSlide**: Componente interactivo que muestra el "Código Legado" frente al "Código Refactorizado". Permite resaltar diferencias.
- **DiagramSlide**: Muestra esquemas de arquitectura o diagramas de flujo para explicar conceptos abstractos (ej: Inyección de Dependencias).
- **InsightSlide**: Foco en un "Tip" o conclusión clave de la misiones.

## 3. Lógica de Completitud
- **Avance Manual**: El jugador controla el ritmo pasando cada slide.
- **Estado de Diálogo**: Una interacción solo se marca como "Completada" cuando se llega a la última slide del deck.
- **Efectos Secundarios**: El fin de una deck puede disparar un cambio en el mundo (ej: aparición de un Reward o cambio de background).
