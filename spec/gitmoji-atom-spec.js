"use babel";

import GitmojiAtom from "../lib/gitmoji-atom";

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe("GitmojiAtom", () => {
    let workspaceElement, activationPromise;

    beforeEach(() => {
        workspaceElement = atom.views.getView(atom.workspace);
        activationPromise = atom.packages.activatePackage("gitmoji-atom");
    });

    describe("when the gitmoji-atom:show event is triggered", () => {
        it("shows the modal panel", () => {
            runs(() => {
                expect(
                    workspaceElement.querySelector(".gitmoji-atom")
                ).not.toExist();
                atom.commands.dispatch(workspaceElement, "gitmoji-atom:show");
                expect(
                    workspaceElement.querySelector(".gitmoji-atom")
                ).toExist();
                let gitmojiAtomElement = workspaceElement.querySelector(
                    ".gitmoji-atom"
                );
                let gitmojiAtomPanel = atom.workspace.panelForItem(
                    gitmojiAtomElement
                );
                expect(gitmojiAtomPanel.isVisible()).toBe(true);
            });
        });
    });
});
