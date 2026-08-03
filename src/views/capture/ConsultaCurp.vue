<script setup>
// Ayuda de consulta de CURP en el portal oficial gob.mx.
// Incluye:
//  1) Botón para abrir gob.mx/curp en ventana nueva (camino confiable).
//  2) Un iframe embebido — gob.mx lo BLOQUEA (X-Frame-Options: SAMEORIGIN,
//     CSP frame-ancestors 'self'), así que normalmente saldrá vacío. Se deja a
//     propósito para evidenciar el bloqueo y evaluar alternativas.
import AppIcon from '../../components/ui/AppIcon.vue'

const URL_CURP = 'https://www.gob.mx/curp/'

function abrir() {
  window.open(URL_CURP, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="consulta-curp">
    <div class="consulta-curp__head">
      <div class="consulta-curp__intro">
        <h3 class="consulta-curp__title">Consultar CURP en gob.mx</h3>
        <p class="consulta-curp__desc">Si el ciudadano no tiene su CURP a la mano, búscala en el portal oficial y cópiala al formulario.</p>
      </div>
      <button class="c-btn c-btn--primary" type="button" @click="abrir">
        <AppIcon name="search" :size="18" />
        <span>Abrir en ventana nueva</span>
      </button>
    </div>

    <div class="c-alert c-alert--warning consulta-curp__nota">
      <AppIcon name="alert" :size="18" />
      <span>
        gob.mx no permite mostrarse embebido (bloqueo <code>X-Frame-Options</code> /
        <code>CSP frame-ancestors</code>). Si el recuadro de abajo aparece vacío, usa
        el botón «Abrir en ventana nueva».
      </span>
    </div>

    <div class="consulta-curp__frame">
      <iframe
        :src="URL_CURP"
        title="Consulta de CURP — gob.mx"
        loading="lazy"
        referrerpolicy="no-referrer"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.consulta-curp {
  margin-top: var(--spacing-3xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
}
.consulta-curp__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-lg);
}
.consulta-curp__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text-primary); }
.consulta-curp__desc { margin: var(--spacing-xs) 0 0; color: var(--text-tertiary); font-size: var(--font-size-sm); max-width: 60ch; }
.consulta-curp__nota { margin-bottom: var(--spacing-lg); }
.consulta-curp__nota code { font-family: var(--font-family-mono); font-size: 0.9em; }

.consulta-curp__frame {
  width: 100%;
  height: 560px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
}
.consulta-curp__frame iframe { width: 100%; height: 100%; border: 0; display: block; }
</style>
