# Capítulo 3: The Flowing Heartstone (Señales y Reactividad)

> *"Bienvenidos a la Metrópolis del Silicio. Durante años, nuestra infraestructura urbana ha seguido la Ley del Censo Centralizado. Si un ciudadano cambia de piso o un coche se para en un cruce, el Ayuntamiento entero entra en pánico: tiene que enviar inspectores a revisar todos los sensores de la ciudad para descubrir qué ha cambiado. Y si el semáforo de una esquina debe ponerse en verde, la arquitectura nos obliga a demoler y reconstruir el barrio entero desde los cimientos solo para cambiar esa bombilla. La CPU de la ciudad está al 100%. El tráfico está congelado. Es hora de cortar los cables del pasado y rediseñar la ciudad con reactividad quirúrgica."*

---

## Prólogo: El Barrio que se Demuele (El "Antes" / VDOM)

### El Escenario

Un barrio caótico y distópico en construcción. Edificios modulares de hormigón están siendo demolidos por grúas mecánicas. Las calles están destrozadas, con un único semáforo roto parpadeando al azar. Llueve sobre el asfalto oscuro.

- **NPC:** *The Overwhelmed Mayor* (El Alcalde Saturado). Un burócrata rodeado de miles de teléfonos sonando a la vez, incapaz de gestionar las alertas de la ciudad.
- **Recompensa:** *The Broken Blueprint* (El Plano Roto). Un mapa físico arrugado que se actualiza tachando cosas con tinta roja.

### El Problema (Fase 0: El Sistema a lo Bruto)

Cuando un solo coche pisa un sensor en el Cruce A, el Ayuntamiento no sabe qué ha pasado y ejecuta un Censo General. Al detectar que un semáforo debe cambiar a verde, la arquitectura obliga a demoler y reconstruir el barrio entero desde los cimientos solo para cambiar esa bombilla.

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

## Capítulo 1: El Sensor de Presión (`Signal.State`)

### El Escenario

Un oscuro y desolado cruce de asfalto. Un único sensor de presión magnético y metálico está incrustado en la carretera, emitiendo un pulso de luz cyan neón constante.

- **NPC:** *The Wiretapper* (La Perforadora de Asfalto). Una ingeniera de mantenimiento de carreteras con herramientas de precisión y un mono de trabajo sucio.
- **Recompensa:** *The Isolated Sensor* (El Sensor Autónomo). Un pequeño chip magnético de asfalto que emite una luz cyan constante.

### La Primitiva (Fase 1: El Dato Autónomo)

Perforamos el asfalto. El dato ya no es una propiedad pegada a la estructura de un edificio; existe por sí mismo en un chip aislado.

```javascript
// 🛡️ EL DESPUÉS: El estado vive fuera de la UI
import { Signal } from "@tc39/proposal-signals";

// Un contenedor reactivo puro. Cambia en absoluto silencio.
const carCount = new Signal.State(0);

console.log(carCount.get()); // 0
carCount.set(1); // El cambio ocurre en memoria instantáneamente
```

---

## Capítulo 2: El Automatizador de Giros (`Signal.Computed`)

### El Escenario

Una caja de conexiones eléctricas abandonada en una pared de ladrillo. Dentro, un único microprocesador inteligente duerme, respirando con un pulso cyan débil solo cuando está activo.

- **NPC:** *The Idle Engineer* (El Ingeniero Sesteante). Un programador de semáforos relajado en su silla que solo se despierta si un monitor parpadea en cyan.
- **Recompensa:** *The Lazy Smart Chip* (El Chip Perezoso). Un procesador dorado cuyas patillas brillan en cyan solo cuando se realiza una consulta.

### Lógica Lazy (Fase 2: Los Espejos Perezosos)

Un módulo de cálculo intermedio. Si el semáforo de giro está apagado por la noche, el chip se duerme. No calcula operaciones matemáticas en bucle a menos que alguien encienda el semáforo y le pida explícitamente el estado del tráfico.

```javascript
// 🔮 Datos derivados con Memoization nativa
const isTrafficJam = new Signal.Computed(() => {
  // Solo se ejecuta si carCount cambia Y alguien está escuchando
  return carCount.get() > 5;
});

// Si nadie hace .get() de isTrafficJam, el coste de CPU es CERO.
```

---

## Capítulo 3: El Cable de Fibra Óptica (El Vínculo Directo al DOM)

### El Escenario

Grietas en el asfalto por donde corre un cable de fibra óptica cyan ultradelgado directamente desde el suelo hasta la base de un panel digital, puenteando todas las demás redes eléctricas.

- **NPC:** *The Fiber Weaver* (El Tendero de Fibra). Un técnico encapuchado que fusiona cables de vidrio reflectante a oscuras bajo la lluvia.
- **Recompensa:** *The Surgical Laser Splicer* (La Fusionadora Láser). Una herramienta de mano estilizada cargada con hilo de fibra óptica cyan.

### Notificación Quirúrgica (Fase 3: El Vínculo de Sangre)

Cortamos las llamadas de censo del ayuntamiento. Tiramos un cable físico de fibra óptica directo desde el sensor hasta la bombilla del semáforo. El cambio es milimétrico.

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

## Capítulo 4: La Central de Ambulancias (El Grafo Sin Glitches)

### El Escenario

Un centro de gestión de tráfico complejo. Múltiples cables brillantes en el suelo forman una red geométrica perfecta (Grafo Acíclico Dirigido). Todas las líneas están bloqueadas en su lugar con uniones cyan. Cero solapamientos. Equilibrio perfecto.

- **NPC:** *The Chrono-Dispatcher* (La Despachadora del Grafo). Una operadora de emergencias fría y analítica que organiza las señales con gestos precisos.
- **Recompensa:** *The Atomic Chronometer* (El Reloj Atómico). Un dispositivo digital de sincronización perfecta que congela los datos hasta que el bloque es consistente.

### Consistencia Atómica (Fase 4: El Grafo Lógico)

Si cambian a la vez la posición de una ambulancia y el volumen de coches, los sistemas viejos envían señales desordenadas haciendo que el semáforo parpadee en colores erróneos durante un milisegundo (un *glitch*). El motor de Signals organiza todo de forma atómica.

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

## Capítulo 5: La Caja de Fusibles (Gobernanza de Stores)

### El Escenario

Una inmensa puerta acorazada de servidores de calle anclada a un muro de hormigón. Cerraduras de hierro y runas de seguridad azules brillantes. Un único panel de lectura externo.

- **NPC:** *The Cyber Guardian* (El Guardián del Armario). Un imponente agente de seguridad acorazado que protege el acceso físico a los servidores centrales de tráfico.
- **Recompensa:** *The Encrypted Master Key* (La Llave de Solo Lectura). Un pase electrónico magnético que permite leer las métricas pero bloquea la escritura.

### Blindaje Arquitectónico (Fase 5: Gobernanza de Stores)

El panel de la avenida es público y cualquiera puede leer el estado del tráfico, pero ningún conductor puede bajarse del coche y puentear los cables a mano para ponerse el semáforo en verde. Protegemos el estado en un Store privado y exponemos proyecciones de Solo Lectura.

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

## Epílogo: El Futuro Nativo de la Plataforma (El Fin del Legado)

- **Adiós a los silos:** Al estar en el core de JavaScript (TC39), no dependes de si usas Lit, React, Angular o Vanilla JS. El motor del navegador gestiona el grafo de rendimiento.
- **Rendimiento por defecto:** La optimización deja de ser una capa compleja de configuración manual (`useMemo`, parches de bindings) y pasa a ser comportamiento nativo de la plataforma.
- **Interfaces Vivas:** Las UI ya no se dibujan una y otra vez... fluyen como ríos electrónicos vivos.

---

### 🛠️ Anexo Técnico: La función `effect`

Como la propuesta del TC39 es una API de bajo nivel pensada para construir abstracciones, no incluye una función `effect()` por defecto, sino la primitiva `Signal.subtle.Watcher`. Aquí tienes una implementación de referencia para conectar Signals con el mundo exterior:

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
