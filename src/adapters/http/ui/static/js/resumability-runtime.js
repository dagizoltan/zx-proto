// src/adapters/http/ui/static/js/resumability-runtime.js

export const hydrate = () => {
  const stateElement = document.getElementById('__RESUMABLE_STATE__');
  if (stateElement) {
    try {
      const state = JSON.parse(stateElement.textContent);
      console.log('💧 Resumability hydrated state:', state);
      // In a real framework (like Qwik), this would re-attach listeners
      // For this demo, we just log it to show the data was transferred.
      window.__APP_STATE__ = state;
    } catch (e) {
      console.error('Hydration failed', e);
    }
  }
};
