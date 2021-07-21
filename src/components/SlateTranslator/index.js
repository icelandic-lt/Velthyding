import { HoveringSuggestion } from "components/HoveringSugestions/ index";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createEditor, Transforms } from "slate";
import { Editable, Slate, withReact } from "slate-react";

// Define a deserializing function that takes a string and returns a value.
// Do we still need this?
// const deserialize = (string) =>
//   // Return a value array of children derived by splitting the string.
//   string.split("\n").map((line) => ({
//     children: [{ text: line, type: "paragraph" }],
//     type: "paragraph",
//   }));

const SentenceElement = (props) => (
  <span
    style={{ backgroundColor: "yellow", marginRight: "20px" }}
    {...props.attributes}
  >
    {props.children}
  </span>
);

const DefaultElement = (props) => <p {...props.attributes}>{props.children}</p>;

const Leaf = (props) => (
  <span
    onMouseOver={() => props.setHoverId(props.leaf.uId)}
    {...props.attributes}
    style={{
      marginRight: "5px",
      backgroundColor:
        props.hoverId && props.leaf.uId === props.hoverId ? "azure" : "white",
    }}
  >
    {props.children}
  </span>
);

const flipTextAndTranslation = (text) =>
  text.map((pg) => ({
    ...pg,
    children: pg.children.map((c) => ({
      ...c,
      text: c.translation,
      translation: c.text,
    })),
  }));

const withBreak = (editor) => {
  // Note: this breaks lists etc.
  // CHECK FOR PARAGRAPH if introducing more complex formating.
  editor.insertBreak = () => {
    const newLine = {
      type: "paragraph",
      children: [
        {
          text: "",
          translation: "",
        },
      ],
    };
    Transforms.insertNodes(editor, newLine);
  };
  return editor;
};

const SlateTranslator = (props) => {
  const { t } = useTranslation();

  const editor = useMemo(() => withBreak(withReact(createEditor())), []);

  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case "sentence":
        return <SentenceElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback(
    (lp) => {
      const updateHover = (hId) => {
        props.setHoverId(hId);
      };
      return <Leaf {...lp} hoverId={props.hoverId} setHoverId={updateHover} />;
    },
    [props]
  );

  let content = props.text;
  if (props.translation) {
    content = flipTextAndTranslation(content);
  }

  const updateText = (newValue) => {
    if (props.translation) {
      props.setText(flipTextAndTranslation(newValue));
    } else {
      props.setText(newValue);
    }
  };

  return (
    <div style={{ height: "100%" }}>
      <Slate
        editor={editor}
        value={content}
        onChange={(newValue) => updateText(newValue)}
      >
        {props.translation && (
          <HoveringSuggestion setPrefix={props.setPrefix} />
        )}
        <Editable
          spellCheck="false"
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={t("slate_placeholder", "Enter text..")}
          autoFocus={!props.translation}
          style={{ height: "100%" }}
        />
      </Slate>
    </div>
  );
};

export default SlateTranslator;
