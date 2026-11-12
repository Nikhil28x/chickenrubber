<script lang="ts">
  import Logo from '../../../lib/components/Logo.svelte';
  import type { ActionData } from './$types';
  let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Admin sign in | Raghav Kitchen Equipments</title></svelte:head>

<main class="login-shell">
  <section class="login-card">
    <Logo tagline="Store admin" />
    <div class="login-copy">
      <p class="eyebrow-text">Private access</p>
      <h1>Welcome back.</h1>
      <p>Sign in to manage callback requests, product frames and business details.</p>
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
      radial-gradient(circle at top right, rgba(226, 184, 79, 0.18), transparent 40%), var(--deep);
  }
  .login-card {
    width: min(100%, 440px);
    padding: 28px;
    border-radius: 26px;
    background: var(--surface);
    box-shadow: var(--shadow-lg);
  }
  .login-copy {
    margin: 48px 0 24px;
  }
  h1 {
    margin: 8px 0 10px;
    color: var(--navy);
    font-family: var(--display);
    font-size: 3rem;
    line-height: 1;
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
