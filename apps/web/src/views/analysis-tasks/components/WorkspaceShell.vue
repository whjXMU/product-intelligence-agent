<template>
  <section class="shell" aria-label="Agent 工作台">
    <aside class="sidebar" aria-label="导航">
      <slot name="sidebar" />
    </aside>

    <main class="main" aria-label="工作区">
      <slot name="main" />
    </main>

    <aside class="aside" aria-label="调试信息">
      <slot name="aside" />
    </aside>
  </section>
</template>

<style scoped lang="scss">
.shell {
  display: grid;
  grid-template-columns: minmax(260px, 0.7fr) minmax(0, 1.4fr) minmax(280px, 0.8fr);
  align-items: start;
  gap: 18px;
  margin-top: 22px;
}

.sidebar,
.main,
.aside {
  min-width: 0;
}

@media (max-width: 1180px) {
  .shell {
    grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.2fr);
  }

  .aside {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .aside {
    grid-column: auto;
  }
}
</style>
