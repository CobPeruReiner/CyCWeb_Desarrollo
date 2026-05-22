import { useContext } from "react";
import PanelContext from "../../context/Panel/PanelContext";
import { Route } from "react-router-dom/cjs/react-router-dom";
import AppLogin from "../../AppLogin";
import AppVerifyOtp from "../../AppVerifyOtp";

export const PublicRoutes = () => {
    const panelContext = useContext(PanelContext);

    if (panelContext.userLogin) {
        return null;
    }

    return (
        <>
            <Route exact path="/" render={(props) => <AppLogin {...props} />} />
            <Route exact path="/verify-otp" render={(props) => <AppVerifyOtp {...props} />} />
        </>
    );
};
