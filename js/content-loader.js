(function ($) {
  'use strict';

  var IMG = '';

  function img(p) { return p ? IMG + p : ''; }

  fetch('content.json')
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
    $('#intro-heading').hide();
    $('#intro-subheading').text(d.intro.subheading);
    $('#intro-text').text(d.intro.text);
    $('#intro-button').text(d.intro.button);

    // Services heading
    $('#services-heading').text(d.servicesHeading);

    // Services grid
    var $grid = $('#services-grid');
    d.services.forEach(function (svc, i) {
      var imgs = svc.images || (svc.image ? [svc.image] : []);
      var thumb = imgs[0] ? img(imgs[0]) : '';
      var imgRight = i % 2 === 1;

      var $item = $('<div class="col-12 mb-5">');
      var $row = $('<div class="row align-items-center">');

      // Sloupec s obrázkem
      var $imgCol = $('<div>').addClass('col-md-6 mb-3 mb-md-0').addClass(imgRight ? 'order-md-2' : '');
      if (thumb) {
        var $gallery = $('<div class="service-gallery" style="display:none">');
        imgs.forEach(function (src) {
          $gallery.append($('<a>').addClass('popup-gallery').attr('href', img(src)));
        });
        var $img = $('<img>').attr({ src: thumb, alt: svc.alt || svc.title }).css({
          width: '100%', height: '280px', objectFit: 'cover',
          borderRadius: '6px', cursor: imgs.length ? 'pointer' : 'default',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
        });
        $img.on('click', function () {
          $gallery.find('.popup-gallery').first().trigger('click');
        });
        $imgCol.append($img).append($gallery);
      }

      // Sloupec s textem
      var $textCol = $('<div>').addClass('col-md-6').addClass(imgRight ? 'order-md-1' : '');
      var padding = imgRight ? 'pr-md-4' : 'pl-md-4';
      var $inner = $('<div>').addClass(padding);
      $inner.append($('<h4 class="mb-3">').text(svc.title));
      $inner.append($('<p class="mb-0">').css({ lineHeight: '1.7' }).text(svc.text));
      $textCol.append($inner);

      $row.append($imgCol).append($textCol);
      $item.append($row);
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
