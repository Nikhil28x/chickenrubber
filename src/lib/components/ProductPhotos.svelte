<script lang="ts">
  import type { Snippet } from 'svelte';
  import ShareButton from './ShareButton.svelte';

  // The photos and videos on a product card: swipe or use the arrows to see
  // them all, and tap one to open it full screen.
  let {
    media,
    name,
    eager = false,
    label,
    onopen,
    shareLink,
    shareText = name,
    children
  }: {
    media: { type: 'image' | 'video'; src: string }[];
    name: string;
    eager?: boolean;
    label: string;
    onopen: (index: number) => void;
    /** Link for sharing the photo or video at this position. */
    shareLink?: (index: number) => string;
    shareText?: string;
    children?: Snippet;
  } = $props();

  let strip = $state<HTMLDivElement>();
  let current = $state(0);

  const several = $derived(media.length > 1);

  function track() {
    if (strip) current = Math.round(strip.scrollLeft / strip.clientWidth);
  }

  function go(step: number) {
    if (!strip) return;
    current = (current + step + media.length) % media.length;
    strip.scrollTo({ left: current * strip.clientWidth, behavior: 'smooth' });
  }
</script>

<div class="product-image">
  <div class="photo-strip" bind:this={strip} onscroll={track}>
    {#each media as item, index}
      <button
        class="photo-slide"
        type="button"
        onclick={() => onopen(index)}
        aria-label={`Open ${item.type === 'video' ? 'video' : 'photo'} ${index + 1} of ${media.length} for ${name} full screen`}
      >
        {#if item.type === 'video'}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video src={item.src} muted playsinline preload="metadata" tabindex="-1"></video>
          <b class="photo-play" aria-hidden="true">▶</b>
        {:else}
          <img src={item.src} alt={name} loading={eager && index === 0 ? 'eager' : 'lazy'} />
        {/if}
      </button>
    {/each}
  </div>
  {@render children?.()}
  {#if shareLink && media[current]}
    <div class="photo-share">
      <ShareButton src={media[current].src} link={shareLink(current)} text={shareText} />
    </div>
  {/if}
  {#if several}
    <button
      class="photo-arrow prev"
      type="button"
      onclick={() => go(-1)}
      aria-label="Previous photo">‹</button
    >
    <button class="photo-arrow next" type="button" onclick={() => go(1)} aria-label="Next photo"
      >›</button
    >
    <span class="view-media" aria-hidden="true">{current + 1} / {media.length}</span>
  {:else if label}
    <span class="view-media" aria-hidden="true">{label}</span>
  {/if}
</div>

<style>
  .photo-strip {
    position: absolute;
    inset: 0;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .photo-strip::-webkit-scrollbar {
    display: none;
  }
  .photo-slide {
    position: relative;
    flex: 0 0 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }
  .photo-slide video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .photo-play {
    position: absolute;
    inset: 50% auto auto 50%;
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border-radius: 50%;
    background: var(--scrim);
    color: var(--white);
    transform: translate(-50%, -50%);
  }
  .photo-arrow {
    position: absolute;
    top: 50%;
    display: grid;
    width: 38px;
    height: 38px;
    place-items: center;
    padding: 0 0 3px;
    border: 0;
    border-radius: 50%;
    background: var(--white);
    box-shadow: var(--shadow-sm);
    color: var(--ink);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    transform: translateY(-50%);
  }
  .photo-arrow.prev {
    left: 8px;
  }
  .photo-share {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  .photo-arrow.next {
    right: 8px;
  }
  .photo-arrow:hover {
    background: var(--accent);
  }
  /* Phone cards are narrow and can be swiped, so the arrows cover less of the photo. */
  @media (max-width: 640px) {
    .photo-arrow {
      width: 32px;
      height: 32px;
      font-size: 1.3rem;
    }
    .photo-arrow.prev {
      left: 4px;
    }
    .photo-arrow.next {
      right: 4px;
    }
  }
</style>
