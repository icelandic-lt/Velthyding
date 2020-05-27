import axios from 'axios';
import { Cookies } from 'react-cookie';

import { store } from 'store';
import { login, logout } from 'features/login/loginSlice';

import { BASE_BACKEND_URL } from 'config';

const CSRF = 'csrf/';

axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.withCredentials = true;

const cookies = new Cookies();

export const apiClient = (APIEndpoint = '') => {
  const csrfCookie = cookies.get(axios.defaults.xsrfCookieName, { path: '/' });
  const params = {
    baseURL: `${BASE_BACKEND_URL}/${APIEndpoint}`,
    headers: {
      Authorization: 'no',
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
  };

  if (csrfCookie != null) {
    params.headers['X-CSRFToken'] = csrfCookie;
  }
  const ac = axios.create(params);

  ac.interceptors.response.use((response) => response, (error) => {
    if (error.response !== undefined && error.response.status === 401) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  });

  return ac;
};

export function checkUser() {
  return new Promise(((resolve, reject) => {
    const ac = apiClient();
    return ac.post('check/', {}).then((response) => {
      if (response.data.email !== null) {
        store.dispatch(login(response.data.email));
      }
      resolve(response);
    })
      .catch((error) => {
        reject(error);
      });
  }));
}

export const checkCookie = () => {
  const csrfCookie = cookies.get(axios.defaults.xsrfCookieName);
  if (csrfCookie == null) {
    const ac = apiClient();
    ac.get(CSRF)
      .then((response) => {
        cookies.remove(axios.defaults.xsrfCookieName, { path: '/' });
        cookies.set(axios.defaults.xsrfCookieName, response.data, { path: '/' });
        checkUser();
      });
  }
};

export function loginUser(username, password) {
  return new Promise(((resolve, reject) => {
    const ac = apiClient();

    return ac.post('login/', {
      username,
      password,
    }).then((response) => {
      resolve(response);
    }).catch((error) => {
      reject(error);
    });
  }));
}


export function logoutUser() {
  return new Promise(((resolve, reject) => {
    const ac = apiClient();
    return ac.post('logout/')
      .then((response) => {
        store.dispatch(logout());
        resolve(response);
      }).catch((error) => {
        reject(error);
      });
  }));
}


export async function storeTranslation(language_pair, model, source_text, target_text) {
  return new Promise(((resolve, reject) => {
    const ac = apiClient();
    return ac.post('api/translations/usertranslations/', {
      language_pair, model, source_text, target_text,
    }).then((response) => {
      resolve(response);
    }).catch((error) => {
      reject(error);
    });
  }));
}


export async function getTranslations() {
  return new Promise(((resolve, reject) => {
    const ac = apiClient();
    return ac.get('api/translations/usertranslations/', {})
      .then((response) => {
        resolve(response);
      }).catch((error) => {
        reject(error);
      });
  }));
}
