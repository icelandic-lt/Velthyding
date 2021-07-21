import getSuggestions from "actions/suggestions";
import { Portal } from "components/common";
import { css } from "emotion";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Transforms } from "slate";
import { ReactEditor, useSlate } from "slate-react";
import "./index.css";

// const insertSuggestion = (editor, sug) => {
//   Transforms.delete(editor, { unit: "word", reverse: true });
//   Transforms.delete(editor, { unit: "word" });

//   Transforms.insertText(editor, sug.trim(), {
//     match: Text.isText,
//     split: false,
//   });
//   Transforms.move(editor);
//   Transforms.deselect(editor);
// };

const insertTranslationFromSuggestion = (editor, sug, prefix, setPrefix) => {
  setPrefix([(prefix + sug).trim(), editor.selection.anchor.path]);
};

const SuggestionButton = ({
  suggestion,
  prefix,
  setPrefix,
  setSuggestions,
}) => {
  const editor = useSlate();

  return (
    /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
    <div
      // This className is probably never used.
      // className={css`
      //   color: #333;
      //   border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      //   padding-bottom: 4px;
      //   padding-top: 4px;
      //   padding-left: 9px;
      //   padding-right: 9px;
      //   line-height: 1.2;
      //   transition: background-color 100ms;
      //   cursor: pointer;
      // `}
      className="HoveringList-item"
      onMouseDown={(event) => {
        setSuggestions([]);
        event.preventDefault();
        // insertSuggestion(editor, suggestion, prefix, setPrefix)
        insertTranslationFromSuggestion(editor, suggestion, prefix, setPrefix);
        Transforms.move(editor);
        Transforms.deselect(editor);
      }}
    >
      {suggestion} ...
    </div>
  );
};

// eslint-disable-next-line import/prefer-default-export
export const HoveringSuggestion = (props) => {
  const ref = useRef();
  const editor = useSlate();
  const [curPrefix, setCurPrefix] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const { target } = useSelector((state) => state.login);

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

    // const fragments = Editor.fragment(editor, selection);

    const [curPgIdx, curSntIdx] = selection.anchor.path;
    const curPg = editor.children[curPgIdx];
    const curSnt = curPg.children[curSntIdx];

    const updateSuggestions = (newSuggestions) => {
      if (JSON.stringify(newSuggestions) !== JSON.stringify(suggestions)) {
        setSuggestions(newSuggestions);
      }
    };
    if (curSnt !== undefined) {
      const curSub = curSnt.text.substr(0, selection.anchor.offset).split(" ");
      const curSubPost = curSnt.text
        .substr(selection.anchor.offset, curSnt.text.length)
        .split(" ");
      curSubPost.shift();
      curSub.pop();

      const prefix = curSub.join(" ");
      const mskSnt = `${prefix} <mask> ${curSubPost.join(" ")}`;
      setCurPrefix(prefix);

      getSuggestions(curSnt.text, mskSnt, target).then((resp) =>
        updateSuggestions(resp.suggestions)
      );
    }

    const domSelection = window.getSelection();
    const domRange = domSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();
    el.style.opacity = 1;
    el.style.top = `${rect.top + window.pageYOffset + 28}px`;
    el.style.left = `${
      rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2
    }px`;
  }, [editor, target, suggestions]);

  return (
    <Portal>
      <div
        ref={ref}
        className={css`
          padding: 8px 7px 6px;
          position: absolute;
          z-index: 1000;
          top: -10000px;
          left: -10000px;
          margin-top: -6px;
          overflow-x: hidden;
          scrollbar-width: thin;
          box-shadow: 1px 2px 10px rgba(0, 0, 0, 0.15);
          outline: none;
          background: white;
          border-radius: 4px;
          color: black;
          max-width: 300px;
          min-width: 100px;
          min-height: 150px;
        `}
      >
        <div className="HoveringList">
          {suggestions.map((sug, idx) => (
            <SuggestionButton
              setSuggestions={setSuggestions}
              setPrefix={props.setPrefix}
              // eslint-disable-next-line react/no-array-index-key
              key={`sug-${idx}`}
              suggestion={sug}
              prefix={curPrefix}
            />
          ))}
        </div>
      </div>
    </Portal>
  );
};
