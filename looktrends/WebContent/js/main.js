;(function() {

  var MAX_COLS = 5,
      FADE_DELAY = 10000,
      FADE_DUR = 500,
      WIPE_DELAY = Math.max(url.int('delay', 3000), 3000),
      wipers = [],
      termsByRegion,
      terms,
      termIndex = 0,
      now,
      lastUpdate,
      idleTimeout, 
      matrixInitialized = false,
      matrix,
      matrixSelect, 
      rows,
      cols,
      pipe;


  init();
  getTerms(function(t) {

    termsByRegion = t;

    if (!matrixInitialized) {
      matrixInitialized = true;
      initializeMatrix();
    }

  });

  function getTerms(callback) {

    // if (url.terms) {
      // callback({ 0: JSON.parse(url.terms) });
    // } else { 
      $.getJSON('api/terms/', callback);
    // }

    setTimeout(function() {
      getTerms(callback);
    }, 60 * 60 * 1000);

  }

  function initializeMatrix() {

    matrix = generateMatrix(MAX_COLS, MAX_COLS);
    matrix.id = 'matrix';
    document.getElementById('matrix-container').appendChild(matrix);

    $(matrix).find('.cell').each(function() {
      wipers.push(new Wiper(this));
    });

    setMatrix(url.int('r', 1)-1, url.int('c', 1)-1);
    setRegion(url.int('p', 0));

    lastUpdate = (+new Date());

    _.each(wipers, startLoop);

    update();

  }

  function startLoop(wiper) {

    var delayedNext = function() {
      wiper.timeout = setTimeout(wiper.next, WIPE_DELAY);
    };

    wiper.next = function() {
      clearTimeout(wiper.timeout);
      wiper.show(terms[++termIndex%terms.length], delayedNext);
    };

    wiper.next();

  }

  function forceNext() {
    _.each(wipers, function(w) {
      if (w.next) w.next(); // meh
    });
  }

  function update() {
    requestAnimationFrame(update);
    now = (+new Date());
    _.each(wipers, updateWiper);
    lastUpdate = now;
  }

  function updateWiper(w) {
    if (!w.disabled) w.update(now - lastUpdate);
  }


  function generateMatrix(rows, cols) {

    var m = document.createElement('div');

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {

        var cell = document.createElement('div');
        cell.classList.add('cell');
        m.appendChild(cell);

      }
    }

    return m;

  }


  function setMatrix(r, c) {

    rows = Math.max(Math.min(r, MAX_COLS-1), 0);
    cols = Math.max(Math.min(c, MAX_COLS-1), 0);

    $(matrix).find('.cell').each(function(k, v) {

      var col = Math.floor(k / MAX_COLS);
      var row = k % MAX_COLS;

      if (row > rows || col > cols) {

        wipers[k].disabled = true;
        v.style.display = 'none';

      } else { 

        // Hm.
        if (wipers[k].disabled) wipers[k].onTransitionEnd();

        wipers[k].disabled = false;
        v.style.top = (row) / (rows+1) * 100 + '%';
        v.style.left = (col) / (cols+1) * 100 + '%';
        v.style.width = 1 / (cols+1) * 101 + '%'; // hack for 1px line that shows up
        v.style.height = 1 / (rows+1) * 101 + '%';
        v.style.display = 'block';
      }

    });
    
    onResize();
    highlightRows(rows, cols, 'select');

  }

  function setRegion(p) {

    var termsRaw;
    pipe = p;
    
    // all regions
    if (p == 0 || !(p in termsByRegion)) {
      termsRaw = _.flatten(termsByRegion);
    } else { 
      termsRaw = termsByRegion[p];
    }

    terms = _.shuffle(_.uniq(termsRaw));

    // Update display

    $selected = $("#region-select option[value='"+p+"']");
    $("#region-select").val(p);
    $("#region span").html($selected.html());

    $("#region-select").width($("#region span").width());

    forceNext();

  }

  function init() {

    // Global resize
    $(window).bind('resize', _.debounce(onResize, 100));

    // Idle fade 
    resetIdleTimeout();
    $(document.body).mousemove(function() {
      $('.idleable').fadeIn();
      resetIdleTimeout();
    });

    // Matrix selector
    matrixSelect = generateTable(MAX_COLS, MAX_COLS);
    matrixSelect.id = 'matrix-select';

    var matrixSelectShowing = false;
    var $matrixSelectContainer = $('#matrix-select-container');

    $matrixSelectContainer.prepend(matrixSelect);

    $(matrixSelect).find('td').each(function(k, v) {

      var col = Math.floor(k / MAX_COLS);
      var row = k % MAX_COLS;

      // Hover highlight
      $(this).bind('mousemove', function(e) {
        e.preventDefault();
        highlightRows(col, row, 'highlight');
        return false;
      });

      // Set matrix
      $(this).bind('click', function(e) {
        e.preventDefault();
        setMatrix(col, row);

        _gaq.push(['_trackEvent', 'Matrix', 'Change', (col+1) + 'x' + (row+1)]);
        updateURL();


        matrixSelectShowing = false;
        $matrixSelectContainer.removeClass('showing');
        resetIdleTimeout();
        return false;
      });

    });


    var openMatrixSelect = function() {
      clearTimeout(idleTimeout);
      highlightRows(0, 0, 'highlight');
      matrixSelectShowing = true;
      $matrixSelectContainer.addClass('showing');
    };

    $('#matrix-button').bind('click', openMatrixSelect)
    if (!Modernizr.touch) {
      $('#matrix-button').bind('mouseenter', openMatrixSelect)
    }


    $matrixSelectContainer.bind('mouseleave', function() {
      matrixSelectShowing = false;
      $matrixSelectContainer.removeClass('showing');
    });


    var $regionSelect = $('#region-select');
    $('#region').prepend($regionSelect);

    // Alphabetize region select.
    var items = $regionSelect.children('option.sort').get();
    items.sort(function(a, b) {
      var compA = $(a).text().toUpperCase();
      var compB = $(b).text().toUpperCase();
      return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
    });
    $.each(items, function(k, v) { $regionSelect.append(v); });

    $regionSelect.change(function() {
      setRegion($(this).val());

      _gaq.push(['_trackEvent', 'Region', 'Change', $(this).val()]);
      updateURL();

    });

    function resetIdleTimeout() {
      
      if (Modernizr.touch) return;

      clearTimeout(idleTimeout);

      idleTimeout = setTimeout(function() {
        $('.idleable').fadeOut(FADE_DUR);
      }, FADE_DELAY);

    }

    // if (url.boolean('neat')) { 

      // $('body *:not(#matrix-container)').remove();
      // $('#matrix-container *:not(#matrix)').remove();

    // }

  }

  function generateTable(rows, cols) {

    var table = document.createElement('table');

    for (var r = 0; r < rows; r++) {
      var row = document.createElement('tr');
      table.appendChild(row);
      for (var c = 0; c < cols; c++) {

        var cell = document.createElement('td');
        row.appendChild(cell);

      }
    }

    return table;

  }

  function updateURL() {
    
    var args = {};
    if (rows != 0) args.r = rows+1;
    if (cols != 0) args.c = cols+1;
    if (pipe != 0) args.p = pipe;
    if (url.hl) args.hl = url.hl;

    var str = [];
    _.each(args, function(v, k) {
      str.push(k +'=' + v);
    })

    str = str.join('&');

    if (Modernizr.history) {
      history.replaceState({}, '', '?' + str);
    } else { 
      window.location = '?' + str;
    }

    console.log(str)

    if (parent && parent.postMessage) {
      parent.postMessage('?' + str, "*");
    }

    // if (parent.document.updateUrl) {
    //   parent.document.updateUrl(rows+1, cols+1, pipe)
    // }  

  }

  function onResize() {

    _.each(wipers, function(w) {
      w.onResize();
    });

  }


  function highlightRows(cols, rows, className) {

    $(matrixSelect).find('td').each(function(k, v) {

      var col = Math.floor(k / MAX_COLS);
      var row = k % MAX_COLS;

      if (col <= cols && row <= rows) {
        $(this).addClass(className);
      } else { 
        $(this).removeClass(className);
      }

    });

  }

})();
