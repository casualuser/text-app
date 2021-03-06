var EditSession = CodeMirror.Doc;

/**
 * @constructor
 * @param {DOM} elementId
 * @param {Settings} settings
 */
function EditorCodeMirror(editorElement, settings) {
  this.element_ = editorElement;
  this.settings_ = settings;
  this.cm_ = CodeMirror(
      editorElement, {'autofocus': true, 'matchBrackets': true, 'value': ''});
  this.cm_.setSize(null, 'auto');
  this.cm_.on('change', this.onChange.bind(this));
  this.searchCursor_ = null;
  this.setTheme();
  this.defaultTabHandler_ = CodeMirror.commands.defaultTab;
}

EditorCodeMirror.EXTENSION_TO_MODE = {
    'bash': 'shell',
    'coffee': 'coffeescript',
    'c': 'clike',
    'c++': 'clike',
    'cc': 'clike',
    'cs': 'clike',
    'css': 'css',
    'cpp': 'clike',
    'cxx': 'clike',
    'diff': 'diff',
    'gemspec': 'ruby',
    'go': 'go',
    'h': 'clike',
    'hh': 'clike',
    'hpp': 'clike',
    'htm': 'htmlmixed',
    'html': 'htmlmixed',
    'java': 'clike',
    'js': 'javascript',
    'json': 'yaml',
    'latex': 'stex',
    'less': 'less',
    'ltx': 'stex',
    'lua': 'lua',
    'markdown': 'markdown',
    'md': 'markdown',
    'ml': 'ocaml',
    'mli': 'ocaml',
    'patch': 'diff',
    'pgsql': 'sql',
    'pl': 'perl',
    'pm': 'perl',
    'php': 'php',
    'phtml': 'php',
    'py': 'python',
    'rb': 'ruby',
    'rdf': 'xml',
    'rs': 'rust',
    'rss': 'xml',
    'ru': 'ruby',
    'sh': 'shell',
    'sql': 'sql',
    'svg': 'xml',
    'tex': 'stex',
    'xhtml': 'htmlmixed',
    'xml': 'xml',
    'xq': 'xquery',
    'yaml': 'yaml'};

/**
 * @param {string} opt_content
 * @return {EditSession}
 * Create an edit session for a new file. Each tab should have its own session.
 */
EditorCodeMirror.prototype.newSession = function(opt_content) {
  var session = new CodeMirror.Doc(opt_content || '');
  return session;
};
/**
 * @param {EditSession} session
 * Change the current session, usually to switch to another tab.
 */
EditorCodeMirror.prototype.setSession = function(session) {
  this.cm_.swapDoc(session);
};

/**
 * @param {string} query
 * @param {CodeMirror.Pos} pos
 * Get a search cursor that is always case insensitive.
 */
EditorCodeMirror.prototype.getSearchCursor = function(query, pos) {
  return this.cm_.getSearchCursor(query, pos, true /* case insensitive */);
};

/**
 * @param {string} query
 * Initialize search. This is called every time the search string is updated.
 */
EditorCodeMirror.prototype.find = function(query) {
  this.searchQuery_ = query;

  // If there is no selection, we start at cursor. If there is, we start at the
  // beginning of it.
  var currentPos = this.cm_.getCursor('start');

  this.searchCursor_ = this.getSearchCursor(query, currentPos);

  // Actually go to the match.
  this.findNext();
};

/**
 * @param {boolean} opt_reverse
 * Select the next match when user presses Enter in search field or clicks on
 * "Next" and "Previous" search navigation buttons.
 */
EditorCodeMirror.prototype.findNext = function(opt_reverse) {
  if (!this.searchCursor_) {
    throw 'Internal error: search cursor should be initialized.';
  }
  var reverse = opt_reverse || false;

  if (!this.searchCursor_.find(reverse)) {
    var lastLine = CodeMirror.Pos(this.cm_.lastLine());
    var firstLine = CodeMirror.Pos(this.cm_.firstLine(), 0);
    this.searchCursor_ = this.getSearchCursor(this.searchQuery_,
        reverse ? lastLine : firstLine);
    this.searchCursor_.find(reverse);
  }

  var from = this.searchCursor_.from();
  var to = this.searchCursor_.to();

  if (from && to) {
    this.cm_.setSelection(from, to);
  } else {
    this.clearSelection();
  }
};

EditorCodeMirror.prototype.clearSelection = function() {
  this.cm_.setCursor(this.cm_.getCursor('anchor'));
};

EditorCodeMirror.prototype.clearSearch = function() {
  this.searchCursor_ = null;
  this.clearSelection();
};

EditorCodeMirror.prototype.onChange = function() {
  $.event.trigger('docchange', this.cm_.getDoc());
};

EditorCodeMirror.prototype.undo = function() {
  this.cm_.undo();
};

EditorCodeMirror.prototype.redo = function() {
  this.cm_.redo();
};

EditorCodeMirror.prototype.focus = function() {
  this.cm_.focus();
};

/**
 * @param {Session} session
 * @param {string} extension
 */
EditorCodeMirror.prototype.setMode = function(session, extension) {
  var mode = EditorCodeMirror.EXTENSION_TO_MODE[extension];
  if (mode) {
    var currentSession = null;
    if (session !== this.cm_.getDoc()) {
      currentSession = this.cm_.swapDoc(session);
    }
    this.cm_.setOption('mode', mode);
    if (currentSession !== null) {
      this.cm_.swapDoc(currentSession);
    }
  }
};

/**
 * @param {number} fontSize
 * Update font size from settings.
 */
EditorCodeMirror.prototype.setFontSize = function(fontSize) {
  $('.CodeMirror').css('font-size',fontSize + 'px');
  this.cm_.refresh();
};

/**
 * @param {EditSession} session
 * @return {string}
 */
EditorCodeMirror.prototype.getContents = function(session) {
  session.getValue();
};

/**
 * @param {EditSession} session
 * @param {number} size
 */
EditorCodeMirror.prototype.setTabSize = function(size) {
  this.cm_.setOption('tabSize', size);
  this.replaceTabWithSpaces(this.settings_.get('spacestab'));
};

/**
 * @param {string} theme
 */
EditorCodeMirror.prototype.setTheme = function(theme) {
  this.cm_.setOption('theme', theme || 'default');
};

/**
 * @param {boolean} val
 */
EditorCodeMirror.prototype.showHideLineNumbers = function(val) {
  this.cm_.setOption('lineNumbers', val);
};

/**
 * @param {boolean} val
 */
EditorCodeMirror.prototype.setWrapLines = function(val) {
  this.cm_.setOption('lineWrapping', val);
};

/**
 * @param {boolean} val
 */
EditorCodeMirror.prototype.setSmartIndent = function(val) {
  this.cm_.setOption('smartIndent', val);
};

/**
 * @param {boolean} val
 */
EditorCodeMirror.prototype.replaceTabWithSpaces = function(val) {
  if (val) {
    // Need to update this closure once the tabsize has changed. So, have to
    // call this method when it happens.
    var tabsize = this.settings_.get('tabsize');
    CodeMirror.commands.defaultTab = function(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection("add");
      } else {
        var nspaces = tabsize - cm.getCursor().ch % tabsize;
        var spaces = Array(nspaces + 1).join(" ");
        cm.replaceSelection(spaces, "end", "+input");
      }
    };
  } else {
    CodeMirror.commands.defaultTab = this.defaultTabHandler_;
  }
};

/**
 * @param {boolean} show
 * @param {number} col
 */
EditorCodeMirror.prototype.showHideMargin = function(show, col) {
};

var Editor = EditorCodeMirror;

