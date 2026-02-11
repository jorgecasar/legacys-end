# 🧪 Metodologías de Desarrollo (IA-First)

El sistema autónomo opera bajo principios estrictos de ingeniería para garantizar código sostenible y de alta calidad.

## 🔴 TDD (Test-Driven Development)
- **Uso**: Core logic, utilidades y servicios de dominio.
- **Flujo**: El agente escribe primero los fallos del test y luego implementa la solución mínima necesaria.

## 🎭 BDD (Behavior-Driven Development)
- **Uso**: Componentes de UI (Lit) y flujos de usuario.
- **Herramienta**: Vitest Browser Mode con Playwright.
- **Foco**: Validar el comportamiento desde la perspectiva del usuario.

## 🏰 DDD (Domain-Driven Design)
- **Uso**: Lógica de negocio compleja.
- **Foco**: Separar el dominio de la infraestructura. El agente debe mantener las entidades y casos de uso puros.

## 📜 CDD (Contract-Driven Development)
- **Uso**: Comunicación entre el sistema y MCPs o APIs externas.
- **Foco**: Definir los esquemas/contratos antes de la implementación para evitar desajustes en la integración.
