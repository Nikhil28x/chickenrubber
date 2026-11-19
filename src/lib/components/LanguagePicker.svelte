<script lang="ts">
  import { LANGUAGES, type Lang } from '../i18n';

  // Language switcher. A native list, so phones show their own picker.
  let { lang, label, onchange }: { lang: Lang; label: string; onchange: (lang: Lang) => void } =
    $props();
</script>

<label class="lang-picker">
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    aria-hidden="true"
    ><circle cx="12" cy="12" r="9" /><path
      d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"
    /></svg
  >
  <select
    aria-label={label}
    value={lang}
    onchange={(event) => onchange(event.currentTarget.value as Lang)}
  >
    {#each LANGUAGES as language}
      <option value={language.code} lang={language.code}>{language.label}</option>
    {/each}
  </select>
  <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"
    ><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" /></svg
  >
</label>

<style>
  /* The list itself fills the pill, so a tap anywhere on it opens the list. */
  .lang-picker {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: 1.5px solid var(--line);
    border-radius: 999px;
    background: var(--white);
    color: var(--ink);
    box-shadow: var(--shadow-sm);
  }
  .lang-picker:hover {
    border-color: var(--brand);
  }
  .lang-picker:focus-within {
    border-color: var(--brand);
    box-shadow: 0 0 0 4px var(--focus-ring);
  }
  .lang-picker svg {
    position: absolute;
    left: 12px;
    color: var(--brand);
    pointer-events: none;
  }
  .lang-picker .chevron {
    left: auto;
    right: 12px;
    color: var(--muted);
  }
  select {
    min-height: 40px;
    padding: 0 32px 0 38px;
    border: 0;
    border-radius: 999px;
    outline: 0;
    appearance: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
  }
</style>
