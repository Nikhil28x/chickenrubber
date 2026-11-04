<script lang="ts">
  import { untrack } from 'svelte';
  // One photo or video slot in the admin. Picking a file uploads and saves it
  // straight away; there is no separate save step and no link to type.
  let {
    kind,
    id,
    field,
    src,
    label,
    video = false
  }: {
    kind: 'settings';
    id: number;
    field: string;
    src: string;
    label: string;
    video?: boolean;
  } = $props();

  const MAX_BYTES = 4 * 1024 * 1024;

  // Starts from the saved file, then follows uploads made in this tile.
  let current = $state(untrack(() => src));
  let status = $state<'idle' | 'uploading' | 'saved' | 'error'>('idle');
  let message = $state('');

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

  async function send(body: FormData) {
    status = 'uploading';
    message = '';
    try {
      body.set('kind', kind);
      body.set('id', String(id));
      body.set('field', field);
      const response = await fetch('/admin/media', { method: 'POST', body });
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
      current = result.url;
      status = 'saved';
    } catch (err) {
      status = 'error';
      message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
    }
  }

  async function choose(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    let file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!video) file = await shrinkPhoto(file);
    if (file.size > MAX_BYTES) {
      status = 'error';
      message = video
        ? 'This video is too large. Please use a clip under 4 MB.'
        : 'This photo is too large. Please choose a smaller photo.';
      return;
    }
    const body = new FormData();
    body.set('file', file);
    await send(body);
  }

  async function remove() {
    if (!confirm(`Remove ${label} from the website?`)) return;
    const body = new FormData();
    body.set('remove', '1');
    await send(body);
  }
</script>

<div class="media-tile">
  <label class="tile" class:empty={!current} class:busy={status === 'uploading'}>
    <input
      type="file"
      accept={video ? 'video/*' : 'image/*'}
      onchange={choose}
      disabled={status === 'uploading'}
    />
    {#if current}
      {#if video}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video src={current} muted playsinline preload="metadata"></video>
        <b class="play">▶</b>
      {:else}
        <img src={current} alt={label} />
      {/if}
      <span class="change">{status === 'uploading' ? 'Uploading…' : 'Tap to change'}</span>
    {:else}
      <span class="add"
        >{status === 'uploading' ? 'Uploading…' : video ? '+ Add video' : '+ Add photo'}</span
      >
    {/if}
  </label>
  <div class="tile-foot">
    <span class="tile-label">{label}</span>
    {#if status === 'saved'}<span class="tile-saved">Saved ✓</span>{/if}
    {#if current && status !== 'uploading'}
      <button type="button" class="tile-remove" onclick={remove}>Remove</button>
    {/if}
  </div>
  {#if status === 'error'}<p class="tile-error" role="alert">{message}</p>{/if}
</div>

<style>
  .media-tile {
    display: grid;
    min-width: 0;
    align-content: start;
    gap: 6px;
  }
  .tile {
    position: relative;
    display: grid;
    overflow: hidden;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--soft);
    cursor: pointer;
  }
  .tile.empty {
    border: 2px dashed var(--line-strong);
    background: var(--surface);
  }
  .tile.busy {
    opacity: 0.6;
    cursor: progress;
  }
  .tile input {
    position: absolute;
    inset: 0;
    z-index: 2;
    opacity: 0;
    cursor: inherit;
  }
  .tile img,
  .tile video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .play {
    position: absolute;
    inset: 50% auto auto 50%;
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border-radius: 50%;
    background: var(--scrim);
    color: var(--white);
    font-size: 0.7rem;
    transform: translate(-50%, -50%);
  }
  .change {
    position: absolute;
    right: 6px;
    bottom: 6px;
    left: 6px;
    padding: 4px 6px;
    border-radius: 8px;
    background: var(--scrim);
    color: var(--white);
    font-size: 0.7rem;
    font-weight: 700;
    text-align: center;
  }
  .add {
    padding: 8px;
    color: var(--brand);
    font-size: 0.85rem;
    font-weight: 800;
    text-align: center;
  }
  .tile-foot {
    display: flex;
    min-height: 22px;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 8px;
  }
  .tile-label {
    margin-right: auto;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .tile-saved {
    color: var(--success);
    font-size: 0.75rem;
    font-weight: 800;
  }
  .tile-remove {
    min-height: 28px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--danger);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }
  .tile-error {
    margin: 0;
    color: var(--danger);
    font-size: 0.75rem;
    line-height: 1.35;
  }
</style>
