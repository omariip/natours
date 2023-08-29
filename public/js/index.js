/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './leaflet';
import { login } from './login';

// DOM ELEMENTS
const leaflet = document.getElementById('map');
const loginForm = document.querySelector('.form');

// DELEGATION
if (leaflet) {
  const locations = JSON.parse(leaflet.dataset.locations);
  displayMap(locations);
}

if (loginForm)
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password')
      .value;
    login(email, password);
  });
