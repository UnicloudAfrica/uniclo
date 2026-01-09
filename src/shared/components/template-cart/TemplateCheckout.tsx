// Template Checkout - Main wizard orchestrator
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiContext } from "../../../hooks/useApiContext";
import clientApi from "../../../index/client/api";
import { useTemplateCart } from "../../../stores/templateCartStore";
import ProjectSetupStep from "./checkout/ProjectSetupStep";
import KeyPairSetupStep from "./checkout/KeyPairSetupStep";
import OrderReviewStep from "./checkout/OrderReviewStep";
import ToastUtils from "../../../utils/toastUtil";
import { Loader2 } from "lucide-react";

const TemplateCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { context } = useApiContext();
  // Using clientApi for all contexts until tenant/admin APIs are created
  const api = clientApi;
  const { items, clearCart } = useTemplateCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [project, setProject] = useState<any>(null);
  const [keypairName, setKeypairName] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const steps = [
    { id: 1, title: "Project Setup" },
    { id: 2, title: "SSH Key Pair" },
    { id: 3, title: "Review Order" },
    { id: 4, title: "Payment" },
  ];

  const handleProjectComplete = (projectData: any) => {
    setProject(projectData);
    setCurrentStep(2);
  };

  const handleKeypairComplete = (kpName: string) => {
    setKeypairName(kpName);
    setCurrentStep(3);
  };

  const handleProceedToPayment = async () => {
    setIsCreatingOrder(true);
    try {
      const endpoint = context === "client" ? "/business/template-orders" : "/template-orders";

      const orderItems = items.map((item) => ({
        template_id: item.templateId,
        quantity: item.quantity,
        configuration: {
          project_id: project.id,
          keypair_name: keypairName,
          region: project.region,
        },
      }));

      const response = await api("POST", endpoint, {
        items: orderItems,
        billing_country: "NG", // TODO: Get from user profile
      });

      const order = response?.data || response;

      // Clear cart
      clearCart();

      // Navigate to payment
      const paymentPath =
        context === "admin"
          ? `/admin-dashboard/orders/${order.id}/payment`
          : context === "tenant"
            ? `/tenant-dashboard/orders/${order.id}/payment`
            : `/client-dashboard/orders/${order.id}/payment`;

      navigate(paymentPath, { state: { order } });
      ToastUtils.success("Order created! Proceeding to payment...");
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to create order");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">Add some templates to your cart before checking out</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  if (isCreatingOrder) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Creating your order...</h2>
          <p className="text-slate-600">Please wait while we prepare your instances</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep >= step.id
                      ? "bg-primary-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step.id}
                </div>
                <div className="ml-3">
                  <div
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded transition-colors ${
                    currentStep > step.id ? "bg-primary-600" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <ProjectSetupStep onComplete={handleProjectComplete} onBack={() => navigate(-1)} />
      )}

      {currentStep === 2 && project && (
        <KeyPairSetupStep
          project={project}
          onComplete={handleKeypairComplete}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && project && keypairName && (
        <OrderReviewStep
          project={project}
          keypairName={keypairName}
          onBack={() => setCurrentStep(2)}
          onProceedToPayment={handleProceedToPayment}
        />
      )}
    </div>
  );
};

export default TemplateCheckout;
