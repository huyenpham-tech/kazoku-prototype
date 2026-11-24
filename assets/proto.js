/* Kazoku – prototype đánh giá chuyên môn.
 * Một file JS dùng chung cho mọi màn: giữ "người cao tuổi đang mở" giữa các màn,
 * nối các màn với nhau, và thêm thông báo / hộp xác nhận cho các nút chính.
 * Màn Lễ tân (LeTan.html) chạy độc lập: không nối sang màn khác.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ dữ liệu */
  var SERVICES = {
    'luu-tru': {
      badge: 'LƯU TRÚ', label: 'Lưu trú', bg: '#E8EEF7', fg: '#26406B', nurse: 'Main.html',
      plan: 'Lưu trú (chăm sóc 24 giờ)',
      careRow: 'Lưu trú: đỡ đi vệ sinh ban đêm, bật đèn ngủ'
    },
    'ban-tru': {
      badge: 'BÁN TRÚ', label: 'Bán trú', bg: '#F3ECDD', fg: '#6B4A12', nurse: 'YTaBanTru.html',
      plan: 'Bán trú (chăm sóc ban ngày)',
      careRow: 'Bán trú: nhắc uống nước mỗi 2 giờ; đỡ đi vệ sinh sau bữa trưa'
    },
    'tai-nha': {
      badge: 'TẠI NHÀ', label: 'Tại nhà', bg: '#E3EFE6', fg: '#24563A', nurse: 'YTaTaiNha.html',
      plan: 'Tại nhà (nhân viên đến nhà)',
      careRow: 'Tại nhà: dọn lối đi, cố định thảm trước buổi đầu; kiểm tra lại mỗi tuần'
    }
  };

  // Ba đối tượng minh hoạ cho 3 loại phiếu y tá, cộng các dòng còn lại trong danh sách.
  var PATIENTS = {
    an:    { name: 'Nguyễn Văn An', age: 78, sex: 'Nam', hs: 'HS-0231', svc: 'luu-tru', dob: '14/02/1948', checkin: '08:24', family: 'Nguyễn Thị Hà (con) · 0912 345 678' },
    binh:  { name: 'Trần Thị Bình', age: 82, sex: 'Nữ',  hs: 'HS-0232', svc: 'ban-tru', dob: '05/09/1944', checkin: '08:50', family: 'Trần Văn Bảo (con) · 0912 xxx xxx', waitDefault: true },
    phuc:  { name: 'Đỗ Văn Phúc',   age: 80, sex: 'Nam', hs: 'HS-0235', svc: 'tai-nha', dob: '21/06/1946', checkin: '09:55', family: 'Đỗ Thị Lan (con) · 0903 xxx xxx' },
    cuong: { name: 'Lê Văn Cường',  age: 71, sex: 'Nam', hs: 'HS-0233', svc: 'tai-nha', dob: '30/01/1955', checkin: '09:30', family: 'Lê Thị Mai (vợ) · 0987 xxx xxx' },
    em:    { name: 'Hoàng Thị Em',  age: 76, sex: 'Nữ',  hs: 'HS-0228', svc: 'ban-tru', dob: '12/11/1950', checkin: '08:10', family: 'Hoàng Văn Nam (con) · 0915 xxx xxx' },
    hung:  { name: 'Phan Văn Hùng', age: 79, sex: 'Nam', hs: 'HS-0226', svc: 'luu-tru', dob: '08/03/1947', checkin: '—', family: 'Phan Thị Thu (con) · 0904 xxx xxx', lockNote: 'Phiếu đã tự khoá lúc 00:00 23/11 · đang chờ quản lý duyệt. Chỉ xem.' },
    khoa:  { name: 'Võ Văn Khoa',   age: 84, sex: 'Nam', hs: 'HS-0219', svc: 'luu-tru', dob: '17/07/1942', checkin: '—', family: 'Võ Thị Hồng (con) · 0938 xxx xxx', lockNote: 'Quản lý đã duyệt ngày 21/11. Phiếu chỉ xem.' }
  };
  var DEMO = ['an', 'binh', 'phuc']; // 1 người / 1 loại dịch vụ
  var DEFAULT_BY_SVC = { 'luu-tru': 'an', 'ban-tru': 'binh', 'tai-nha': 'phuc' };
  var NURSE_PAGES = { Main: 'luu-tru', YTaBanTru: 'ban-tru', YTaTaiNha: 'tai-nha' };

  // Dòng trong danh sách → màn mở ra (theo mã hồ sơ)
  var LIST_ROUTES = {
    'HS-0235': { key: 'phuc',  nurse: 'YTaTaiNha.html', doctor: 'BacSi.html' },
    'HS-0233': { key: 'cuong', nurse: 'BacSi.html',     doctor: 'BacSi.html' },
    'HS-0231': { key: 'an',    nurse: 'Main.html',      doctor: 'BacSi.html' },
    'HS-0232': { key: 'binh',  nurse: 'KetLuanCho.html', doctor: 'KetLuanCho.html' },
    'HS-0228': { key: 'em',    nurse: 'KetLuan.html',   doctor: 'KetLuan.html' },
    'HS-0226': { key: 'hung',  nurse: 'KetLuan.html?locked=1', doctor: 'KetLuan.html?locked=1' },
    'HS-0219': { key: 'khoa',  nurse: 'KetLuan.html?locked=1', doctor: 'KetLuan.html?locked=1' }
  };

  var PAGE = document.body.getAttribute('data-page') || '';
  var params = new URLSearchParams(location.search);

  /* ------------------------------------------------------------------ lưu trạng thái */
  var store = {
    get: function (k) { try { return localStorage.getItem('kz_' + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('kz_' + k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('kz_' + k); } catch (e) {} }
  };
  function flash(msg, tone) { try { sessionStorage.setItem('kz_flash', JSON.stringify({ msg: msg, tone: tone || 'ok' })); } catch (e) {} }

  function resolvePatient() {
    var key = params.get('p');
    if (!PATIENTS[key]) key = store.get('patient');
    if (!PATIENTS[key]) key = 'an';
    var forced = NURSE_PAGES[PAGE];
    if (forced && PATIENTS[key].svc !== forced) key = DEFAULT_BY_SVC[forced];
    store.set('patient', key);
    return key;
  }
  var PKEY = PAGE === 'LeTan' ? null : resolvePatient();
  var P = PKEY ? PATIENTS[PKEY] : null;
  var S = P ? SERVICES[P.svc] : null;

  function isWaiting(key) {
    var v = store.get('wait_' + key);
    if (v === null) return !!PATIENTS[key].waitDefault;
    return v === '1';
  }
  function setWaiting(key, on) { store.set('wait_' + key, on ? '1' : '0'); }

  /* ------------------------------------------------------------------ tiện ích */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function now() { var d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function withP(href, key) {
    if (!href || /^(https?:|#|mailto:|tel:)/.test(href) || href.indexOf('.html') === -1) return href;
    var parts = href.split('#'), base = parts[0], hash = parts[1];
    var q = base.split('?'), path = q[0], sp = new URLSearchParams(q[1] || '');
    sp.set('p', key);
    return path + '?' + sp.toString() + (hash ? '#' + hash : '');
  }
  function go(href, key) { location.href = withP(href, key || PKEY); }

  var ICON = {
    ok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    warn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5"/><path d="M12 18h.01"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5h.01"/></svg>',
    lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
  };

  /* ------------------------------------------------------------------ toast */
  var toastWrap;
  function toast(msg, tone) {
    if (!toastWrap) {
      toastWrap = document.createElement('div');
      toastWrap.className = 'kz-toast-wrap';
      toastWrap.setAttribute('role', 'status');
      toastWrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastWrap);
    }
    tone = tone || 'ok';
    var t = document.createElement('div');
    t.className = 'kz-toast ' + tone;
    t.innerHTML = (tone === 'ok' ? ICON.ok : tone === 'info' ? ICON.info : ICON.warn) + '<span>' + esc(msg) + '</span>';
    toastWrap.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }

  /* ------------------------------------------------------------------ modal */
  function modal(opts) {
    return new Promise(function (resolve) {
      var last = document.activeElement;
      var bd = document.createElement('div');
      bd.className = 'kz-backdrop';
      var buttons = (opts.cancel === false ? '' : '<button type="button" class="kz-btn" data-r="0">' + esc(opts.cancel || 'Huỷ') + '</button>') +
        (opts.ok === false ? '' : '<button type="button" class="kz-btn ' + (opts.tone === 'danger' ? 'danger' : 'primary') + '" data-r="1">' + esc(opts.ok || 'Xác nhận') + '</button>');
      bd.innerHTML = '<div class="kz-modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="kz-mt">' +
        '<div class="kz-modal-h">' + (opts.icon ? '<span style="color:' + (opts.iconColor || '#0E6E66') + '">' + opts.icon + '</span>' : '') + '<h2 id="kz-mt">' + esc(opts.title) + '</h2></div>' +
        '<div class="kz-modal-b">' + (opts.html || '') + '</div>' +
        '<div class="kz-modal-f">' + buttons + '</div></div>';
      function close(r) { document.removeEventListener('keydown', onKey); bd.remove(); if (last && last.focus) last.focus(); resolve(r); }
      function onKey(e) {
        if (e.key === 'Escape') close(false);
        if (e.key === 'Tab') { // giữ focus trong hộp thoại
          var f = $$('button, a[href], input, select, textarea', bd);
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      }
      bd.addEventListener('click', function (e) {
        if (e.target === bd) return close(false);
        var b = e.target.closest('[data-r]');
        if (b) close(b.getAttribute('data-r') === '1');
      });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(bd);
      var first = $('[data-r="1"]', bd) || $('[data-r="0"]', bd);
      if (first) first.focus();
    });
  }

  /* ------------------------------------------------------------------ thanh prototype */
  function prototypeBar() {
    var bar = document.createElement('div');
    bar.className = 'kz-bar';
    bar.setAttribute('aria-label', 'Điều khiển prototype');
    var html = '<b>PROTOTYPE</b><a href="index.html">Mục lục màn</a>';
    if (PAGE !== 'DanhSach') {
      html += '<label>Đối tượng minh hoạ <select aria-label="Chọn đối tượng minh hoạ">';
      var keys = DEMO.indexOf(PKEY) === -1 ? DEMO.concat([PKEY]) : DEMO;
      keys.forEach(function (k) {
        var p = PATIENTS[k];
        html += '<option value="' + k + '"' + (k === PKEY ? ' selected' : '') + '>' + esc(SERVICES[p.svc].label + ' – ' + p.name) + '</option>';
      });
      html += '</select></label>';
    }
    html += '<button type="button" aria-label="Ẩn thanh prototype" title="Ẩn">×</button>';
    bar.innerHTML = html;
    document.body.appendChild(bar);
    var sel = $('select', bar);
    if (sel) sel.addEventListener('change', function () {
      var k = sel.value, target;
      if (NURSE_PAGES[PAGE]) target = SERVICES[PATIENTS[k].svc].nurse;
      else if ((PAGE === 'KetLuan' || PAGE === 'KetLuanCho')) target = isWaiting(k) ? 'KetLuanCho.html' : 'KetLuan.html';
      else target = PAGE + '.html';
      go(target, k);
    });
    $('button', bar).addEventListener('click', function () { bar.remove(); });
  }

  /* ------------------------------------------------------------------ thẻ người cao tuổi */
  function fillPatientCard() {
    var card = $('main > section');
    if (!card || !P) return;
    var spans = $$('span', card);
    spans.forEach(function (sp) {
      var t = txt(sp);
      if (/^(LƯU TRÚ|BÁN TRÚ|TẠI NHÀ)$/.test(t)) {
        sp.textContent = S.badge; sp.style.background = S.bg; sp.style.color = S.fg;
      } else if (/^Người nhà:/.test(t)) {
        sp.textContent = 'Người nhà: ' + P.family;
      } else if (/^Check-in/.test(t)) {
        sp.textContent = 'Check-in ' + P.checkin;
      } else if (/· (Nam|Nữ)$/.test(t) && /\d/.test(t)) {
        sp.textContent = P.name + ' · ' + P.age + ' · ' + P.sex;
      } else if (/^HS-\d+/.test(t)) {
        sp.textContent = t.replace(/HS-\d+/, P.hs).replace(/\d{4}$/, P.hs.slice(3));
      }
    });
    // Khối "Thông tin cơ bản" (tab Bác sĩ – Khám)
    var basics = { 'Họ và tên': P.name, 'Giới tính': P.sex, 'Tuổi': String(P.age), 'Ngày sinh': P.dob };
    $$('main span').forEach(function (sp) {
      var k = txt(sp), val = sp.nextElementSibling;
      if (basics[k] && val && val.tagName === 'SPAN' && /font-size: 1[5-9]px/.test(val.getAttribute('style') || '')) val.textContent = basics[k];
    });
    document.title = document.title + ' · ' + P.name;
  }

  /* ------------------------------------------------------------------ nối link */
  function rewriteLinks() {
    var wait = isWaiting(PKEY);
    $$('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      var path = h.split('?')[0];
      if (/^(Main|YTaBanTru|YTaTaiNha)\.html$/.test(path)) h = S.nurse;
      // Tab / nút "Kết luận": mở màn "Chờ kết quả" khi hồ sơ đang chờ (trừ nút Cập nhật trên chính màn đó)
      if (/^KetLuan(Cho)?\.html$/.test(path) && !(PAGE === 'KetLuanCho' && !a.closest('nav'))) {
        h = wait ? 'KetLuanCho.html' : 'KetLuan.html';
      }
      a.setAttribute('href', withP(h, PKEY));
    });
  }

  /* ------------------------------------------------------------------ hành vi chung của form */
  var PILL_ON = { border: '1px solid #0E6E66', background: '#E3F2EF', color: '#0A524C' };
  var PILL_OFF = { border: '1px solid #C9CFCB', background: '#FFFFFF', color: '#3A4549' };
  function isPill(label) {
    var b = label.style.border || '';
    return /#0E6E66|#C9CFCB|rgb\(14, 110, 102\)|rgb\(201, 207, 203\)/i.test(b) || /(14, 110, 102|201, 207, 203)/.test(b);
  }
  function paintPill(input) {
    var label = input.closest('label');
    if (!label || !isPill(label)) return;
    var s = input.checked ? PILL_ON : PILL_OFF;
    label.style.border = s.border; label.style.background = s.background; label.style.color = s.color;
  }
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.type === 'radio') {
      $$('input[type="radio"]').filter(function (r) { return r.name === el.name; }).forEach(paintPill);
    } else if (el.type === 'checkbox') {
      paintPill(el);
    }
  });

  function clearRow(row) {
    $$('input', row).forEach(function (i) {
      if (i.type === 'checkbox' || i.type === 'radio') { i.checked = false; i.removeAttribute('checked'); }
      else { i.value = ''; i.removeAttribute('value'); }
    });
    $$('select', row).forEach(function (s) { s.selectedIndex = 0; });
    $$('textarea', row).forEach(function (t) { t.value = ''; });
    // ô chỉ đọc (vd. tên chất gây dị ứng) → thành ô nhập
    Array.prototype.slice.call(row.children).forEach(function (c) {
      if (c.tagName === 'SPAN' && /font-size: 15px/.test(c.getAttribute('style') || '')) {
        var inp = document.createElement('input');
        inp.setAttribute('aria-label', 'Tên');
        inp.placeholder = 'Nhập tên';
        inp.setAttribute('style', c.getAttribute('style').replace(/font-weight: \d+;?/, '') + '; height: 40px; border: 1px solid #C9CFCB; border-radius: 8px; padding: 0 10px; font-size: 14px; box-sizing: border-box');
        c.replaceWith(inp);
      }
    });
    $$('button[aria-label^="Xoá"]', row).forEach(function (b) { b.setAttribute('aria-label', 'Xoá dòng'); });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var label = txt(btn);

    // + Thêm … : nhân bản dòng cuối
    if (/^\+ Thêm/.test(label)) {
      var prev = btn.previousElementSibling, row = null, host = null;
      while (prev && !(prev.querySelector('tbody, .rt-wrap') || prev.children.length > 1)) prev = prev.previousElementSibling;
      if (!prev) return;
      if (prev.querySelector('tbody')) { host = prev.querySelector('tbody'); row = host.lastElementChild; }
      else if (prev.querySelector('.rt-wrap')) { host = prev.querySelector('.rt-wrap'); row = host.lastElementChild; }
      else { host = prev; row = prev.lastElementChild; }
      if (!row) return;
      var clone = row.cloneNode(true);
      clearRow(clone);
      host.appendChild(clone);
      var f = $('input, select, textarea', clone);
      if (f) f.focus();
      return;
    }

    // Xoá dòng (trừ xoá tệp ở Hồ sơ y tế – xử lý riêng)
    var al = btn.getAttribute('aria-label') || '';
    if (/^Xoá/.test(al) && al !== 'Xoá tệp') {
      var r = btn.closest('tr') || btn.closest('.rt') || btn.parentElement;
      if (r) { r.remove(); toast('Đã xoá dòng', 'info'); }
      return;
    }

    // Lưu nháp
    if (label === 'Lưu nháp') { toast('Đã lưu nháp lúc ' + now(), 'ok'); }
  });

  /* ------------------------------------------------------------------ màn Y tá (3 loại) */
  function nursePage() {
    var send = $$('a').filter(function (a) { return /Hoàn tất & chuyển bác sĩ/.test(txt(a)); })[0];
    if (!send) return;
    send.addEventListener('click', function (e) {
      e.preventDefault();
      var box = send.closest('section');
      var cb = box && $('input[type="checkbox"]', box);
      if (cb && !cb.checked) {
        cb.closest('label').style.color = '#B42318';
        modal({
          title: 'Chưa thể chuyển bác sĩ', icon: ICON.warn, iconColor: '#B42318', cancel: false, ok: 'Đã hiểu',
          html: '<p>Cần người cao tuổi hoặc người đại diện xác nhận phần tự khai ở mục 1 trước khi chuyển phiếu.</p>'
        }).then(function () { cb.focus(); });
        return;
      }
      modal({
        title: 'Hoàn tất và chuyển cho bác sĩ?', icon: ICON.info,
        ok: 'Chuyển bác sĩ',
        html: '<dl><dt>Người cao tuổi</dt><dd>' + esc(P.name + ' · ' + P.hs) + '</dd><dt>Dịch vụ</dt><dd>' + esc(S.label) + '</dd><dt>Bác sĩ nhận</dt><dd>BS Minh</dd></dl>' +
          '<p>Sau khi chuyển, phần Y tá chỉ còn xem. Bác sĩ nhận phiếu trong danh sách của mình.</p>'
      }).then(function (ok) {
        if (!ok) return;
        store.set('nurse_' + PKEY, now());
        flash('Đã chuyển phiếu y tá của ' + P.name + ' cho BS Minh lúc ' + now(), 'ok');
        go('BacSi.html');
      });
    });
  }

  /* ------------------------------------------------------------------ màn Bác sĩ – Khám */
  function doctorPage() {
    var next = $$('a').filter(function (a) { return /Tiếp: Chỉ định/.test(txt(a)); })[0];
    var radios = $$('input[name="cs"]');
    var yes = radios.filter(function (r) { return /^Có/.test(txt(r.closest('label'))); })[0];
    var no = radios.filter(function (r) { return /^Không/.test(txt(r.closest('label'))); })[0];
    if (!next || !yes || !no) return;
    var note = document.createElement('p');
    note.className = 'kz-banner warn kz-hidden';
    note.style.margin = '0';
    note.innerHTML = ICON.warn + '<span>Hồ sơ sẽ chuyển sang “Chờ kết quả chuyên môn”. Kết luận sau khi có kết quả xét nghiệm chuyên khoa / khám chuyên sâu.</span>';
    yes.closest('div').after(note);

    function sync() {
      var waiting = yes.checked;
      note.classList.toggle('kz-hidden', !waiting);
      next.textContent = waiting ? 'Lưu & chờ kết quả chuyên khoa' : 'Tiếp: Chỉ định ›';
    }
    if (isWaiting(PKEY)) { yes.checked = true; paintPill(yes); paintPill(no); }
    sync();
    [yes, no].forEach(function (r) { r.addEventListener('change', function () { if (!yes.checked) setWaiting(PKEY, false); sync(); rewriteLinks(); }); });

    next.addEventListener('click', function (e) {
      if (!yes.checked) return;
      e.preventDefault();
      modal({
        title: 'Chuyển hồ sơ sang “Chờ kết quả”?', icon: ICON.info, ok: 'Lưu & chờ kết quả',
        html: '<p>Phiếu của <b>' + esc(P.name) + '</b> được lưu, chưa kết luận. Hệ thống nhắc lại khi có kết quả tải lên tab Hồ sơ y tế.</p>'
      }).then(function (ok) {
        if (!ok) return;
        setWaiting(PKEY, true);
        flash('Đã lưu. Hồ sơ ' + P.name + ' đang chờ kết quả chuyên môn.', 'warn');
        go('KetLuanCho.html');
      });
    });
  }

  /* ------------------------------------------------------------------ màn Chỉ định */
  function planPage() {
    var h2 = $$('h2').filter(function (h) { return /^15 · Chỉ định/.test(txt(h)); })[0];
    if (h2) h2.textContent = '15 · Chỉ định chuyên môn · ' + S.plan;
    $$('td').forEach(function (td) {
      if (/^Lưu trú: /.test(txt(td))) td.textContent = S.careRow;
    });
  }

  /* ------------------------------------------------------------------ màn Kết luận */
  function conclusionPage() {
    var locked = params.get('locked') === '1' || !!P.lockNote;
    var save = $$('button').filter(function (b) { return txt(b) === 'Lưu kết luận'; })[0];
    var condLabel = $$('label').filter(function (l) { return /^Điều kiện cụ thể/.test(txt(l)); })[0];
    var reason = $$('label').filter(function (l) { return /^Lý do/.test(txt(l)); })[0];
    var kl = $$('input[name="kl"]');
    var nav = $('nav');

    if (locked) {
      var b = document.createElement('div');
      b.className = 'kz-banner info';
      b.innerHTML = ICON.lock + '<span>' + esc(P.lockNote || 'Phiếu đã khoá · chờ quản lý duyệt. Chỉ xem.') + '</span>';
      nav.after(b);
      $('main').classList.add('kz-locked');
      $$('input, textarea, select').forEach(function (i) { i.disabled = true; });
      if (save) save.classList.add('kz-hidden');
      return;
    }

    function syncCond() {
      var picked = kl.filter(function (r) { return r.checked; })[0];
      var conditional = picked && /có điều kiện/.test(txt(picked.closest('label')));
      if (condLabel) condLabel.classList.toggle('kz-hidden', !conditional);
    }
    kl.forEach(function (r) { r.addEventListener('change', syncCond); });
    syncCond();

    if (!save) return;
    save.addEventListener('click', function () {
      var picked = kl.filter(function (r) { return r.checked; })[0];
      var cls = $$('input[name="cls"]').filter(function (r) { return r.checked; })[0];
      var reasonTa = reason && $('textarea', reason);
      var condTa = condLabel && $('textarea', condLabel);
      var conditional = picked && /có điều kiện/.test(txt(picked.closest('label')));
      var missing = [];
      $$('.kz-field-err').forEach(function (x) { x.classList.remove('kz-field-err'); });
      if (!picked) missing.push('Kết luận');
      if (reasonTa && !reasonTa.value.trim()) { missing.push('Lý do'); reasonTa.classList.add('kz-field-err'); }
      if (conditional && condTa && !condTa.value.trim()) { missing.push('Điều kiện cụ thể'); condTa.classList.add('kz-field-err'); }
      if (missing.length) {
        toast('Cần điền: ' + missing.join(', '), 'err');
        var firstErr = $('.kz-field-err'); if (firstErr) firstErr.focus();
        return;
      }
      var verdict = txt(picked.closest('label'));
      modal({
        title: 'Lưu kết luận chuyên môn?', icon: ICON.info, ok: 'Lưu kết luận',
        html: '<dl><dt>Người cao tuổi</dt><dd>' + esc(P.name + ' · ' + P.hs) + '</dd>' +
          '<dt>Dịch vụ</dt><dd>' + esc(S.label) + '</dd>' +
          '<dt>Phân loại sức khoẻ</dt><dd>' + esc(cls ? txt(cls.closest('label')) : '—') + '</dd>' +
          '<dt>Kết luận</dt><dd>' + esc(verdict) + '</dd></dl>' +
          '<p>Phiếu còn sửa được trong hôm nay. Từ 00:00 ngày mai phiếu tự khoá để quản lý duyệt.</p>'
      }).then(function (ok) {
        if (!ok) return;
        setWaiting(PKEY, false);
        store.set('done_' + PKEY, now());
        flash('Đã lưu kết luận “' + verdict + '” cho ' + P.name + '. Tự khoá lúc 00:00 ngày mai.', 'ok');
        go('DanhSach.html?role=bs');
      });
    });
  }

  /* ------------------------------------------------------------------ màn Kết luận – chờ kết quả */
  function waitingPage() {
    var upd = $$('a').filter(function (a) { return /Cập nhật xét nghiệm chuyên khoa/.test(txt(a)); })[0];
    if (!upd) return;
    upd.addEventListener('click', function (e) {
      e.preventDefault();
      modal({
        title: 'Đã có kết quả chuyên khoa?', icon: ICON.info, ok: 'Có, mở Kết luận',
        html: '<p>Kiểm tra kết quả đã tải lên tab <b>Hồ sơ y tế</b>. Hồ sơ rời trạng thái “Chờ kết quả” và mở lại phần Kết luận.</p>'
      }).then(function (ok) {
        if (!ok) return;
        setWaiting(PKEY, false);
        flash('Hồ sơ ' + P.name + ' đã có kết quả. Mời bác sĩ ra kết luận.', 'info');
        go('KetLuan.html');
      });
    });
  }

  /* ------------------------------------------------------------------ màn Hồ sơ y tế */
  function recordsPage() {
    var CARD_ON = { border: '2px solid #0E6E66', background: '#F2F8F7' };
    var CARD_OFF = { border: '1px solid #E1E4E0', background: '#FFFFFF' };
    var list = null, countEl = null, previewTitle = null, pageEl = null, page = 1, pages = 1;

    var viewBtns = $$('button').filter(function (b) { return txt(b) === 'Xem'; });
    if (!viewBtns.length) return;
    list = viewBtns[0].parentElement.parentElement.parentElement;
    countEl = $$('span').filter(function (s) { return /^\d+ tệp$/.test(txt(s)); })[0];
    var fsBtn = $$('button').filter(function (b) { return txt(b) === 'Mở toàn màn hình'; })[0];
    var bar = fsBtn && fsBtn.parentElement;
    previewTitle = bar && bar.firstElementChild;
    pageEl = bar && $$('span', bar).filter(function (s) { return /^Trang/.test(txt(s)); })[0];

    function cards() { return Array.prototype.slice.call(list.children); }
    function info(card) {
      var sp = $$('span', card);
      var meta = txt(sp[2]);
      var n = parseInt(meta, 10) || 1;
      return { title: txt(sp[0]), issuer: txt(sp[1]).split(' · ')[0], pages: n };
    }
    function select(card) {
      cards().forEach(function (c) { c.style.border = CARD_OFF.border; c.style.background = CARD_OFF.background; });
      card.style.border = CARD_ON.border; card.style.background = CARD_ON.background;
      var i = info(card);
      page = 1; pages = i.pages;
      if (previewTitle) previewTitle.textContent = i.title + ' · ' + i.issuer;
      if (pageEl) pageEl.textContent = 'Trang 1/' + pages;
    }
    function recount() { if (countEl) countEl.textContent = cards().filter(function (c) { return !c.classList.contains('kz-hidden'); }).length + ' tệp'; }

    document.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var t = txt(b), card = b.closest('div') && b.parentElement.parentElement;
      if (t === 'Xem') { select(card); if (window.innerWidth < 900 && bar) bar.scrollIntoView({ behavior: 'smooth' }); }
      else if (t === 'Tải về') { toast('Đã tải về “' + info(card).title + '.pdf” (bản minh hoạ)', 'ok'); }
      else if (b.getAttribute('aria-label') === 'Xoá tệp') {
        var i = info(card);
        modal({ title: 'Xoá tệp “' + i.title + '”?', icon: ICON.warn, iconColor: '#B42318', tone: 'danger', ok: 'Xoá tệp',
          html: '<p>Tệp bị gỡ khỏi hồ sơ y tế của ' + esc(P.name) + '. Không hoàn tác được.</p>' })
          .then(function (ok) {
            if (!ok) return;
            var wasSel = /2px/.test(card.style.border);
            card.remove(); recount();
            if (wasSel && cards()[0]) select(cards()[0]);
            toast('Đã xoá tệp “' + i.title + '”', 'info');
          });
      }
      else if (b.getAttribute('aria-label') === 'Trang trước') { if (page > 1) page--; if (pageEl) pageEl.textContent = 'Trang ' + page + '/' + pages; }
      else if (b.getAttribute('aria-label') === 'Trang sau') { if (page < pages) page++; if (pageEl) pageEl.textContent = 'Trang ' + page + '/' + pages; }
      else if (t === 'Mở toàn màn hình') {
        var lines = ''; for (var k = 0; k < 14; k++) lines += '<i style="width:' + (55 + (k * 37) % 45) + '%"></i>';
        modal({ title: (previewTitle ? txt(previewTitle) : 'Tài liệu') + ' · trang ' + page + '/' + pages, wide: true, cancel: false, ok: 'Đóng',
          html: '<div class="kz-pdf"><div class="kz-pdf-page"><i style="width:50%;height:12px;background:#C9CFCB"></i>' + lines + '</div></div>' });
      }
      else if (t === '+ Tải lên PDF') { picker.click(); }
    });

    var picker = document.createElement('input');
    picker.type = 'file'; picker.accept = 'application/pdf,.pdf'; picker.hidden = true;
    document.body.appendChild(picker);
    picker.addEventListener('change', function () {
      var f = picker.files[0];
      picker.value = '';
      if (!f) return;
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { toast('Chỉ nhận tệp PDF. “' + f.name + '” không phải PDF.', 'err'); return; }
      if (f.size > 20 * 1024 * 1024) { toast('Tệp vượt quá 20 MB. Hãy nén hoặc tách tệp rồi tải lại.', 'err'); return; }
      var tpl = cards()[cards().length - 1];
      var c = tpl.cloneNode(true);
      var sp = $$('span', c);
      var who = txt($('header span[style*="margin-left: auto"]')).split(' · ')[0] || 'Bạn';
      sp[0].textContent = f.name.replace(/\.pdf$/i, '');
      sp[1].textContent = 'Chưa ghi nơi cấp · hôm nay';
      sp[2].textContent = '1 trang · ' + (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB · tải lên bởi ' + who + ' · ' + now();
      list.appendChild(c);
      recount(); select(c);
      toast('Đã tải lên “' + f.name + '”', 'ok');
    });

    // Tìm và lọc giấy tờ
    var search = $('input[aria-label="Tìm hồ sơ"]');
    var type = $('select[aria-label="Loại giấy tờ"]');
    function filter() {
      var q = (search && search.value || '').trim().toLowerCase();
      var ty = type && type.selectedIndex > 0 ? type.value : '';
      var rx = { 'Giấy ra viện': /ra viện/i, 'Đơn thuốc': /đơn thuốc/i, 'Xét nghiệm': /xét nghiệm/i, 'Chẩn đoán hình ảnh': /x-quang|siêu âm|ct|mri|hình ảnh/i, 'Khác': /^(?!.*(ra viện|đơn thuốc|xét nghiệm|x-quang|siêu âm)).*/i }[ty];
      cards().forEach(function (c) {
        var t = txt(c).toLowerCase();
        var ok = (!q || t.indexOf(q) > -1) && (!rx || rx.test(txt(c)));
        c.classList.toggle('kz-hidden', !ok);
      });
      recount();
    }
    if (search) search.addEventListener('input', filter);
    if (type) type.addEventListener('change', filter);
  }

  /* ------------------------------------------------------------------ màn Danh sách */
  function listPage() {
    var role = params.get('role') === 'bs' ? 'doctor' : 'nurse';
    if (role === 'doctor') {
      var who = $('header span[style*="margin-left: auto"]');
      if (who) who.textContent = 'BS Minh · Bác sĩ · Chi nhánh Đống Đa';
      var sub = $('main p');
      if (sub) sub.textContent = 'Người đã check-in và phiếu y tá đã chuyển, xếp theo giờ đến.';
    }
    if (role === 'doctor') document.title = 'Danh sách người cao tuổi – Bác sĩ';
    var PILLS = {
      'Chờ đánh giá': 'background: #FFF4D6; color: #7A5300',
      'Chờ kết quả chuyên môn': 'background: #E8EEF7; color: #26406B',
      'Đã đánh giá': 'background: #E3F2EF; color: #0A524C'
    };
    function setStatus(row, status, note) {
      var cell = row.children[3];
      var pill = $('span', cell);
      pill.textContent = status;
      pill.setAttribute('style', pill.getAttribute('style').replace(/background: [^;]+; color: [^;]+/, PILLS[status]));
      if (note !== undefined) {
        Array.prototype.slice.call(cell.children, 1).forEach(function (x) { x.remove(); });
        var n = document.createElement('span');
        n.setAttribute('style', 'font-size: 12px; color: #5B666A');
        n.textContent = note;
        cell.appendChild(n);
      }
    }
    var rows = $$('.rt:not(.rt-head)');
    rows.forEach(function (row) {
      var hs = (txt(row).match(/HS-\d{4}/) || [])[0];
      var r = LIST_ROUTES[hs];
      var a = $('a', row);
      if (!r || !a) return;
      var target = role === 'doctor' ? r.doctor : r.nurse;
      // Trạng thái do người dùng tạo ra khi đi qua prototype
      var done = store.get('done_' + r.key);
      if (done) {
        setStatus(row, 'Đã đánh giá', 'Kết luận ' + done + ' · tự khoá 00:00 ngày mai');
        target = 'KetLuan.html'; a.textContent = 'Sửa';
        a.setAttribute('style', a.getAttribute('style').replace('background: #0E6E66; color: #FFFFFF; border: 1px solid #0E6E66', 'background: #FFFFFF; color: #0A524C; border: 1px solid #C9CFCB'));
      } else if (/^KetLuan(Cho)?\.html$/.test(target)) {
        target = isWaiting(r.key) ? 'KetLuanCho.html' : 'KetLuan.html';
        if (!isWaiting(r.key) && /Chờ kết quả/.test(txt(row.children[3]))) setStatus(row, 'Chờ đánh giá', 'Đã có kết quả chuyên khoa');
      } else if (isWaiting(r.key)) {
        setStatus(row, 'Chờ kết quả chuyên môn', '');
      }
      if (!done && store.get('nurse_' + r.key)) {
        $$('span', row.children[3]).forEach(function (chip) {
          if (/^Y tá/.test(txt(chip))) { chip.textContent = 'Y tá ✓'; chip.style.background = 'rgb(227, 242, 239)'; chip.style.color = 'rgb(10, 82, 76)'; }
        });
        if (role === 'nurse' && target === r.nurse && NURSE_PAGES[target.replace('.html', '')]) a.textContent = 'Xem';
      }
      a.setAttribute('href', withP(target, r.key));
      if (role === 'doctor' && /Đánh giá|Tiếp tục/.test(txt(a)) && r.doctor === 'BacSi.html') {
        // Bác sĩ chỉ khám khi y tá đã chuyển phiếu
        a.textContent = 'Khám';
      }
      a.addEventListener('click', function () { store.set('patient', r.key); });
    });

    // Lọc theo tab trạng thái, dịch vụ, ô tìm
    var tabs = $$('[role="tab"]');
    var chips = $$('button[aria-pressed]');
    var search = $('input[aria-label="Tìm người cao tuổi"]');
    var tabOn = tabs[0] && tabs[0].getAttribute('style'), tabOff = tabs[1] && tabs[1].getAttribute('style');
    var badgeOn = tabs[0] && $('span', tabs[0]).getAttribute('style'), badgeOff = tabs[1] && $('span', tabs[1]).getAttribute('style');
    var chipOn = chips[0] && chips[0].getAttribute('style'), chipOff = chips[1] && chips[1].getAttribute('style');
    var state = { status: 'Tất cả', svc: 'Tất cả' };

    function label(el) { return (el.firstChild && el.firstChild.textContent || '').trim(); }
    function apply() {
      var q = (search && search.value || '').trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) {
        var cols = row.children;
        var svc = txt(cols[1]);
        var status = txt($('span', cols[3]));
        var ok = (state.status === 'Tất cả' || status === state.status) &&
                 (state.svc === 'Tất cả' || svc === state.svc) &&
                 (!q || txt(cols[0]).toLowerCase().indexOf(q) > -1);
        row.classList.toggle('kz-hidden', !ok);
        if (ok) shown++;
      });
      var empty = $('#kz-empty');
      if (!shown) {
        if (!empty) {
          empty = document.createElement('p');
          empty.id = 'kz-empty';
          empty.setAttribute('style', 'margin: 0; padding: 28px 18px; text-align: center; font-size: 15px; color: #5B666A');
          empty.textContent = 'Không có người cao tuổi nào khớp bộ lọc.';
          $('.rt-wrap').appendChild(empty);
        }
      } else if (empty) empty.remove();
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          x.setAttribute('style', on ? tabOn : tabOff);
          $('span', x).setAttribute('style', on ? badgeOn : badgeOff);
        });
        state.status = label(t);
        apply();
      });
    });
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) {
          var on = x === c;
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
          x.setAttribute('style', on ? chipOn : chipOff);
        });
        state.svc = txt(c);
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);
  }

  /* ------------------------------------------------------------------ màn Lễ tân (độc lập) */
  function receptionPage() {
    var stats = $$('main > div:nth-of-type(2) > div');
    function stat(name) {
      var box = stats.filter(function (b) { return txt(b.firstElementChild) === name; })[0];
      return box && box.lastElementChild;
    }
    function bump(name, d) { var el = stat(name); if (el) el.textContent = Math.max(0, (parseInt(el.textContent, 10) || 0) + d); }

    document.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var row = b.closest('.rt');
      if (!row) return;
      var who = txt(row.children[1].firstElementChild);
      var contact = txt(row.children[1].lastElementChild);
      var staff = txt(row.children[3]);
      var pill = row.children[4];
      if (txt(b) === 'Check-in') {
        modal({
          title: 'Check-in cho ' + who + '?', icon: ICON.info, ok: 'Check-in',
          html: '<dl><dt>Dịch vụ</dt><dd>' + esc(txt(row.children[2])) + '</dd><dt>Phụ trách</dt><dd>' + esc(staff) + '</dd></dl>' +
            '<p>Hồ sơ chuyển vào danh sách “Chờ đánh giá” của y tá phụ trách.</p>'
        }).then(function (ok) {
          if (!ok) return;
          pill.style.background = '#E3F2EF'; pill.style.color = '#0A524C';
          pill.innerHTML = '<span aria-hidden="true">●</span>Đã đến ' + now();
          var act = row.children[5];
          act.innerHTML = '<span style="font-size: 13px; color: #5B666A">Đã chuyển y tá · chờ đánh giá</span>';
          bump('Đã đến', 1); bump('Chờ đến', -1);
          toast('Đã check-in ' + who + '. Đã báo ' + staff.split(' · ')[0] + '.', 'ok');
        });
      } else if (txt(b) === 'Liên hệ') {
        modal({
          title: 'Liên hệ gia đình · ' + who, icon: ICON.info, ok: 'Ghi nhận đã gọi', cancel: 'Đóng',
          html: '<dl><dt>Hồ sơ</dt><dd>' + esc(contact) + '</dd><dt>Trạng thái</dt><dd>' + esc(txt(pill)) + '</dd></dl>' +
            '<label style="display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600">Kết quả cuộc gọi' +
            '<select id="kz-call" style="height:44px;border:1px solid #C9CFCB;border-radius:8px;padding:0 10px;font-size:14px;background:#FFFFFF">' +
            '<option>Đang trên đường đến</option><option>Không nghe máy</option><option>Xin dời lịch hẹn</option></select></label>'
        }).then(function (ok) {
          if (!ok) return;
          toast('Đã ghi nhận cuộc gọi cho ' + who + ' lúc ' + now(), 'ok');
        });
      }
    });
  }

  /* ------------------------------------------------------------------ khởi chạy */
  function init() {
    if (PAGE === 'LeTan') { receptionPage(); return; }

    if (PAGE !== 'DanhSach') {
      fillPatientCard();
      rewriteLinks();
    }
    if (NURSE_PAGES[PAGE]) nursePage();
    if (PAGE === 'BacSi') doctorPage();
    if (PAGE === 'ChiDinh') planPage();
    if (PAGE === 'KetLuan') conclusionPage();
    if (PAGE === 'KetLuanCho') waitingPage();
    if (PAGE === 'HoSoYTe') recordsPage();
    if (PAGE === 'DanhSach') listPage();
    prototypeBar();

    try {
      var f = JSON.parse(sessionStorage.getItem('kz_flash') || 'null');
      if (f) { sessionStorage.removeItem('kz_flash'); toast(f.msg, f.tone); }
    } catch (e) {}
  }
  init();
})();
