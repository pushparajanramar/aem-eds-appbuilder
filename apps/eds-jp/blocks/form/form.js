import { annotateBlock, annotateField, getCFPath, buildAEMUrn } from '../../ue/instrumentation.js';

export default function decorate(block) {
  const cfPath = getCFPath(block);
  annotateBlock(block, {
    resource: buildAEMUrn(cfPath),
    type: 'component',
    model: 'form',
    label: 'Form',
  });

  window.adobeDataLayer = window.adobeDataLayer || [];

  const rows = [...block.children];
  const formEl = document.createElement('form');
  formEl.className = 'form__fields';
  formEl.setAttribute('novalidate', '');

  const formId = block.dataset.formId || `form-${Date.now()}`;
  const actionRow = rows.find((r) => r.querySelector('a'));
  const action = actionRow?.querySelector('a')?.href || '#';
  formEl.setAttribute('action', action);
  formEl.setAttribute('id', formId);

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const labelText = cells[0]?.textContent.trim();
    const fieldType = cells[1]?.textContent.trim().toLowerCase() || 'text';
    if (!labelText || labelText === action) return;

    const group = document.createElement('div');
    group.className = 'form__group';

    const id = `field-${i}`;
    const label = document.createElement('label');
    label.className = 'form__label form__label--required';
    label.setAttribute('for', id);
    label.textContent = labelText;
    annotateField(label, { prop: `label-${i}`, type: 'text', label: `Field Label ${i}` });

    let input;
    if (fieldType === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'form__textarea';
    } else {
      input = document.createElement('input');
      input.type = fieldType === 'email' ? 'email' : 'text';
      input.className = 'form__input';
    }
    input.id = id;
    input.name = id;
    input.setAttribute('aria-required', 'true');
    input.setAttribute('aria-describedby', `${id}-error`);

    const error = document.createElement('span');
    error.className = 'form__error';
    error.id = `${id}-error`;
    error.setAttribute('role', 'alert');
    error.textContent = `${labelText} is required.`;

    group.append(label, input, error);
    formEl.append(group);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'form__submit';
  submitBtn.textContent = 'Submit';
  formEl.append(submitBtn);

  const message = document.createElement('div');
  message.className = 'form__message';
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;
    formEl.querySelectorAll('.form__group').forEach((g) => {
      const inp = g.querySelector('input, textarea');
      if (inp && inp.getAttribute('aria-required') === 'true' && !inp.value.trim()) {
        g.classList.add('form__group--error');
        valid = false;
      } else if (inp) {
        g.classList.remove('form__group--error');
      }
    });

    if (!valid) {
      window.adobeDataLayer.push({ event: 'component:form:error', component: { formId, action } });
      return;
    }

    try {
      submitBtn.disabled = true;
      const formData = new FormData(formEl);
      const resp = await fetch(action, { method: 'POST', body: formData });
      if (resp.ok) {
        message.className = 'form__message form__message--success';
        message.textContent = 'Thank you! Your submission was received.';
        formEl.reset();
        window.adobeDataLayer.push({ event: 'component:form:submit', component: { formId, action } });
      } else {
        throw new Error('Server error');
      }
    } catch {
      message.className = 'form__message form__message--error';
      message.textContent = 'Something went wrong. Please try again.';
      window.adobeDataLayer.push({ event: 'component:form:error', component: { formId, action } });
    } finally {
      submitBtn.disabled = false;
    }
  });

  block.textContent = '';
  block.append(formEl, message);
}
