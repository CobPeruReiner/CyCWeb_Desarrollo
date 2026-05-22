import { useContext, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { LoginService } from "../../service/LoginService";
import PanelContext from "../../context/Panel/PanelContext";

export const PanelCambiarContrasena = () => {
    const toast = useRef(null);
    const panelContext = useContext(PanelContext);

    const [mensaje, setMensaje] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formKey, setFormKey] = useState(0);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    const showToast = (severity, summary, detail, life = 4000) => {
        toast.current?.show({ severity, summary, detail, life });
    };

    const limpiarFormulario = () => {
        setCurrentPassword("");
        setNewPassword("");
        setRepeatPassword("");
        setMensaje(null);
        setFormKey((prev) => prev + 1);
    };

    const obtenerDocUsuario = () => {
        const usuarioContext = panelContext?.userLogin || null;

        if (usuarioContext?.DOC) return usuarioContext.DOC;
        if (usuarioContext?.NUMDOC) return usuarioContext.NUMDOC;
        if (usuarioContext?.USUARIO) return usuarioContext.USUARIO;

        const usrm = sessionStorage.getItem("usrm");

        if (usrm) {
            try {
                const usuarioSession = JSON.parse(usrm);

                if (usuarioSession?.DOC) return usuarioSession.DOC;
                if (usuarioSession?.NUMDOC) return usuarioSession.NUMDOC;
                if (usuarioSession?.USUARIO) return usuarioSession.USUARIO;
            } catch (error) {
                console.error("Error leyendo usuario de sessionStorage:", error);
            }
        }

        return null;
    };

    const validarFormulario = () => {
        if (!currentPassword || !newPassword || !repeatPassword) {
            setMensaje("Completa todos los campos.");
            return false;
        }

        if (newPassword !== repeatPassword) {
            setMensaje("Las contraseñas no coinciden.");
            return false;
        }

        if (currentPassword === newPassword) {
            setMensaje("La nueva contraseña no puede ser igual a la actual.");
            return false;
        }

        return true;
    };

    const cambiarPassword = async () => {
        setMensaje(null);

        const doc = obtenerDocUsuario();

        if (!doc) {
            setMensaje("No se pudo identificar al usuario autenticado.");
            return;
        }

        if (!validarFormulario()) return;

        setLoading(true);

        try {
            const res = await new LoginService().changePassword({
                doc,
                currentPassword,
                newPassword,
            });

            if (res?.status === "0" || res?.status === 0) {
                limpiarFormulario();

                showToast("success", "Contraseña actualizada", res?.body || "La contraseña fue actualizada correctamente.");
            } else {
                setMensaje(res?.body || "No se pudo actualizar la contraseña.");
            }
        } catch (e) {
            console.error(e);

            const data = e?.response?.data;

            if (data?.body) {
                setMensaje(data.body);
            } else if (data?.error) {
                setMensaje(data.error);
            } else {
                setMensaje("Error cambiando contraseña.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-grid p-justify-center">
            <Toast ref={toast} position="top-right" />

            <div className="p-col-12 p-md-8 p-lg-6">
                <div className="card p-p-4" key={formKey}>
                    <div className="p-mb-4">
                        <h2 className="p-m-0">Cambiar contraseña</h2>
                        <small>Actualiza tu contraseña por seguridad o vencimiento.</small>
                    </div>

                    <div className="p-fluid">
                        <div className="p-field">
                            <label htmlFor="currentPassword">Contraseña actual</label>
                            <Password id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} feedback={false} toggleMask inputProps={{ autoComplete: "new-password" }} />
                        </div>

                        <div className="p-field">
                            <label htmlFor="newPassword">Nueva contraseña</label>
                            <Password id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} feedback={false} toggleMask inputProps={{ autoComplete: "new-password" }} />
                        </div>

                        <div className="p-field">
                            <label htmlFor="repeatPassword">Repetir nueva contraseña</label>
                            <Password id="repeatPassword" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} feedback={false} toggleMask inputProps={{ autoComplete: "new-password" }} />
                        </div>

                        {mensaje && (
                            <div className="p-mt-2" style={{ color: "red" }}>
                                {mensaje}
                            </div>
                        )}

                        <div className="p-d-flex p-jc-end p-mt-4">
                            <Button label={loading ? "Actualizando..." : "Actualizar contraseña"} icon="pi pi-key" onClick={cambiarPassword} loading={loading} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
