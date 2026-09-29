/* state-gate.js — makes :hover / :active / :focus drivable by a class, so a specimen cell tagged
 * data-gate="hover | active | focus" renders in that state instead of at rest under a caption.
 *
 * Every such pseudo in every stylesheet is rewritten IN PLACE to :is(:pseudo, .<prefix>gate-*),
 * where <prefix> is the project's classPrefix, stamped on <html data-prefix> by the page.
 * :is() takes the specificity of its most specific argument and a pseudo-class and a class are
 * both (0,1,0), so specificity and source position are preserved exactly: the cells paint the
 * real cascade, framework rules included. Real pointer and keyboard states still work.
 *
 * It is not a substitute for measuring true focus — only one element can hold focus — so probes
 * that need the authoritative Focus numbers still call el.focus(). */
(function () {
  var P = document.documentElement.getAttribute('data-prefix') || '';
  var G = P + 'gate-';
  /* `(?![\w-])`: without it `:focus` matches inside `:focus-within` and yields an invalid
     selector the setter drops silently. `focus-visible` must precede `focus` in the
     alternation or it degrades to `:is(:focus,…)-visible`. `(?!,\s*\.<prefix>gate-)` stops a second
     pass from re-wrapping a pseudo it already wrapped. */
  var RE = new RegExp(':(focus-visible|focus|hover|active)(?![\\w-])(?!,\\s*\\.' + G + ')', 'g');

  function gateClass(name) {
    if (name === 'hover') return '.' + G + 'hover';
    if (name === 'active') return '.' + G + 'active';
    return '.' + G + 'focus';
  }

  function gate(sel) {
    return sel.replace(RE, function (_, name) {
      return ':is(:' + name + ', ' + gateClass(name) + ')';
    });
  }

  function run() {
    var stats = { sheets: 0, styleRules: 0, rewritten: 0, failed: [], tagged: 0 };

    function walk(container) {
      var rules;
      try { rules = container.cssRules; } catch (e) { return; }
      if (!rules) return;
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.selectorText) {
          stats.styleRules++;
          var next = gate(r.selectorText);
          if (next !== r.selectorText) {
            var before = r.selectorText;
            try { r.selectorText = next; } catch (e) { /* rebuilt below */ }
            if (r.selectorText.indexOf(G) === -1) {
              /* The setter may no-op on a selector it cannot parse: rebuild at the same index. */
              try {
                container.deleteRule(i);
                container.insertRule(next + '{' + r.style.cssText + '}', i);
                r = rules[i];
              } catch (e2) { stats.failed.push(before); continue; }
            }
            stats.rewritten++;
          }
        }
        /* Since CSS Nesting, every style rule has an empty-but-truthy cssRules list. */
        if (r.cssRules && r.cssRules.length) walk(r);
      }
    }

    for (var s = 0; s < document.styleSheets.length; s++) { stats.sheets++; walk(document.styleSheets[s]); }

    /* Pressed is hover + active: the framework's pressed rule is `.btn:hover:active`. */
    var cells = document.querySelectorAll('[data-gate]');
    for (var c = 0; c < cells.length; c++) {
      var states = cells[c].getAttribute('data-gate').split(/\s+/);
      for (var k = 0; k < states.length; k++) {
        var st = states[k];
        if (st === 'active') cells[c].classList.add(G + 'active', G + 'hover');
        else if (st === 'hover') cells[c].classList.add(G + 'hover');
        else if (st === 'focus') cells[c].classList.add(G + 'focus');
      }
      stats.tagged++;
    }

    window.wfStateGate = stats;

    var outs = document.querySelectorAll('[id="' + P + 'state-gate-readout"]');
    for (var o = 0; o < outs.length; o++) {
      outs[o].innerHTML = '<br><strong>State gate:</strong> ' + stats.rewritten + ' of ' +
        stats.styleRules + ' style rules across ' + stats.sheets +
        ' stylesheets rewritten, ' + stats.tagged + ' cells driven' +
        (stats.failed.length
          ? ', <strong>' + stats.failed.length + ' selector(s) FAILED to rewrite</strong>.'
          : ', 0 rewrite failures.');
    }
  }

  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);
})();
