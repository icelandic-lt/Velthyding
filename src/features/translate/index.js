import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSelector, useDispatch } from 'react-redux';

import mammoth from 'mammoth';
import ClipLoader from 'react-spinners/ClipLoader';
import { Button } from 'semantic-ui-react';

import 'App.css';
import Translator from 'components/Translator';
import { translateMany, updateSentenceTranslation } from 'actions/translations';
import { storeTranslation } from 'api';
import { setTranslation } from './translateSlice';


const parseForSlate = (text) => {
    return text.split('\n').filter(pg => pg != '').map(pg => ({
      type: 'paragraph',
      children: pg.split('.').filter(sentence => sentence != '').map(sentence => ({
          text: sentence.trim(),
          translation: ""
        }))
    }))
}

function useOnDrop(setText) {
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      const isDocx = file.path.split('.')[1] === 'docx';
      reader.onload = () => {
        if (isDocx) {
          mammoth.extractRawText({ arrayBuffer: reader.result }).then((result) => {
            const extractedText = result.value;
            setText(parseForSlate(extractedText));
          }).done();
        } else {
          setText(parseForSlate(reader.result));
        }
      };
      if (isDocx) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }, [setText]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  return { getRootProps, getInputProps, isDragActive }
}


const updateParagraph = (pg, pgId) => {
  return pg.map( (s, i) => ({id: i, uId: pgId + "-" + i, text: s[0], translation: s[1] }))
}

const updateText = (translationObject) => {
  const firstEngine = translationObject[0];
  const translations = firstEngine.structuredText;
  return translations.map((v, i) => ({type: "paragraph", children: updateParagraph(v, i)}))
}


function Translate() {
  const [hoverId, setHoverId] = useState(-1);
  const [prefix, setPrefix] = useState("");
  const [translationId, setTranslationId] = useState(null);
  const [text, setText] = useState([
    {
      type: 'paragraph',
      children: [
        {
          id: 0,
          text: "",
          translation: "",
        },]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const engines = useSelector((state) => state.engines);
  const { source, target, showGoogle } = useSelector((state) => state.login);
  const [googleTranslation, setGoogleTranslation] = useState('');
  const dispatch = useDispatch();
  const { getRootProps, getInputProps, isDragActive } = useOnDrop(setText);

  const translate = async () => {
    if (text.length === 1 && text[0].children.length === 1 && text[0].children[0].text === '') {
      return;
    }
    setLoading(true);

    const activeEngines = engines.filter((engine) => engine.selected);
    
    // TODO handle not sending translation if revising,
    // keep translation logic in effect of dropdown suggestion changes?

    // TODO reconsider use of translateMany

    const trans = await translateMany(
      activeEngines,
      text,
      source,
      target,
    );

    const newText = updateText(trans);
    setText(newText);
    trans.forEach((t) => dispatch(setTranslation({ name: t.engine.name, text: t.text, structuredText: t.structuredText })));

    trans.filter(t => t.engine.selected && t.engine.textOnly).map((t) => setGoogleTranslation(t.text));

    trans.forEach((t) => storeTranslation(
      translationId,
      `${source}-${target}`,
      t.engine.name,
      text.map((pg) => pg.children.map((ch) => ch.text).join('')).join('\n\n'),
      t.text.join('\n\n')).then((resp) => {if(resp.data.id){setTranslationId(resp.data.id)}}));  
      setLoading(trans === []);
  }

  const revise = async () => {
    if (text.length === 1 && text[0].children.length === 1 && text[0].children[0].text === '') {
      return;
    }
    setLoading(true);

    const activeEngines = engines.filter((engine) => engine.selected);

    storeTranslation(
      translationId,
      `${source}-${target}`,
      activeEngines[0].name,
      text.map((pg) => pg.children.map((ch) => ch.text).join('')).join('\n\n'),
      text.map((pg) => pg.children.map((ch) => ch.translation).join('')).join('\n\n')).then(
        (resp) => {
          if(resp.data.id){
            setTranslationId(resp.data.id);
          };
          setLoading(false);
        }
      )
  }

  const translatePrefix = async () => {
    setLoading(true);
    const pgIdx = prefix[1][0];
    const sntIdx = prefix[1][1];
    const srcText = text[pgIdx].children[sntIdx].text;

    const translation = await updateSentenceTranslation(srcText, prefix[0], source, target);

    const newText = text.map((pg, i) => {
      if(i === pgIdx){
        const children = pg.children.map((snt, j) => {
          if (j === sntIdx) {
            return {...snt, translation: translation}
          } else { return snt}
        })
        return {...pg, children: children}
      } else {return pg}
    })
    setLoading(false);
    setText(newText)
  }

  useEffect(() => {
    if (prefix.length < 2) {
      return;
    }
   translatePrefix()

  }, [prefix]);

  useEffect(() => {
    if (text.length === 1 && text[0].children.length === 1 && text[0].children[0].text === '' && text[0].children[0].translation === '') {
      setHoverId('');
      setTranslationId(null);
    }
  }, [text, dispatch, hoverId]);

  const translateButton = <Button
    primary
    className="TranslateBox-submit"
    onClick={translate}>
    {loading ? <ClipLoader size={10} color={'#FFF'} /> : <span> Translate </span>}
  </Button>;

  const reviseButton = <Button
    color="teal"
    className="TranslateBox-submit"
    onClick={revise}>
    {loading ? <ClipLoader size={10} color={'#FFF'} /> : <span> Revise </span>}
    </Button>;

  const uploadButton = <Button className="TranslateBox-submit TranslateBox-upload" {...getRootProps()}>
    <input {...getInputProps()} />
    { isDragActive ? <span>Drop here</span> : <span>Upload</span> }
  </Button>;

  return (
    <div className="Translate">
      {translateButton}
      <Translator
        sourceText={text}
        setText={setText}
        prefix={prefix}
        setPrefix={setPrefix}
        hoverId={hoverId}
        setHoverId={setHoverId}
        googleTranslation={showGoogle ? googleTranslation : ""}
      />
      <div>
      {showGoogle && googleTranslation && 
        <div className="Translator-containers reverse">
            <div className="Translator-subtext">{googleTranslation.map( pg => <p>{pg}</p>)}</div>
          </div>} 
        <div className="Translate-footer">
        <span style={{fontSize: "12px", fontWeight: "bold"}}>{showGoogle && googleTranslation === "" ? "Miðeind and Google translation active" : ""}</span>
          {uploadButton}
          {translateButton}
          {translationId && reviseButton}
        </div>
      </div>
    </div>
  );
}

export default Translate;
