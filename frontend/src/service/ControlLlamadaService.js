import axios from "axios";
import { LocalStorageService } from "./LocalStorageService";

const api = axios.create({
    baseURL: process.env.REACT_APP_ROUTE_API,
});

api.interceptors.request.use(
    (config) => {
        const token = new LocalStorageService().getAccessToken();
        if (token) {
            config.headers["api_token"] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export class ControlLlamadasService {
    base = "control-llamadas/";

    iniciarLlamada(data) {
        return api.post(this.base + "inicio", data).then((res) => res.data);
    }

    marcarGestion(data) {
        return api.post(this.base + "gestion", data).then((res) => res.data);
    }
}
