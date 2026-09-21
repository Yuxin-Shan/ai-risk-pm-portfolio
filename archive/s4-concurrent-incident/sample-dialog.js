(() => {
  const toast = document.querySelector('.toast');
  const runLabel = document.querySelector('[data-run-label]');
  const runState = document.querySelector('[data-run-state]');
  const pauseButton = document.querySelector('[data-action="pause"]');
  const params = document.querySelector('.param-panel');
  const textarea = document.querySelector('textarea');

  let toastTimer;
  const notify = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
  };

  document.querySelector('[data-action="evidence"]').addEventListener('click', (event) => {
    const card = event.currentTarget.closest('.evidence-card');
    const open = card.classList.toggle('open');
    event.currentTarget.setAttribute('aria-expanded', String(open));
    event.currentTarget.querySelector('[data-caret]').textContent = open ? '收起 ↑' : '展开 ↓';
  });

  pauseButton.addEventListener('click', () => {
    const paused = runState.dataset.paused === 'true';
    runState.dataset.paused = String(!paused);
    runLabel.textContent = paused ? '执行中 · 2/4' : '已暂停 · 2/4';
    pauseButton.textContent = paused ? '暂停' : '继续';
    notify(paused ? '任务已继续，保留原执行上下文' : '任务已静默暂停，已完成结果不会丢失');
  });

  document.querySelector('[data-action="params"]').addEventListener('click', () => {
    params.classList.toggle('open');
  });

  document.querySelector('[data-action="save-params"]').addEventListener('click', () => {
    params.classList.remove('open');
    notify('参数已更新；第 2 组将按新参数重跑');
  });

  document.querySelector('[data-action="send"]').addEventListener('click', () => {
    const text = textarea.value.trim();
    notify(text ? '样张反馈：已接收追加需求' : '请先输入需求');
    if (text) textarea.value = '';
  });

  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      textarea.value = button.dataset.prompt;
      textarea.focus();
    });
  });

  document.querySelectorAll('.nav-item:not(.active), .object-item').forEach((button) => {
    button.addEventListener('click', () => notify('样张范围：此入口将在高保真原型阶段接通'));
  });
})();

