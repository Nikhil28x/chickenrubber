<script lang="ts">
  import Logo from '../../lib/components/Logo.svelte';
  import MediaTile from '../../lib/components/MediaTile.svelte';
  import ProductGallery from '../../lib/components/ProductGallery.svelte';
  import { untrack } from 'svelte';
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
  // Forms post without JS enhancement, so reopen the tab that was just saved.
  let activeTab = $state<'orders' | 'products' | 'reviews' | 'settings'>(
    untrack(() => (form && 'tab' in form && form.tab ? form.tab : 'orders'))
  );

  const waitingReviews = $derived(data.reviews.filter((review) => !review.is_approved).length);

  function money(value: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  function dateTime(value: string) {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    }).format(new Date(value));
  }

  const statusLabels: Record<string, string> = {
    confirmed: 'New',
    processing: 'Called',
    shipped: 'Quoted',
    delivered: 'Completed',
    cancelled: 'Not interested'
  };

  function address(order: Record<string, unknown>) {
    return [
      order.shop_name,
      order.locality,
      order.road,
      order.landmark && `Near ${order.landmark}`,
      order.city,
      order.district,
      order.state,
      order.pincode
    ]
      .filter(Boolean)
      .join(', ');
  }
</script>

{#snippet ratingField(rating: number)}
  <label class="admin-field"
    ><span>Stars</span><select name="rating" value={rating}>
      {#each [5, 4, 3, 2, 1] as stars}
        <option value={stars}>{'★'.repeat(stars)} ({stars})</option>
      {/each}
    </select></label
  >
{/snippet}

<svelte:head><title>Store admin | Raghav Kitchen Equipments</title></svelte:head>

<header class="admin-topbar">
  <Logo href="/admin" tagline="Store admin" />
  <div>
    <a href="/" target="_blank">View website ↗</a>
    <form method="POST" action="?/logout"><button type="submit">Log out</button></form>
  </div>
</header>

<main class="admin-shell">
  <section class="admin-intro">
    <div>
      <p class="eyebrow-text">Store dashboard</p>
      <h1>Good to see you.</h1>
      <p>Manage callback requests, product frames and business details from one place.</p>
    </div>
    <div class="admin-stats">
      <article><span>Total requests</span><strong>{data.stats.total_orders}</strong></article>
      <article><span>To call back</span><strong>{data.stats.open_orders}</strong></article>
      <article>
        <span>Live frames</span><strong>{data.stats.live_frames} / {data.frames.length}</strong>
      </article>
    </div>
  </section>

  {#if form?.success}<div class="admin-notice success">✓ {form.success}</div>{/if}
  {#if form?.error}<div class="admin-notice error">{form.error}</div>{/if}

  <nav class="admin-tabs" aria-label="Admin sections">
    <button class:active={activeTab === 'orders'} onclick={() => (activeTab = 'orders')}
      >Callback requests <span>{data.orders.length}</span></button
    >
    <button class:active={activeTab === 'products'} onclick={() => (activeTab = 'products')}
      >Product frames <span>{data.frames.length}</span></button
    >
    <button class:active={activeTab === 'reviews'} onclick={() => (activeTab = 'reviews')}
      >Reviews {#if waitingReviews}<span class="tab-new">{waitingReviews} new</span>{/if}</button
    >
    <button class:active={activeTab === 'settings'} onclick={() => (activeTab = 'settings')}
      >Business details</button
    >
  </nav>

  {#if activeTab === 'orders'}
    <section class="admin-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow-text">Latest first</p>
          <h2>Callback requests</h2>
        </div>
        <p>Up to 100 recent requests are shown. Call the customer, then update the status.</p>
      </div>
      {#if data.orders.length}
        <div class="orders-list">
          {#each data.orders as order}
            <article class="order-card">
              <div class="order-card-head">
                <div>
                  <span>Request #{order.order_number}</span><strong>{order.customer_name}</strong
                  ><small>{dateTime(order.created_at)}</small>
                </div>
                <b class={`status ${order.status}`}>{statusLabels[order.status] ?? order.status}</b>
              </div>
              <div class="order-details">
                <div>
                  <span>Mobile</span><a href={`tel:${order.mobile_primary}`}
                    >{order.mobile_primary}</a
                  >
                </div>
                <div>
                  <span>Alternate</span>{#if order.mobile_secondary}<a
                      href={`tel:${order.mobile_secondary}`}>{order.mobile_secondary}</a
                    >{:else}<strong>—</strong>{/if}
                </div>
                <div>
                  <span>Interested in</span><strong
                    >{order.items.map((item: { name: string }) => item.name).join(', ') ||
                      'Not specified'}</strong
                  >
                </div>
              </div>
              <div class="order-address">
                <span>Location</span>
                <p>{address(order) || '—'}</p>
              </div>
              {#if order.message}
                <div class="order-address order-message">
                  <span>Message</span>
                  <p>{order.message}</p>
                </div>
              {/if}
              {#if order.payment_method !== 'callback'}
                <div class="order-items">
                  <span>Older online order · {order.payment_method.toUpperCase()}</span>
                  {#if order.total}<span>{money(order.total)}</span>{/if}
                </div>
              {/if}
              <form method="POST" action="?/updateOrder" class="status-form">
                <input type="hidden" name="id" value={order.id} />
                <label class="admin-field"
                  ><span>Status</span><select name="status" value={order.status}>
                    {#each Object.entries(statusLabels) as [value, label]}
                      <option {value}>{label}</option>
                    {/each}
                  </select></label
                >
                <button class="button primary" type="submit">Update</button>
                <a
                  class="button whatsapp"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/91${order.mobile_primary}?text=${encodeURIComponent(`Hello ${order.customer_name}, this is Raghav Kitchen Equipments regarding your callback request #${order.order_number}. `)}`}
                  >WhatsApp customer</a
                >
              </form>
            </article>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <span>◎</span>
          <h3>No requests yet</h3>
          <p>New callback requests from the website will appear here.</p>
        </div>
      {/if}
    </section>
  {:else if activeTab === 'products'}
    <section class="admin-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow-text">Website product section</p>
          <h2>Product frames</h2>
        </div>
        <p>
          Each frame is a row of four products. Switch a frame on to show it on the website, below
          the frames already live.
        </p>
      </div>

      <div class="frames-list">
        {#each data.frames as frame, frameIndex}
          <details class="frame-admin" class:live={frame.is_active} open={frameIndex === 0}>
            <summary>
              <span class="frame-index">{String(frameIndex + 1).padStart(2, '0')}</span>
              <span class="frame-summary"
                ><strong>{frame.title}</strong><small
                  >{frame.products.length} products · order {frame.sort_order}</small
                ></span
              >
              <b class="frame-state">{frame.is_active ? 'Live' : 'Hidden'}</b>
            </summary>

            <form method="POST" action="?/updateFrame" class="frame-settings">
              <input type="hidden" name="id" value={frame.id} />
              <label class="admin-field"
                ><span>Frame title</span><input name="title" value={frame.title} required /></label
              >
              <label class="admin-field"
                ><span>Short line under the title</span><input
                  name="subtitle"
                  value={frame.subtitle}
                /></label
              >
              <label class="admin-field order-field"
                ><span>Position</span><input
                  name="sort_order"
                  type="number"
                  step="1"
                  value={frame.sort_order}
                /></label
              >
              <label class="toggle switch"
                ><input type="checkbox" name="is_active" checked={frame.is_active} /><span
                  >Show this frame on website</span
                ></label
              >
              <button class="button primary" type="submit">Save frame</button>
            </form>

            <div class="admin-product-grid">
              {#each frame.products as product}
                <div class="edit-product">
                  <ProductGallery productId={product.id} media={product.media} />
                  <p class="upload-help">
                    Tap a box to add or change a photo. It saves straight away.
                  </p>
                  <form method="POST" action="?/updateProduct" class="product-details">
                    <input type="hidden" name="id" value={product.id} />
                    <label class="admin-field"
                      ><span>Product name</span><input
                        name="name"
                        value={product.name}
                        required
                      /></label
                    >
                    <label class="admin-field"
                      ><span>Short description</span><textarea name="description" rows="2"
                        >{product.description}</textarea
                      ></label
                    >
                    <div class="two-fields">
                      <label class="admin-field"
                        ><span>Price ₹ (0 = ask price)</span><input
                          name="price"
                          type="number"
                          min="0"
                          step="1"
                          value={product.price}
                          required
                        /></label
                      >
                      <label class="admin-field"
                        ><span>Quantity</span><input
                          name="stock"
                          type="number"
                          min="0"
                          step="1"
                          value={product.stock}
                          required
                        /></label
                      >
                    </div>
                    <input type="hidden" name="sort_order" value={product.sort_order} />
                    <label class="toggle"
                      ><input type="checkbox" name="is_active" checked={product.is_active} /><span
                        >Show this product</span
                      ></label
                    >
                    <button class="button primary" type="submit">Save product</button>
                  </form>
                </div>
              {/each}
            </div>
          </details>
        {/each}
      </div>

      <form method="POST" action="?/addFrame" class="add-frame">
        <div>
          <h3>Add a new frame</h3>
          <p>Creates a hidden frame with four product slots for you to fill in.</p>
        </div>
        <label class="admin-field"
          ><span>Frame title</span><input
            name="title"
            placeholder="e.g. Vegetable cutting machines"
            required
          /></label
        >
        <button class="button primary" type="submit">Add frame</button>
      </form>
    </section>
  {:else if activeTab === 'reviews'}
    <section class="admin-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow-text">Shown on the website after you approve</p>
          <h2>Customer reviews</h2>
        </div>
        <p>
          Check each review before showing it. Mobile numbers are for your checks and are never
          shown.
        </p>
      </div>

      <form method="POST" action="?/addReview" class="review-admin add-review">
        <h3>Add a review from a customer</h3>
        <p class="upload-help">
          Only add what a real customer told you, such as a WhatsApp message or a Google review, and
          ask them before using their name.
        </p>
        <div class="settings-grid">
          <label class="admin-field"
            ><span>Customer name</span><input name="customer_name" maxlength="80" required /></label
          >
          <label class="admin-field"
            ><span>Town / city</span><input name="location" maxlength="80" /></label
          >
          {@render ratingField(5)}
          <label class="admin-field full"
            ><span>Review</span><textarea name="comment" rows="3" maxlength="300" required
            ></textarea></label
          >
        </div>
        <button class="button primary" type="submit">Add to website</button>
      </form>

      <div class="orders-list">
        {#each data.reviews as review (review.id)}
          <form method="POST" action="?/updateReview" class="review-admin">
            <input type="hidden" name="id" value={review.id} />
            <div class="review-admin-head">
              <span class="review-state" class:live={review.is_approved}
                >{review.is_approved ? 'On website' : 'Waiting for approval'}</span
              >
              <small>
                {review.source === 'website' ? 'Sent from website' : 'Added by you'} ·
                {dateTime(review.created_at)}
                {#if review.mobile}
                  · <a href={`tel:${review.mobile}`}>{review.mobile}</a>
                {/if}
              </small>
            </div>
            <div class="settings-grid">
              <label class="admin-field"
                ><span>Customer name</span><input
                  name="customer_name"
                  value={review.customer_name}
                  maxlength="80"
                  required
                /></label
              >
              <label class="admin-field"
                ><span>Town / city</span><input
                  name="location"
                  value={review.location}
                  maxlength="80"
                /></label
              >
              {@render ratingField(review.rating)}
              <label class="admin-field full"
                ><span>Review</span><textarea name="comment" rows="3" maxlength="300" required
                  >{review.comment}</textarea
                ></label
              >
            </div>
            <div class="review-admin-actions">
              <button
                class="button"
                class:primary={review.is_approved}
                type="submit"
                name="show"
                value={review.is_approved ? '1' : '0'}>Save</button
              >
              <button
                class="button"
                class:primary={!review.is_approved}
                type="submit"
                name="show"
                value={review.is_approved ? '0' : '1'}
                >{review.is_approved ? 'Hide from website' : 'Approve and show'}</button
              >
              <button
                class="review-delete"
                type="submit"
                formaction="?/deleteReview"
                formnovalidate
                onclick={(event) => {
                  if (!confirm('Delete this review?')) event.preventDefault();
                }}>Delete</button
              >
            </div>
          </form>
        {:else}
          <div class="empty-state">
            <h3>No reviews yet</h3>
            <p>Reviews customers send from the website will wait here for your approval.</p>
          </div>
        {/each}
      </div>
    </section>
  {:else}
    <section class="admin-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow-text">Website contact & media</p>
          <h2>Business details</h2>
        </div>
        <p>Update the phone numbers, email, address, hero image and the two videos.</p>
      </div>
      <form method="POST" action="?/updateSettings" class="settings-form">
        <div class="settings-block">
          <h3>Contact details</h3>
          <div class="settings-grid">
            <label class="admin-field full"
              ><span>Business name</span><input
                name="business_name"
                value={data.settings.business_name}
                required
              /></label
            >
            <label class="admin-field"
              ><span>Main mobile</span><input
                name="phone"
                value={data.settings.phone}
                required
              /></label
            >
            <label class="admin-field"
              ><span>Second mobile</span><input
                name="secondary_phone"
                value={data.settings.secondary_phone}
              /></label
            >
            <label class="admin-field"
              ><span>WhatsApp number</span><input
                name="whatsapp"
                value={data.settings.whatsapp}
                required
              /></label
            >
            <label class="admin-field"
              ><span>Email</span><input
                name="email"
                type="email"
                value={data.settings.email}
                required
              /></label
            >
            <label class="admin-field full"
              ><span>Shop address (shown in the top bar and footer)</span><input
                name="address"
                value={data.settings.address}
                placeholder="Door no, street, area, city - PIN"
              /></label
            >
          </div>
        </div>
        <button class="button primary settings-save" type="submit">Save business details</button>
      </form>
      <div class="settings-block settings-media">
        <h3>Hero image & videos</h3>
        <p class="upload-help">Tap a box to add or change it. It saves straight away.</p>
        <div class="product-media-admin">
          <MediaTile
            kind="settings"
            id={1}
            field="hero_image_url"
            src={data.settings.hero_image_url}
            label="Hero background"
          />
          <MediaTile
            kind="settings"
            id={1}
            field="video_1_url"
            src={data.settings.video_1_url}
            label="Video 1"
            video
          />
          <MediaTile
            kind="settings"
            id={1}
            field="video_2_url"
            src={data.settings.video_2_url}
            label="Video 2"
            video
          />
        </div>
      </div>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    background: var(--paper);
  }
  .admin-topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    min-height: 72px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 11px max(18px, calc((100vw - 1220px) / 2));
    border-bottom: 1px solid var(--line);
    background: var(--header-bg);
    backdrop-filter: blur(16px);
  }
  .admin-topbar > div {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .admin-topbar > div > a {
    color: var(--blue);
    font-size: 0.78rem;
    font-weight: 800;
  }
  .admin-topbar form button {
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 0.78rem;
    cursor: pointer;
  }
  .admin-shell {
    max-width: 1220px;
    margin: 0 auto;
    padding: 36px 18px 80px;
  }
  .admin-intro {
    display: grid;
    gap: 24px;
    margin-bottom: 28px;
  }
  .admin-intro h1 {
    margin: 8px 0;
    color: var(--navy);
    font-size: clamp(2.7rem, 8vw, 5rem);
    line-height: 0.95;
    letter-spacing: -0.065em;
  }
  .admin-intro > div:first-child > p:last-child {
    color: var(--muted);
  }
  .admin-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .admin-stats article {
    display: grid;
    gap: 7px;
    padding: 15px;
    border: 1px solid var(--line);
    border-radius: 15px;
    background: var(--white);
  }
  .admin-stats span {
    color: var(--muted);
    font-size: 0.67rem;
    font-weight: 750;
  }
  .admin-stats strong {
    color: var(--navy);
    font-size: clamp(1.1rem, 4vw, 1.7rem);
    letter-spacing: -0.03em;
  }
  .admin-notice {
    margin-bottom: 16px;
    padding: 12px 15px;
    border-radius: 12px;
    font-size: 0.84rem;
    font-weight: 750;
  }
  .admin-notice.success {
    background: var(--success-tint);
    color: var(--success);
  }
  .admin-notice.error {
    background: var(--danger-tint);
    color: var(--danger);
  }
  .admin-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 14px;
    padding: 5px;
    border: 1px solid var(--line);
    border-radius: 15px;
    background: var(--white);
  }
  .admin-tabs button {
    display: flex;
    flex: 0 0 auto;
    min-height: 43px;
    align-items: center;
    gap: 7px;
    padding: 9px 15px;
    border: 0;
    border-radius: 11px;
    background: transparent;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 800;
    cursor: pointer;
  }
  .admin-tabs button.active {
    background: var(--blue);
    color: var(--white);
  }
  .admin-tabs span {
    display: grid;
    min-width: 21px;
    height: 21px;
    padding: 0 6px;
    place-items: center;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.2);
    font-size: 0.65rem;
  }
  .admin-tabs .tab-new {
    background: var(--cod);
    color: var(--cod-ink);
  }
  .admin-panel {
    padding: 22px 16px;
    border: 1px solid var(--line);
    border-radius: 21px;
    background: var(--white);
  }
  .panel-heading {
    display: grid;
    gap: 8px;
    margin-bottom: 22px;
  }
  .panel-heading h2 {
    margin: 6px 0 0;
    color: var(--navy);
    font-size: clamp(1.8rem, 6vw, 3rem);
    letter-spacing: -0.05em;
  }
  .panel-heading > p {
    color: var(--muted);
    font-size: 0.82rem;
  }
  .orders-list {
    display: grid;
    gap: 12px;
  }
  .order-card {
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--surface);
  }
  .order-card-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .order-card-head > div {
    display: grid;
    gap: 4px;
  }
  .order-card-head span {
    color: var(--blue);
    font-size: 0.7rem;
    font-weight: 850;
  }
  .order-card-head strong {
    color: var(--navy);
    font-size: 1.05rem;
  }
  .order-card-head small {
    color: var(--muted);
  }
  .status {
    height: fit-content;
    padding: 6px 9px;
    border-radius: 999px;
    background: var(--line);
    color: var(--ink);
    font-size: 0.62rem;
    text-transform: uppercase;
  }
  .status.confirmed {
    background: var(--accent-tint);
    color: var(--accent-ink);
  }
  .status.processing {
    background: var(--brand-tint);
    color: var(--brand);
  }
  .status.shipped {
    background: var(--soft);
    color: var(--ink);
  }
  .status.delivered {
    background: var(--success-tint);
    color: var(--success);
  }
  .status.cancelled {
    background: var(--danger-tint);
    color: var(--danger);
  }
  .order-details {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 15px 0;
  }
  .order-details > div {
    display: grid;
    gap: 3px;
    padding: 10px;
    border-radius: 10px;
    background: var(--white);
  }
  .order-details span,
  .order-address span {
    color: var(--muted);
    font-size: 0.65rem;
    font-weight: 750;
  }
  .order-details a,
  .order-details strong {
    color: var(--navy);
    font-size: 0.76rem;
    overflow-wrap: anywhere;
  }
  .order-address {
    padding: 12px;
    border-radius: 10px;
    background: var(--white);
  }
  .order-address p {
    margin: 5px 0 0;
    color: var(--muted);
    font-size: 0.78rem;
    line-height: 1.45;
  }
  .order-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0;
  }
  .order-items span {
    padding: 5px 8px;
    border-radius: 7px;
    background: var(--sky);
    color: var(--blue-dark);
    font-size: 0.68rem;
    font-weight: 750;
  }
  .status-form {
    display: grid;
    gap: 8px;
    align-items: end;
  }
  .status-form .button {
    min-height: 46px;
    font-size: 0.75rem;
  }
  .empty-state {
    padding: 70px 20px;
    text-align: center;
  }
  .empty-state > span {
    color: var(--line-strong);
    font-size: 3rem;
  }
  .empty-state h3 {
    margin: 12px 0 5px;
    color: var(--navy);
  }
  .empty-state p {
    color: var(--muted);
  }
  .admin-product-grid {
    display: grid;
    gap: 14px;
  }
  .product-details {
    display: grid;
    gap: 13px;
  }
  .settings-media {
    display: grid;
    gap: 12px;
    margin-top: 24px;
  }
  .edit-product {
    display: grid;
    gap: 13px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--surface);
  }
  .product-media-admin {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    max-width: 560px;
  }
  .upload-help {
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
    line-height: 1.4;
  }
  .two-fields,
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .settings-grid .full {
    grid-column: 1/-1;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 0.76rem;
    font-weight: 750;
  }
  .toggle input {
    width: 18px;
    height: 18px;
    accent-color: var(--blue);
  }
  .settings-form {
    display: grid;
    gap: 16px;
  }
  .settings-block {
    padding: 18px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--surface);
  }
  .settings-block h3 {
    margin: 0 0 16px;
    color: var(--navy);
  }
  .settings-save {
    width: 100%;
  }
  .order-message {
    margin-top: 8px;
  }
  .frames-list {
    display: grid;
    gap: 12px;
  }
  .frame-admin {
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--white);
  }
  .frame-admin[open] {
    background: var(--surface);
  }
  .frame-admin summary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    cursor: pointer;
    list-style: none;
  }
  .frame-admin summary::-webkit-details-marker {
    display: none;
  }
  .frame-index {
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
    font-size: 0.72rem;
    font-weight: 800;
  }
  .frame-summary {
    display: grid;
    flex: 1;
    gap: 2px;
    min-width: 0;
  }
  .frame-summary strong {
    font-size: 1rem;
  }
  .frame-summary small {
    color: var(--muted);
    font-size: 0.72rem;
  }
  .frame-state {
    padding: 5px 10px;
    border-radius: 999px;
    background: var(--soft);
    color: var(--muted);
    font-size: 0.66rem;
    text-transform: uppercase;
  }
  .frame-admin.live .frame-state {
    background: var(--ink);
    color: var(--white);
  }
  .frame-settings {
    display: grid;
    gap: 12px;
    margin: 0 16px 16px;
    padding: 16px;
    border-radius: 14px;
    background: var(--paper);
  }
  .frame-admin .admin-product-grid {
    padding: 0 16px 16px;
  }
  .switch {
    min-height: 48px;
  }
  .add-frame {
    display: grid;
    gap: 12px;
    margin-top: 18px;
    padding: 18px;
    border: 1px dashed var(--line-strong);
    border-radius: 16px;
  }
  .add-frame h3 {
    margin: 0 0 4px;
  }
  .add-frame p {
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
  }
  :global(.admin-field textarea) {
    resize: vertical;
  }
  @media (min-width: 700px) {
    .admin-shell {
      padding: 50px 28px 100px;
    }
    .admin-intro {
      grid-template-columns: 1fr 1fr;
      align-items: end;
    }
    .panel-heading {
      grid-template-columns: 1fr auto;
      align-items: end;
    }
    .status-form {
      grid-template-columns: 1fr auto auto;
    }
    .admin-product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .frame-settings {
      grid-template-columns: 1fr 1.4fr 110px;
      align-items: end;
    }
    .frame-settings .switch,
    .frame-settings .button {
      grid-column: span 1;
    }
    .add-frame {
      grid-template-columns: 1fr 1.2fr auto;
      align-items: end;
    }
    .admin-panel {
      padding: 28px;
    }
  }
  @media (min-width: 1000px) {
    .admin-product-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .admin-topbar :global(.brand small),
    .admin-topbar > div > a {
      display: none;
    }
    .admin-stats {
      grid-template-columns: 1fr;
    }
    .admin-stats article {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
    .order-details {
      grid-template-columns: 1fr;
    }
    .settings-grid {
      grid-template-columns: 1fr;
    }
    .settings-grid .full {
      grid-column: auto;
    }
  }
  .review-admin {
    display: grid;
    gap: 12px;
    padding: 18px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--surface);
  }
  .add-review {
    margin-bottom: 18px;
  }
  .add-review h3,
  .add-review p {
    margin: 0;
  }
  .add-review .button {
    justify-self: start;
  }
  .review-admin-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 12px;
  }
  .review-admin-head small {
    color: var(--muted);
  }
  .review-state {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--cod);
    color: var(--cod-ink);
    font-size: 0.78rem;
    font-weight: 800;
  }
  .review-state.live {
    background: var(--brand-tint);
    color: var(--brand-deep);
  }
  .review-admin-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .review-delete {
    margin-left: auto;
    padding: 8px 4px;
    border: 0;
    background: none;
    color: var(--danger);
    font-weight: 700;
    cursor: pointer;
  }
</style>
