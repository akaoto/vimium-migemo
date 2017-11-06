// Copyright Ilya Sukhar <ilya.sukhar@gmail.com> and Phil Crosby <phil.crosby@gmail.com> (github: philc)
// github : https://github.com/philc/vimium
// Generated by CoffeeScript 1.12.7
(function() {
  var Commands, commandDescriptions, defaultKeyMappings, ref, ref1, root,
    hasProp = {}.hasOwnProperty,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Commands = {
    availableCommands: {},
    keyToCommandRegistry: null,
    mapKeyRegistry: null,
    init: function() {
      var command, description, options, ref;
      for (command in commandDescriptions) {
        if (!hasProp.call(commandDescriptions, command)) continue;
        ref = commandDescriptions[command], description = ref[0], options = ref[1];
        this.availableCommands[command] = extend(options != null ? options : {}, {
          description: description
        });
      }
      Settings.postUpdateHooks["keyMappings"] = this.loadKeyMappings.bind(this);
      return this.loadKeyMappings(Settings.get("keyMappings"));
    },
    loadKeyMappings: function(customKeyMappings) {
      var _, base, command, configLines, fromChar, i, key, keySequence, len, line, name, optionList, options, ref, ref1, registryEntry, seen, toChar, tokens, unmapAll;
      this.keyToCommandRegistry = {};
      this.mapKeyRegistry = {};
      configLines = (function() {
        var results;
        results = [];
        for (key in defaultKeyMappings) {
          if (!hasProp.call(defaultKeyMappings, key)) continue;
          command = defaultKeyMappings[key];
          results.push("map " + key + " " + command);
        }
        return results;
      })();
      configLines.push.apply(configLines, BgUtils.parseLines(customKeyMappings));
      seen = {};
      unmapAll = false;
      ref = configLines.reverse();
      for (i = 0, len = ref.length; i < len; i++) {
        line = ref[i];
        tokens = line.split(/\s+/);
        switch (tokens[0]) {
          case "map":
            if (3 <= tokens.length && !unmapAll) {
              _ = tokens[0], key = tokens[1], command = tokens[2], optionList = 4 <= tokens.length ? slice.call(tokens, 3) : [];
              if (!seen[key] && (registryEntry = this.availableCommands[command])) {
                seen[key] = true;
                keySequence = this.parseKeySequence(key);
                options = this.parseCommandOptions(command, optionList);
                this.keyToCommandRegistry[key] = extend({
                  keySequence: keySequence,
                  command: command,
                  options: options,
                  optionList: optionList
                }, this.availableCommands[command]);
              }
            }
            break;
          case "unmap":
            if (tokens.length === 2) {
              seen[tokens[1]] = true;
            }
            break;
          case "unmapAll":
            unmapAll = true;
            break;
          case "mapkey":
            if (tokens.length === 3) {
              fromChar = this.parseKeySequence(tokens[1]);
              toChar = this.parseKeySequence(tokens[2]);
              if ((fromChar.length === (ref1 = toChar.length) && ref1 === 1)) {
                if ((base = this.mapKeyRegistry)[name = fromChar[0]] == null) {
                  base[name] = toChar[0];
                }
              }
            }
        }
      }
      chrome.storage.local.set({
        mapKeyRegistry: this.mapKeyRegistry
      });
      this.installKeyStateMapping();
      this.prepareHelpPageData();
      return Settings.set("passNextKeyKeys", (function() {
        var ref2, results;
        ref2 = this.keyToCommandRegistry;
        results = [];
        for (key in ref2) {
          if (!hasProp.call(ref2, key)) continue;
          if (this.keyToCommandRegistry[key].command === "passNextKey" && 1 < key.length) {
            results.push(key);
          }
        }
        return results;
      }).call(this));
    },
    parseKeySequence: (function() {
      var modifiedKey, modifier, namedKey, specialKeyRegexp;
      modifier = "(?:[acm]-)";
      namedKey = "(?:[a-z][a-z0-9]+)";
      modifiedKey = "(?:" + modifier + "+(?:.|" + namedKey + "))";
      specialKeyRegexp = new RegExp("^<(" + namedKey + "|" + modifiedKey + ")>(.*)", "i");
      return function(key) {
        var i, keyChar, modifiers, ref;
        if (key.length === 0) {
          return [];
        } else if (0 === key.search(specialKeyRegexp)) {
          ref = RegExp.$1.split("-"), modifiers = 2 <= ref.length ? slice.call(ref, 0, i = ref.length - 1) : (i = 0, []), keyChar = ref[i++];
          if (keyChar.length !== 1) {
            keyChar = keyChar.toLowerCase();
          }
          modifiers = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = modifiers.length; j < len; j++) {
              modifier = modifiers[j];
              results.push(modifier.toLowerCase());
            }
            return results;
          })();
          modifiers.sort();
          return ["<" + (slice.call(modifiers).concat([keyChar]).join('-')) + ">"].concat(slice.call(this.parseKeySequence(RegExp.$2)));
        } else {
          return [key[0]].concat(slice.call(this.parseKeySequence(key.slice(1))));
        }
      };
    })(),
    parseCommandOptions: function(command, optionList) {
      var i, len, option, options, parse;
      options = {};
      for (i = 0, len = optionList.length; i < len; i++) {
        option = optionList[i];
        parse = option.split("=", 2);
        options[parse[0]] = parse.length === 1 ? true : parse[1];
      }
      if ("count" in options) {
        options.count = parseInt(options.count);
        if (isNaN(options.count) || this.availableCommands[command].noRepeat) {
          delete options.count;
        }
      }
      return options;
    },
    installKeyStateMapping: function() {
      var currentMapping, i, index, j, key, keyStateMapping, keys, len, len1, prop, ref, ref1, ref2, ref3, registryEntry;
      keyStateMapping = {};
      ref = this.keyToCommandRegistry;
      for (keys in ref) {
        if (!hasProp.call(ref, keys)) continue;
        registryEntry = ref[keys];
        currentMapping = keyStateMapping;
        ref1 = registryEntry.keySequence;
        for (index = i = 0, len = ref1.length; i < len; index = ++i) {
          key = ref1[index];
          if ((ref2 = currentMapping[key]) != null ? ref2.command : void 0) {
            break;
          } else if (index < registryEntry.keySequence.length - 1) {
            currentMapping = currentMapping[key] != null ? currentMapping[key] : currentMapping[key] = {};
          } else {
            currentMapping[key] = extend({}, registryEntry);
            ref3 = ["keySequence", "description"];
            for (j = 0, len1 = ref3.length; j < len1; j++) {
              prop = ref3[j];
              delete currentMapping[key][prop];
            }
          }
        }
      }
      chrome.storage.local.set({
        normalModeKeyStateMapping: keyStateMapping
      });
      return chrome.storage.local.set({
        useVimLikeEscape: !("<c-[>" in keyStateMapping)
      });
    },
    prepareHelpPageData: function() {
      var command, commandGroups, commandToKey, commands, group, i, key, len, name, ref, ref1, ref2, registryEntry;
      commandToKey = {};
      ref = this.keyToCommandRegistry;
      for (key in ref) {
        if (!hasProp.call(ref, key)) continue;
        registryEntry = ref[key];
        (commandToKey[name = registryEntry.command] != null ? commandToKey[name] : commandToKey[name] = []).push(key);
      }
      commandGroups = {};
      ref1 = this.commandGroups;
      for (group in ref1) {
        if (!hasProp.call(ref1, group)) continue;
        commands = ref1[group];
        commandGroups[group] = [];
        for (i = 0, len = commands.length; i < len; i++) {
          command = commands[i];
          commandGroups[group].push({
            command: command,
            description: this.availableCommands[command].description,
            keys: (ref2 = commandToKey[command]) != null ? ref2 : [],
            advanced: indexOf.call(this.advancedCommands, command) >= 0
          });
        }
      }
      return chrome.storage.local.set({
        helpPageData: commandGroups
      });
    },
    commandGroups: {
      pageNavigation: ["scrollDown", "scrollUp", "scrollToTop", "scrollToBottom", "scrollPageDown", "scrollPageUp", "scrollFullPageDown", "scrollFullPageUp", "scrollLeft", "scrollRight", "scrollToLeft", "scrollToRight", "reload", "copyCurrentUrl", "openCopiedUrlInCurrentTab", "openCopiedUrlInNewTab", "goUp", "goToRoot", "enterInsertMode", "enterVisualMode", "enterVisualLineMode", "passNextKey", "focusInput", "LinkHints.activateMode", "LinkHints.activateModeToOpenInNewTab", "LinkHints.activateModeToOpenInNewForegroundTab", "LinkHints.activateModeWithQueue", "LinkHints.activateModeToDownloadLink", "LinkHints.activateModeToOpenIncognito", "LinkHints.activateModeToCopyLinkUrl", "goPrevious", "goNext", "nextFrame", "mainFrame", "Marks.activateCreateMode", "Marks.activateGotoMode"],
      vomnibarCommands: ["Vomnibar.activate", "Vomnibar.activateInNewTab", "Vomnibar.activateBookmarks", "Vomnibar.activateBookmarksInNewTab", "Vomnibar.activateTabSelection", "Vomnibar.activateEditUrl", "Vomnibar.activateEditUrlInNewTab"],
      findCommands: ["enterFindMode", "performFind", "performBackwardsFind"],
      historyNavigation: ["goBack", "goForward"],
      tabManipulation: ["createTab", "previousTab", "nextTab", "visitPreviousTab", "firstTab", "lastTab", "duplicateTab", "togglePinTab", "toggleMuteTab", "removeTab", "restoreTab", "moveTabToNewWindow", "closeTabsOnLeft", "closeTabsOnRight", "closeOtherTabs", "moveTabLeft", "moveTabRight"],
      misc: ["showHelp", "toggleViewSource"]
    },
    advancedCommands: ["scrollToLeft", "scrollToRight", "moveTabToNewWindow", "goUp", "goToRoot", "LinkHints.activateModeWithQueue", "LinkHints.activateModeToDownloadLink", "Vomnibar.activateEditUrl", "Vomnibar.activateEditUrlInNewTab", "LinkHints.activateModeToOpenIncognito", "LinkHints.activateModeToCopyLinkUrl", "goNext", "goPrevious", "Marks.activateCreateMode", "Marks.activateGotoMode", "moveTabLeft", "moveTabRight", "closeTabsOnLeft", "closeTabsOnRight", "closeOtherTabs", "enterVisualLineMode", "toggleViewSource", "passNextKey"]
  };

  defaultKeyMappings = {
    "?": "showHelp",
    "j": "scrollDown",
    "k": "scrollUp",
    "h": "scrollLeft",
    "l": "scrollRight",
    "gg": "scrollToTop",
    "G": "scrollToBottom",
    "zH": "scrollToLeft",
    "zL": "scrollToRight",
    "<c-e>": "scrollDown",
    "<c-y>": "scrollUp",
    "d": "scrollPageDown",
    "u": "scrollPageUp",
    "r": "reload",
    "gs": "toggleViewSource",
    "i": "enterInsertMode",
    "v": "enterVisualMode",
    "V": "enterVisualLineMode",
    "H": "goBack",
    "L": "goForward",
    "gu": "goUp",
    "gU": "goToRoot",
    "gi": "focusInput",
    "f": "LinkHints.activateMode",
    "F": "LinkHints.activateModeToOpenInNewTab",
    "<a-f>": "LinkHints.activateModeWithQueue",
    "yf": "LinkHints.activateModeToCopyLinkUrl",
    "/": "enterFindMode",
    "n": "performFind",
    "N": "performBackwardsFind",
    "[[": "goPrevious",
    "]]": "goNext",
    "yy": "copyCurrentUrl",
    "p": "openCopiedUrlInCurrentTab",
    "P": "openCopiedUrlInNewTab",
    "K": "nextTab",
    "J": "previousTab",
    "gt": "nextTab",
    "gT": "previousTab",
    "^": "visitPreviousTab",
    "<<": "moveTabLeft",
    ">>": "moveTabRight",
    "g0": "firstTab",
    "g$": "lastTab",
    "W": "moveTabToNewWindow",
    "t": "createTab",
    "yt": "duplicateTab",
    "x": "removeTab",
    "X": "restoreTab",
    "<a-p>": "togglePinTab",
    "<a-m>": "toggleMuteTab",
    "o": "Vomnibar.activate",
    "O": "Vomnibar.activateInNewTab",
    "T": "Vomnibar.activateTabSelection",
    "b": "Vomnibar.activateBookmarks",
    "B": "Vomnibar.activateBookmarksInNewTab",
    "ge": "Vomnibar.activateEditUrl",
    "gE": "Vomnibar.activateEditUrlInNewTab",
    "gf": "nextFrame",
    "gF": "mainFrame",
    "m": "Marks.activateCreateMode",
    "`": "Marks.activateGotoMode"
  };

  commandDescriptions = {
    showHelp: [
      "Show help", {
        topFrame: true,
        noRepeat: true
      }
    ],
    scrollDown: ["Scroll down"],
    scrollUp: ["Scroll up"],
    scrollLeft: ["Scroll left"],
    scrollRight: ["Scroll right"],
    scrollToTop: ["Scroll to the top of the page"],
    scrollToBottom: [
      "Scroll to the bottom of the page", {
        noRepeat: true
      }
    ],
    scrollToLeft: [
      "Scroll all the way to the left", {
        noRepeat: true
      }
    ],
    scrollToRight: [
      "Scroll all the way to the right", {
        noRepeat: true
      }
    ],
    scrollPageDown: ["Scroll a half page down"],
    scrollPageUp: ["Scroll a half page up"],
    scrollFullPageDown: ["Scroll a full page down"],
    scrollFullPageUp: ["Scroll a full page up"],
    reload: [
      "Reload the page", {
        noRepeat: true
      }
    ],
    toggleViewSource: [
      "View page source", {
        noRepeat: true
      }
    ],
    copyCurrentUrl: [
      "Copy the current URL to the clipboard", {
        noRepeat: true
      }
    ],
    openCopiedUrlInCurrentTab: [
      "Open the clipboard's URL in the current tab", {
        background: true,
        noRepeat: true
      }
    ],
    openCopiedUrlInNewTab: [
      "Open the clipboard's URL in a new tab", {
        background: true,
        repeatLimit: 20
      }
    ],
    enterInsertMode: [
      "Enter insert mode", {
        noRepeat: true
      }
    ],
    passNextKey: ["Pass the next key to the page"],
    enterVisualMode: [
      "Enter visual mode", {
        noRepeat: true
      }
    ],
    enterVisualLineMode: [
      "Enter visual line mode", {
        noRepeat: true
      }
    ],
    focusInput: ["Focus the first text input on the page"],
    "LinkHints.activateMode": ["Open a link in the current tab"],
    "LinkHints.activateModeToOpenInNewTab": ["Open a link in a new tab"],
    "LinkHints.activateModeToOpenInNewForegroundTab": ["Open a link in a new tab & switch to it"],
    "LinkHints.activateModeWithQueue": [
      "Open multiple links in a new tab", {
        noRepeat: true
      }
    ],
    "LinkHints.activateModeToOpenIncognito": ["Open a link in incognito window"],
    "LinkHints.activateModeToDownloadLink": ["Download link url"],
    "LinkHints.activateModeToCopyLinkUrl": ["Copy a link URL to the clipboard"],
    enterFindMode: [
      "Enter find mode", {
        noRepeat: true
      }
    ],
    performFind: ["Cycle forward to the next find match"],
    performBackwardsFind: ["Cycle backward to the previous find match"],
    goPrevious: [
      "Follow the link labeled previous or <", {
        noRepeat: true
      }
    ],
    goNext: [
      "Follow the link labeled next or >", {
        noRepeat: true
      }
    ],
    goBack: ["Go back in history"],
    goForward: ["Go forward in history"],
    goUp: ["Go up the URL hierarchy"],
    goToRoot: ["Go to root of current URL hierarchy"],
    nextTab: [
      "Go one tab right", {
        background: true
      }
    ],
    previousTab: [
      "Go one tab left", {
        background: true
      }
    ],
    visitPreviousTab: [
      "Go to previously-visited tab", {
        background: true
      }
    ],
    firstTab: [
      "Go to the first tab", {
        background: true
      }
    ],
    lastTab: [
      "Go to the last tab", {
        background: true
      }
    ],
    createTab: [
      "Create new tab", {
        background: true,
        repeatLimit: 20
      }
    ],
    duplicateTab: [
      "Duplicate current tab", {
        background: true,
        repeatLimit: 20
      }
    ],
    removeTab: [
      "Close current tab", {
        background: true,
        repeatLimit: (ref = (ref1 = chrome.session) != null ? ref1.MAX_SESSION_RESULTS : void 0) != null ? ref : 25
      }
    ],
    restoreTab: [
      "Restore closed tab", {
        background: true,
        repeatLimit: 20
      }
    ],
    moveTabToNewWindow: [
      "Move tab to new window", {
        background: true
      }
    ],
    togglePinTab: [
      "Pin or unpin current tab", {
        background: true,
        noRepeat: true
      }
    ],
    toggleMuteTab: [
      "Mute or unmute current tab", {
        background: true,
        noRepeat: true
      }
    ],
    closeTabsOnLeft: [
      "Close tabs on the left", {
        background: true,
        noRepeat: true
      }
    ],
    closeTabsOnRight: [
      "Close tabs on the right", {
        background: true,
        noRepeat: true
      }
    ],
    closeOtherTabs: [
      "Close all other tabs", {
        background: true,
        noRepeat: true
      }
    ],
    moveTabLeft: [
      "Move tab to the left", {
        background: true
      }
    ],
    moveTabRight: [
      "Move tab to the right", {
        background: true
      }
    ],
    "Vomnibar.activate": [
      "Open URL, bookmark or history entry", {
        topFrame: true
      }
    ],
    "Vomnibar.activateInNewTab": [
      "Open URL, bookmark or history entry in a new tab", {
        topFrame: true
      }
    ],
    "Vomnibar.activateTabSelection": [
      "Search through your open tabs", {
        topFrame: true
      }
    ],
    "Vomnibar.activateBookmarks": [
      "Open a bookmark", {
        topFrame: true
      }
    ],
    "Vomnibar.activateBookmarksInNewTab": [
      "Open a bookmark in a new tab", {
        topFrame: true
      }
    ],
    "Vomnibar.activateEditUrl": [
      "Edit the current URL", {
        topFrame: true
      }
    ],
    "Vomnibar.activateEditUrlInNewTab": [
      "Edit the current URL and open in a new tab", {
        topFrame: true
      }
    ],
    nextFrame: [
      "Select the next frame on the page", {
        background: true
      }
    ],
    mainFrame: [
      "Select the page's main/top frame", {
        topFrame: true,
        noRepeat: true
      }
    ],
    "Marks.activateCreateMode": [
      "Create a new mark", {
        noRepeat: true
      }
    ],
    "Marks.activateGotoMode": [
      "Go to a mark", {
        noRepeat: true
      }
    ]
  };

  Commands.init();

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.Commands = Commands;

}).call(this);
