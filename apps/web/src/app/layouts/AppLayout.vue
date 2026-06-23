<template>
  <main class="shell">
    <RouterView />
  </main>
</template>

<style scoped lang="scss">
.shell {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
  padding: 40px 0;
}

@media (max-width: 900px) {
  .shell {
    width: min(100% - 28px, 680px);
    padding: 28px 0;
  }
}
</style>
