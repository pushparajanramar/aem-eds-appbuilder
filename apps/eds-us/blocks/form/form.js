/*
 * Form Block
 * Render and handle form submissions
 */

function constructPayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== 'submit' && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) {
          if (payload[field.name]) {
            payload[field.name] += `, ${field.value}`;
          } else {
            payload[field.name] = field.value;
          }
        }
      } else {
        payload[field.name] = field.value;
      }
    }
  });

  return payload;
}

async function submitForm(form) {
  const payload = constructPayload(form);
  const response = await fetch(form.dataset.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  });

  if (response.ok) {
    // Form submitted successfully
    if (form.dataset.redirect) {
      window.location.href = form.dataset.redirect;
    } else {
      form.innerHTML = '<div class="form-confirmation">Thank you for your submission!</div>';
    }
  } else {
    // Show error
    const error = form.querySelector('.form-error') || document.createElement('div');
    error.className = 'form-error';
    error.textContent = 'There was an error submitting the form. Please try again.';
    if (!form.querySelector('.form-error')) {
      form.prepend(error);
    }
  }
}

function createField(fd) {
  const {
    Type, Field, Label, Placeholder, Mandatory,
  } = fd;

  const fieldWrapper = document.createElement('div');
  fieldWrapper.className = 'field-wrapper';

  let field;

  switch (Type) {
    case 'select':
      field = document.createElement('select');
      field.id = Field;
      field.name = Field;
      break;
    case 'textarea':
      field = document.createElement('textarea');
      field.id = Field;
      field.name = Field;
      field.placeholder = Placeholder || '';
      break;
    case 'checkbox':
    case 'radio':
      field = document.createElement('input');
      field.type = Type;
      field.id = Field;
      field.name = Field;
      field.value = Field;
      break;
    default:
      field = document.createElement('input');
      field.type = Type || 'text';
      field.id = Field;
      field.name = Field;
      field.placeholder = Placeholder || '';
  }

  if (Mandatory && Mandatory.toLowerCase() === 'true') {
    field.setAttribute('required', 'required');
  }

  const label = document.createElement('label');
  label.setAttribute('for', Field);
  label.textContent = Label || Field;

  if (Type === 'checkbox' || Type === 'radio') {
    fieldWrapper.append(field, label);
  } else {
    fieldWrapper.append(label, field);
  }

  return fieldWrapper;
}

export default async function decorate(block) {
  const form = document.createElement('form');
  const rows = [...block.children];

  // First row contains form metadata
  const formData = {};
  if (rows.length > 0 && rows[0].children.length === 2) {
    const metaRow = rows.shift();
    [...metaRow.children[0].querySelectorAll('p')].forEach((p, idx) => {
      const key = p.textContent.trim();
      const value = metaRow.children[1].querySelectorAll('p')[idx]?.textContent.trim();
      if (key && value) formData[key] = value;
    });
  }

  form.dataset.action = formData.Action || '/submit';
  if (formData.Redirect) form.dataset.redirect = formData.Redirect;

  // Remaining rows are form fields
  rows.forEach((row) => {
    const fieldData = {};
    [...row.children].forEach((cell, idx) => {
      const headers = ['Type', 'Field', 'Label', 'Placeholder', 'Mandatory'];
      fieldData[headers[idx]] = cell.textContent.trim();
    });

    if (fieldData.Type === 'submit') {
      const button = document.createElement('button');
      button.textContent = fieldData.Label || 'Submit';
      button.type = 'submit';
      button.classList.add('button', 'primary');
      form.append(button);
    } else if (fieldData.Field) {
      form.append(createField(fieldData));
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submitForm(form).finally(() => {
      submit.disabled = false;
    });
  });

  block.textContent = '';
  block.append(form);
}
