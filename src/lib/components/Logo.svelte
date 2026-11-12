<script lang="ts">
  let {
    tagline = 'A unit of Naazare Enterprises',
    tone = 'dark',
    href = '/'
  }: { tagline?: string; tone?: 'dark' | 'light'; href?: string } = $props();
</script>

<a class="brand" class:light={tone === 'light'} {href} aria-label="Raghav Kitchen Equipments home">
  <img
    class="brand-mark"
    src={tone === 'light' ? '/brand/rk-mark-light.svg' : '/brand/rk-mark.svg'}
    alt=""
    width="48"
    height="48"
  />
  <span class="brand-name"><strong>Raghav Kitchen Equipments</strong><small>{tagline}</small></span>
</a>
