<script lang="ts">
  import Icon from './Icon.svelte';

  // A Share button for one photo or video. It opens a small panel with
  // WhatsApp, Facebook, Instagram and Copy link.
  //  - WhatsApp and Facebook share a link to this photo or video on our site;
  //    the link preview shows the photo.
  //  - Instagram has no web share link, so on phones we hand the photo or video
  //    file itself to the phone's share menu, where Instagram is listed. On
  //    computers we copy the link instead.
  let {
    src,
    link,
    text,
    variant = 'overlay',
    showLabel = false
  }: {
    src: string;
    /** Page link to share, such as /?product=3&media=1 or /#videos. */
    link: string;
    text: string;
    variant?: 'overlay' | 'dark' | 'light';
    showLabel?: boolean;
  } = $props();

  // Bigger files take too long to send through the phone's share menu.
  const MAX_FILE_BYTES = 15 * 1024 * 1024;

  let dialog = $state<HTMLDialogElement>();
  let file = $state<File | null>(null);
  let message = $state('');
  let canShareNatively = $state(false);

  function absolute(path: string) {
    return new URL(path, location.origin).href;
  }

  function open(event: MouseEvent) {
    event.stopPropagation();
    message = '';
    canShareNatively = typeof navigator.share === 'function';
    dialog?.showModal();
    // Fetch the file now so it is ready when Instagram is tapped. Phones only
    // allow the share menu straight after a tap, not after a slow download.
    if (!file && typeof navigator.canShare === 'function') prepareFile();
  }

  async function prepareFile() {
    try {
      const response = await fetch(src);
      if (!response.ok) return;
      const blob = await response.blob();
      if (blob.size > MAX_FILE_BYTES) return;
      const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const ready = new File([blob], `raghav-kitchen-equipments.${extension}`, {
        type: blob.type
      });
      if (navigator.canShare?.({ files: [ready] })) file = ready;
    } catch {
      // Sharing the link still works.
    }
  }

  function close() {
    dialog?.close();
  }

  function popup(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer,width=640,height=560');
    close();
  }

  function whatsapp() {
    popup(`https://wa.me/?text=${encodeURIComponent(`${text}\n${absolute(link)}`)}`);
  }

  function facebook() {
    popup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absolute(link))}`);
  }

  async function instagram() {
    if (file) {
      try {
        await navigator.share({ files: [file], title: text });
        close();
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    await copy('Link copied. Open Instagram and paste it into a message or your story.');
  }

  async function more() {
    try {
      await navigator.share({ title: text, text, url: absolute(link) });
      close();
    } catch {
      // Closed without sharing.
    }
  }

  async function copy(done = 'Link copied.') {
    try {
      await navigator.clipboard.writeText(absolute(link));
      message = done;
    } catch {
      message = `Copy this link: ${absolute(link)}`;
    }
  }

  function backdrop(event: MouseEvent) {
    if (event.target === dialog) close();
  }
</script>

<button
  class={`share-button ${variant}`}
  class:labelled={showLabel}
  type="button"
  onclick={open}
  aria-label="Share"
  ><Icon name="share" size={showLabel ? 17 : 18} />{#if showLabel}Share{/if}</button
>

<dialog
  bind:this={dialog}
  class="share-sheet"
  onclick={backdrop}
  onkeydown={(event) => event.stopPropagation()}
  aria-label="Share"
>
  <div class="sheet-inner">
    <div class="sheet-head">
      <strong>Share</strong>
      <button class="sheet-close" type="button" onclick={close} aria-label="Close">×</button>
    </div>
    <div class="sheet-options">
      <button type="button" class="opt whatsapp" onclick={whatsapp}
        ><span><Icon name="whatsapp" size={24} /></span>WhatsApp</button
      >
      <button type="button" class="opt facebook" onclick={facebook}
        ><span><Icon name="facebook" size={24} /></span>Facebook</button
      >
      <button type="button" class="opt instagram" onclick={instagram}
        ><span><Icon name="instagram" size={22} /></span>Instagram</button
      >
      <button type="button" class="opt copy" onclick={() => copy()}
        ><span><Icon name="link" size={22} /></span>Copy link</button
      >
    </div>
    {#if canShareNatively}
      <button type="button" class="sheet-more" onclick={more}>More apps…</button>
    {/if}
    <p class="sheet-message" aria-live="polite">{message}</p>
  </div>
</dialog>

<style>
  .share-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 38px;
    height: 38px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .share-button.labelled {
    width: auto;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 0.85rem;
  }
  .share-button.overlay {
    background: var(--white);
    box-shadow: var(--shadow-sm);
    color: var(--ink);
  }
  .share-button.overlay:hover {
    background: var(--accent);
  }
  .share-button.dark {
    border: 1px solid var(--on-dark-line);
    background: transparent;
    color: var(--white);
  }
  .share-button.dark:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  .share-button.light {
    border: 1px solid var(--line);
    background: var(--white);
    color: var(--ink);
  }

  .share-sheet {
    width: min(380px, calc(100% - 32px));
    padding: 0;
    border: 0;
    border-radius: 18px;
    background: var(--white);
    color: var(--ink);
    box-shadow: var(--shadow);
  }
  .share-sheet::backdrop {
    background: rgba(20, 24, 21, 0.55);
  }
  .sheet-inner {
    display: grid;
    gap: 14px;
    padding: 16px 18px 18px;
  }
  .sheet-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sheet-head strong {
    font-size: 1.05rem;
  }
  .sheet-close {
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: var(--surface);
    color: var(--ink);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
  }
  .sheet-options {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .opt {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: 0.74rem;
    font-weight: 700;
    cursor: pointer;
  }
  .opt span {
    display: grid;
    width: 52px;
    height: 52px;
    place-items: center;
    border-radius: 50%;
    color: #fff;
    transition: transform 150ms ease;
  }
  .opt:hover span {
    transform: scale(1.07);
  }
  .whatsapp span {
    background: #25d366;
  }
  .facebook span {
    background: #1877f2;
  }
  .instagram span {
    background: linear-gradient(45deg, #f9a825, #e1306c 50%, #833ab4);
  }
  .copy span {
    background: var(--brand);
  }
  .sheet-more {
    min-height: 42px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .sheet-message {
    min-height: 1em;
    margin: 0;
    color: var(--brand);
    font-size: 0.82rem;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .sheet-message:empty {
    display: none;
  }
  /* On phones the panel rises from the bottom of the screen. */
  @media (max-width: 640px) {
    .share-sheet {
      width: 100%;
      max-width: none;
      margin: auto 0 0;
      border-radius: 20px 20px 0 0;
    }
    .sheet-inner {
      padding-bottom: calc(18px + env(safe-area-inset-bottom));
    }
  }
</style>
