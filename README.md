# 🌌 AETHER — Calculadora Interactiva y Graficador en el Plano Complejo

**AETHER** es una calculadora web interactiva ultramoderna y un graficador avanzado de funciones matemáticas que opera completamente en el plano real y complejo. Diseñada con una estética *glassmorphism* premium de estilo futurista, AETHER ofrece una experiencia de usuario fluida, viva y de alto rendimiento.

---

## ✨ Características Principales

### 1. 🧮 Modos de Calculadora
* **Clásica**: Operaciones aritméticas elementales rápidas y fluidas.
* **Científica Avanzada**:
  * Funciones trigonométricas e hiperbólicas estándar y complejas.
  * Operaciones logarítmicas, exponenciales y factoriales.
  * Soporte completo para **números complejos**: constante imaginaria `i`, conjugado (`conj`), argumento (`arg`), parte real (`Re`) e imaginaria (`Im`).

### 2. 📈 Graficador de Funciones en el Plano Complejo
AETHER permite introducir funciones con las variables `x` o `z` (como `z^2 - 1`, `1/z`, `sqrt(z)` o `sin(z) * z`) y representarlas mediante tres modos de visualización avanzados:
* **2D Real**: El comportamiento clásico que traza únicamente la curva real $y = \text{Re}(f(x))$ cuando la parte imaginaria es despreciable.
* **2D Complejo**: Grafica sobre el eje real $x$ tanto la parte real $\text{Re}(f(x))$ en una línea sólida brillante como la parte imaginaria $\text{Im}(f(x))$ en una línea discontinua (dashed).
* **Plano Z (Coloreo de Dominio)**: Mapea la función $f(z)$ sobre todo el plano complejo $z = x + iy$.
  * **Matiz (Hue)**: Representa el argumento o ángulo de fase de la salida.
  * **Brillo (Lightness)**: Representa la magnitud o módulo $|f(z)|$ utilizando contornos logarítmicos concéntricos suavizados para una lectura matemática precisa.

### 3. 🚀 Optimizaciones de Rendimiento a 60 FPS
Para asegurar interacciones suaves (panning y zoom) al evaluar millones de operaciones por segundo en el modo Plano Z, AETHER utiliza un **lienzo offscreen adaptativo**:
* **En reposo**: Renderiza a 1/3 de la resolución original (escala 3x).
* **En interacción (arrastrar o zoom)**: Escala automáticamente a 1/6 de la resolución (escala 6x).
* El lienzo offscreen es estirado y suavizado dinámicamente por la GPU mediante interpolación bilineal, manteniendo una tasa de refresco fluida de **60 FPS** sin pixelación tosca.

---

## 🎨 Diseño y UX Premium
* **Estética Glassmorphism**: Paneles translúcidos con difuminado de fondo (`backdrop-filter: blur(8px)`) y bordes satinados.
* **Neones y Brillos**: Paleta de colores armoniosa con efectos de brillo neon autogenerados para cada función.
* **Etiquetas Dinámicas**: Los nombres de las funciones cambian automáticamente entre $f(x)$ y $f(z)$ según el modo seleccionado.
* **Crosshair Interactivo**: Muestra las coordenadas precisas del cursor y los valores complejos resultantes de la evaluación en tiempo real (`z: x + yi | f(z): u + vi | |f(z)|: r`).

---

## 🛠️ Tecnologías Utilizadas
* **HTML5**: Estructura semántica completa optimizada para SEO.
* **CSS3**: Diseño responsivo adaptable a dispositivos móviles y de escritorio, utilizando variables CSS globales y transiciones aceleradas por hardware.
* **JavaScript (ES6+)**: Lógica e intérprete matemático personalizado (Shunting-Yard y RPN con soporte nativo de la clase `Complex`).

---

## 🚀 Instalación y Uso Local

1. Descarga o clona el repositorio:
   ```bash
   git clone https://github.com/scavero/calculadoraFancy.git
   cd calculadoraFancy
   ```
2. Inicia un servidor local (por ejemplo, con `http-server` o la extensión Live Server de VS Code):
   ```bash
   npx http-server -p 8080
   ```
3. Abre en tu navegador la dirección `http://localhost:8080`.
