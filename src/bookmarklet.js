(function () {
  'use strict';

  var VERSION = '0.1.5';
  var TARGET_HOST = 'www.kidit-tsn.org.tw';
  var TARGET_PATH_PATTERN = /^\/Start\/Edit\/[1-9]\d*\/?$/;
  var TARGET_FORM_ACTION = '/Start/SaveDeleteCancel';
  var TEST_MODE = window.__KIDIT_HELPER_TEST__ === true;
  var FIELD_LABELS = {
    TurnHospital: '搜尋轉入院所'
  };

  function stop(message) {
    window.alert('KiDit 小幫手：' + message);
  }

  if (!TEST_MODE && window.location.hostname !== TARGET_HOST) {
    stop('請先登入 www.kidit-tsn.org.tw，再點這個書籤。');
    return;
  }

  if (!TEST_MODE && !TARGET_PATH_PATTERN.test(window.location.pathname)) {
    stop('請開啟病人的「病史紀錄」頁，再點這個書籤。');
    return;
  }

  var targetForm = document.querySelector('form[action="' + TARGET_FORM_ACTION + '"]');
  if (!targetForm) {
    stop('找不到預期的病史表單；KiDit 可能已改版，工具未執行。');
    return;
  }

  var alreadyEnabled = document.querySelector('.kd-helper-wrap');
  if (alreadyEnabled) {
    var existingInput = alreadyEnabled.querySelector('input[type="search"]');
    if (existingInput) existingInput.focus();
    return;
  }
  if (targetForm.dataset.kdHelperActive === VERSION) return;
  targetForm.dataset.kdHelperActive = VERSION;

  var style = document.createElement('style');
  style.id = 'kd-helper-style';
  style.textContent = [
    '.kd-helper-host{display:flex!important;align-items:flex-start;gap:8px;flex-wrap:nowrap;overflow:visible}',
    '.kd-helper-host>select{flex:0 1 auto}',
    '.kd-helper-wrap{position:relative;box-sizing:border-box;flex:0 0 280px;min-width:230px;max-width:340px;padding:5px;border:1px solid #0891b2;border-radius:8px;background:#ecfeff;box-shadow:0 2px 8px rgba(14,116,144,.14);font-family:Arial,"Noto Sans TC",sans-serif}',
    '.kd-helper-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}',
    '.kd-helper-search{box-sizing:border-box;width:100%;min-height:40px;padding:7px 11px;border:2px solid #0e7490;border-radius:6px;background:#fff;color:#17202a;font-size:16px;line-height:1.4}',
    '.kd-helper-search:disabled{border-color:#94a3b8;background:#f1f5f9;color:#475569;cursor:not-allowed}',
    '.kd-helper-search:focus{outline:3px solid #fbbf24;outline-offset:2px}',
    '.kd-helper-menu{position:absolute;z-index:2147483646;left:0;right:0;max-height:300px;overflow:auto;margin:3px 0 0;padding:4px;border:1px solid #64748b;border-radius:7px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.22)}',
    '.kd-helper-menu[hidden]{display:none}',
    '.kd-helper-option{display:block;box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:0;border-radius:5px;background:#fff;color:#17202a;text-align:left;font-size:16px;cursor:pointer}',
    '.kd-helper-option:hover,.kd-helper-option.is-active{background:#cffafe;color:#164e63}',
    '.kd-helper-option:focus{outline:3px solid #fbbf24;outline-offset:-3px}',
    '#kd-helper-toast{position:fixed;right:16px;bottom:16px;z-index:2147483647;display:flex;align-items:center;gap:10px;max-width:330px;padding:10px 12px;border:2px solid #0e7490;border-radius:8px;background:#ecfeff;color:#164e63;box-shadow:0 8px 24px rgba(15,23,42,.25);font:700 14px/1.4 Arial,"Noto Sans TC",sans-serif}',
    '#kd-helper-toast button{min-width:44px;min-height:44px;border:0;border-radius:6px;background:#0e7490;color:#fff;font-size:20px;cursor:pointer}',
    '#kd-helper-toast button:focus{outline:3px solid #fbbf24;outline-offset:2px}',
    '@media(max-width:900px){.kd-helper-host{flex-wrap:wrap}.kd-helper-wrap{flex:1 1 100%;min-width:0;max-width:340px}}'
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
    if (!select || select.dataset.kdHelper === VERSION) return false;

    select.dataset.kdHelper = VERSION;
    var wrap = document.createElement('div');
    wrap.className = 'kd-helper-wrap';
    wrap.dataset.for = select.id;

    var label = document.createElement('label');
    var inputId = 'kd-helper-' + select.id;
    label.className = 'kd-helper-sr-only';
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

    var status = document.createElement('span');
    status.className = 'kd-helper-sr-only';
    status.setAttribute('aria-live', 'polite');

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(menu);
    wrap.appendChild(status);
    var host = select.parentNode;
    host.classList.add('kd-helper-host');
    host.insertBefore(wrap, select.nextSibling);

    var matches = [];
    var activeIndex = -1;

    function closeMenu() {
      menu.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }

    function syncAvailability(message) {
      var hasOptions = searchableOptions(select).length > 0;
      input.disabled = !hasOptions;
      input.placeholder = hasOptions ? '輸入關鍵字' : '請先選擇縣市';
      if (!hasOptions) {
        input.value = '';
        status.textContent = '請先選擇縣市。';
        closeMenu();
      } else if (message) {
        status.textContent = message;
      }
      return hasOptions;
    }

    function choose(option) {
      option.selected = true;
      input.value = option.textContent.trim();
      status.textContent = '已選：' + input.value;
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
      if (!syncAvailability()) return;
      var query = normalized(input.value);
      menu.textContent = '';
      activeIndex = -1;
      if (!query) {
        status.textContent = '';
        closeMenu();
        return;
      }

      matches = searchableOptions(select).filter(function (option) {
        return normalized(option.textContent).indexOf(query) !== -1;
      }).slice(0, 12);

      if (!matches.length) {
        status.textContent = '找不到符合「' + input.value + '」的選項。';
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
      status.textContent = '找到 ' + matches.length + ' 筆；可用上下方向鍵選擇。';
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
      syncAvailability();
    });
    var optionObserver = new MutationObserver(function () {
      var selected = select.options[select.selectedIndex];
      input.value = selected && selected.value !== '' ? selected.textContent.trim() : '';
      syncAvailability('轉入院所選項已由 KiDit 更新。');
      closeMenu();
    });
    optionObserver.observe(select, { childList: true, subtree: true });
    syncAvailability();

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
  var toastText;
  var observer = new MutationObserver(function () {
    var addedCount = enhanceAll();
    if (addedCount && toastText) {
      toastText.textContent = 'KiDit 小幫手 v' + VERSION + ' 已啟用';
    }
  });
  observer.observe(targetForm, { childList: true, subtree: true });

  var toast = document.createElement('div');
  toast.id = 'kd-helper-toast';
  toast.setAttribute('role', 'status');
  toastText = document.createElement('span');
  toastText.textContent = initialCount
    ? 'KiDit 小幫手 v' + VERSION + ' 已啟用'
    : 'KiDit 小幫手 v' + VERSION + ' 已待命；請將「是否他院轉入」選為 Yes';
  toast.appendChild(toastText);
  var close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', '關閉提示');
  close.textContent = '×';
  close.addEventListener('click', function () { toast.remove(); });
  toast.appendChild(close);
  document.body.appendChild(toast);
}());
