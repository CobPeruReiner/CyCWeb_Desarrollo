/* eslint-disable eqeqeq */
import { useState, useEffect, useContext, useRef, useCallback } from "react";
// import classNames from "classnames";

import { useHistory } from "react-router-dom";
import { Button } from "primereact/button";
// import PrimeReact from "primereact/api";
import { Divider } from "primereact/divider";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "prismjs/themes/prism-coy.css";
import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";
import "./layout/flags/flags.css";
import "./layout/layout.scss";
import "./AppLogin.css";
import { InputText } from "primereact/inputtext";
import { LoginService } from "./service/LoginService";
import { LocalStorageService } from "./service/LocalStorageService";
import PanelContext from "./context/Panel/PanelContext";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import ReCAPTCHA from "react-google-recaptcha";
import moment from "moment";

const BODY_CLASS = "body-overflow-hidden-login";
const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const AppLogin = () => {
    const toast = useRef(null);
    const captchaRef = useRef(null);

    const history = useHistory();
    const panelContext = useContext(PanelContext);

    const [mensaje, setMensaje] = useState(null);
    const [login, setLogin] = useState({ user: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);

    const [view, setView] = useState("login");
    const [docRecovery, setDocRecovery] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    useEffect(() => {
        document.body.classList.add(BODY_CLASS);
        return () => document.body.classList.remove(BODY_CLASS);
    }, []);

    useEffect(() => {
        const msg = sessionStorage.getItem("forcedLogoutMsg");
        if (msg) {
            toast.current?.show({
                severity: "warn",
                summary: "Sesión finalizada",
                detail: msg,
                life: 4000,
            });
            sessionStorage.removeItem("forcedLogoutMsg");
        }
    }, []);

    // const solicitarCodigo = async () => {
    //     setMensaje(null);

    //     if (!docRecovery.trim()) {
    //         setMensaje("Ingresa tu DNI.");
    //         return;
    //     }

    //     setLoading(true);

    //     try {
    //         const res = await new LoginService().requestPasswordReset({
    //             doc: docRecovery,
    //         });

    //         if (res.status === "0") {
    //             showToast("success", "Código enviado", res.body);
    //             setView("recover-code");
    //         } else {
    //             setMensaje(res.body);
    //         }
    //     } catch (e) {
    //         console.error(e);

    //         const data = e?.response?.data;

    //         if (data?.body) {
    //             setMensaje(data.body);
    //         } else if (data?.error) {
    //             setMensaje(data.error);
    //         } else {
    //             setMensaje("Error solicitando recuperación.");
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const verificarCodigo = async () => {
    //     setMensaje(null);

    //     if (!otp.trim()) {
    //         setMensaje("Ingresa el código.");
    //         return;
    //     }

    //     setLoading(true);

    //     try {
    //         const res = await new LoginService().verifyPasswordOtp({
    //             doc: docRecovery,
    //             otp,
    //         });

    //         if (res.status === "0") {
    //             showToast("success", "Código válido", "Ahora puedes cambiar tu contraseña.");
    //             setView("recover-password");
    //         } else {
    //             setMensaje(res.body);
    //         }
    //     } catch (e) {
    //         console.error(e);

    //         const data = e?.response?.data;

    //         if (data?.body) {
    //             setMensaje(data.body);
    //         } else if (data?.error) {
    //             setMensaje(data.error);
    //         } else {
    //             setMensaje("Error verificando código.");
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const cambiarPassword = async () => {
    //     setMensaje(null);

    //     if (!newPassword || !repeatPassword) {
    //         setMensaje("Completa todos los campos.");
    //         return;
    //     }

    //     if (newPassword !== repeatPassword) {
    //         setMensaje("Las contraseñas no coinciden.");
    //         return;
    //     }

    //     setLoading(true);

    //     try {
    //         const res = await new LoginService().resetPassword({
    //             doc: docRecovery,
    //             password: newPassword,
    //         });

    //         if (res.status === "0") {
    //             showToast("success", "Contraseña actualizada", res.body);
    //             setView("login");
    //         } else {
    //             setMensaje(res.body);
    //         }
    //     } catch (e) {
    //         console.error(e);

    //         const data = e?.response?.data;

    //         if (data?.body) {
    //             setMensaje(data.body);
    //         } else if (data?.error) {
    //             setMensaje(data.error);
    //         } else {
    //             setMensaje("Error cambiando contraseña.");
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const showToast = useCallback((severity, summary, detail, life = 4000) => {
        toast.current?.show({ severity, summary, detail, life });
    }, []);

    // const handleCaptchaChange = (token) => setCaptchaToken(token || null);

    const resetCaptcha = () => {
        setCaptchaToken(null);
        captchaRef.current?.reset();
    };

    const credencialesCompletas = login.user.trim() && login.password.trim();
    const puedeEnviar = !!credencialesCompletas && !loading;

    const handleClick = async () => {
        setMensaje(null);

        if (!credencialesCompletas) {
            setMensaje("Ingresa usuario y contraseña.");
            return;
        }

        // if (!captchaToken) {
        //     setMensaje("Por favor, marca el reCAPTCHA.");
        //     return;
        // }

        setLoading(true);
        try {
            const response = await new LoginService().logIn({
                ...login,
                captchaToken,
                dateSolicitud: moment().format("YYYY-MM-DD"),
                timeSolicitud: moment().format("HH:mm:ss"),
            });

            // console.log("Respuesta: ", response);

            if (response.status == 0) {
                const lsService = new LocalStorageService();
                lsService.setToken(response.body);
                panelContext.setUserLogin(response.body);
                showToast("success", "Bienvenido", "Autenticación exitosa.", 1500);
                history.push("/admin/gestion");
            } else if (response.status == 2) {
                setMensaje(response.body);
            } else {
                setMensaje(response.body ?? "No se pudo iniciar sesión.");
            }
        } catch (e) {
            console.error(e);

            const data = e?.response?.data;

            if (data) {
                if (data?.intentos && data?.maxIntentos) {
                    setMensaje(`${data.body} (Intento ${data.intentos} de ${data.maxIntentos})`);
                } else if (data?.body) {
                    setMensaje(data.body);
                } else if (data?.error) {
                    setMensaje(data.error);
                } else {
                    setMensaje("No se pudo iniciar sesión.");
                }
            } else {
                setMensaje("Error de red. Intenta nuevamente.");
            }

            resetCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && puedeEnviar) handleClick();
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="container" id="container" style={{ minHeight: 500 }}>
                <div className="wrap-login100">
                    <div className="login100-form-title" style={{ backgroundImage: "url(assets/layout/images/bg-01.png)" }}>
                        <span className="login100-form-title-1"></span>
                    </div>

                    <div className="p-d-flex">
                        <div className="p-mt-5 p-ml-5">
                            <img alt="Logo" height="50" src="assets/layout/images/logo.png" />
                        </div>
                        <div className="p-mt-5 p-ml-5">
                            <span style={{ color: "#607d8b", fontWeight: 700, fontSize: 18, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif' }}>Cobranzas Perú</span>
                            <br />
                            <span style={{ color: "#607d8b", fontWeight: 700, fontSize: 16, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif' }}>SISTEMA DE GESTIÓN DE CARTERAS Y COBRANZAS</span>
                        </div>
                    </div>

                    <Divider />

                    {view === "login" && (
                        <div className="p-fluid p-p-6">
                            <div className="p-field p-grid">
                                <label htmlFor="user" className="p-col-12 p-md-2">
                                    Usuario
                                </label>
                                <div className="p-col-12 p-md-10">
                                    <InputText id="user" value={login.user} onChange={(e) => setLogin({ ...login, user: e.target.value.trim() })} onKeyDown={onKeyDown} type="text" autoComplete="username" />
                                </div>
                            </div>

                            <div className="p-field p-grid">
                                <label htmlFor="password" className="p-col-12 p-md-2">
                                    Password
                                </label>
                                <div className="p-col-12 p-md-10">
                                    <Password id="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value.trim() })} feedback={false} inputProps={{ autoComplete: "current-password", onKeyDown }} />
                                </div>
                            </div>

                            {typeof mensaje === "string" && mensaje && (
                                <div className="p-field p-grid">
                                    <label className="p-col-12 p-md-2"></label>
                                    <div className="p-col-12 p-md-10" style={{ color: "red" }}>
                                        {mensaje}
                                    </div>
                                </div>
                            )}

                            {/* <div className="p-field p-grid">
                                <label className="p-col-12 p-md-2"></label>
                                <div className="p-col-12 p-md-10">
                                    <ReCAPTCHA ref={captchaRef} sitekey={SITE_KEY} onChange={handleCaptchaChange} onExpired={resetCaptcha} onErrored={resetCaptcha} hl="es" />
                                </div>
                            </div> */}

                            <div className="p-fluid p-formgrid p-grid">
                                <div className="p-field p-col-12 p-md-9"></div>
                                <div className="p-field p-col-12 p-md-3">
                                    <Button label={loading ? "Verificando..." : "Iniciar Sesión"} icon={"pi pi-send"} onClick={handleClick} className="p-button-rounded p-button-secondary" disabled={!puedeEnviar} loading={loading ? 1 : 0} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
    //<AppFooter />
};

export default AppLogin;
