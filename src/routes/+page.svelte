<script lang="ts">
  import Icon from '../lib/components/Icon.svelte';
  import Logo from '../lib/components/Logo.svelte';
  import { INSTAGRAM_URL, YOUTUBE_URL } from '../lib/social';
  import type { Product } from '../lib/types';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const productLines = [
    'Chicken feather cleaning machines',
    'Chicken cutting machines',
    'Rubbers & bushes',
    'Commercial mixers',
    'Grinders',
    'Dough kneading machines'
  ];
  const yearsInTrade = new Date().getFullYear() - 2004;

  let submitting = $state(false);
  let errorMessage = $state('');
  let requestNumber = $state('');
  let activeProduct = $state<Product | null>(null);
  let activeMediaIndex = $state(0);

  let form = $state({
    customer_name: '',
    mobile_primary: '',
    mobile_secondary: '',
    city: '',
    state: '',
    pincode: '',
    shop_name: '',
    product_id: '',
    message: ''
  });

  const allProducts = $derived(data.frames.flatMap((frame) => frame.products));
  const aboutImages = $derived([allProducts[0]?.image_url, allProducts[1]?.image_url]);
  const phone = $derived(data.settings.phone);
  const phoneLabel = $derived(formatPhone(phone));
  const allPhones = $derived(
    [phone, data.settings.secondary_phone].filter(Boolean).map(formatPhone).join('  ·  ')
  );
  const whatsappNumber = $derived(data.settings.whatsapp.replace(/\D/g, '').slice(-10));
  const whatsappHref = $derived(whatsappLink());

  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = activeProduct ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  });

  function productMedia(product: Product) {
    const images = [...new Set([product.image_url, product.image_2_url, product.image_3_url])]
      .filter(Boolean)
      .map((src, index) => ({ type: 'image' as const, src, label: `Photo ${index + 1}` }));
    return product.product_video_url
      ? [...images, { type: 'video' as const, src: product.product_video_url, label: 'Video' }]
      : images;
  }

  function mediaLabel(product: Product) {
    const media = productMedia(product);
    const photos = media.filter((item) => item.type === 'image').length;
    const video = media.length > photos ? ' + video' : '';
    return `${photos} photo${photos === 1 ? '' : 's'}${video}`;
  }

  function whatsappLink(product?: Product) {
    const message = product
      ? `Hello Naazare Enterprises, I am interested in ${product.name}. Please share the price.`
      : 'Hello Naazare Enterprises, I would like to know more about your products.';
    return `https://wa.me/91${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  function showMedia(step: number) {
    if (!activeProduct) return;
    const count = productMedia(activeProduct).length;
    activeMediaIndex = (activeMediaIndex + step + count) % count;
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
    if (!activeProduct) return;
    if (event.key === 'Escape') closeProduct();
    if (event.key === 'ArrowRight') showMedia(1);
    if (event.key === 'ArrowLeft') showMedia(-1);
  }

  async function submitRequest(event: SubmitEvent) {
    event.preventDefault();
    errorMessage = '';
    submitting = true;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, product_id: Number(form.product_id) || null })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send your request');
      requestNumber = result.requestNumber;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Could not send your request';
    } finally {
      submitting = false;
    }
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(-10);
    return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : value;
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

{#snippet contactActions(product?: Product)}
  <div class="contact-actions">
    <a class="button primary" href={`tel:${phone}`}><Icon name="phone" size={18} />Call us</a>
    <a class="button whatsapp" href={whatsappLink(product)} target="_blank" rel="noreferrer"
      ><Icon name="whatsapp" size={19} />WhatsApp</a
    >
  </div>
{/snippet}

{#snippet cashOnDelivery(label = 'Cash on delivery', large = false)}
  <span class="cod" class:large><Icon name="check" size={large ? 20 : 15} />{label}</span>
{/snippet}

<svelte:head>
  <title>{data.settings.business_name} | Commercial Kitchen Equipment Since 2004</title>
  <meta
    name="description"
    content="Naazare Enterprises — dealers in commercial kitchen equipment since 2004. Chicken feather cleaning machines, chicken cutting machines, rubbers and bushes, commercial mixers, grinders and dough kneading machines."
  />
</svelte:head>

<div class="infobar">
  <div class="container infobar-inner">
    <div class="infobar-details">
      <span class="infobar-item infobar-address"
        ><Icon name="pin" size={18} />{data.settings.address ||
          'Dealers in commercial kitchen equipment since 2004'}</span
      >
      <a class="infobar-item infobar-phone" href={`tel:${phone}`}
        ><Icon name="phone" size={18} />{phoneLabel}</a
      >
      <a class="infobar-item infobar-email" href={`mailto:${data.settings.email}`}
        ><Icon name="mail" size={18} />{data.settings.email}</a
      >
    </div>
    <div class="infobar-social">
      <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="WhatsApp"
        ><Icon name="whatsapp" size={22} /></a
      >
      <a href={`tel:${phone}`} aria-label="Call"><Icon name="phone" size={20} /></a>
      <a href={`mailto:${data.settings.email}`} aria-label="Email"><Icon name="mail" size={20} /></a
      >
      <a
        class="social-extra"
        href={YOUTUBE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="YouTube"><Icon name="youtube" size={22} /></a
      >
      <a
        class="social-extra"
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"><Icon name="instagram" size={20} /></a
      >
    </div>
  </div>
</div>

<header class="topbar">
  <div class="container topbar-inner">
    <Logo href="#home" />
    <nav class="desktop-nav" aria-label="Main navigation">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#products">Products</a>
      <a href="#videos">Videos</a>
      <a href="#callback">Contact</a>
    </nav>
    <a class="header-call" href={`tel:${phone}`}>
      <span class="header-call-icon"><Icon name="chat" size={22} /></span>
      <span class="header-call-text"
        ><small>Have any questions?</small><strong>Call: {phoneLabel}</strong></span
      >
    </a>
    <a class="button primary header-call-mobile" href={`tel:${phone}`}
      ><Icon name="phone" size={16} />Call</a
    >
  </div>
</header>

<main>
  <section
    class="hero"
    class:has-image={!!data.settings.hero_image_url}
    id="home"
    style={data.settings.hero_image_url
      ? `--hero-image: url('${data.settings.hero_image_url}')`
      : undefined}
  >
    <div class="container hero-inner">
      <div class="hero-head">
        <div class="hero-copy">
          <p class="eyebrow">Commercial kitchen equipment · Since 2004</p>
          <h1><span>Naazare</span> Enterprises</h1>
          <p class="hero-lead">
            Dependable machines and genuine spare parts for poultry shops, hotels, bakeries and
            commercial kitchens.
          </p>
          {@render cashOnDelivery('Cash on delivery across India', true)}
          <div class="hero-actions">
            <a class="button shop" href="#products">Shop now <Icon name="arrow" size={18} /></a>
            {@render contactActions()}
          </div>
        </div>
        <div class="seal" aria-label={`${yearsInTrade} years of trust`}>
          <span class="seal-since">Since 2004</span>
          <strong>{yearsInTrade}</strong>
          <span class="seal-label">Years of trust</span>
        </div>
      </div>
    </div>
    <div class="hero-band">
      <div class="container hero-band-inner">
        <span
          ><Icon name="truck" size={18} />{data.settings.address ||
            'Delivery across India · Cash on delivery'}</span
        >
        <a href={`tel:${phone}`}><Icon name="phone" size={16} />{allPhones}</a>
      </div>
    </div>
  </section>

  <section class="stats" aria-label="Highlights">
    <div class="container stats-inner">
      <div><strong>2004</strong><span>Established and trusted by kitchens</span></div>
      <div><strong>{yearsInTrade}+</strong><span>Years of experience in the trade</span></div>
      <div><strong>{productLines.length}+</strong><span>Product lines and growing</span></div>
      <div><strong>COD</strong><span>Cash on delivery to your doorstep</span></div>
    </div>
  </section>

  <section class="section" id="about">
    <div class="container about">
      <div class="about-media">
        {#if aboutImages[0]}
          <img class="about-main" src={aboutImages[0]} alt="Naazare Enterprises product" />
        {/if}
        {#if aboutImages[1]}
          <img class="about-inset" src={aboutImages[1]} alt="" loading="lazy" />
        {/if}
        <div class="about-badge"><strong>{yearsInTrade}+</strong><span>Years of trust</span></div>
      </div>
      <div class="about-copy">
        <p class="eyebrow-text">About us</p>
        <h2>Naazare Enterprises</h2>
        <p class="about-lead">Dealers in commercial kitchen equipment since 2004.</p>
        <p>
          For over two decades we have supplied hard-working machines and genuine spare parts to
          poultry shops, hotels, bakeries and commercial kitchens. Every enquiry is handled
          personally — we help you choose the right machine, share the price and arrange delivery.
        </p>
        <h3>Products include</h3>
        <ul class="product-lines">
          {#each productLines as line}<li><Icon name="check" size={16} />{line}</li>{/each}
          <li class="more">…and more</li>
        </ul>
        {@render contactActions()}
      </div>
    </div>
  </section>

  <section class="section products" id="products">
    <div class="container">
      <div class="section-heading centered">
        <h2>Our products</h2>
      </div>

      {#each data.frames as frame, frameIndex}
        <div class="frame" id={`frame-${frame.id}`}>
          {#if data.frames.length > 1}
            <h3 class="frame-title">{frame.title}</h3>
          {/if}
          <div class="product-grid">
            {#each frame.products as product, index}
              <article class="product-card">
                <button
                  class="product-image"
                  type="button"
                  onclick={() => openProduct(product)}
                  aria-label={`Open photos and video for ${product.name}`}
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading={frameIndex > 0 || index > 1 ? 'lazy' : 'eager'}
                  />
                  {#if product.stock > 0}<span class="stock">Available</span>{:else}<span
                      class="stock out">Out of stock</span
                    >{/if}
                  <span class="view-media" aria-hidden="true">{mediaLabel(product)}</span>
                </button>
                <div class="product-info">
                  <h4>{product.name}</h4>
                  <div class="product-meta">
                    <div>
                      <span>Price</span><strong
                        >{product.price > 0 ? money(product.price) : 'Ask price'}</strong
                      >
                    </div>
                    <div>
                      <span>Quantity</span><strong>{product.stock}</strong>
                    </div>
                  </div>
                  {@render cashOnDelivery()}
                  <a class="enquire" href={`tel:${phone}`}><Icon name="phone" size={17} />Call us</a
                  >
                </div>
              </article>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section class="videos section" id="videos">
    <div class="container">
      <div class="section-heading centered light">
        <p class="eyebrow-text">See it working</p>
        <h2>Know what arrives</h2>
        <p>Short, clear videos of our products — made for your phone.</p>
      </div>
      <div class="video-grid">
        <article>
          <video controls playsinline preload="metadata" src={data.settings.video_1_url}>
            <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
          </video>
          <div><span>Film 01</span><strong>Rubber and washer</strong></div>
        </article>
        <article>
          <video controls playsinline preload="metadata" src={data.settings.video_2_url}>
            <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
          </video>
          <div><span>Film 02</span><strong>Close-up and flexibility</strong></div>
        </article>
      </div>
      <div class="follow">
        <p>Watch more of our products working</p>
        <div>
          <a class="button youtube" href={YOUTUBE_URL} target="_blank" rel="noreferrer"
            ><Icon name="youtube" size={22} />YouTube</a
          >
          <a class="button instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"
            ><Icon name="instagram" size={20} />Instagram</a
          >
        </div>
      </div>
    </div>
  </section>

  <section class="section callback-section" id="callback">
    <div class="container callback">
      <div class="callback-intro">
        <p class="eyebrow-text">Request a callback</p>
        <h2>Tell us what you need. We’ll call you back.</h2>
        <p>
          Share your details and the product you are interested in. Our team will call you with the
          price, availability and delivery options.
        </p>
        <ol class="steps">
          <li><strong>Share your details</strong><span>Takes less than a minute.</span></li>
          <li>
            <strong>We call you back</strong><span>During working hours, usually same day.</span>
          </li>
          <li>
            <strong>Confirm and receive</strong><span>Price, delivery and support sorted.</span>
          </li>
        </ol>
        <div class="direct-contact">
          <span>Prefer to talk now?</span>
          <div>
            <a class="button primary" href={`tel:${phone}`}
              ><Icon name="phone" size={18} />Call us · {phoneLabel}</a
            >
            <a class="button whatsapp" href={whatsappHref} target="_blank" rel="noreferrer"
              ><Icon name="whatsapp" size={19} />WhatsApp</a
            >
          </div>
        </div>
      </div>
      <div class="callback-card">
        {#if requestNumber}
          <div class="success" role="status">
            <span class="success-icon">✓</span>
            <p class="eyebrow-text">Request received</p>
            <h3>Thank you, {form.customer_name}!</h3>
            <p>
              Your request number is <strong>#{requestNumber}</strong>. We will call you on
              <strong>{form.mobile_primary}</strong> shortly.
            </p>
            <button
              class="button"
              type="button"
              onclick={() => {
                requestNumber = '';
                form.product_id = '';
                form.message = '';
              }}>Send another request</button
            >
          </div>
        {:else}
          <form onsubmit={submitRequest}>
            <div class="form-grid">
              <label class="full"
                ><span>Your name *</span><input
                  id="customer-name"
                  bind:value={form.customer_name}
                  required
                  autocomplete="name"
                /></label
              >
              <label
                ><span>Mobile number *</span><input
                  bind:value={form.mobile_primary}
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
                ><span>Alternate mobile</span><input
                  bind:value={form.mobile_secondary}
                  type="tel"
                  inputmode="numeric"
                  maxlength="10"
                /></label
              >
              <label
                ><span>Town / city *</span><input
                  bind:value={form.city}
                  required
                  autocomplete="address-level2"
                /></label
              >
              <label
                ><span>State</span><input
                  bind:value={form.state}
                  autocomplete="address-level1"
                /></label
              >
              <label
                ><span>PIN code</span><input
                  bind:value={form.pincode}
                  inputmode="numeric"
                  pattern={'[0-9]{6}'}
                  maxlength="6"
                  autocomplete="postal-code"
                /></label
              >
              <label><span>Shop / business name</span><input bind:value={form.shop_name} /></label>
              <label class="full"
                ><span>Interested in</span><select bind:value={form.product_id}>
                  <option value="">Not sure yet / something else</option>
                  {#each data.frames as frame}
                    <optgroup label={frame.title}>
                      {#each frame.products as product}
                        <option value={String(product.id)}>{product.name}</option>
                      {/each}
                    </optgroup>
                  {/each}
                </select></label
              >
              <label class="full"
                ><span>Message</span><textarea
                  bind:value={form.message}
                  rows="3"
                  placeholder="Quantity, model, or anything we should know"></textarea></label
              >
            </div>
            {#if errorMessage}<p class="form-error" role="alert">{errorMessage}</p>{/if}
            <button class="button primary submit" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Request a callback'}
            </button>
            <p class="privacy-note">
              We only use your details to call you back about this request.
            </p>
          </form>
        {/if}
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <Logo href="#home" tone="light" />
      <p>Dealers in commercial kitchen equipment since 2004.</p>
      <div class="footer-social">
        <a href={whatsappHref} target="_blank" rel="noreferrer" aria-label="WhatsApp"
          ><Icon name="whatsapp" size={17} /></a
        >
        <a href={`tel:${phone}`} aria-label="Call"><Icon name="phone" size={16} /></a>
        <a href={`mailto:${data.settings.email}`} aria-label="Email"
          ><Icon name="mail" size={16} /></a
        >
        <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" aria-label="YouTube"
          ><Icon name="youtube" size={18} /></a
        >
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram"
          ><Icon name="instagram" size={17} /></a
        >
      </div>
    </div>
    <div>
      <h3>Products</h3>
      <ul>
        {#each productLines as line}<li>{line}</li>{/each}
      </ul>
    </div>
    <div>
      <h3>Quick links</h3>
      <ul>
        <li><a href="#about">About us</a></li>
        <li><a href="#products">Products</a></li>
        <li><a href="#videos">Videos</a></li>
        <li><a href="#callback">Request a callback</a></li>
      </ul>
    </div>
    <div>
      <h3>Contact</h3>
      <ul class="footer-contact">
        {#if data.settings.address}<li>
            <Icon name="pin" size={15} />{data.settings.address}
          </li>{/if}
        <li><Icon name="phone" size={15} /><a href={`tel:${phone}`}>{phoneLabel}</a></li>
        {#if data.settings.secondary_phone}<li>
            <Icon name="phone" size={15} /><a href={`tel:${data.settings.secondary_phone}`}
              >{formatPhone(data.settings.secondary_phone)}</a
            >
          </li>{/if}
        <li>
          <Icon name="mail" size={15} /><a href={`mailto:${data.settings.email}`}
            >{data.settings.email}</a
          >
        </li>
      </ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© {new Date().getFullYear()} {data.settings.business_name}. All rights reserved.</span>
    <span>Since 2004 · Delivery across India</span>
  </div>
</footer>

{#if activeProduct}
  {@const viewedProduct = activeProduct}
  {@const media = productMedia(viewedProduct)}
  {@const selectedMedia = media[activeMediaIndex] ?? media[0]}
  <div
    class="product-viewer"
    role="dialog"
    aria-modal="true"
    aria-label={`${viewedProduct.name} photos and video`}
  >
    <div class="viewer-stage">
      {#if selectedMedia?.type === 'image'}
        <img src={selectedMedia.src} alt={viewedProduct.name} />
      {:else if selectedMedia}
        <video src={selectedMedia.src} controls autoplay playsinline preload="metadata">
          <track kind="captions" src="/media/demo-captions.vtt" srclang="en" label="English" />
        </video>
      {/if}
      <button class="viewer-close" type="button" onclick={closeProduct} aria-label="Close">×</button
      >
      {#if media.length > 1}
        <button
          class="viewer-nav prev"
          type="button"
          onclick={() => showMedia(-1)}
          aria-label="Previous photo">‹</button
        >
        <button
          class="viewer-nav next"
          type="button"
          onclick={() => showMedia(1)}
          aria-label="Next photo">›</button
        >
        <span class="viewer-count">{activeMediaIndex + 1} / {media.length}</span>
      {/if}
    </div>
    <div class="viewer-side">
      <div class="viewer-thumbnails" aria-label="Choose photo or video">
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
      <div class="viewer-purchase">
        <h3>{viewedProduct.name}</h3>
        {#if viewedProduct.description}<p>{viewedProduct.description}</p>{/if}
        <div class="product-meta">
          <div>
            <span>Price</span><strong
              >{viewedProduct.price > 0 ? money(viewedProduct.price) : 'Ask price'}</strong
            >
          </div>
          <div>
            <span>Quantity</span><strong>{viewedProduct.stock}</strong>
          </div>
        </div>
        {@render cashOnDelivery()}
      </div>
    </div>
    <div class="viewer-actions">{@render contactActions(viewedProduct)}</div>
  </div>
{/if}

<a
  class="whatsapp-float"
  href={whatsappHref}
  target="_blank"
  rel="noreferrer"
  aria-label="Chat on WhatsApp"><Icon name="whatsapp" size={30} /></a
>

<nav class="mobile-dock" aria-label="Quick actions">
  <a href={`tel:${phone}`}><Icon name="phone" size={22} />Call us</a>
  <a href={whatsappHref} target="_blank" rel="noreferrer"
    ><Icon name="whatsapp" size={23} />WhatsApp</a
  >
</nav>
