<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let quantities = $state<Record<number, number>>({});
  let checkoutOpen = $state(false);
  let submitting = $state(false);
  let errorMessage = $state('');
  let orderNumber = $state('');

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

  const selectedItems = $derived.by(() =>
    data.products
      .filter((product) => (quantities[product.id] || 0) > 0)
      .map((product) => ({ ...product, quantity: quantities[product.id] }))
  );
  const itemCount = $derived(selectedItems.reduce((sum, item) => sum + item.quantity, 0));
  const total = $derived(selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const whatsappNumber = $derived(data.settings.whatsapp.replace(/\D/g, '').slice(-10));
  const whatsappHref = $derived(
    `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent('Hello Raghav, I want to know about chicken machine rubber.')}`
  );

  function changeQuantity(productId: number, change: number, max: number) {
    quantities[productId] = Math.max(0, Math.min(max, (quantities[productId] || 0) + change));
  }

  function startOrder() {
    if (!itemCount) {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
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

<svelte:head>
  <title>Raghav Chicken Machine Rubber | Since 2004</title>
  <meta
    name="description"
    content="Chicken machine rubber delivered across India. Call, WhatsApp or order online with cash on delivery and UPI."
  />
</svelte:head>

<header class="topbar">
  <a class="brand" href="#home" aria-label="Raghav home">
    <span class="brand-mark">R</span>
    <span><strong>Raghav</strong><small>Since 2004</small></span>
  </a>
  <a class="call-mini" href={`tel:${data.settings.phone}`} aria-label="Call Raghav">Call now</a>
</header>

<main>
  <section class="hero section" id="home">
    <div class="hero-copy">
      <div class="eyebrow"><span></span> Cash on delivery all over India</div>
      <h1>Strong rubber.<br /><em>Smooth work.</em></h1>
      <p>Reliable chicken machine rubber from a family business serving customers since 2004.</p>
      <div class="hero-actions">
        <a class="button primary" href="#products">See 4 products</a>
        <a class="button whatsapp" href={whatsappHref} target="_blank" rel="noreferrer">
          <span aria-hidden="true">✆</span> WhatsApp
        </a>
      </div>
      <div class="trust-row" aria-label="Service benefits">
        <span>✓ Easy ordering</span><span>✓ COD available</span><span>✓ India delivery</span>
      </div>
    </div>
    <div class="hero-visual">
      <div class="poster-wrap">
        <img src={data.settings.hero_image_url} alt="Raghav Chicken Machine Rubber poster" />
      </div>
      <div class="floating-note"><strong>20+</strong><span>Years serving India</span></div>
    </div>
  </section>

  <section class="products-section section" id="products">
    <div class="section-heading">
      <div>
        <span class="section-number">01</span>
        <p class="eyebrow-text">Choose your rubber</p>
      </div>
      <h2>Four simple choices.</h2>
      <p>Tap + to choose quantity. You can confirm everything before placing your order.</p>
    </div>

    <div class="product-grid">
      {#each data.products as product, index}
        <article class="product-card">
          <div class="product-image">
            <img
              src={product.image_url}
              alt={product.name}
              loading={index > 1 ? 'lazy' : 'eager'}
            />
            {#if product.stock > 0}<span class="stock">In stock</span>{:else}<span class="stock out"
                >Out of stock</span
              >{/if}
          </div>
          <div class="product-info">
            <span class="product-count">0{index + 1}</span>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <div class="product-bottom">
              <strong>{product.price > 0 ? money(product.price) : 'Ask price'}</strong>
              <div class="stepper" aria-label={`Quantity for ${product.name}`}>
                <button
                  type="button"
                  onclick={() => changeQuantity(product.id, -1, product.stock)}
                  aria-label="Remove one">−</button
                >
                <span>{quantities[product.id] || 0}</span>
                <button
                  type="button"
                  onclick={() => changeQuantity(product.id, 1, product.stock)}
                  aria-label="Add one"
                  disabled={product.stock < 1}>+</button
                >
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
        <p class="eyebrow-text">See the product</p>
      </div>
      <h2>Watch before you buy.</h2>
      <p>See the rubber closely and check its flexibility on your phone.</p>
    </div>
    <div class="video-grid">
      <article>
        <video controls playsinline preload="metadata" src={data.settings.video_1_url}>
          <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
        </video>
        <div><span>Product demo</span><strong>Soft rubber & washer</strong></div>
      </article>
      <article>
        <video controls playsinline preload="metadata" src={data.settings.video_2_url}>
          <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
        </video>
        <div><span>Close-up</span><strong>Size & flexibility</strong></div>
      </article>
    </div>
  </section>

  <section class="order-section section" id="order">
    <div class="section-heading">
      <div>
        <span class="section-number">03</span>
        <p class="eyebrow-text">Order your way</p>
      </div>
      <h2>Three easy options.</h2>
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
        <p class="eyebrow-text">Need help?</p>
        <h2>Speak directly with Raghav.</h2>
        <p>Call or WhatsApp for product questions, price and delivery help.</p>
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

<nav class="mobile-dock" aria-label="Quick actions">
  <a href={`tel:${data.settings.phone}`}><span>☎</span>Call</a>
  <a href={whatsappHref} target="_blank" rel="noreferrer"><span>◉</span>WhatsApp</a>
  <button type="button" onclick={startOrder} class:has-items={itemCount > 0}>
    <span>{itemCount || '↗'}</span>{itemCount ? 'Order now' : 'Order'}
  </button>
</nav>
