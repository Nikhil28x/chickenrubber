<script lang="ts">
  import { untrack } from 'svelte';
  import type { ProductMedia } from '../types';

  // All photos and videos for one product. Add as many as you like; every
  // change saves straight away. The first photo is the main photo.
  let { productId, media }: { productId: number; media: ProductMedia[] } = $props();

  const MAX_BYTES = 4 * 1024 * 1024;

  let items = $state(untrack(() => [...media]));
  let busy = $state(false);
  let progress = $state('');
  let errors = $state<string[]>([]);
  let saved = $state(false);

  const mainPhotoId = $derived(items.find((item) => item.kind === 'image')?.id);
  const countLabel = $derived.by(() => {
    const photos = items.filter((item) => item.kind === 'image').length;
    const videos = items.length - photos;
    return `${photos} photo${photos === 1 ? '' : 's'} · ${videos} video${videos === 1 ? '' : 's'}`;
  });

  async function shrinkPhoto(file: File) {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.82)
      );
      if (blob && blob.size < file.size) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
          type: 'image/jpeg'
        });
      }
    } catch {
      // The browser cannot read this format; send the original instead.
    }
    return file;
  }

  async function post(body: FormData) {
    const response = await fetch('/admin/product-media', { method: 'POST', body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        result.error ||
          result.message ||
          (response.status === 413
            ? 'This file is too large. Please use one under 4 MB.'
            : 'Upload failed. Please try again.')
      );
    }
    return result;
  }

  async function add(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;

    busy = true;
    saved = false;
    errors = [];
    for (const [index, original] of files.entries()) {
      progress = `Uploading ${index + 1} of ${files.length}…`;
      const isVideo = original.type.startsWith('video/');
      const file = isVideo ? original : await shrinkPhoto(original);
      try {
        if (file.size > MAX_BYTES) {
          throw new Error(
            isVideo
              ? 'This video is too large. Please use a clip under 4 MB.'
              : 'This photo is too large. Please choose a smaller photo.'
          );
        }
        const body = new FormData();
        body.set('action', 'add');
        body.set('product_id', String(productId));
        body.set('file', file);
        items = [...items, await post(body)];
      } catch (err) {
        errors = [
          ...errors,
          `${original.name}: ${err instanceof Error ? err.message : 'Upload failed.'}`
        ];
      }
    }
    busy = false;
    progress = '';
    saved = errors.length < files.length;
  }

  async function change(item: ProductMedia, action: 'remove' | 'main') {
    busy = true;
    saved = false;
    errors = [];
    try {
      const body = new FormData();
      body.set('action', action);
      body.set('id', String(item.id));
      await post(body);
      items =
        action === 'remove'
          ? items.filter((other) => other.id !== item.id)
          : [item, ...items.filter((other) => other.id !== item.id)];
      saved = true;
    } catch (err) {
      errors = [err instanceof Error ? err.message : 'Could not save. Please try again.'];
    }
    busy = false;
  }
</script>

<div class="gallery">
  <div class="gallery-grid">
    {#each items as item (item.id)}
      <div class="gallery-item">
        <div class="thumb">
          {#if item.kind === 'video'}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video src={item.url} muted playsinline preload="metadata"></video>
            <b class="play">▶</b>
          {:else}
            <img src={item.url} alt="" />
          {/if}
          {#if item.id === mainPhotoId}<span class="main-badge">Main photo</span>{/if}
        </div>
        <div class="item-actions">
          {#if item.kind === 'image' && item.id !== mainPhotoId}
            <button type="button" disabled={busy} onclick={() => change(item, 'main')}
              >Make main</button
            >
          {/if}
          <button
            type="button"
            class="remove"
            disabled={busy}
            onclick={() => change(item, 'remove')}>Remove</button
          >
        </div>
      </div>
    {/each}
    <label class="add-tile" class:busy>
      <input type="file" accept="image/*,video/*" multiple onchange={add} disabled={busy} />
      <span>{busy && progress ? progress : '+ Add photos or videos'}</span>
    </label>
  </div>
  <div class="gallery-status" aria-live="polite">
    {#if saved && !busy}<span class="saved">Saved ✓</span>{/if}
    <span class="count">{countLabel}</span>
  </div>
  {#each errors as message}<p class="gallery-error" role="alert">{message}</p>{/each}
</div>

<style>
  .gallery {
    display: grid;
    gap: 8px;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }
  .gallery-item {
    display: grid;
    min-width: 0;
    align-content: start;
    gap: 4px;
  }
  .thumb {
    position: relative;
    overflow: hidden;
    aspect-ratio: 1;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--soft);
  }
  .thumb img,
  .thumb video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .play {
    position: absolute;
    inset: 50% auto auto 50%;
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border-radius: 50%;
    background: var(--scrim);
    color: var(--white);
    font-size: 0.65rem;
    transform: translate(-50%, -50%);
  }
  .main-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--brand);
    color: var(--white);
    font-size: 0.62rem;
    font-weight: 800;
  }
  .item-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px;
  }
  .item-actions button {
    min-height: 28px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--brand);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }
  .item-actions .remove {
    margin-left: auto;
    color: var(--danger);
  }
  .item-actions button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .add-tile {
    position: relative;
    display: grid;
    aspect-ratio: 1;
    place-items: center;
    padding: 8px;
    border: 2px dashed var(--line-strong);
    border-radius: 12px;
    background: var(--surface);
    color: var(--brand);
    font-size: 0.82rem;
    font-weight: 800;
    text-align: center;
    cursor: pointer;
  }
  .add-tile.busy {
    color: var(--muted);
    cursor: progress;
  }
  .add-tile input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: inherit;
  }
  .gallery-status {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.78rem;
  }
  .saved {
    color: var(--success);
    font-weight: 800;
  }
  .count {
    margin-left: auto;
    color: var(--muted);
  }
  .gallery-error {
    margin: 0;
    color: var(--danger);
    font-size: 0.78rem;
  }
</style>
