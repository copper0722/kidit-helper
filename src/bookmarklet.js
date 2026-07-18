(function () {
  'use strict';

  var VERSION = '0.1.0';
  var TARGET_HOST = 'www.kidit-tsn.org.tw';
  var TEST_MODE = window.__KIDIT_HELPER_TEST__ === true;
  var FIELD_LABELS = {
    COUNTY: '搜尋縣市',
    REALM: '搜尋區鄉市鎮',
    MAILNO: '搜尋郵遞區號',
    STREET: '搜尋路街'
  };

  function stop(message) {
    window.alert('KiDit 小幫手：' + message);
  }

  if (!TEST_MODE && window.location.hostname !== TARGET_HOST) {
    stop('請先登入 www.kidit-tsn.org.tw，再點這個書籤。');
    return;
  }

  if (!TEST_MODE && !/^\/Patient\/(Create|Edit)$/.test(window.location.pathname)) {
    stop('目前只支援 KiDit 的病人新增／編輯頁。');
    return;
  }

  var patientForm = document.querySelector('form[action="/Patient/SaveDeleteCancel"]');
  if (!patientForm) {
    stop('找不到預期的病人表單；KiDit 可能已改版，工具未執行。');
    return;
  }

  var alreadyEnabled = document.querySelector('.kd-helper-wrap');
  if (alreadyEnabled) {
    var existingInput = alreadyEnabled.querySelector('input[type="search"]');
    if (existingInput) existingInput.focus();
    return;
  }

  var style = document.createElement('style');
  style.id = 'kd-helper-style';
  style.textContent = [
    '.kd-helper-wrap{position:relative;margin:6px 0 10px;max-width:360px;font-family:Arial,"Noto Sans TC",sans-serif}',
    '.kd-helper-label{display:block;margin-bottom:4px;color:#164e63;font-size:14px;font-weight:700}',
    '.kd-helper-search{box-sizing:border-box;width:100%;min-height:44px;padding:9px 12px;border:2px solid #0e7490;border-radius:7px;background:#fff;color:#17202a;font-size:16px;line-height:1.4}',
    '.kd-helper-search:focus{outline:3px solid #fbbf24;outline-offset:2px}',
    '.kd-helper-menu{position:absolute;z-index:2147483646;left:0;right:0;max-height:300px;overflow:auto;margin:3px 0 0;padding:4px;border:1px solid #64748b;border-radius:7px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.22)}',
    '.kd-helper-menu[hidden]{display:none}',
    '.kd-helper-option{display:block;box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:0;border-radius:5px;background:#fff;color:#17202a;text-align:left;font-size:16px;cursor:pointer}',
    '.kd-helper-option:hover,.kd-helper-option.is-active{background:#cffafe;color:#164e63}',
    '.kd-helper-option:focus{outline:3px solid #fbbf24;outline-offset:-3px}',
    '.kd-helper-note{display:block;margin-top:3px;color:#475569;font-size:12px}',
    '#kd-helper-toast{position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;align-items:center;gap:10px;max-width:330px;padding:10px 12px;border:2px solid #0e7490;border-radius:8px;background:#ecfeff;color:#164e63;box-shadow:0 8px 24px rgba(15,23,42,.25);font:700 14px/1.4 Arial,"Noto Sans TC",sans-serif}',
    '#kd-helper-toast button{min-width:44px;min-height:44px;border:0;border-radius:6px;background:#0e7490;color:#fff;font-size:20px;cursor:pointer}',
    '#kd-helper-toast button:focus{outline:3px solid #fbbf24;outline-offset:2px}'
  ].join('');
  document.head.appendChild(style);

  function normalized(value) {
    return String(value || '').toLocaleLowerCase('zh-TW').replace(/\s+/g, ' ').trim();
  }

  function searchableOptions(select) {
    return Array.prototype.slice.call(select.options).filter(function (option) {
      return option.value !== '' && normalized(option.textContent) !== '';
    });
  }

  function enhanceSelect(select) {
    if (!select || select.dataset.kdHelper === VERSION || select.options.length < 7) return false;

    select.dataset.kdHelper = VERSION;
    var wrap = document.createElement('div');
    wrap.className = 'kd-helper-wrap';
    wrap.dataset.for = select.id;

    var label = document.createElement('label');
    var inputId = 'kd-helper-' + select.id;
    label.className = 'kd-helper-label';
    label.htmlFor = inputId;
    label.textContent = FIELD_LABELS[select.id] || ('搜尋' + select.id);

    var input = document.createElement('input');
    input.id = inputId;
    input.className = 'kd-helper-search';
    input.type = 'search';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = '輸入關鍵字';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');

    var menu = document.createElement('div');
    menu.id = inputId + '-list';
    menu.className = 'kd-helper-menu';
    menu.hidden = true;
    menu.setAttribute('role', 'listbox');
    input.setAttribute('aria-controls', menu.id);

    var note = document.createElement('span');
    note.className = 'kd-helper-note';
    note.setAttribute('aria-live', 'polite');
    note.textContent = '原下拉選單仍保留；本工具不會自動送出。';

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(menu);
    wrap.appendChild(note);
    select.parentNode.insertBefore(wrap, select);

    var matches = [];
    var activeIndex = -1;

    function closeMenu() {
      menu.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }

    function choose(option) {
      option.selected = true;
      input.value = option.textContent.trim();
      note.textContent = '已選：' + input.value + '。請確認原下拉選單後，再由人工存檔。';
      closeMenu();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function setActive(index) {
      var buttons = menu.querySelectorAll('.kd-helper-option');
      if (!buttons.length) return;
      activeIndex = (index + buttons.length) % buttons.length;
      Array.prototype.forEach.call(buttons, function (button, buttonIndex) {
        button.classList.toggle('is-active', buttonIndex === activeIndex);
      });
      input.setAttribute('aria-activedescendant', buttons[activeIndex].id);
      buttons[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function render() {
      var query = normalized(input.value);
      menu.textContent = '';
      activeIndex = -1;
      if (!query) {
        note.textContent = '原下拉選單仍保留；本工具不會自動送出。';
        closeMenu();
        return;
      }

      matches = searchableOptions(select).filter(function (option) {
        return normalized(option.textContent).indexOf(query) !== -1;
      }).slice(0, 12);

      if (!matches.length) {
        note.textContent = '找不到符合「' + input.value + '」的選項。';
        closeMenu();
        return;
      }

      matches.forEach(function (option, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.id = menu.id + '-option-' + index;
        button.className = 'kd-helper-option';
        button.setAttribute('role', 'option');
        button.textContent = option.textContent.trim();
        button.addEventListener('click', function () { choose(option); });
        menu.appendChild(button);
      });
      menu.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      note.textContent = '找到 ' + matches.length + ' 筆；可用上下方向鍵選擇。';
    }

    input.addEventListener('input', render);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (menu.hidden) render();
        setActive(activeIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (menu.hidden) render();
        setActive(activeIndex - 1);
      } else if (event.key === 'Enter' && activeIndex >= 0 && matches[activeIndex]) {
        event.preventDefault();
        choose(matches[activeIndex]);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    });
    input.addEventListener('blur', function () {
      window.setTimeout(closeMenu, 150);
    });
    select.addEventListener('change', function () {
      var selected = select.options[select.selectedIndex];
      input.value = selected && selected.value !== '' ? selected.textContent.trim() : '';
    });
    var optionObserver = new MutationObserver(function () {
      var selected = select.options[select.selectedIndex];
      input.value = selected && selected.value !== '' ? selected.textContent.trim() : '';
      note.textContent = '選項已由 KiDit 更新；請重新搜尋並確認。';
      closeMenu();
    });
    optionObserver.observe(select, { childList: true, subtree: true });

    return true;
  }

  function enhanceAll() {
    var count = 0;
    Object.keys(FIELD_LABELS).forEach(function (id) {
      if (enhanceSelect(document.getElementById(id))) count += 1;
    });
    return count;
  }

  var initialCount = enhanceAll();
  var observer = new MutationObserver(function () { enhanceAll(); });
  observer.observe(patientForm, { childList: true, subtree: true });

  if (!document.querySelector('.kd-helper-wrap')) {
    observer.disconnect();
    style.remove();
    stop('找不到可搜尋的長下拉；KiDit 可能已改版，工具未執行。');
    return;
  }

  var toast = document.createElement('div');
  toast.id = 'kd-helper-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = '<span>KiDit 小幫手 v' + VERSION + ' 已啟用（' + initialCount + ' 個欄位）</span>';
  var close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', '關閉提示');
  close.textContent = '×';
  close.addEventListener('click', function () { toast.remove(); });
  toast.appendChild(close);
  document.body.appendChild(toast);
}());
