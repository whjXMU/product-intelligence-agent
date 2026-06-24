<template>
  <section class="shell" aria-label="Agent 工作台">
    <aside class="shell-sidebar" aria-label="导航">
      <slot name="sidebar" />
    </aside>

    <main class="shell-main" aria-label="会话内容">
      <slot name="main" />
    </main>

    <aside class="shell-aside" aria-label="排查区">
      <slot name="aside" />
    </aside>
  </section>
</template>

<style scoped lang="scss">
$sidebar-width: 320px;
$aside-width: 360px;

.shell {
  display: flex;
  gap: 18px;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  padding: 16px;
  background: var(--color-page);
}

.shell-sidebar,
.shell-main,
.shell-aside {
  min-width: 0;
  height: 100%;
  overflow-y: auto;
}

.shell-sidebar {
  flex: 0 0 $sidebar-width;
}

.shell-main {
  flex: 1 1 auto;
  padding: 0;
}

.shell-aside {
  flex: 0 0 $aside-width;
}

@media (max-width: 1180px) {
  .shell {
    flex-wrap: wrap;
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .shell-sidebar {
    flex-basis: $sidebar-width;
  }

  .shell-main {
    flex: 1 1 calc(100% - $sidebar-width - 18px);
  }

  .shell-aside {
    flex: 1 1 100%;
    height: auto;
  }
}

@media (max-width: 900px) {
  .shell {
    display: block;
  }

  .shell-sidebar,
  .shell-main,
  .shell-aside {
    height: auto;
    overflow: visible;
  }

  .shell-main,
  .shell-aside {
    margin-top: 14px;
  }
}
</style>
