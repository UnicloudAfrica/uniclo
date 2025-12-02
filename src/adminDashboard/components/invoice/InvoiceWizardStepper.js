import React from 'react';
import { Check } from 'lucide-react';

const InvoiceWizardStepper = ({ currentStep, steps }) => {
    return (
        <>
            {/* Desktop Stepper - Pill Style */}
            <div className="hidden md:block">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${index < currentStep
                                            ? 'bg-primary-600 text-white'
                                            : index === currentStep
                                                ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-600'
                                                : 'bg-slate-100 text-slate-400'
                                        }`}
                                >
                                    {index < currentStep ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span
                                        className={`text-sm font-semibold ${index <= currentStep ? 'text-slate-900' : 'text-slate-400'
                                            }`}
                                    >
                                        {step}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Step {index + 1} of {steps.length}
                                    </span>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`h-0.5 flex-1 mx-4 ${index < currentStep ? 'bg-primary-600' : 'bg-slate-200'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Mobile Stepper - Compact */}
            <div className="md:hidden">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {currentStep + 1}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                {steps[currentStep]}
                            </p>
                            <p className="text-xs text-slate-500">
                                Step {currentStep + 1} of {steps.length}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 w-8 rounded-full ${index <= currentStep ? 'bg-primary-600' : 'bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default InvoiceWizardStepper;
