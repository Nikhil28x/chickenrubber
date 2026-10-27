<script lang="ts">
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Admin sign in | Raghav</title></svelte:head>

<main class="login-shell">
  <section class="login-card">
    <a class="brand" href="/">
      <span class="brand-mark">R</span>
      <span><strong>Raghav admin</strong><small>Store control</small></span>
    </a>
    <div class="login-copy">
      <p class="eyebrow-text">Private access</p>
      <h1>Welcome back.</h1>
      <p>Sign in to edit products, contact details and view orders.</p>
    </div>
    <form method="POST">
      <label class="admin-field"
        ><span>Username</span><input
          name="username"
          value={form?.username ?? ''}
          required
          autocomplete="username"
        /></label
      >
      <label class="admin-field"
        ><span>Password</span><input
          name="password"
          type="password"
          required
          autocomplete="current-password"
        /></label
      >
      {#if form?.error}<p class="form-error">{form.error}</p>{/if}
      <button class="button primary" type="submit">Sign in</button>
    </form>
    <a class="back-link" href="/">← Back to website</a>
  </section>
</main>

<style>
  .login-shell {
    display: grid;
    min-height: 100svh;
    place-items: center;
    padding: 24px;
    background:
      radial-gradient(circle at top right, rgba(255, 255, 255, 0.12), transparent 34%), #0a0a0a;
  }
  .login-card {
    width: min(100%, 440px);
    padding: 28px;
    border-radius: 26px;
    background: white;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
  }
  .login-copy {
    margin: 48px 0 24px;
  }
  h1 {
    margin: 8px 0 10px;
    color: var(--navy);
    font-size: 3rem;
    letter-spacing: -0.06em;
  }
  .login-copy > p:last-child {
    color: var(--muted);
    line-height: 1.55;
  }
  form {
    display: grid;
    gap: 16px;
  }
  form .button {
    margin-top: 4px;
  }
  .back-link {
    display: block;
    margin-top: 22px;
    color: var(--blue);
    font-size: 0.82rem;
    font-weight: 750;
    text-align: center;
  }
</style>
