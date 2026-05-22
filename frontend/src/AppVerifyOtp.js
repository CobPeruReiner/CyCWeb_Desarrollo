import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { LocalStorageService } from "./service/LocalStorageService";
import { LoginService } from "./service/LoginService";
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

const BODY_CLASS = "body-overflow-hidden-login";

const AppVerifyOtp = () => {
    const history = useHistory();
    const location = useLocation();

    const { usuario } = location.state || {};

    const toast = React.useRef(null);

    const [codigo, setCodigo] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        document.body.classList.add(BODY_CLASS);
        return () => document.body.classList.remove(BODY_CLASS);
    }, []);

    const enviar = async () => {
        if (!codigo) {
            setMensaje("Ingrese el código.");
            return;
        }

        try {
            setLoading(true);

            const r = await new LoginService().verifyOtp({
                usuario,
                codigo,
            });

            if (r.status == 0) {
                const lsService = new LocalStorageService();
                lsService.setToken(r.body);

                toast.current?.show({
                    severity: "success",
                    summary: "Correcto",
                    detail: "Código verificado.",
                    life: 1500,
                });

                setTimeout(() => {
                    history.push("/admin/gestion");
                }, 500);
            } else {
                setMensaje(r.body || "Código inválido.");
            }
        } catch (e) {
            console.error(e);
            setMensaje("Error al validar el código.");
        } finally {
            setLoading(false);
        }
    };

    if (!usuario) {
        history.replace("/");
        return null;
    }

    return (
        <>
            <Toast ref={toast} />
            <div className="container" id="container" style={{ minHeight: 500 }}>
                <div className="wrap-login100">
                    <div className="login100-form-title" style={{ backgroundImage: "url(assets/layout/images/bg-01.png)" }}>
                        <span className="login100-form-title-1"></span>
                    </div>

                    <div className="p-fluid p-p-6">
                        <h3>Ingrese el código enviado a su correo</h3>

                        <div className="p-field">
                            <label>Código</label>
                            <InputText value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus />
                        </div>

                        {mensaje && <div style={{ color: "red", marginBottom: 10 }}>{mensaje}</div>}

                        <Button label={loading ? "Verificando..." : "Verificar"} icon="pi pi-check" onClick={enviar} className="p-button-rounded p-button-secondary" disabled={loading} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default AppVerifyOtp;
