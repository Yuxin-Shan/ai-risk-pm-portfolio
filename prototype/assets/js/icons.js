      const content = document.querySelector('#content');
      const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
      const badge = (label, kind='running') => `<span class="badge ${kind}">${label}</span>`;
