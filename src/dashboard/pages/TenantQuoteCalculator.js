import React, { useEffect } from "react";
import QuoteCalculatorWizard from "./QuoteCalculatorWizard";
import useAuthStore from "../../stores/userAuthStore";
import { useNavigate } from "react-router-dom";

export default function TenantQuoteCalculator() {
  const navigate = useNavigate();
  const { token } = useAuthStore.getState();

  useEffect(() => {
    if (!token) {
      navigate("/sign-in");
    }
  }, [token, navigate]);

  return <QuoteCalculatorWizard />;
}
