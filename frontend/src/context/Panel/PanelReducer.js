import { GET_BIODIVERSITIES, SET_USERLOGIN, SET_ETIQUETAS, SET_TELEFONOS, SET_SELECTEDCUSTOMER, SET_SELECTEDPHONE, SET_SELECTEDENTITYID, SET_SELECTEDCARTERAID, SET_CONTROL_LLAMADA_ID, SET_REQUIERE_GESTION, SET_GESTION_GUARDADA } from "../../types";

// eslint-disable-next-line import/no-anonymous-default-export
export default (state, action) => {
    const { payload, type } = action;

    switch (type) {
        case GET_BIODIVERSITIES:
            return {
                ...state,
                biodiversities: payload,
            };
        case SET_USERLOGIN:
            return {
                ...state,
                userLogin: payload,
            };
        case SET_ETIQUETAS:
            return {
                ...state,
                etiquetas: payload,
            };
        case SET_TELEFONOS:
            return {
                ...state,
                dataTelefonos: payload,
            };
        case SET_SELECTEDCUSTOMER:
            return {
                ...state,
                selectedCustomer: payload,
            };
        case SET_SELECTEDPHONE:
            return {
                ...state,
                selectedPhone: payload,
            };
        case SET_SELECTEDENTITYID:
            return {
                ...state,
                selectedEntityId: payload,
            };
        case SET_SELECTEDCARTERAID:
            return {
                ...state,
                selectedCarteraId: payload,
            };
        case SET_CONTROL_LLAMADA_ID:
            return {
                ...state,
                controlLlamadaId: action.payload,
            };

        case SET_REQUIERE_GESTION:
            return {
                ...state,
                requiereGestion: action.payload,
            };

        case SET_GESTION_GUARDADA:
            return {
                ...state,
                gestionGuardada: action.payload,
            };
        default:
            return state;
    }
};
