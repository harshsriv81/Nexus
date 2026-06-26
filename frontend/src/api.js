import axios from 'axios';
import { resolveApiBaseUrl } from './config/backend';

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
});

export default API;
