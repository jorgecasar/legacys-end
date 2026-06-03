# Legacy's End: The Flowing Heartstone (Slides)

## Slide 1: Portada (Intro)

**Imagen de Fondo:** (Tu imagen de referencia del pantano/ciudad lluviosa).
**Título Principal:** Legacy's End: The Flowing Heartstone
**Subtítulo:** Reactividad quirúrgica con Signals y el fin del renderizado masivo.

> **Nota del Ponente:** "Bienvenidos a la Metrópolis del Silicio. Hoy vamos a hackear su obsoleta infraestructura de tráfico..."

---

## Slide 2: Prólogo — La Ciudad Ineficiente (El Problema)

**Cabecera:** Fase 0: El Sistema a lo Bruto (Virtual DOM)
**Estructura:** Dos columnas.

### Columna Izquierda (Narrativa)
>
> Cuando un solo coche pisa un sensor en el Cruce A, el Ayuntamiento no sabe qué ha pasado. Ejecuta un Censo General (revisa todos los sensores de la ciudad). Al detectar que un semáforo debe cambiar a verde, la arquitectura obliga a demoler y reconstruir el barrio entero desde los cimientos solo para cambiar esa bombilla.

### Columna Derecha (Código Legacy)

```javascript
// 🛑 EL ANTES: Re-ejecución total en cada mutación
class IntersectionComponent extends HTMLElement {
  set carCount(value) {
    this._cars = value;
    this.render(); // ⚠️ Re-renderiza e inhabilita el barrio
  }

  render() {
    console.log("⚠️ Demoliendo y reconstruyendo el cruce...");
    this.innerHTML = `
      <div class="intersection">
        <div class="light">${this._cars > 0 ? '🟢' : '🔴'}</div>
        <div class="asphalt-details">...</div>
      </div>
    `; // Se destruyen y recrean nodos del DOM innecesarios
  }
}
```

---

## Slide 3: Capítulo 1 — El Sensor de Presión (La Primitiva)

**Cabecera:** Fase 1: `Signal.State` (El Dato Autónomo)
**Estructura:** Texto arriba, código abajo.

**Contenido:** Perforamos el asfalto. El dato ya no es una propiedad pegada a la estructura de un edificio; existe por sí mismo en un chip aislado.

**Código:**

```javascript
// 🛡️ EL DESPUÉS: El estado vive fuera de la UI
import { Signal } from "@tc39/proposal-signals";

// Un contenedor reactivo puro. Cambia en absoluto silencio.
const carCount = new Signal.State(0);

console.log(carCount.get()); // 0
carCount.set(1); // El cambio ocurre en memoria instantáneamente
```

---

## Slide 4: Capítulo 2 — El Automatizador de Giros (Lógica Lazy)

**Cabecera:** Fase 2: `Signal.Computed` (Los Espejos Perezosos)
**Estructura:** Explicación a la izquierda, código a la derecha.

**Concepto Urbano:** Un módulo de cálculo intermedio. Si el semáforo de giro está apagado por la noche, el chip se duerme. No calcula operaciones matemáticas en bucle a menos que alguien encienda el semáforo y le pida explícitamente el estado del tráfico (Lazy evaluation).

**Código:**

```javascript
// 🔮 Datos derivados con Memoization nativa
const isTrafficJam = new Signal.Computed(() => {
  // Solo se ejecuta si carCount cambia Y alguien está escuchando
  return carCount.get() > 5;
});

// Si nadie hace .get() de isTrafficJam, el coste de CPU es CERO.
```

---

## Slide 5: Capítulo 3 — El Cable de Fibra Óptica (Notificación Quirúrgica)

**Cabecera:** Fase 3: `Signal.subtle.Watcher` (El Vínculo de Sangre)
**Estructura:** Comparativa visual directa.

**Contenido:** Cortamos las llamadas de censo del ayuntamiento. Tiramos un cable físico de fibra óptica directo desde el sensor hasta la bombilla del semáforo. El cambio es milimétrico.

**Código:**

```javascript
// ⚔️ Conexión directa al DOM puenteando el framework
const lightDOM = document.getElementById("traffic-light");

// Abstracción básica de un efecto utilizando el core del TC39
effect(() => {
  // El motor registra que lightDOM depende de isTrafficJam
  lightDOM.textContent = isTrafficJam.get() ? '🔴 ATASCO' : '🟢 FLUIDO';
});

// ¡Al hacer carCount.set(6), solo muta el textContent!
// Ningún componente se vuelve a ejecutar. El barrio sigue intacto.
```

---

## Slide 6: Capítulo 4 — La Central de Ambulancias (Glitch-Free)

**Cabecera:** Fase 4: El Grafo Lógico (Consistencia Atómica)
**Estructura:** Concepto y diagrama mental.

**Contenido:** Si cambian a la vez la posición de una ambulancia y el volumen de coches, los sistemas viejos envían señales desordenadas haciendo que el semáforo parpadee en colores erróneos durante un milisegundo (un glitch). El motor de Signals del TC39 organiza todo en un Grafo Acíclico Dirigido (DAG).

**Código de demostración:**

```javascript
const ambulanceNear = new Signal.State(false);
const heavyTraffic = new Signal.State(false);

// Grafo de dependencia: Alarma depende de ambas señales
const triggerEmergencyLight = new Signal.Computed(() => {
  return ambulanceNear.get() && heavyTraffic.get();
});

// El algoritmo Push/Pull del TC39 estabiliza el grafo en bloque.
// Aunque ambas señales muten a la vez, el resultado final es atómico.
// Cero parpadeos inconsistentes en la pantalla del usuario.
```

---

## Slide 7: Capítulo 5 — La Caja de Fusibles Cerrada con Llave (Gobernanza)

**Cabecera:** Fase 5: Blindaje Arquitectónico (Gobernanza de Stores)
**Estructura:** Código limpio de Arquitectura de Software.

**Contenido:** El panel de la avenida es público y cualquiera puede leer el estado del tráfico, pero ningún conductor puede bajarse del coche y puentear los cables a mano para ponerse el semáforo en verde. Protegemos el estado en un Store privado y exponemos proyecciones de Solo Lectura.

**Código:**

```javascript
// 🏰 Arquitectura Unidireccional Robusta
export class TrafficStore {
  // El estado real es privado. Nadie puede hacerle un .set() directo externamente
  #cars = new Signal.State(0);

  constructor() {
    // Exponemos un espejo de solo lectura para los semáforos de la UI
    this.cars = new Signal.Computed(() => this.#cars.get());
  }

  // Única puerta de entrada lógica y validada para alterar la realidad
  registerVehicleEntry() {
    const current = this.#cars.get();
    this.#cars.set(current + 1); // Mutación controlada
  }
}

const store = new TrafficStore();
store.cars.set(100); // ❌ Excepción: Un Computed Signal no se puede mutar desde fuera.
store.registerVehicleEntry(); // ✅ Flujo seguro e identificable.
```

---

## Slide 8: Epílogo — El Futuro Nativo de la Plataforma

**Cabecera:** Conclusión: El Fin del Legado

**Puntos Clave:**

- **Adiós a los silos:** Al estar en el core de JavaScript (TC39), no dependes de si usas Lit, React, Angular o Vanilla JS. El motor del navegador gestiona el grafo de rendimiento.
- **Rendimiento por defecto:** La optimización deja de ser una capa compleja de configuración manual (`useMemo`, parches de bindings) y pasa a ser comportamiento nativo de la plataforma.
- Interfaces que no se dibujan una y otra vez... fluyen como ríos electrónicos vivos.

---

### 🛠️ Script Útil para tu Charla (Función `effect`)

Como la propuesta del TC39 es una API de bajo nivel pensada para que los creadores de frameworks e ingenieros de software construyan sus propias abstracciones, no incluye una función `effect()` por defecto (provee `Signal.subtle.Watcher`). Para que tus ejemplos de código anteriores funcionen de forma literal en la presentación, puedes incluir este helper real en tus recursos o explicarlo brevemente:

```javascript
// La abstracción que conecta las Signals con el mundo exterior
export function effect(callback) {
  let w = new Signal.subtle.Watcher(() => w.watch());

  // Función para ejecutar el bloque rastreando dependencias
  const run = () => {
    Signal.subtle.WatchContext.runInContext(w, callback);
  };

  w.watch();
  run();
}
```
