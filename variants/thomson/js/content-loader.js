(function ($) {
  'use strict';

  var IMG = '../../';

  function img(p) { return p ? IMG + p : ''; }

  fetch('../../content.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      fillContent(d);
      initPlugins();
    });

  function fillContent(d) {
    // Nav
    $('#nav-intro').text(d.nav.intro);
    $('#nav-services').text(d.nav.services);
    $('#nav-about').text(d.nav.about);
    $('#nav-references').text(d.nav.references);
    $('#nav-contact').text(d.nav.contact);

    // Intro / Hero
    $('#intro-heading').text(d.intro.heading);
    $('#intro-subheading').text(d.intro.subheading);
    $('#intro-text').text(d.intro.text);
    $('#intro-button').text(d.intro.button);

    // Services heading
    $('#services-heading').text(d.servicesHeading);

    // Services grid
    var $grid = $('#services-grid');
    d.services.forEach(function (svc) {
      var imgs = svc.images || (svc.image ? [svc.image] : []);
      var thumb = imgs[0] ? img(imgs[0]) : '';

      var $item = $('<div class="col-lg-4 col-6 mb-4 shuffle-item">');
      var $box = $('<div class="position-relative inner-box">');
      var $imgWrap = $('<div class="image position-relative">');

      if (thumb) {
        $imgWrap.append($('<img>').attr({ src: thumb, alt: svc.alt || svc.title, class: 'img-fluid w-100 d-block' }));
      }

      var shortDesc = svc.text.length > 110 ? svc.text.substring(0, 110) + '…' : svc.text;
      var $overlay = $('<div class="overlay-box"><div class="overlay-inner"><div class="overlay-content"><h5 class="mb-1">' + escHtml(svc.title) + '</h5><p class="mb-0 small">' + escHtml(shortDesc) + '</p></div></div></div>');
      $imgWrap.append($overlay);

      var $gallery = $('<div class="service-gallery" style="display:none">');
      imgs.forEach(function (src) {
        $gallery.append($('<a>').addClass('popup-gallery').attr('href', img(src)));
      });
      $imgWrap.append($gallery);

      $overlay.css('cursor', 'pointer').on('click', function () {
        $gallery.find('.popup-gallery').first().trigger('click');
      });

      $box.append($imgWrap);
      $item.append($box);
      $grid.append($item);
    });

    // About
    $('#about-heading').text(d.about.heading);
    $('#about-text').text(d.about.text);

    var $pillars = $('#pillars-grid');
    d.about.pillars.forEach(function (p) {
      var $col = $('<div class="col-lg-4">');
      var $item = $('<div class="service-item mb-5">');
      $item.append($('<i>').addClass('fas fa-' + p.icon));
      $item.append($('<h4 class="my-3">').text(p.title));
      $item.append($('<p>').text(p.text));
      $col.append($item);
      $pillars.append($col);
    });

    // Team
    var $team = $('#team-grid');
    d.about.founders.forEach(function (f) {
      var $col = $('<div class="col-lg-6 mb-5">');
      var $card = $('<div class="d-flex align-items-start team-card">');
      var $icon = $('<div class="team-icon mr-4"><i class="fas fa-' + f.icon + ' fa-2x text-color"></i></div>');
      var $info = $('<div>');
      $info.append($('<h4 class="mb-1">').text(f.name));
      $info.append($('<p class="text-muted mb-2 small letter-spacing">').text(f.role));
      $info.append($('<p>').text(f.bio));
      $card.append($icon).append($info);
      $col.append($card);
      $team.append($col);
    });

    // References
    $('#references-heading').text(d.references.heading);
    var $refs = $('#references-grid');
    d.references.projects.forEach(function (p) {
      var $col = $('<div class="col-lg-4 col-md-6 mb-4">');
      var $card = $('<div class="reference-card p-4 h-100">');
      if (p.year) $card.append($('<span class="ref-year float-right">').text(p.year));
      $card.append($('<span class="ref-tag mb-3 d-inline-block">').text(p.tag));
      $card.append($('<h5 class="mb-2">').text(p.client));
      $card.append($('<p class="mb-0">').text(p.task));
      $col.append($card);
      $refs.append($col);
    });

    // Contact
    $('#contact-heading').text(d.contact.heading);
    $('#contact-intro').text(d.contact.intro);
    $('#contact-email').text(d.contact.email).attr('href', 'mailto:' + d.contact.email);
    $('#contact-phone').text(d.contact.phone).attr('href', 'tel:' + d.contact.phone.replace(/\s/g, ''));

    // Footer
    $('#footer-copyright').html(d.footer.copyright);
  }

  function initPlugins() {
    AOS.init({ once: true });
    AOS.refresh();
    $('#services-grid').find('.service-gallery').each(function () {
      $(this).find('.popup-gallery').magnificPopup({
        type: 'image',
        gallery: { enabled: true }
      });
    });
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})(jQuery);
