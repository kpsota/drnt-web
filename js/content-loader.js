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

      var $item = $('<div class="col-lg-4 col-md-6 mb-4">');
      var $card = $('<div class="svc-card position-relative overflow-hidden" style="min-height:280px;cursor:pointer;">');

      // Fotka v pozadí – viditelná, lehce ztlumená
      if (thumb) {
        $card.append(
          $('<img>').attr({ src: thumb, alt: '' }).css({
            position: 'absolute', inset: '0', width: '100%', height: '100%',
            objectFit: 'cover', filter: 'grayscale(60%) brightness(0.62)'
          })
        );
      }

      // Jemný světlý overlay (stejný tón jako hero sekce)
      $card.append($('<div>').css({
        position: 'absolute', inset: '0',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.32))'
      }));

      // Text v popředí – tmavý pro čitelnost na světlejším pozadí
      var $text = $('<div>').css({
        position: 'relative', zIndex: 1, padding: '1.5rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '280px'
      });
      $text.append($('<h4>').css({ color: '#fff', marginBottom: '0.5rem', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }).text(svc.title));
      $text.append($('<p>').css({ color: 'rgba(255,255,255,0.9)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: 0, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }).text(svc.text));
      $card.append($text);

      // Skryté linky pro lightbox
      var $gallery = $('<div class="service-gallery" style="display:none">');
      imgs.forEach(function (src) {
        $gallery.append($('<a>').addClass('popup-gallery').attr('href', img(src)));
      });
      $card.append($gallery);

      $card.on('click', function () {
        $gallery.find('.popup-gallery').first().trigger('click');
      });

      $item.append($card);
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
