(function () {
  var scriptTag = Array.from(document.scripts).find(function (script) {
    return /(^|\/)nav\.js($|\?)/.test(script.src);
  });
  var logoUrl = scriptTag ? new URL('ra_logo_gif_big.gif', scriptTag.src).href : 'ra_logo_gif_big.gif';
  var style = document.createElement('style');
  style.setAttribute('data-brand-mark', 'true');
  style.textContent = '.brand-mark{overflow:hidden;}.brand-mark img{display:block;width:100%;height:100%;object-fit:contain;border-radius:inherit;}.brand-mark svg{display:none;}';
  document.head.appendChild(style);

  function applyBrandMark() {
    document.querySelectorAll('.brand-mark').forEach(function (mark) {
      if (mark.querySelector('img.brand-mark-image')) return;
      var svg = mark.querySelector('svg');
      var img = document.createElement('img');
      img.src = logoUrl;
      img.alt = 'Renaissance Academy logo';
      img.className = 'brand-mark-image';
      img.loading = 'eager';
      if (svg) {
        mark.replaceChild(img, svg);
      } else {
        mark.appendChild(img);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBrandMark, { once: true });
  } else {
    applyBrandMark();
  }

  var header = document.querySelector('.header');
  var toggle = document.querySelector('.nav-toggle');
  if (!header || !toggle) return;
  function setOpen(open) {
    header.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () {
    setOpen(!header.classList.contains('open'));
  });
  header.querySelectorAll('.nav-menu a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();
