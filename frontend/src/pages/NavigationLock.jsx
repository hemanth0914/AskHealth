import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function NavigationLock({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      navigate(location.pathname, { replace: true });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, location.pathname]);

  return <>{children}</>;
}

export default NavigationLock;
