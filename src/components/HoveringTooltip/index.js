import { Menu, Portal } from "components/common";
import { css } from "emotion";
import { useEffect, useRef, useState } from "react";
import { Editor } from "slate";
import { ReactEditor, useSlate } from "slate-react";

// eslint-disable-next-line import/prefer-default-export
export function HoveringTooltip() {
  const ref = useRef();
  const editor = useSlate();

  const [trans, setTrans] = useState("");

  useEffect(() => {
    const el = ref.current;
    const { selection } = editor;

    if (!el) {
      return;
    }

    if (
      !selection ||
      !ReactEditor.isFocused(editor) ||
      (selection && selection.anchor.offset === 0)
    ) {
      el.removeAttribute("style");
      return;
    }

    const fragments = Editor.fragment(editor, selection);
    const translation = fragments
      .map((p) => p.children)
      .flat()
      .map((c) => c.translation)
      .join(" ");

    if (translation.replace(/\s/g, "") === "") {
      el.removeAttribute("style");
      return;
    }
    setTrans(translation);

    const domSelection = window.getSelection();
    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    el.style.opacity = 1;
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`;
    el.style.left = `${
      rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    }px`;
  }, [editor]);

  return (
    <Portal>
      <Menu
        ref={ref}
        className={css`
          padding: 8px 7px 6px;
          position: absolute;
          z-index: 1000;
          top: -10000px;
          left: -10000px;
          margin-top: -6px;
          opacity: 0;
          background-color: #222;
          border-radius: 4px;
          transition: opacity 0.75s;
          color: white;
          max-width: 300px;
        `}
      >
        {trans}
      </Menu>
    </Portal>
  );
}
