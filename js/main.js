// Loaded with defer, so the DOM is ready. Wrapped to keep these names out of the global scope.
(function () {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Enquiry form, contact page only
  var form = document.getElementById('enquiry');
  if (!form) return;

  var status = document.getElementById('form-status');
  var fieldAlert = document.getElementById('field-alert');
  var messages = {
    name: 'Enter your name',
    email: 'Enter an email address in the correct format, like name@example.com',
    phone: 'Enter a phone number using only numbers, spaces, brackets or +',
    message: 'Tell us about your garden in at least 10 characters'
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
      status.textContent = 'Check ' + (invalid.length === 1 ? 'this field' : 'these ' + invalid.length + ' fields') +
        ': ' + invalid.map(fieldName).join(', ') + '.';
      invalid[0].focus();
      return;
    }

    var endpoint = form.dataset.endpoint;
    if (!endpoint) {
      status.textContent = 'This is a preview of the site, so enquiries are not sent yet. Email hello@sapandstone.co.uk instead.';
      return;
    }

    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('Enquiry failed with status ' + response.status);
        form.reset();
        status.textContent = 'Thank you. Your enquiry has been sent, and we will reply within two working days.';
      })
      .catch(function (err) {
        console.error(err);
        status.textContent = 'Sorry, your enquiry did not send. Try again, or email hello@sapandstone.co.uk.';
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
