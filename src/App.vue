<template>
  <div id="app">
    <nav id="nav">
      <router-link to="/global">Global Cases</router-link>
      <router-link to="/us">US Cases</router-link>
      <router-link to="/about">About</router-link>
    </nav>
    <div id="routerViewWrapper">
      <router-view />
    </div>
  </div>
</template>

<style lang="scss">
h1 {
  margin: 1rem;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  height: 100%;
}

#nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  line-height: 2rem;
  padding: 0.5rem 0 0;

  a {
    font-weight: bold;
    color: #5b80a4;
    margin: 0 1rem;
    white-space: nowrap;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

#routerViewWrapper {
  margin: 1rem;
}

#footer {
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 0;
  text-align: center;
  width: 100%;
  align-items: center;
  padding-bottom: 0.5rem;
}
</style>
