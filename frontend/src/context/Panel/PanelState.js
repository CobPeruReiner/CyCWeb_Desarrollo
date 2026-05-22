import { useReducer } from "react";
import { GET_BIODIVERSITIES, SET_USERLOGIN, SET_ETIQUETAS, SET_TELEFONOS, SET_SELECTEDCUSTOMER, SET_SELECTEDPHONE, SET_SELECTEDENTITYID, SET_SELECTEDCARTERAID, SET_CONTROL_LLAMADA_ID, SET_REQUIERE_GESTION, SET_GESTION_GUARDADA } from "../../types";
import PanelContext from "./PanelContext";
import PanelReducer from "./PanelReducer";

const PanelState = (props) => {
    const initialState = {
        userLogin: null,
        biodiversities: [],
        dataTelefonos: [],
        etiquetas: [],
        selectedEntityId: null,
        selectedCarteraId: null,
        selectedCustomer: null,
        selectedPhone: null,

        controlLlamadaId: null,
        requiereGestion: 0,
        gestionGuardada: false,
    };

    const [state, dispatch] = useReducer(PanelReducer, initialState);

    const getBiosystems = () => {
        dispatch({
            type: GET_BIODIVERSITIES,
            payload: [
                { id: 1, name: "aa" },
                { id: 2, name: "vvv" },
                { id: 3, name: "ccc" },
            ],
        });
    };

    const setUserLogin = (e) => {
        dispatch({ type: SET_USERLOGIN, payload: e });
    };

    const setEtiquetas = (e) => {
        dispatch({ type: SET_ETIQUETAS, payload: e });
    };

    const setTelefonos = (e) => {
        dispatch({ type: SET_TELEFONOS, payload: e });
    };

    const setSelectedEntityId = (e) => {
        dispatch({ type: SET_SELECTEDENTITYID, payload: e });
    };

    const setSelectedCarteraId = (e) => {
        dispatch({ type: SET_SELECTEDCARTERAID, payload: e });
    };

    const setSelectedCustomer = (e) => {
        dispatch({ type: SET_SELECTEDCUSTOMER, payload: e });
    };

    const setSelectedPhone = (e) => {
        dispatch({ type: SET_SELECTEDPHONE, payload: e });
    };

    const setControlLlamadaId = (e) => {
        dispatch({ type: SET_CONTROL_LLAMADA_ID, payload: e });
    };

    const setRequiereGestion = (e) => {
        dispatch({ type: SET_REQUIERE_GESTION, payload: e });
    };

    const setGestionGuardada = (e) => {
        dispatch({ type: SET_GESTION_GUARDADA, payload: e });
    };

    return (
        <PanelContext.Provider
            value={{
                userLogin: state.userLogin,
                biodiversities: state.biodiversities,
                selectedEntityId: state.selectedEntityId,
                selectedCarteraId: state.selectedCarteraId,
                etiquetas: state.etiquetas,
                dataTelefonos: state.dataTelefonos,
                selectedCustomer: state.selectedCustomer,
                selectedPhone: state.selectedPhone,
                getBiosystems,
                setEtiquetas,
                setTelefonos,
                setSelectedCustomer,
                setSelectedPhone,
                setSelectedEntityId,
                setSelectedCarteraId,
                setUserLogin,

                controlLlamadaId: state.controlLlamadaId,
                requiereGestion: state.requiereGestion,
                gestionGuardada: state.gestionGuardada,

                setControlLlamadaId,
                setRequiereGestion,
                setGestionGuardada,
            }}
        >
            {props.children}
        </PanelContext.Provider>
    );
};
export default PanelState;
