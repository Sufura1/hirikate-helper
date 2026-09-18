/* ============================================================
   HIRIKATE Helper — интерактив сайта (ES6+)
   Preloader, тема, бургер, счётчики, поиск, копирование,
   аккордеон, модалки, тосты, scroll-to-top.
   ============================================================ */

(() => {
  'use strict';

  /* ---------- Утилиты ---------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function toast(message) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.innerHTML = '<i class="fa-solid fa-circle-check"></i><span></span>';
      document.body.appendChild(el);
    }
    $('span', el).textContent = message;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------- Preloader ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => {
      const p = $('#preloader');
      if (p) { p.classList.add('hidden'); setTimeout(() => p.remove(), 600); }
    }, 250);
  });

  /* ---------- Тема (тёмная/светлая) ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hirikate-theme', theme);
    $$('#themeToggle i').forEach(i => i.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun');
  }
  const savedTheme = localStorage.getItem('hirikate-theme') || 'dark';
  applyTheme(savedTheme);

  document.addEventListener('click', e => {
    const btn = e.target.closest('#themeToggle');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
    toast(current === 'dark' ? 'Светлая тема включена' : 'Тёмная тема включена');
  });

  /* ---------- Шапка: скролл + активный пункт ---------- */
  const header = $('.site-header');
  const scrollBtn = $('#scrollTop');

  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
    if (scrollBtn) scrollBtn.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Мобильное меню ---------- */
  const burger = $('.burger');
  const nav = $('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) {
        burger.classList.remove('open');
        nav.classList.remove('open');
      }
    });
  }

  /* ---------- Счётчики статистики ---------- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const dur = parseInt(el.dataset.dur, 10) || 2000;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const statNumbers = $$('.stat-num[data-target]');
  if (statNumbers.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          animateCounter(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    statNumbers.forEach(n => io.observe(n));
  }

  /* ---------- AOS (анимации по скроллу) ---------- */
  if (window.AOS) {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
  }

  /* ---------- Аккордеон (FAQ, предыдущие версии) ---------- */
  document.addEventListener('click', e => {
    const head = e.target.closest('.acc-head');
    if (!head) return;
    const item = head.closest('.acc-item');
    const body = $('.acc-body', item);
    const isOpen = item.classList.contains('open');

    // одиночное открытие внутри одного аккордеона
    const group = item.parentElement;
    if (group && group.classList.contains('accordion')) {
      $$('.acc-item.open', group).forEach(o => {
        if (o !== item) {
          o.classList.remove('open');
          $('.acc-body', o).style.maxHeight = '0px';
        }
      });
    }
    item.classList.toggle('open', !isOpen);
    if (body) body.style.maxHeight = isOpen ? '0px' : body.scrollHeight + 'px';
  });

  /* ---------- Модальные окна организаций ---------- */
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-org-modal]');
    if (opener) {
      const id = opener.getAttribute('data-org-modal');
      const modal = document.getElementById('orgModal_' + id);
      if (modal) openModal(modal);
      return;
    }
    if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay')) {
      closeAllModals();
    }
  });

  function openModal(modal) {
    closeAllModals();
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeAllModals() {
    $$('.modal-overlay').forEach(m => m.classList.remove('show'));
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  /* ---------- Копирование кода ---------- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const code = $('code', btn.closest('.code-block'));
    if (!code) return;
    const text = code.innerText;
    const done = () => {
      btn.classList.add('copied');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Скопировано';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = '<i class="fa-solid fa-copy"></i> Копировать';
      }, 2200);
      toast('Код скопирован в буфер обмена');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  });

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { /* игнор */ }
    ta.remove();
  }

  /* ---------- Язык AutoHotkey для Prism ---------- */
  function registerAhkGrammar() {
    if (!window.Prism || !Prism.languages) return;
    Prism.languages.ahk = {
      'comment': /(?:;[^\n]*|\/\*[\s\S]*?\*\/)/,
      'string': { pattern: /(^|[^\\])"(?:[^"\r\n\\]|\\.)*"/, lookbehind: true },
      'hotstring': /:?:?[:\w\-.*+?<>^!]{0,30}:?:?[:\*]{0,2}\*\*/,
      'hotkey': /(?:^|\s)[!#^+~\w ]+::/,
      'keyword': /\b(?:If|Else|Return|While|For|Break|Continue|Goto|Gosub|Loop|Global|Local|Static|VarSetCapacity|SendInput|Send|SendRaw|Sleep|Gui|GuiShow|GuiControl|ControlSend)\b/i,
      'function': /(?:\w+)(?=\s*\()/,
      'number': /\b0x[\da-fA-F]+\b|\b\d+\.?\d*\b/,
      'punctuation': /[,:{}()\[\]]/
    };
  }
  registerAhkGrammar();

  /* ---------- Подсветка кода Prism ---------- */
  function highlightCode() {
    if (window.Prism) {
      Prism.highlightAll();
    } else {
      $$('pre code').forEach(el => {
        const lang = el.className.match(/language-(\w+)/);
        if (lang) el.setAttribute('data-lang', lang[1]);
      });
    }
  }
  highlightCode();

  /* ---------- Поиск по документации ---------- */
  const searchInput = $('#docSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      $$('.docs-nav a[href^="#"]').forEach(link => {
        const target = document.querySelector(link.getAttribute('href'));
        const hay = (link.textContent + ' ' + (target ? target.textContent : '')).toLowerCase();
        link.style.display = hay.includes(q) ? '' : 'none';
      });
      const groups = $$('.docs-nav .nav-group');
      groups.forEach(g => {
        let any = false;
        let sib = g.nextElementSibling;
        while (sib && !sib.classList.contains('nav-group')) {
          if (sib.style.display !== 'none') any = true;
          sib = sib.nextElementSibling;
        }
        g.style.display = any ? '' : 'none';
      });
    });
  }

  /* ---------- Активный пункт бокового меню при скролле ---------- */
  const docNav = $('#docNav');
  if (docNav) {
    const sections = $$('.doc-section[id]');
    const links = $$('.docs-nav a[href^="#"]');
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- Чекбокс AutoHotkey на странице скачивания ---------- */
  const ahkCheck = $('#chkAhk');
  if (ahkCheck) {
    ahkCheck.addEventListener('change', () => {
      toast(ahkCheck.checked ? 'AutoHotkey 1.1 добавлен в установку' : 'AutoHotkey исключён из установки');
    });
  }

  /* ---------- Кнопки скачивания ---------- */
  document.addEventListener('click', e => {
    const btn = e.target.closest('.dl-btn');
    if (!btn) return;
    e.preventDefault();
    if (!btn.hasAttribute('data-file')) return; // заглушки «Не доступна»
    const file = btn.getAttribute('data-file') || 'HIRIKATE-Helper_Setup.exe';
    // файл лежит рядом с html (без папок) — скачиваем относительно корня сайта.
    // ?v= сбрасывает кэш браузера, когда установщик пересобирается
    const a = document.createElement('a');
    a.href = file + '?v=2';
    a.setAttribute('download', file);
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('Загружаю: ' + file);
  });

  /* ---------- Параллакс лёгких элементов ---------- */
  if (window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('mousemove', e => {
      const layers = $$('.parallax-layer');
      layers.forEach(l => {
        const speed = parseFloat(l.dataset.speed || '20');
        const x = (e.clientX / window.innerWidth - 0.5) * speed;
        const y = (e.clientY / window.innerHeight - 0.5) * speed;
        l.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
  }
})();