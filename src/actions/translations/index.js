import { decodeHTML } from '../../utils/text.js';


async function translate(engine, text, source, target, transfTransl) {
  const data = {
    ...engine.extraData,
    model: engine.extraData !== undefined && engine.extraData.model !== undefined ? engine.extraData.model : `${source}-${target}`,
    contents: text.split('\n\n'),
    sourceLanguageCode: source,
    targetLanguageCode: target,
  };

  const { url } = engine;
  const param = {
    method: 'POST',
    crossDomain: true,
    mode: 'cors',
    ...engine.extraParam,
    headers: {
      'Content-Type': 'application/json; utf-8',
      ...engine.extraHeader,
    },
  };
  param.body = JSON.stringify(data);

  if (source === target) {
    return text;
  }

  let transl;
  const response = await fetch(url, param).catch((e) => console.log(e));
  if (response !== undefined) {
    try {
      transl = await response.json();
      const returnTrans = transl.translations.map((trans) => decodeHTML(trans.translatedText));
      const structuredTrans = transl.translations.filter((trans) => trans.translatedTextStructured).map((trans) => trans.translatedTextStructured);
      return { ...transl, translations: returnTrans, structuredTrans };
    } catch (err) {
      return ['Error'];
    }
  } else {
    return ['Error'];
  }
}

export async function translateMany(engines, text, source, target, transl) {
  const translations = await engines.map((engine) => translate(engine, text, source, target, transl));
  return Promise.all(translations).then((ts) => ts.map((p, i) => ({
    text: p.translations, structuredText: p.structuredTrans, engine: engines[i],
  })));
}
