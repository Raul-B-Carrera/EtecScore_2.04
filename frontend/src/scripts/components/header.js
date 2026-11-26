const iconSearch = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg>`;

export function renderHeader(activePage) {
  const links = [
    { page: 'dashboard', href: 'index.html', label: 'Dashboard' },
    { page: 'teams', href: 'equipes.html', label: 'Equipes' },
    { page: 'bracket', href: 'mata-mata.html', label: 'Mata-Mata' }
  ];
  const linkMarkup = links.map((link) => `<a class="nav-link ${activePage === link.page ? 'is-active' : ''}" href="./${link.href}" ${activePage === link.page ? 'aria-current="page"' : ''}>${link.label}</a>`).join('');
  return `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="./index.html" aria-label="EtecScore — início">
          <span class="brand-line"><span class="brand-name">EtecScore</span><span class="brand-bar"></span></span>
          <span class="brand-subtitle">2º Desenvolvimento de Sistemas</span>
        </a>
        <nav class="main-nav" aria-label="Navegação principal">${linkMarkup}</nav>
        <div class="header-actions">
          <button class="search-trigger" type="button" data-open-search aria-label="Pesquisar (Ctrl ou Command + K)">${iconSearch}<kbd>⌘ + K</kbd></button>
          <a class="button button-dark" href="./mata-mata.html">Explorar <span aria-hidden="true">↗</span></a>
          <button class="icon-button mobile-menu-button" type="button" data-mobile-menu aria-label="Abrir menu" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
        </div>
      </div>
      <nav class="mobile-nav" id="mobile-nav" aria-label="Navegação mobile">${linkMarkup}</nav>
    </header>`;
}

export function initHeader(activePage) {
  const mount = document.getElementById('header-mount');
  if (!mount) return;
  mount.innerHTML = renderHeader(activePage);
  mount.querySelector('[data-mobile-menu]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    const nav = mount.querySelector('#mobile-nav');
    const isOpen = nav.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });
}
