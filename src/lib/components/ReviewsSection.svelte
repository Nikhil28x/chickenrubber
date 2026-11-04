<script lang="ts">
  import type { Review } from '../types';

  // Approved customer reviews, plus the form for sending a new one.
  let { reviews }: { reviews: Review[] } = $props();

  const CARD_SECONDS = 8;
  const MIN_CARDS = 8;

  let formOpen = $state(false);
  let sending = $state(false);
  let sent = $state(false);
  let errorMessage = $state('');
  let form = $state({
    customer_name: '',
    mobile: '',
    location: '',
    rating: 0,
    comment: '',
    website: ''
  });

  // Scrolling only looks right with a few reviews; one or two simply sit still.
  const scrolling = $derived(reviews.length >= 3);
  // Repeat until the row is wider than any screen, then double it for a seamless loop.
  const loop = $derived.by(() => {
    if (!scrolling) return reviews;
    const row = [...reviews];
    while (row.length < MIN_CARDS) row.push(...reviews);
    return [...row, ...row];
  });
  const seconds = $derived((loop.length / 2) * CARD_SECONDS);

  function stars(rating: number) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    errorMessage = '';
    if (!form.rating) {
      errorMessage = 'Please choose a star rating';
      return;
    }
    sending = true;
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      sent = true;
    } catch (error) {
      errorMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Could not send your review. Please try again.';
    } finally {
      sending = false;
    }
  }
</script>

<section class="section reviews-section" id="reviews">
  <div class="container">
    <div class="section-heading centered">
      <h2>{reviews.length ? 'What our customers say' : 'Bought from us before?'}</h2>
    </div>
  </div>

  {#if reviews.length}
    <div class="reviews-window" class:scrolling>
      <ul class="reviews-track" style={`--seconds: ${seconds}s`}>
        {#each loop as review, index}
          <li
            class="review-card"
            class:copy={index >= reviews.length}
            aria-hidden={index >= reviews.length}
          >
            <span class="review-stars" role="img" aria-label={`${review.rating} out of 5 stars`}
              >{stars(review.rating)}</span
            >
            <p>{review.comment}</p>
            <footer>
              <strong>{review.customer_name}</strong>
              {#if review.location}<small>{review.location}</small>{/if}
            </footer>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="container review-compose">
    {#if sent}
      <p class="review-thanks" role="status">
        Thank you, {form.customer_name}! Your review will appear here after we check it.
      </p>
    {:else if !formOpen}
      <button class="button primary" type="button" onclick={() => (formOpen = true)}
        >Leave a review</button
      >
    {:else}
      <form class="callback-card review-form" onsubmit={submit}>
        <div class="form-grid">
          <label class="full"
            ><span>Your name *</span><input
              bind:value={form.customer_name}
              required
              maxlength="80"
              autocomplete="name"
            /></label
          >
          <label
            ><span>Mobile number *</span><input
              bind:value={form.mobile}
              required
              type="tel"
              inputmode="numeric"
              pattern={'[0-9]{10}'}
              maxlength="10"
              autocomplete="tel-national"
              title="10-digit mobile number"
            /></label
          >
          <label
            ><span>Town / city</span><input
              bind:value={form.location}
              maxlength="80"
              autocomplete="address-level2"
            /></label
          >
          <fieldset class="full star-picker">
            <legend>Your rating *</legend>
            {#each [1, 2, 3, 4, 5] as value}
              <label class:on={form.rating >= value}>
                <input type="radio" name="review-rating" {value} bind:group={form.rating} />
                <span aria-hidden="true">★</span>
                <b>{value} star{value === 1 ? '' : 's'}</b>
              </label>
            {/each}
          </fieldset>
          <label class="full"
            ><span>Your review *</span><textarea
              bind:value={form.comment}
              required
              rows="3"
              maxlength="300"
              placeholder="What did you buy, and how has it worked for you?"></textarea></label
          >
          <label class="review-trap" aria-hidden="true"
            >Website<input bind:value={form.website} tabindex="-1" autocomplete="off" /></label
          >
        </div>
        {#if errorMessage}<p class="form-error" role="alert">{errorMessage}</p>{/if}
        <button class="button primary submit" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send review'}
        </button>
        <p class="privacy-note">
          We may show your name, town, rating and review on this website. Your mobile number is
          never shown; we only use it to check the review.
        </p>
      </form>
    {/if}
  </div>
</section>

<style>
  .reviews-window {
    display: flex;
    justify-content: center;
    overflow: hidden;
    padding: 4px 0 8px;
  }
  .reviews-window.scrolling {
    justify-content: flex-start;
  }
  .reviews-track {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
    margin: 0;
    padding: 0 var(--gutter);
    list-style: none;
  }
  .scrolling .reviews-track {
    flex-wrap: nowrap;
    justify-content: flex-start;
    width: max-content;
    padding: 0;
    animation: reviews-scroll var(--seconds) linear infinite;
  }
  .scrolling:hover .reviews-track {
    animation-play-state: paused;
  }
  @keyframes reviews-scroll {
    to {
      /* One full row plus half a gap, so the doubled row lines up exactly. */
      transform: translateX(calc(-50% - 8px));
    }
  }
  .review-card {
    display: flex;
    flex-direction: column;
    flex: none;
    width: min(320px, 82vw);
    gap: 10px;
    padding: 20px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .review-stars {
    color: var(--accent);
    font-size: 1.15rem;
    letter-spacing: 0.08em;
  }
  .review-card p {
    flex: 1;
    margin: 0;
    color: var(--ink);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .review-card footer {
    display: grid;
    gap: 1px;
  }
  .review-card small {
    color: var(--muted);
  }
  .review-compose {
    display: grid;
    justify-items: center;
    margin-top: 28px;
  }
  .review-thanks {
    margin: 0;
    color: var(--brand-deep);
    font-weight: 700;
    text-align: center;
  }
  .review-form {
    width: 100%;
    max-width: 760px;
  }
  .star-picker {
    display: flex;
    gap: 6px;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .star-picker legend {
    margin-bottom: 4px;
    padding: 0;
    color: var(--ink-soft);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .star-picker label {
    position: relative;
    display: grid;
    width: 48px;
    height: 48px;
    place-items: center;
    color: var(--line-strong);
    font-size: 2.1rem;
    line-height: 1;
    cursor: pointer;
  }
  .star-picker label.on {
    color: var(--accent);
  }
  .star-picker label > span {
    color: inherit;
    font-size: inherit;
    font-weight: 400;
    letter-spacing: 0;
  }
  .star-picker input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }
  .star-picker label:focus-within {
    border-radius: 8px;
    outline: 2px solid var(--brand);
  }
  .star-picker b {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .review-trap {
    position: absolute;
    left: -9999px;
  }
  @media (prefers-reduced-motion: reduce) {
    .scrolling {
      overflow-x: auto;
    }
    .scrolling .reviews-track {
      padding: 0 var(--gutter);
      animation: none;
    }
    .copy {
      display: none;
    }
  }
</style>
