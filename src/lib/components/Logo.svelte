<script lang="ts">
  let {
    tagline = 'Enterprises',
    tone = 'dark',
    href = '/'
  }: { tagline?: string; tone?: 'dark' | 'light'; href?: string } = $props();
</script>

<a class="brand" class:light={tone === 'light'} {href} aria-label="Naazare Enterprises home">
  <img
    class="brand-mark"
    src={tone === 'light' ? '/brand/naazare-mark-light.svg' : '/brand/naazare-mark.svg'}
    alt=""
    width="48"
    height="48"
  />
  <span class="brand-name"><strong>Naazare</strong><small>{tagline}</small></span>
</a>
