"use babel";
import {CompositeDisposable} from "atom";
const SelectList = require("atom-select-list");
const Gitmojis = require("gitmojis");
import {StringArrayFilterer} from "zadeh";

module.exports = {
  activate(state) {
    this.gitmojiFilter = new StringArrayFilterer(
      Array.from(Gitmojis.gitmojis, (gitmoji) => gitmoji.description + " " + gitmoji.code)
    );
    this.gitmojiAtomView = new SelectList({
      // TODO: Seperate this into gitmoji-atom-view.js via extending
      // See https://github.com/atom/atom-space-pen-views#selectlistview
      items: Gitmojis.gitmojis,
      emptyMessage: "Sorry, no results found \u{1F61E}",
      filter: (items, query) => {
          if (query === "") return items;
          return this.gitmojiFilter.filter(query, {
              usePathScoring: false,
              useExtensionBonus: false
          });
      },
      didCancelSelection: () => {
        this.modalPanel.hide();
      },
      didConfirmSelection: item => {
        this.confirm(item);
      },
      didConfirmEmptySelection: () => {
        this.confirm("");
      },
      elementForItem: item => {
        let li = document.createElement("li");
        li.innerHTML =
          item.emoji + " ( <code>" + item.code + "</code>) " + item.description;
        return li;
      }
    });
    this.gitmojiAtomView.element.classList.add("gitmoji-atom");

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.gitmojiAtomView.element,
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "gitmoji-atom:show": () => this.show()
      })
    );
  },

  deactivate() {
    console.log("GitmojiAtom was de-activated!");
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gitmojiAtomView.destroy();
  },
  confirm(item) {
    shouldShowNotifications = !atom.config.get("gitmoji-atom.noNotifications");
    function writeToClipboard(value) {
      atom.clipboard.write(value);
      if (shouldShowNotifications) {
        atom.notifications.addSuccess(`Copied '${value}' to clipboard!`);
      }
      console.log(`GitMoji-Atom: Copied '${value}' to clipboard`);
    }
    function insertToEditor(value, editor) {
      editor.insertText(value_to_submit);
      if (shouldShowNotifications) {
        atom.notifications.addSuccess(`Inserted '${value}'!`);
      }
      console.log(`GitMoji-Atom: Inserted '${value}' to ${editor}`);
    }
    function getGitHubPane() {
      return Array.from(
        document.querySelectorAll("atom-panel-container")
      ).filter(
        element =>
          element.querySelector(
            ".github-CommitView-editor .github-AtomTextEditor-container > atom-text-editor"
          ) !== null
      )[0].model.dock;
    }
    if (item !== "") {
      valueToSubmit =
        item[atom.config.get("gitmoji-atom.outputType")] +
        (atom.config.get("gitmoji-atom.addSpaceAfter") ? " " : "");
      let editor = atom.workspace.getActiveTextEditor();
      switch (atom.config.get("gitmoji-atom.submitMode")) {
        case "git":
          let commitEditor = document.querySelector(
            ".github-CommitView-editor .github-AtomTextEditor-container > atom-text-editor"
          );
          if (commitEditor !== null && getGitHubPane().isVisible()) {
            commitEditor = commitEditor.getModel();
            newText = valueToSubmit + commitEditor.getText();
            commitEditor.setText(newText);
            if (shouldShowNotifications) {
              atom.notifications.addSuccess(
                `Inserted '${valueToSubmit}' to commit editor!`
              );
            }
          } else {
            writeToClipboard(valueToSubmit);
          }
          break;
        case "fallback":
          if (editor) {
            insertToEditor(valueToSubmit, editor);
          } else {
            writeToClipboard(valueToSubmit);
          }
          break;
        case "copy":
          writeToClipboard(valueToSubmit);
          break;
        case "insert":
          try {
            editor.insertText(valueToSubmit);
            console.log(`GitMoji-Atom: Inserted '${value}' to ${editor}`);
          } catch (e) {
            if (!atom.config.get("gitmoji-atom.noNotifications")) {
              atom.notifications.addError("No editors found");
              console.log(`GitMoji-Atom: Failed to insert '${value}'`);
            }
          }
          break;
      }
      if (atom.config.get("gitmoji-atom.resetSearchBar") == true) {
        this.gitmojiAtomView.query = "";
      }
    }
    this.modalPanel.hide();
  },
  show() {
    console.log("GitmojiAtom was activated!");
    if (!this.modalPanel.isVisible()) this.modalPanel.show();
    this.gitmojiAtomView.focus();
  },

  config: {
    addSpaceAfter: {
      type: "boolean",
      default: true
    },
    resetSearchBar: {
      type: "boolean",
      default: true
    },
    outputType: {
      type: "string",
      default: "code",
      description: "The type of thing to submit",
      enum: [
        {
          value: "code",
          description: "The emoji code (such as ':tada:')"
        },
        {
          value: "emoji",
          description: "The emoji (such as '\u{1F389}')"
        },
        {
          value: "entity",
          description: "The HTML entity (such as '&#x1f3a8;')."
        }
      ]
    },
    submitMode: {
      type: "string",
      default: "git",
      description: "What to do after you found the appropriate emoji",
      enum: [
        {
          value: "git",
          description:
            "Try to insert the emoji into the git commit editor. Otherwise, copy it to clipboard"
        },
        {
          value: "fallback",
          description:
            "If a TextEditor is focused, insert the emoji. Otherwise, copy it to clipboard"
        },
        {value: "copy", description: "Copy the emoji to the clipboard"},
        {
          value: "insert",
          description:
            "Insert the emoji to the editor. Fail if no editor is active"
        }
      ]
    },
    noNotifications: {
      type: "boolean",
      default: false,
      description: "Suppress notifications"
    }
  }
};
