import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useCreateMultiQuotes } from '../../../hooks/adminHooks/calculatorOptionHooks';
import { useSharedFetchRegions } from '../../../hooks/sharedCalculatorHooks';
import { useFetchProductPricing } from '../../../hooks/resource';
import { useCustomerContext } from '../../../hooks/adminHooks/useCustomerContext';
import ModernButton from '../ModernButton';
import InvoiceWizardStepper from '../invoice/InvoiceWizardStepper';
import InvoiceInfoStep from '../../pages/invoiceComps/InvoiceInfoStep';
import InvoiceItemsStep from '../../pages/invoiceComps/InvoiceItemsStep';
import InvoiceSummaryStep from '../../pages/invoiceComps/InvoiceSummaryStep';
import InvoiceFinalReviewStep from '../../pages/invoiceComps/InvoiceFinalReviewStep';
import InvoiceConfirmationStep from '../../pages/invoiceComps/InvoiceConfirmationStep';
import ToastUtils from '../../../utils/toastUtil';

const SharedCreateInvoice = ({ mode = 'admin', onExit }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [countryCode, setCountryCode] = useState('US');
    const [currencyCode, setCurrencyCode] = useState('USD');

    const [formData, setFormData] = useState({
        // Step 1
        subject: '',
        email: '',
        emails: '',
        notes: '',
        bill_to_name: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        // Total discount fields
        apply_total_discount: false,
        total_discount_type: 'percent',
        total_discount_value: '',
        total_discount_label: '',
        // Lead tracking fields
        create_lead: false,
        lead_first_name: '',
        lead_last_name: '',
        lead_email: '',
        lead_phone: '',
        lead_company: '',
        lead_country: '',
        // Step 2 (form part)
        region: '',
        compute_instance_id: null,
        os_image_id: null,
        months: 1,
        number_of_instances: 1,
        volume_type_id: null,
        storage_size_gb: '',
        bandwidth_id: null,
        bandwidth_count: 0,
        floating_ip_id: null,
        floating_ip_count: 0,
        // Object Storage fields
        object_storage_region: '',
        object_storage_product_id: null,
        object_storage_quantity: 1000,
        object_storage_months: 1,
    });

    const [pricingRequests, setPricingRequests] = useState([]);
    const [objectStorageRequests, setObjectStorageRequests] = useState([]);
    const [errors, setErrors] = useState({});
    const [apiResponse, setApiResponse] = useState(null);

    const {
        contextType,
        setContextType,
        selectedTenantId,
        setSelectedTenantId,
        selectedUserId,
        setSelectedUserId,
        tenants,
        isTenantsFetching,
        userPool,
        isUsersFetching,
    } = useCustomerContext({ enabled: mode === 'admin' });

    // Hooks
    const { data: regions, isFetching: isRegionsFetching } = useSharedFetchRegions(mode);
    const { mutate: createMultiQuotes, isPending: isSubmissionPending } =
        useCreateMultiQuotes();

    const { data: computerInstances, isFetching: isComputerInstancesFetching } =
        useFetchProductPricing(formData.region, 'compute_instance', {
            enabled: !!formData.region,
            countryCode: countryCode,
        });
    const { data: osImages, isFetching: isOsImagesFetching } =
        useFetchProductPricing(formData.region, 'os_image', {
            enabled: !!formData.region,
            countryCode: countryCode,
        });
    const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
        useFetchProductPricing(formData.region, 'volume_type', {
            enabled: !!formData.region,
            countryCode: countryCode,
        });
    const { data: bandwidths, isFetching: isBandwidthsFetching } =
        useFetchProductPricing(formData.region, 'bandwidth', {
            enabled: !!formData.region,
            countryCode: countryCode,
        });
    const { data: floatingIps, isFetching: isFloatingIpsFetching } =
        useFetchProductPricing(formData.region, 'ip', {
            enabled: !!formData.region,
            countryCode: countryCode,
        });
    const { data: crossConnects, isFetching: isCrossConnectsFetching } =
        useFetchProductPricing(formData.region, 'cross_connect', {
            enabled: !!formData.region,
            countryCode: countryCode,
        });
    const { data: objectStorageProducts, isFetching: isObjectStorageProductsFetching } =
        useFetchProductPricing(formData.object_storage_region, 'object_storage', {
            enabled: !!formData.object_storage_region,
            countryCode: countryCode,
        });

    const steps = ['Invoice Info', 'Add Items', 'Invoice Summary', 'Final Review', 'Confirmation'];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const updateFormData = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: null }));
    };

    const handleCurrencyChange = (country, currency) => {
        setCountryCode(country);
        setCurrencyCode(currency);
        // Reset region selections when currency changes (prices will be different)
        setFormData((prev) => ({
            ...prev,
            region: '',
            object_storage_region: '',
        }));
        setPricingRequests([]);
        setObjectStorageRequests([]);
    };

    const validateStep = (step = currentStep) => {
        const newErrors = {};
        if (step === 0) {
            if (!formData.subject) newErrors.subject = 'Subject is required.';
            if (!formData.email) newErrors.email = 'Primary email is required.';
            if (!formData.bill_to_name)
                newErrors.bill_to_name = 'Bill to name is required.';
        } else if (step === 1) {
            if (pricingRequests.length === 0 && objectStorageRequests.length === 0) {
                newErrors.general = 'Please add at least one item (compute or object storage) to the invoice.';
            }
        } else if (step === 3) {
            if (formData.create_lead) {
                if (!formData.lead_first_name) {
                    newErrors.lead_first_name = 'First name is required for lead creation.';
                }
                if (!formData.lead_last_name) {
                    newErrors.lead_last_name = 'Last name is required for lead creation.';
                }
                if (!formData.lead_email) {
                    newErrors.lead_email = 'Email is required for lead creation.';
                }
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateItem = () => {
        const newErrors = {};
        if (!formData.region) newErrors.region = 'Region is required.';
        if (!formData.compute_instance_id)
            newErrors.compute_instance_id = 'Compute instance is required.';
        if (!formData.os_image_id) newErrors.os_image_id = 'OS image is required.';
        if (!formData.months || formData.months < 1)
            newErrors.months = 'Term must be at least 1 month.';
        if (!formData.number_of_instances || formData.number_of_instances < 1)
            newErrors.number_of_instances = 'At least 1 instance is required.';
        if (!formData.volume_type_id)
            newErrors.volume_type_id = 'Volume type is required.';
        if (!formData.storage_size_gb || formData.storage_size_gb < 1)
            newErrors.storage_size_gb = 'Storage size must be at least 1 GB.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addPricingRequest = () => {
        if (validateItem()) {
            const computeName =
                computerInstances?.find(
                    (c) =>
                        c.product.productable_id === parseInt(formData.compute_instance_id)
                )?.product.name || 'N/A';
            const osName =
                osImages?.find(
                    (o) => o.product.productable_id === parseInt(formData.os_image_id)
                )?.product.name || 'N/A';

            const newRequest = {
                region: formData.region,
                compute_instance_id: parseInt(formData.compute_instance_id),
                os_image_id: parseInt(formData.os_image_id),
                months: parseInt(formData.months),
                number_of_instances: parseInt(formData.number_of_instances),
                volume_types: [
                    {
                        volume_type_id: parseInt(formData.volume_type_id),
                        storage_size_gb: parseInt(formData.storage_size_gb),
                    },
                ],
                _display: {
                    compute: computeName,
                    os: osName,
                    storage: `${formData.storage_size_gb} GB`,
                },
            };
            setPricingRequests([...pricingRequests, newRequest]);
            setFormData((prev) => ({
                ...prev,
                region: '',
                compute_instance_id: null,
                os_image_id: null,
                months: 1,
                number_of_instances: 1,
                volume_type_id: null,
                storage_size_gb: '',
            }));
            setErrors({});
            ToastUtils.success('Item added to invoice.');
        }
    };

    const validateObjectStorageItem = () => {
        const newErrors = {};
        if (!formData.object_storage_region) newErrors.object_storage_region = 'Region is required.';
        if (!formData.object_storage_product_id)
            newErrors.object_storage_product_id = 'Storage tier is required.';
        if (!formData.object_storage_quantity || formData.object_storage_quantity < 1)
            newErrors.object_storage_quantity = 'Quantity must be at least 1 GB.';
        if (!formData.object_storage_months || formData.object_storage_months < 1)
            newErrors.object_storage_months = 'Term must be at least 1 month.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const addObjectStorageRequest = () => {
        if (validateObjectStorageItem()) {
            const productName =
                objectStorageProducts?.find(
                    (p) =>
                        p.product.productable_id ===
                        parseInt(formData.object_storage_product_id)
                )?.product.name || 'Object Storage';

            const newRequest = {
                region: formData.object_storage_region,
                productable_id: parseInt(formData.object_storage_product_id),
                quantity: parseInt(formData.object_storage_quantity),
                months: parseInt(formData.object_storage_months),
                _display: {
                    name: productName,
                    quantity: `${formData.object_storage_quantity} GB`,
                },
            };
            setObjectStorageRequests([...objectStorageRequests, newRequest]);
            setFormData((prev) => ({
                ...prev,
                object_storage_product_id: null,
                object_storage_quantity: 1000,
                object_storage_months: 1,
            }));
            setErrors({});
            ToastUtils.success('Object storage added to invoice.');
        }
    };

    const removeObjectStorageRequest = (index) => {
        setObjectStorageRequests(objectStorageRequests.filter((_, i) => i !== index));
    };

    const removePricingRequest = (index) => {
        setPricingRequests(pricingRequests.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1 && validateStep()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        if (!validateStep(0) || !validateStep(1) || !validateStep(3)) {
            ToastUtils.error('Please complete all required fields in all steps.');
            return;
        }

        const payload = {
            subject: formData.subject,
            email: formData.email,
            emails: formData.emails.trim()
                ? formData.emails
                    .split(',')
                    .map((e) => e.trim())
                    .filter(Boolean)
                : [],
            notes: formData.notes,
            bill_to_name: formData.bill_to_name,
            country_code: countryCode,
            currency_code: currencyCode,
            pricing_requests: pricingRequests.map((req) => {
                const { _display, ...rest } = req;
                return rest;
            }),
            object_storage_items: objectStorageRequests.map((req) => {
                const { _display, ...rest } = req;
                return rest;
            }),
        };

        if (contextType === 'tenant' && selectedTenantId) {
            payload.tenant_id = selectedTenantId;
        } else if (contextType === 'user' && selectedUserId) {
            payload.client_id = selectedUserId;
            if (selectedTenantId) {
                payload.tenant_id = selectedTenantId;
            }
        }

        if (formData.apply_total_discount && formData.total_discount_value) {
            payload.total_discount = {
                type: formData.total_discount_type,
                value: parseFloat(formData.total_discount_value),
                label: formData.total_discount_label || null,
            };
        }

        if (formData.create_lead) {
            payload.create_lead = true;
            payload.lead_info = {
                first_name: formData.lead_first_name || '',
                last_name: formData.lead_last_name || '',
                email: formData.lead_email || formData.email,
                phone: formData.lead_phone || null,
                company: formData.lead_company || null,
                country: formData.lead_country || null,
            };
        }

        createMultiQuotes(payload, {
            onSuccess: (res) => {
                ToastUtils.success('Invoice created successfully!');
                setApiResponse(res);
                setCurrentStep((prev) => prev + 1);
            },
            onError: (err) => {
                ToastUtils.error(
                    err.message || 'Failed to create invoice. Please try again.'
                );
            },
        });
    };

    const selectedTenant = tenants?.find(
        (tenant) => String(tenant.id) === String(selectedTenantId)
    );
    const selectedUser = userPool?.find(
        (user) => String(user.id) === String(selectedUserId)
    );
    const assignmentDetails = {
        assignType: contextType,
        tenant: selectedTenant,
        user: selectedUser,
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <InvoiceInfoStep
                        formData={formData}
                        errors={errors}
                        updateFormData={updateFormData}
                        mode={mode}
                        contextType={contextType}
                        setContextType={setContextType}
                        selectedTenantId={selectedTenantId}
                        setSelectedTenantId={setSelectedTenantId}
                        selectedUserId={selectedUserId}
                        setSelectedUserId={setSelectedUserId}
                        tenants={tenants}
                        isTenantsFetching={isTenantsFetching}
                        userPool={userPool}
                        isUsersFetching={isUsersFetching}
                        countryCode={countryCode}
                        currencyCode={currencyCode}
                        onCurrencyChange={handleCurrencyChange}
                    />
                );
            case 1:
                return (
                    <InvoiceItemsStep
                        formData={formData}
                        errors={errors}
                        updateFormData={updateFormData}
                        regions={regions}
                        isRegionsFetching={isRegionsFetching}
                        computerInstances={computerInstances}
                        isComputerInstancesFetching={isComputerInstancesFetching}
                        ebsVolumes={ebsVolumes}
                        isEbsVolumesFetching={isEbsVolumesFetching}
                        osImages={osImages}
                        isOsImagesFetching={isOsImagesFetching}
                        bandwidths={bandwidths}
                        isBandwidthsFetching={isBandwidthsFetching}
                        floatingIps={floatingIps}
                        isFloatingIpsFetching={isFloatingIpsFetching}
                        crossConnects={crossConnects}
                        isCrossConnectsFetching={isCrossConnectsFetching}
                        onAddRequest={addPricingRequest}
                        pricingRequests={pricingRequests}
                        onRemoveRequest={removePricingRequest}
                        objectStorageProducts={objectStorageProducts}
                        isObjectStorageProductsFetching={isObjectStorageProductsFetching}
                        onAddObjectStorageRequest={addObjectStorageRequest}
                        objectStorageRequests={objectStorageRequests}
                        onRemoveObjectStorageRequest={removeObjectStorageRequest}
                    />
                );
            case 2:
                return (
                    <InvoiceSummaryStep
                        pricingRequests={pricingRequests}
                        objectStorageRequests={objectStorageRequests}
                        formData={formData}
                    />
                );
            case 3:
                return (
                    <InvoiceFinalReviewStep
                        formData={formData}
                        pricingRequests={pricingRequests}
                        objectStorageRequests={objectStorageRequests}
                        tenants={tenants}
                        assignmentDetails={assignmentDetails}
                        updateFormData={updateFormData}
                        errors={errors}
                        mode={mode}
                    />
                );
            case 4:
                return <InvoiceConfirmationStep apiResponse={apiResponse} />;
            default:
                return null;
        }
    };

    const stepCtas = [
        'Continue to Items',
        'Continue to Summary',
        'Continue to Final Review',
        'Submit Invoice',
        'Finish',
    ];
    const isReviewStep = currentStep === steps.length - 2;
    const isFinalStep = currentStep === steps.length - 1;
    const primaryActionLabel = stepCtas[currentStep] || 'Continue';

    const handlePrimaryAction = () => {
        if (isReviewStep) {
            handleSubmit();
        } else if (isFinalStep) {
            onExit ? onExit() : navigate('/admin-dashboard');
        } else {
            handleNext();
        }
    };

    const disablePrimary =
        isSubmissionPending ||
        (currentStep === 1 && pricingRequests.length === 0 && objectStorageRequests.length === 0) ||
        (isReviewStep && pricingRequests.length === 0 && objectStorageRequests.length === 0);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Stepper */}
            <div className="mb-8">
                <InvoiceWizardStepper currentStep={currentStep} steps={steps} />
            </div>

            {/* Step Content */}
            <div className="mb-8">{renderStep()}</div>

            {/* Navigation Buttons - Desktop */}
            <div className="hidden md:flex items-center justify-between border-t border-slate-200 pt-6">
                {currentStep > 0 && currentStep < steps.length - 1 ? (
                    <ModernButton
                        variant="outline"
                        onClick={handleBack}
                        isDisabled={isSubmissionPending}
                        leftIcon={<ChevronLeft className="h-4 w-4" />}
                    >
                        Back
                    </ModernButton>
                ) : (
                    <div />
                )}

                {currentStep < steps.length - 1 && (
                    <ModernButton
                        variant="primary"
                        onClick={handlePrimaryAction}
                        isDisabled={disablePrimary}
                        isLoading={isSubmissionPending}
                    >
                        {primaryActionLabel}
                    </ModernButton>
                )}

                {currentStep === steps.length - 1 && (
                    <ModernButton
                        variant="primary"
                        onClick={() => onExit ? onExit() : navigate('/admin-dashboard')}
                    >
                        Finish
                    </ModernButton>
                )}
            </div>

            {/* Mobile Sticky Bottom Bar */}
            {currentStep < steps.length - 1 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
                    <div className="mx-auto max-w-7xl">
                        <ModernButton
                            variant="primary"
                            size="lg"
                            className="w-full shadow-lg shadow-primary-500/20"
                            onClick={handlePrimaryAction}
                            isDisabled={disablePrimary}
                            isLoading={isSubmissionPending}
                        >
                            {primaryActionLabel}
                        </ModernButton>
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                disabled={isSubmissionPending}
                                className="mt-2 w-full text-center text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
                            >
                                ← Back
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SharedCreateInvoice;
