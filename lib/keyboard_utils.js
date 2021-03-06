// Copyright Ilya Sukhar <ilya.sukhar@gmail.com> and Phil Crosby <phil.crosby@gmail.com> (github: philc)
// github : https://github.com/philc/vimium
// Generated by CoffeeScript 1.12.7
(function() {
  var KeyboardUtils, mapKeyRegistry, root,
    slice = [].slice;

  mapKeyRegistry = {};

  if (typeof Utils !== "undefined" && Utils !== null) {
    Utils.monitorChromeStorage("mapKeyRegistry", (function(_this) {
      return function(value) {
        return mapKeyRegistry = value;
      };
    })(this));
  }

  KeyboardUtils = {
    keyNames: {
      "ArrowLeft": "left",
      "ArrowUp": "up",
      "ArrowRight": "right",
      "ArrowDown": "down",
      " ": "space",
      "Backspace": "backspace"
    },
    init: function() {
      if (navigator.userAgent.indexOf("Mac") !== -1) {
        return this.platform = "Mac";
      } else if (navigator.userAgent.indexOf("Linux") !== -1) {
        return this.platform = "Linux";
      } else {
        return this.platform = "Windows";
      }
    },
    getKeyChar: function(event) {
      var key;
      if (!Settings.get("ignoreKeyboardLayout")) {
        key = event.key;
      } else if (event.code.slice(0, 6) === "Numpad") {
        key = event.key;
      } else {
        key = event.code;
        if (key.slice(0, 3) === "Key") {
          key = key.slice(3);
        }
        if (this.enUsTranslations[key]) {
          key = event.shiftKey ? this.enUsTranslations[key][1] : this.enUsTranslations[key][0];
        } else if (key.length === 1 && !event.shiftKey) {
          key = key.toLowerCase();
        }
      }
      if (key in this.keyNames) {
        return this.keyNames[key];
      } else if (key == null) {
        return "";
      } else if (key.length === 1) {
        return key;
      } else if (key.length === 2 && ("F1" <= key && key <= "F9")) {
        return key.toLowerCase();
      } else if (key.length === 3 && ("F10" <= key && key <= "F12")) {
        return key.toLowerCase();
      } else {
        return "";
      }
    },
    getKeyCharString: function(event) {
      var keyChar, modifiers, ref;
      if (keyChar = this.getKeyChar(event)) {
        modifiers = [];
        if (event.shiftKey && keyChar.length === 1) {
          keyChar = keyChar.toUpperCase();
        }
        if (event.altKey) {
          modifiers.push("a");
        }
        if (event.ctrlKey) {
          modifiers.push("c");
        }
        if (event.metaKey) {
          modifiers.push("m");
        }
        keyChar = slice.call(modifiers).concat([keyChar]).join("-");
        if (1 < keyChar.length) {
          keyChar = "<" + keyChar + ">";
        }
        keyChar = (ref = mapKeyRegistry[keyChar]) != null ? ref : keyChar;
        return keyChar;
      }
    },
    isEscape: (function() {
      var useVimLikeEscape;
      useVimLikeEscape = true;
      Utils.monitorChromeStorage("useVimLikeEscape", function(value) {
        return useVimLikeEscape = value;
      });
      return function(event) {
        return event.key === "Escape" || (useVimLikeEscape && this.getKeyCharString(event) === "<c-[>");
      };
    })(),
    isBackspace: function(event) {
      var ref;
      return (ref = event.key) === "Backspace" || ref === "Delete";
    },
    isPrintable: function(event) {
      var ref;
      return ((ref = this.getKeyCharString(event)) != null ? ref.length : void 0) === 1;
    },
    enUsTranslations: {
      "Backquote": ["`", "~"],
      "Minus": ["-", "_"],
      "Equal": ["=", "+"],
      "Backslash": ["\\", "|"],
      "IntlBackslash": ["\\", "|"],
      "BracketLeft": ["[", "{"],
      "BracketRight": ["]", "}"],
      "Semicolon": [";", ":"],
      "Quote": ["'", '"'],
      "Comma": [",", "<"],
      "Period": [".", ">"],
      "Slash": ["/", "?"],
      "Space": [" ", " "],
      "Digit1": ["1", "!"],
      "Digit2": ["2", "@"],
      "Digit3": ["3", "#"],
      "Digit4": ["4", "$"],
      "Digit5": ["5", "%"],
      "Digit6": ["6", "^"],
      "Digit7": ["7", "&"],
      "Digit8": ["8", "*"],
      "Digit9": ["9", "("],
      "Digit0": ["0", ")"]
    }
  };

  KeyboardUtils.init();

  root = typeof exports !== "undefined" && exports !== null ? exports : (window.root != null ? window.root : window.root = {});

  root.KeyboardUtils = KeyboardUtils;

  if (typeof exports === "undefined" || exports === null) {
    extend(window, root);
  }

}).call(this);
