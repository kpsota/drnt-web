(function () {
  'use strict';

  var IMG = '../';

  function img(p) { return p ? IMG + p : ''; }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  fetch('../content.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      fillNav(d.nav);
      fillHero(d.intro);
      fillServices(d.servicesHeading, d.about.text, d.services);
      fillPortfolio(d.references.heading, d.about.heading, d.services);
      fillTeam(d.about.founders);
      fillContact(d.contact);
      document.getElementById('footer-copyright').innerHTML = d.footer.copyright;
      initLightbox();
    });

  function fillNav(nav) {
    document.getElementById('nav-intro').textContent = nav.intro;
    document.getElementById('nav-services').textContent = nav.services;
    document.getElementById('nav-references').textContent = nav.references;
    document.getElementById('nav-about').textContent = nav.about;
    document.getElementById('nav-contact').textContent = nav.contact;
  }

  function fillHero(intro) {
    document.getElementById('hero-heading').textContent = intro.heading;
    document.getElementById('hero-subheading').textContent = intro.subheading;
    document.getElementById('hero-text').textContent = intro.text;
    document.getElementById('hero-button').textContent = intro.button;
    // Use first ortho image as hero illustration
    document.getElementById('hero-img').src = img('images/ortho_1_web.jpg');
    document.getElementById('hero-img').style.objectFit = 'cover';
    document.getElementById('hero-img').style.borderRadius = '4px';
  }

  function fillServices(heading, aboutText, services) {
    document.getElementById('services-heading').textContent = heading;
    document.getElementById('services-subheading').textContent = aboutText;

    var grid = document.getElementById('services-grid');
    services.forEach(function (svc) {
      var col = document.createElement('div');
      col.className = 'flex-shrink px-4 max-w-full w-full sm:w-1/2 lg:w-1/3 lg:px-6 wow fadeInUp';
      col.innerHTML =
        '<div class="py-8 px-12 mb-12 bg-gray-50 border-b border-gray-100 transform transition duration-300 ease-in-out hover:-translate-y-2">' +
          '<div class="inline-block text-gray-900 mb-4 text-3xl"><i class="fas fa-drone-alt"></i></div>' +
          '<h3 class="text-lg leading-normal mb-2 font-semibold text-black">' + esc(svc.title) + '</h3>' +
          '<p class="text-gray-500">' + esc(svc.text.substring(0, 120)) + '…</p>' +
        '</div>';
      grid.appendChild(col);
    });
  }

  function fillPortfolio(heading, subheading, services) {
    document.getElementById('portfolio-heading').textContent = heading;
    document.getElementById('portfolio-intro').textContent = subheading;

    var grid = document.getElementById('portfolio-grid');

    // Collect all service images as portfolio items
    var items = [];
    services.forEach(function (svc) {
      var imgs = svc.images || (svc.image ? [svc.image] : []);
      imgs.forEach(function (src) {
        items.push({ src: src, title: svc.title, tag: svc.alt || svc.title });
      });
    });

    items.forEach(function (item, i) {
      var figure = document.createElement('figure');
      figure.className = 'flex-shrink max-w-full px-3 w-full sm:w-1/2 lg:w-1/5 group wow fadeInUp';
      figure.innerHTML =
        '<div class="relative overflow-hidden cursor-pointer mb-6">' +
          '<a href="' + esc(img(item.src)) + '" data-gallery="gallery1" class="glightbox3">' +
            '<img class="block w-full h-auto transform duration-500 grayscale hover:scale-125" ' +
              'src="' + esc(img(item.src)) + '" alt="' + esc(item.title) + '" style="height:160px;object-fit:cover;">' +
            '<div class="absolute inset-x-0 bottom-0 h-16 transition-opacity duration-500 ease-in opacity-0 group-hover:opacity-100 px-4 py-2 text-gray-100 bg-black text-center">' +
              '<p class="text-sm font-semibold my-1 text-white">' + esc(item.title) + '</p>' +
            '</div>' +
          '</a>' +
        '</div>';
      grid.appendChild(figure);
    });
  }

  function fillTeam(founders) {
    var grid = document.getElementById('team-grid');
    founders.forEach(function (f) {
      var col = document.createElement('div');
      col.className = 'flex-shrink max-w-full px-4 w-2/3 sm:w-1/2 md:w-5/12 lg:w-1/4 xl:px-6';
      col.innerHTML =
        '<div class="relative overflow-hidden bg-white mb-12 wow fadeInUp">' +
          '<div class="relative overflow-hidden px-6 py-8 text-center">' +
            '<div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">' +
              '<i class="fas fa-' + esc(f.icon) + ' fa-3x text-gray-600"></i>' +
            '</div>' +
            '<p class="text-lg leading-normal font-bold mb-1">' + esc(f.name) + '</p>' +
            '<p class="text-gray-500 leading-relaxed font-light mb-3">' + esc(f.role) + '</p>' +
            '<p class="text-gray-500 text-sm leading-relaxed">' + esc(f.bio) + '</p>' +
          '</div>' +
        '</div>';
      grid.appendChild(col);
    });
  }

  function fillContact(contact) {
    document.getElementById('contact-heading').textContent = contact.heading;
    document.getElementById('contact-intro').textContent = contact.intro;
    var emailEl = document.getElementById('contact-email');
    emailEl.textContent = contact.email;
    emailEl.href = 'mailto:' + contact.email;
    var phoneEl = document.getElementById('contact-phone');
    phoneEl.textContent = contact.phone;
    phoneEl.href = 'tel:' + contact.phone.replace(/\s/g, '');
  }

  function initLightbox() {
    if (typeof GLightbox !== 'undefined') {
      GLightbox({ selector: '.glightbox3', touchNavigation: true, loop: true });
    }
  }

})();
