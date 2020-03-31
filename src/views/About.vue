<template>
  <div id="about">
    <h1>About</h1>
    <div>
      <section>
        <h2>References</h2>
        <p>
          <a href="https://github.com/CSSEGISandData/COVID-19" target="_blank"
            >Data</a
          >&nbsp;adapted from the CSSE at Johns Hopkins University
        </p>
      </section>
      <section>
        <h2>Disclaimer</h2>
        <p>
          Information intended only for personal use and not guaranteed for
          business or government decision-making
        </p>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#about {
  @include borderStyle();
  display: flex;
  flex-wrap: wrap;
  padding: 1rem;
  flex-direction: column;
  align-items: center;
  text-align: left;

  max-width: 650px;
  margin: auto;
}
</style>
