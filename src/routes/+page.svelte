<script lang="ts">
  import type { Product } from '../lib/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let checkoutOpen = $state(false);
  let submitting = $state(false);
  let errorMessage = $state('');
  let orderNumber = $state('');
  let activeProduct = $state<Product | null>(null);
  let activeMediaIndex = $state(0);
  let selectedProductId = $state(0);

  let form = $state({
    customer_name: '',
    mobile_primary: '',
    mobile_secondary: '',
    pincode: '',
    state: '',
    district: '',
    city: '',
    locality: '',
    road: '',
    landmark: '',
    shop_name: '',
    payment_method: 'cod'
  });

  const selectedItems = $derived.by(() => {
    const product = data.products.find((item) => item.id === Number(selectedProductId));
    return product && product.stock > 0 ? [{ ...product, quantity: 1 }] : [];
  });
  const total = $derived(selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const whatsappNumber = $derived(data.settings.whatsapp.replace(/\D/g, '').slice(-10));
  const whatsappHref = $derived(
    `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent('Hello Raghav, I want to know about chicken machine rubber.')}`
  );

  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = activeProduct ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  });

  $effect(() => {
    const selectionIsAvailable = data.products.some(
      (product) => product.id === Number(selectedProductId) && product.stock > 0
    );
    if (!selectionIsAvailable) {
      selectedProductId =
        data.products.find((product) => product.stock > 0)?.id ?? data.products[0]?.id ?? 0;
    }
  });

  function productMedia(product: Product) {
    return [
      { type: 'image' as const, src: product.image_url, label: 'Photo 1' },
      { type: 'image' as const, src: product.image_2_url || product.image_url, label: 'Photo 2' },
      { type: 'image' as const, src: product.image_3_url || product.image_url, label: 'Photo 3' },
      {
        type: 'video' as const,
        src: product.product_video_url || data.settings.video_1_url,
        label: 'Video'
      }
    ];
  }

  function openProduct(product: Product) {
    activeProduct = product;
    activeMediaIndex = 0;
  }

  function closeProduct() {
    activeProduct = null;
    activeMediaIndex = 0;
  }

  function handleGalleryKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && activeProduct) closeProduct();
  }

  function startOrder() {
    checkoutOpen = true;
    setTimeout(
      () => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' }),
      50
    );
  }

  async function submitOrder(event: SubmitEvent) {
    event.preventDefault();
    errorMessage = '';
    submitting = true;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: selectedItems.map((item) => ({ id: item.id, quantity: item.quantity }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not place order');
      orderNumber = result.orderNumber;
      setTimeout(
        () => document.getElementById('order-success')?.scrollIntoView({ behavior: 'smooth' }),
        50
      );
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Could not place order';
    } finally {
      submitting = false;
    }
  }

  function money(value: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }
</script>

<svelte:window onkeydown={handleGalleryKey} />

<svelte:head>
  <title>Raghav Chicken Machine Rubber | Since 2004</title>
  <meta
    name="description"
    content="Chicken machine rubber delivered across India. Call, WhatsApp or order online with cash on delivery and UPI."
  />
</svelte:head>

<div class="announcement">
  <span>Cash on delivery across India</span>
  <a href={`tel:${data.settings.phone}`}>{data.settings.phone}</a>
</div>
<header class="topbar">
  <a class="brand" href="#home" aria-label="Raghav home">
    <strong>RAGHAV</strong><small>Chicken Machine Rubber</small>
  </a>
  <nav class="desktop-nav" aria-label="Main navigation">
    <a href="#products">Products</a>
    <a href="#demo">Watch</a>
    <a href="#order">How to order</a>
  </nav>
  <a class="call-mini" href={`tel:${data.settings.phone}`} aria-label="Call Raghav">Call</a>
</header>

<main>
  <section class="hero section" id="home">
    <div class="hero-copy">
      <div class="eyebrow">Raghav · Since 2004</div>
      <h1>Built for<br />the work.</h1>
      <p>Chicken machine rubber, shown clearly and delivered simply.</p>
      <div class="hero-services" aria-label="Service benefits">
        <div class="cod-pulse"><strong>Cash on delivery</strong><span>Pay on arrival</span></div>
        <div><strong>Delivery across India</strong><span>Doorstep service</span></div>
        <div><strong>Direct support</strong><span>Call for help</span></div>
      </div>
    </div>
    <div class="hero-visual">
      <div class="poster-wrap">
        <img src={data.settings.hero_image_url} alt="Raghav Chicken Machine Rubber poster" />
      </div>
      <div class="floating-note"><strong>Since</strong><span>2004</span></div>
    </div>
  </section>

  <section class="products-section section" id="products">
    <div class="product-grid">
      {#each data.products as product, index}
        <article class="product-card">
          <button
            class="product-image product-media-button"
            type="button"
            onclick={() => openProduct(product)}
            aria-label={`Open photos and video for ${product.name}`}
          >
            <img
              src={product.image_url}
              alt={product.name}
              loading={index > 1 ? 'lazy' : 'eager'}
            />
            {#if product.stock > 0}<span class="stock">Available</span>{:else}<span
                class="stock out">Out of stock</span
              >{/if}
            <span class="view-media" aria-hidden="true">View 3 photos + video</span>
          </button>
          <div class="product-info">
            <div class="product-bottom">
              <div class="price-block">
                <span>Price</span><strong
                  >{product.price > 0 ? money(product.price) : 'Ask price'}</strong
                >
              </div>
              <div class="quantity-block">
                <span>Quantity</span>
                <strong>{product.stock}</strong>
              </div>
            </div>
          </div>
        </article>
      {/each}
    </div>
  </section>

  <section class="video-section section" id="demo">
    <div class="section-heading light">
      <div>
        <span class="section-number">02</span>
        <p class="eyebrow-text">See every detail</p>
      </div>
      <h2>Know what arrives.</h2>
      <p>Short, clear videos made for your phone.</p>
    </div>
    <div class="video-grid">
      <article>
        <video controls playsinline preload="metadata" src={data.settings.video_1_url}>
          <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
        </video>
        <div><span>Product film 01</span><strong>Rubber and washer</strong></div>
      </article>
      <article>
        <video controls playsinline preload="metadata" src={data.settings.video_2_url}>
          <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
        </video>
        <div><span>Product film 02</span><strong>Close-up and flexibility</strong></div>
      </article>
    </div>
  </section>

  <section class="order-section section" id="order">
    <div class="section-heading">
      <div>
        <span class="section-number">03</span>
        <p class="eyebrow-text">Choose your way</p>
      </div>
      <h2>Order in a few taps.</h2>
    </div>
    <div class="order-options">
      <a href={`tel:${data.settings.phone}`}>
        <span class="option-icon">01</span>
        <div><strong>Call Raghav</strong><small>{data.settings.phone}</small></div>
        <b>→</b>
      </a>
      <a href={whatsappHref} target="_blank" rel="noreferrer">
        <span class="option-icon green">02</span>
        <div><strong>Message on WhatsApp</strong><small>Fastest reply</small></div>
        <b>→</b>
      </a>
      <button type="button" onclick={startOrder}>
        <span class="option-icon gold">03</span>
        <div><strong>Order online</strong><small>COD or UPI</small></div>
        <b>→</b>
      </button>
    </div>

    {#if checkoutOpen}
      <div class="checkout" id="order-form">
        {#if orderNumber}
          <div class="success-card" id="order-success">
            <span class="success-icon">✓</span>
            <p class="eyebrow-text">Order confirmed</p>
            <h2>Thank you, {form.customer_name}!</h2>
            <p>
              Your order number is <strong>#{orderNumber}</strong>. Raghav will contact you shortly.
            </p>
            <a
              class="button whatsapp"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(`Hello Raghav, I placed order #${orderNumber}. My name is ${form.customer_name}.`)}`}
              >Send order on WhatsApp</a
            >
          </div>
        {:else}
          <form onsubmit={submitOrder}>
            <div class="checkout-head">
              <div>
                <p class="eyebrow-text">Delivery details</p>
                <h2>Where should we send it?</h2>
              </div>
              <button
                class="close"
                type="button"
                onclick={() => (checkoutOpen = false)}
                aria-label="Close form">×</button
              >
            </div>

            <label class="checkout-product">
              <span>Choose product *</span>
              <select bind:value={selectedProductId} required>
                {#each data.products as product}
                  <option value={product.id} disabled={product.stock < 1}>
                    {product.name} · {product.price > 0 ? money(product.price) : 'Ask price'}
                  </option>
                {/each}
              </select>
            </label>

            <div class="order-summary">
              {#each selectedItems as item}
                <div>
                  <span>{item.name} × {item.quantity}</span><strong
                    >{item.price ? money(item.price * item.quantity) : 'Price on call'}</strong
                  >
                </div>
              {/each}
              {#if total > 0}<div class="summary-total">
                  <span>Total</span><strong>{money(total)}</strong>
                </div>{/if}
            </div>

            <div class="form-grid">
              <label class="full"
                ><span>Customer name *</span><input
                  bind:value={form.customer_name}
                  required
                  autocomplete="name"
                /></label
              >
              <label
                ><span>Mobile number *</span><input
                  bind:value={form.mobile_primary}
                  required
                  inputmode="numeric"
                  minlength="10"
                  maxlength="10"
                  autocomplete="tel"
                /></label
              >
              <label
                ><span>Second mobile (optional)</span><input
                  bind:value={form.mobile_secondary}
                  inputmode="numeric"
                  maxlength="10"
                /></label
              >
              <label
                ><span>PIN code *</span><input
                  bind:value={form.pincode}
                  required
                  inputmode="numeric"
                  pattern={'[0-9]{6}'}
                  maxlength="6"
                  autocomplete="postal-code"
                /></label
              >
              <label
                ><span>State *</span><input
                  bind:value={form.state}
                  required
                  autocomplete="address-level1"
                /></label
              >
              <label><span>District *</span><input bind:value={form.district} required /></label>
              <label
                ><span>Village / town / city *</span><input
                  bind:value={form.city}
                  required
                  autocomplete="address-level2"
                /></label
              >
              <label class="full"
                ><span>Locality / area *</span><input
                  bind:value={form.locality}
                  required
                  autocomplete="address-line2"
                /></label
              >
              <label class="full"
                ><span>Road name</span><input
                  bind:value={form.road}
                  autocomplete="address-line1"
                /></label
              >
              <label><span>Landmark</span><input bind:value={form.landmark} /></label>
              <label><span>Shop name</span><input bind:value={form.shop_name} /></label>
            </div>

            <fieldset>
              <legend>Choose payment *</legend>
              <label class:chosen={form.payment_method === 'cod'} class="payment-choice">
                <input type="radio" bind:group={form.payment_method} value="cod" />
                <span
                  ><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span
                >
                <b>COD</b>
              </label>
              <label class:chosen={form.payment_method === 'upi'} class="payment-choice">
                <input type="radio" bind:group={form.payment_method} value="upi" />
                <span
                  ><strong>Pay with UPI</strong><small
                    >{data.settings.upi_id || 'UPI details shared after confirmation'}</small
                  ></span
                >
                <b>UPI</b>
              </label>
            </fieldset>

            {#if form.payment_method === 'upi' && data.settings.qr_url}
              <div class="qr-card">
                <img src={data.settings.qr_url} alt="UPI QR code" /><span>Scan to pay</span>
              </div>
            {/if}

            {#if errorMessage}<p class="form-error" role="alert">{errorMessage}</p>{/if}
            <button class="button primary submit" type="submit" disabled={submitting}>
              {submitting ? 'Placing order…' : 'Confirm order'}
            </button>
            <p class="privacy-note">Your details are used only to deliver this order.</p>
          </form>
        {/if}
      </div>
    {/if}
  </section>

  <section class="contact-section section" id="contact">
    <div class="contact-card">
      <div>
        <p class="eyebrow-text">Direct support</p>
        <h2>Questions? Ask Raghav.</h2>
        <p>Call or WhatsApp for product, price and delivery help.</p>
      </div>
      <div class="contact-actions">
        <a class="button light-button" href={`tel:${data.settings.phone}`}
          >Call {data.settings.phone}</a
        >
        <a class="button whatsapp" href={whatsappHref} target="_blank" rel="noreferrer"
          >WhatsApp now</a
        >
      </div>
    </div>
    <footer>
      <div>
        <strong>{data.settings.business_name}</strong><span
          >Since 2004 · Cash on delivery all over India</span
        >
      </div>
      <a href={`mailto:${data.settings.email}`}>{data.settings.email}</a>
    </footer>
  </section>
</main>

{#if activeProduct}
  {@const viewedProduct = activeProduct}
  {@const media = productMedia(viewedProduct)}
  {@const selectedMedia = media[activeMediaIndex]}
  <div class="product-viewer" role="presentation">
    <button class="viewer-backdrop" type="button" onclick={closeProduct} aria-label="Close gallery"
    ></button>
    <div
      class="viewer-shell"
      role="dialog"
      aria-modal="true"
      aria-label={`${viewedProduct.name} media gallery`}
    >
      <button class="viewer-close" type="button" onclick={closeProduct} aria-label="Close gallery"
        >×</button
      >
      <div class="viewer-thumbnails" aria-label="Choose media">
        {#each media as item, mediaIndex}
          <button
            type="button"
            class:active={activeMediaIndex === mediaIndex}
            onclick={() => (activeMediaIndex = mediaIndex)}
            aria-label={item.label}
          >
            {#if item.type === 'image'}
              <img src={item.src} alt="" />
            {:else}
              <video src={item.src} muted playsinline preload="metadata"></video>
              <span class="play-mark">▶</span>
            {/if}
          </button>
        {/each}
      </div>
      <div class="viewer-stage">
        {#if selectedMedia.type === 'image'}
          <img src={selectedMedia.src} alt={viewedProduct.name} />
        {:else}
          <video src={selectedMedia.src} controls autoplay playsinline preload="metadata">
            <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
          </video>
        {/if}
      </div>
      <div class="viewer-purchase">
        <div>
          <span>Price</span><strong
            >{viewedProduct.price > 0 ? money(viewedProduct.price) : 'Ask price'}</strong
          >
        </div>
        <div class="quantity-block">
          <span>Quantity</span>
          <strong>{viewedProduct.stock}</strong>
        </div>
      </div>
    </div>
  </div>
{/if}

<nav class="mobile-dock" aria-label="Quick actions">
  <a href={`tel:${data.settings.phone}`}><span>☎</span>Call</a>
  <a href={whatsappHref} target="_blank" rel="noreferrer"><span>◉</span>WhatsApp</a>
  <button
    type="button"
    onclick={() => {
      closeProduct();
      startOrder();
    }}><span>↗</span>Order</button
  >
</nav>
