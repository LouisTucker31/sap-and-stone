// Mark JS as available before first paint so inactive pages stay hidden.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  var pages = document.querySelectorAll('[data-page]');
  var navLinks = document.querySelectorAll('[data-nav]');

  function pageFromHash() {
    var id = location.hash.slice(1);
    // Only page ids switch pages; any other hash (e.g. the skip link) is left alone.
    return document.querySelector('[data-page="' + CSS.escape(id) + '"]') ? id : null;
  }

  function show(id, moveFocus) {
    pages.forEach(function (page) {
      page.classList.toggle('is-active', page.dataset.page === id);
    });
    navLinks.forEach(function (link) {
      if (link.dataset.nav === id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    var active = document.querySelector('[data-page="' + id + '"]');
    document.title = active.dataset.title;
    window.scrollTo(0, 0);
    if (moveFocus) {
      var heading = active.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  // Handle in-page links here rather than letting the browser follow the hash.
  // Sandboxed previews (about:srcdoc) resolve "#gallery" against the parent URL and blank the frame.
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var id = link.getAttribute('href').slice(1);
    event.preventDefault();
    if (document.querySelector('[data-page="' + CSS.escape(id) + '"]')) {
      show(id, true);
      try {
        history.pushState({ page: id }, '', '#' + id);
      } catch (err) {
        // Some previews refuse history changes. The page still switches, only the URL stays put.
      }
      return;
    }
    var target = document.getElementById(id);
    if (target) target.focus();
  });

  function syncFromUrl() {
    show(pageFromHash() || 'home', true);
  }
  window.addEventListener('popstate', syncFromUrl);
  window.addEventListener('hashchange', syncFromUrl);
  show(pageFromHash() || 'home', false);
  // A direct link to #gallery or #contact makes the browser jump to that page's container,
  // hiding the header. Start at the top instead.
  window.addEventListener('load', function () {
    if (pageFromHash()) window.scrollTo(0, 0);
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  // Enquiry form
  var form = document.getElementById('enquiry');
  var status = document.getElementById('form-status');
  var fieldAlert = document.getElementById('field-alert');
  var messages = {
    name: 'Please enter your name.',
    email: 'Please enter a valid email address, for example name@example.com.',
    phone: 'Please use numbers, spaces, brackets or + only.',
    message: 'Please tell us a little about your garden (at least 10 characters).'
  };

  function checkField(input) {
    var error = document.getElementById(input.getAttribute('aria-describedby'));
    if (!error) return true;
    var ok = input.checkValidity();
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    error.textContent = ok ? '' : messages[input.name];
    return ok;
  }

  form.querySelectorAll('[aria-describedby]').forEach(function (input) {
    input.addEventListener('blur', function () {
      if (!input.value && input.getAttribute('aria-invalid') !== 'true') return;
      // Errors appear silently on screen, so read them out to screen readers too.
      fieldAlert.textContent = checkField(input) ? '' : messages[input.name];
    });
  });

  function fieldName(input) {
    return form.querySelector('label[for="' + input.id + '"]').firstChild.textContent.trim();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    status.textContent = '';
    fieldAlert.textContent = '';
    var invalid = [];
    form.querySelectorAll('[aria-describedby]').forEach(function (input) {
      if (!checkField(input)) invalid.push(input);
    });
    if (invalid.length) {
      status.textContent = 'Please check ' + (invalid.length === 1 ? 'this field' : 'these ' + invalid.length + ' fields') +
        ': ' + invalid.map(fieldName).join(', ') + '.';
      invalid[0].focus();
      return;
    }

    var endpoint = form.dataset.endpoint;
    if (!endpoint) {
      status.textContent = 'Thanks. This form is not connected to an inbox yet, so nothing was sent. Please email hello@sapandstone.co.uk in the meantime.';
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('Enquiry failed with status ' + response.status);
        form.reset();
        status.textContent = 'Thank you. Your enquiry has been sent and we will be in touch soon.';
      })
      .catch(function (err) {
        console.error(err);
        status.textContent = 'Sorry, your enquiry did not send. Please try again or email hello@sapandstone.co.uk.';
      })
      .finally(function () {
        button.disabled = false;
      });
  });
});
