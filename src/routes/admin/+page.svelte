<script lang="ts">
  import type { ActionData, PageData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let activeTab = $state<'orders' | 'products' | 'settings'>('orders');

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

  function address(order: Record<string, unknown>) {
    return [
      order.shop_name,
      order.locality,
      order.road,
      order.landmark,
      order.city,
      order.district,
      order.state,
      order.pincode
    ]
      .filter(Boolean)
      .join(', ');
  }

  async function resizePhonePhoto(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/') || file.size < 1_500_000) return;

    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = 1800;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.82)
      );
      bitmap.close();
      if (!blob || blob.size >= file.size) return;

      const files = new DataTransfer();
      files.items.add(
        new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
      );
      input.files = files.files;
    } catch {
      // Keep the original file if the browser cannot resize this format.
    }
  }
</script>

<svelte:head><title>Store admin | Raghav</title></svelte:head>

<header class="admin-topbar">
  <a class="brand" href="/admin"
    ><span class="brand-mark">R</span><span
      ><strong>Raghav admin</strong><small>Store control</small></span
    ></a
  >
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
      <p>Manage orders, products and business details from one place.</p>
    </div>
    <div class="admin-stats">
      <article><span>Total orders</span><strong>{data.stats.total_orders}</strong></article>
      <article><span>Open orders</span><strong>{data.stats.open_orders}</strong></article>
      <article><span>Order value</span><strong>{money(data.stats.total_value)}</strong></article>
    </div>
  </section>

  {#if form?.success}<div class="admin-notice success">✓ {form.success}</div>{/if}
  {#if form?.error}<div class="admin-notice error">{form.error}</div>{/if}

  <nav class="admin-tabs" aria-label="Admin sections">
    <button class:active={activeTab === 'orders'} onclick={() => (activeTab = 'orders')}
      >Orders <span>{data.orders.length}</span></button
    >
    <button class:active={activeTab === 'products'} onclick={() => (activeTab = 'products')}
      >Products <span>{data.products.length}</span></button
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
          <h2>Customer orders</h2>
        </div>
        <p>Up to 100 recent orders are shown.</p>
      </div>
      {#if data.orders.length}
        <div class="orders-list">
          {#each data.orders as order}
            <article class="order-card">
              <div class="order-card-head">
                <div>
                  <span>Order #{order.order_number}</span><strong>{order.customer_name}</strong
                  ><small>{dateTime(order.created_at)}</small>
                </div>
                <b class={`status ${order.status}`}>{order.status}</b>
              </div>
              <div class="order-details">
                <div>
                  <span>Mobile</span><a href={`tel:${order.mobile_primary}`}
                    >{order.mobile_primary}</a
                  >
                </div>
                <div><span>Payment</span><strong>{order.payment_method.toUpperCase()}</strong></div>
                <div>
                  <span>Total</span><strong
                    >{order.total ? money(order.total) : 'Price on call'}</strong
                  >
                </div>
              </div>
              <div class="order-address">
                <span>Delivery address</span>
                <p>{address(order)}</p>
              </div>
              <div class="order-items">
                {#each order.items as item}<span>{item.name} × {item.quantity}</span>{/each}
              </div>
              <form method="POST" action="?/updateOrder" class="status-form">
                <input type="hidden" name="id" value={order.id} />
                <label class="admin-field"
                  ><span>Order status</span><select name="status" value={order.status}
                    ><option value="confirmed">Confirmed</option><option value="processing"
                      >Processing</option
                    ><option value="shipped">Shipped</option><option value="delivered"
                      >Delivered</option
                    ><option value="cancelled">Cancelled</option></select
                  ></label
                >
                <button class="button primary" type="submit">Update</button>
                <a
                  class="button whatsapp"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://wa.me/91${order.mobile_primary}?text=${encodeURIComponent(`Hello ${order.customer_name}, regarding your Raghav order #${order.order_number}: `)}`}
                  >WhatsApp customer</a
                >
              </form>
            </article>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <span>◎</span>
          <h3>No orders yet</h3>
          <p>New customer orders will appear here.</p>
        </div>
      {/if}
    </section>
  {:else if activeTab === 'products'}
    <section class="admin-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow-text">Website section 2</p>
          <h2>Edit four products</h2>
        </div>
        <p>Set three photos, one video, price and available quantity for each product.</p>
      </div>
      <div class="admin-product-grid">
        {#each data.products as product}
          <form
            method="POST"
            action="?/updateProduct"
            enctype="multipart/form-data"
            class="edit-product"
          >
            <input type="hidden" name="id" value={product.id} />
            <div class="product-media-admin">
              <div>
                <div class="edit-product-image">
                  <img src={product.image_url} alt={`${product.name}, angle 1`} />
                </div>
                <span>Photo 1 · Main</span>
              </div>
              <div>
                <div class="edit-product-image">
                  <img src={product.image_2_url} alt={`${product.name}, angle 2`} />
                </div>
                <span>Photo 2</span>
              </div>
              <div>
                <div class="edit-product-image">
                  <img src={product.image_3_url} alt={`${product.name}, angle 3`} />
                </div>
                <span>Photo 3</span>
              </div>
              <div>
                <div class="edit-product-image video-preview">
                  <video src={product.product_video_url} muted playsinline preload="metadata"
                  ></video>
                  <b>▶</b>
                </div>
                <span>Video</span>
              </div>
            </div>
            <div class="media-fields">
              <label class="admin-field"
                ><span>Photo 1 link</span><input
                  name="image_url"
                  value={product.image_url}
                  required
                /></label
              >
              <label class="upload-button"
                ><input
                  type="file"
                  name="image_upload"
                  accept="image/*"
                  onchange={resizePhonePhoto}
                /><span>Upload photo 1</span></label
              >
              <label class="admin-field"
                ><span>Photo 2 link</span><input
                  name="image_2_url"
                  value={product.image_2_url}
                  required
                /></label
              >
              <label class="upload-button"
                ><input
                  type="file"
                  name="image_2_upload"
                  accept="image/*"
                  onchange={resizePhonePhoto}
                /><span>Upload photo 2</span></label
              >
              <label class="admin-field"
                ><span>Photo 3 link</span><input
                  name="image_3_url"
                  value={product.image_3_url}
                  required
                /></label
              >
              <label class="upload-button"
                ><input
                  type="file"
                  name="image_3_upload"
                  accept="image/*"
                  onchange={resizePhonePhoto}
                /><span>Upload photo 3</span></label
              >
              <label class="admin-field"
                ><span>Product video link</span><input
                  name="product_video_url"
                  value={product.product_video_url}
                  required
                /></label
              >
              <label class="upload-button"
                ><input type="file" name="product_video_upload" accept="video/*" /><span
                  >Upload video (max 15 MB)</span
                ></label
              >
            </div>
            <p class="upload-help">Phone photos are resized automatically before upload.</p>
            <label class="admin-field"
              ><span>Product name</span><input name="name" value={product.name} required /></label
            >
            <label class="admin-field"
              ><span>Short description</span><textarea name="description" rows="2"
                >{product.description}</textarea
              ></label
            >
            <div class="two-fields">
              <label class="admin-field"
                ><span>Price ₹</span><input
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
                >Show on website</span
              ></label
            >
            <button class="button primary" type="submit">Save product</button>
          </form>
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
        <p>Update the phone, email, UPI, poster and two videos.</p>
      </div>
      <form
        method="POST"
        action="?/updateSettings"
        enctype="multipart/form-data"
        class="settings-form"
      >
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
          </div>
        </div>
        <div class="settings-block">
          <h3>UPI payment</h3>
          <div class="settings-grid">
            <label class="admin-field full"
              ><span>UPI ID</span><input
                name="upi_id"
                value={data.settings.upi_id}
                placeholder="name@bank"
              /></label
            >
            <label class="admin-field full"
              ><span>QR image link</span><input
                name="qr_url"
                value={data.settings.qr_url}
                placeholder="https://..."
              /></label
            >
            <label class="upload-button full"
              ><input
                type="file"
                name="qr_upload"
                accept="image/*"
                onchange={resizePhonePhoto}
              /><span>Or upload QR image</span></label
            >
          </div>
        </div>
        <div class="settings-block">
          <h3>Poster & videos</h3>
          <div class="settings-grid">
            <label class="admin-field full"
              ><span>Poster image link</span><input
                name="hero_image_url"
                value={data.settings.hero_image_url}
                required
              /></label
            >
            <label class="upload-button full"
              ><input
                type="file"
                name="hero_upload"
                accept="image/*"
                onchange={resizePhonePhoto}
              /><span>Upload new poster</span></label
            >
            <label class="admin-field full"
              ><span>Video 1 link</span><input
                name="video_1_url"
                value={data.settings.video_1_url}
                required
              /></label
            >
            <label class="upload-button full"
              ><input type="file" name="video_1_upload" accept="video/*" /><span
                >Upload video 1 (max 15 MB)</span
              ></label
            >
            <label class="admin-field full"
              ><span>Video 2 link</span><input
                name="video_2_url"
                value={data.settings.video_2_url}
                required
              /></label
            >
            <label class="upload-button full"
              ><input type="file" name="video_2_upload" accept="video/*" /><span
                >Upload video 2 (max 15 MB)</span
              ></label
            >
          </div>
        </div>
        <button class="button primary settings-save" type="submit">Save business details</button>
      </form>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    background: #f4f4f2;
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
    border-bottom: 1px solid #d8d8d5;
    background: rgba(255, 255, 255, 0.94);
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
    color: #666;
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
    border: 1px solid #d8d8d5;
    border-radius: 15px;
    background: white;
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
    background: #e7e7e5;
    color: #111;
  }
  .admin-notice.error {
    background: #d0d0cd;
    color: #111;
  }
  .admin-tabs {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    margin-bottom: 14px;
    padding: 5px;
    border: 1px solid #d8d8d5;
    border-radius: 15px;
    background: white;
    scrollbar-width: none;
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
    color: #555;
    font-size: 0.82rem;
    font-weight: 800;
    cursor: pointer;
  }
  .admin-tabs button.active {
    background: var(--blue);
    color: white;
  }
  .admin-tabs span {
    display: grid;
    min-width: 21px;
    height: 21px;
    place-items: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    font-size: 0.65rem;
  }
  .admin-panel {
    padding: 22px 16px;
    border: 1px solid #d8d8d5;
    border-radius: 21px;
    background: white;
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
    border: 1px solid #d8d8d5;
    border-radius: 16px;
    background: #fafafa;
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
    background: #e5e5e3;
    color: #333;
    font-size: 0.62rem;
    text-transform: uppercase;
  }
  .status.confirmed {
    background: #ededeb;
    color: #111;
  }
  .status.processing {
    background: #dededb;
    color: #111;
  }
  .status.shipped {
    background: #d2d2cf;
    color: #111;
  }
  .status.delivered {
    background: #c5c5c1;
    color: #111;
  }
  .status.cancelled {
    background: #b9b9b5;
    color: #111;
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
    background: white;
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
    background: white;
  }
  .order-address p {
    margin: 5px 0 0;
    color: #444;
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
    color: #aaa;
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
  .edit-product {
    display: grid;
    gap: 13px;
    padding: 14px;
    border: 1px solid #d8d8d5;
    border-radius: 16px;
    background: #fafafa;
  }
  .edit-product-image {
    overflow: hidden;
    aspect-ratio: 1;
    border-radius: 13px;
    background: #eee;
  }
  .edit-product-image img,
  .edit-product-image video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .product-media-admin {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 7px;
  }
  .product-media-admin > div {
    display: grid;
    gap: 5px;
  }
  .product-media-admin span {
    color: var(--muted);
    font-size: 0.58rem;
    font-weight: 750;
    text-align: center;
  }
  .video-preview {
    position: relative;
  }
  .video-preview b {
    position: absolute;
    inset: 50% auto auto 50%;
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    font-size: 0.62rem;
    transform: translate(-50%, -50%);
  }
  .media-fields {
    display: grid;
    gap: 9px;
  }
  .upload-help {
    margin: -4px 0 0;
    color: var(--muted);
    font-size: 0.68rem;
    line-height: 1.4;
  }
  .upload-button {
    position: relative;
    display: grid;
    min-height: 44px;
    place-items: center;
    overflow: hidden;
    border: 1px dashed #888;
    border-radius: 11px;
    background: var(--sky);
    color: var(--blue);
    font-size: 0.75rem;
    font-weight: 800;
    cursor: pointer;
  }
  .upload-button input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
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
    color: #444;
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
    border: 1px solid #d8d8d5;
    border-radius: 16px;
    background: #fafafa;
  }
  .settings-block h3 {
    margin: 0 0 16px;
    color: var(--navy);
  }
  .settings-save {
    width: 100%;
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
    .admin-topbar .brand small,
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
</style>
