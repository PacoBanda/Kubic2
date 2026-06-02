// --- ESTADO GLOBAL ---
let currentIndex = 0;
let currentDensity = 2.0;
const slider = document.getElementById("slider");

let totalAvance = 0;
let totalRebaje = 0;
let totalRecorte = 0;

// --- NAVEGACIÓN ---
function goToSlide(index) {
  if (index < 0 || index > 3) return;
  currentIndex = index;
  slider.style.transform = `translateX(-${currentIndex * 100}vw)`;
  const dotsList = document.querySelectorAll(".dot");
  dotsList.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
}

// --- CONTROL DE ENTER E INPUTS ---
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (document.activeElement.tagName === "INPUT") {
      const currentInput = document.activeElement;
      const id = currentInput.getAttribute("data-id");

      // CONDICIÓN: Si es la ÚLTIMA casilla de la pantalla actual, avanza de slide
      const esUltimaCasilla = (id === "av_lD" || id === "re_lD" || id === "rec_lng");

      if (esUltimaCasilla) {
        currentInput.blur(); // Cerramos el teclado nativo en móviles
        goToSlide(currentIndex + 1); // Pasamos a la siguiente pantalla
      } else {
        // Si no es la última casilla, Enter funciona como un "Tabulador" saltando a la siguiente casilla automáticamente
        const inputs = Array.from(document.querySelectorAll(".kb-input"));
        const index = inputs.indexOf(currentInput);
        if (index > -1 && inputs[index + 1]) {
          inputs[index + 1].focus();
        }
      }
    }
    return;
  }

  // Las flechas físicas del teclado del PC solo moverán la pantalla si el usuario no está dentro de un input escribiendo
  if (document.activeElement.tagName !== "INPUT") {
    if (e.key === "ArrowRight") goToSlide(currentIndex + 1);
    if (e.key === "ArrowLeft") goToSlide(currentIndex - 1);
  }
});

// Deslizar con el dedo (Swipe) desactivado si se está editando para que no haya saltos molestos
let tStartX = 0;
slider.addEventListener("touchstart", (e) => {
  if (document.activeElement.tagName !== "INPUT") {
    tStartX = e.changedTouches[0].screenX;
  }
}, { passive: true });

slider.addEventListener("touchend", (e) => {
  if (document.activeElement.tagName === "INPUT") return;
  const dx = tStartX - e.changedTouches[0].screenX;
  if (Math.abs(dx) > 100) {
    if (dx > 0) goToSlide(currentIndex + 1);
    else goToSlide(currentIndex - 1);
  }
}, { passive: true });

// --- LÓGICA DE CÁLCULO ASOCIADA A INPUTS ---
function updateGlobal() {
  document.getElementById("sum_av").innerText = `${totalAvance} Tn`;
  document.getElementById("sum_re").innerText = `${totalRebaje} Tn`;
  document.getElementById("sum_rec").innerText = `${totalRecorte} Tn`;
  document.getElementById("res_total_general").innerText = `${totalAvance + totalRebaje + totalRecorte} Tn`;
}

// Selector exacto con blindaje matemático para no procesar números inferiores a 0
function getVal(id) {
  const input = document.querySelector(`.kb-input[data-id="${id}"]`);
  const v = input ? parseFloat(input.value) || 0 : 0;
  return Math.max(0, v); // Si de algún modo llega un valor negativo, se procesa como 0
}

function calcAvance() {
  const lI = getVal("av_lI"), lD = getVal("av_lD");
  let lMedia = (lI + lD) / ((lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1);
  
  let hSum = 0, hm = 0;
  ["av_h1", "av_h2", "av_h3", "av_h4", "av_h5", "av_h6"].forEach((id) => {
    let v = getVal(id); if (v > 0) { hSum += v; hm++; }
  });
  let altMedia = hm === 0 ? 5.1 : hSum / hm;
  
  let aSum = 0, am = 0;
  ["av_a1", "av_a2", "av_a3"].forEach((id) => {
    let v = getVal(id); if (v > 0) { aSum += v; am++; }
  });
  let anchoMedia = am === 0 ? 8.2 : aSum / am;
  
  totalAvance = Math.ceil(9.5 * lMedia * 2.0 + (altMedia - 1.5) * (anchoMedia * lMedia) * 2.0);
  document.getElementById("res_avance").innerText = `${totalAvance} Tn`;
  updateGlobal();
}

function calcRebaje() {
  const lI = getVal("re_lI"), lD = getVal("re_lD");
  let lMedia = (lI + lD) / ((lI > 0 ? 1 : 0) + (lD > 0 ? 1 : 0) || 1);
  
  let hSum = 0, hm = 0;
  ["re_h1", "re_h2", "re_h3", "re_h4", "re_h5", "re_h6"].forEach((id) => {
    let v = getVal(id); if (v > 0) { hSum += v; hm++; }
  });
  let altMedia = hm === 0 ? 2.0 : hSum / hm;
  
  let aSum = 0, am = 0;
  ["re_a1", "re_a2", "re_a3"].forEach((id) => {
    let v = getVal(id); if (v > 0) { aSum += v; am++; }
  });
  let anchoMedia = am === 0 ? 8.0 : aSum / am;
  
  totalRebaje = Math.ceil(lMedia * anchoMedia * altMedia * currentDensity);
  document.getElementById("res_rebaje").innerText = `${totalRebaje} Tn`;
  updateGlobal();
}

function calcRecorte() {
  totalRecorte = Math.ceil(getVal("rec_anch") * getVal("rec_lng") * getVal("rec_alt"));
  document.getElementById("res_recorte").innerText = `${totalRecorte} Tn`;
  updateGlobal();
}

// Control de densidad
function setDensity(val, btnId) {
  currentDensity = val;
  document.querySelectorAll(".mat-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(btnId).classList.add("active");
  calcRebaje();
}

// --- ESCUCHADORES DE EVENTOS UNIFICADOS ---
document.querySelectorAll(".kb-input").forEach(input => {
  // 1. Recalcular los datos en tiempo real al escribir
  input.addEventListener("input", () => {
    const id = input.getAttribute("data-id");
    if (id.startsWith("av")) calcAvance();
    if (id.startsWith("re")) calcRebaje();
    if (id.startsWith("rec")) calcRecorte();
  });

  // 2. Selección automática de todo el texto al hacer clic o usar TAB
  input.addEventListener("focus", () => {
    setTimeout(() => {
      input.select();
    }, 50);
  });
});

// Lanzar los cálculos al iniciar el archivo
calcAvance(); calcRebaje(); calcRecorte();