import React, { useState, useEffect } from 'react';
import { 
  Server, 
  CreditCard, 
  Zap, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useInitiateMultiInstanceRequest, useTransactionPolling } from '../hooks/instancesHook';
import PaymentSummary from './PaymentSummary';

const MultiInstanceCreation = ({ onComplete, initialData = null }) => {
  const [step, setStep] = useState(initialData ? 'review' : 'configure');
  const [instanceConfig, setInstanceConfig] = useState(initialData || {
    fast_track: false,
    pricing_requests: []
  });
  const [transactionData, setTransactionData] = useState(null);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  
  const createInstancesMutation = useInitiateMultiInstanceRequest();
  
  // Poll transaction status if we have a pending transaction
  const { data: transactionStatus } = useTransactionPolling(
    transactionData?.data?.transaction?.id,
    (completedTransaction) => {
      // Handle successful payment
      setStep('completed');
      if (onComplete) {
        onComplete(completedTransaction);
      }
    }
  );

  const handleCreateInstances = async () => {
    try {
      setStep('processing');
      
      const result = await createInstancesMutation.mutateAsync(instanceConfig);
      setTransactionData(result);

      // Check if this is fast-track or requires payment
      if (result.data?.fast_track_completed) {
        setStep('completed');
        if (onComplete) {
          onComplete(result);
        }
      } else if (result.data?.payment?.required) {
        setStep('payment');
        setShowPaymentSummary(true);
      } else {
        setStep('completed');
      }
    } catch (error) {
      console.error('Failed to create instances:', error);
      setStep('error');
    }
  };

  const handlePaymentComplete = (completedTransaction) => {
    setStep('completed');
    if (onComplete) {
      onComplete(completedTransaction);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'configure', label: 'Configure', active: step === 'configure' },
      { id: 'review', label: 'Review', active: ['review', 'processing'].includes(step) },
      { id: 'payment', label: 'Payment', active: ['payment'].includes(step) },
      { id: 'completed', label: 'Complete', active: step === 'completed' }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepItem, index) => (
          <React.Fragment key={stepItem.id}>
            <div className={`flex items-center ${stepItem.active ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                ${stepItem.active ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                {step === 'completed' && stepItem.id === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className="ml-2 text-sm font-medium">{stepItem.label}</span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="w-4 h-4 mx-4 text-gray-400" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderConfigurationStep = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Instance Configuration</h3>
      
      {/* Fast-track toggle */}
      <div className="mb-6 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">Fast Track</h4>
              <p className="text-sm text-yellow-700">Skip payment and provision immediately (Admin only)</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={instanceConfig.fast_track}
              onChange={(e) => setInstanceConfig(prev => ({ ...prev, fast_track: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Configuration form would go here */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Instances
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={instanceConfig.pricing_requests?.[0]?.number_of_instances || 1}
            onChange={(e) => {
              const newConfig = { ...instanceConfig };
              if (!newConfig.pricing_requests?.[0]) {
                newConfig.pricing_requests = [{}];
              }
              newConfig.pricing_requests[0].number_of_instances = parseInt(e.target.value);
              setInstanceConfig(newConfig);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Add more configuration fields as needed */}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setStep('review')}
          disabled={!instanceConfig.pricing_requests?.length}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          Review Configuration
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Create</h3>
      
      {/* Configuration summary */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Server className="w-5 h-5 text-gray-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">Instance Configuration</h4>
              <p className="text-sm text-gray-600">
                {instanceConfig.pricing_requests?.[0]?.number_of_instances || 1} instances
                {instanceConfig.fast_track && ' (Fast Track)'}
              </p>
            </div>
          </div>
          {instanceConfig.fast_track && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Zap className="w-3 h-3 mr-1" />
              Fast Track
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep('configure')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Configure
        </button>
        
        <button
          onClick={handleCreateInstances}
          disabled={createInstancesMutation.isLoading}
          className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
        >
          {createInstancesMutation.isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : instanceConfig.fast_track ? (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Create Instances (Fast Track)
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Create & Pay
            </>
          )}
        </button>
      </div>

      {createInstancesMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Creating Instances</h3>
              <div className="mt-2 text-sm text-red-700">
                {createInstancesMutation.error?.message || 'An unexpected error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderProcessingStep = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
      <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Instances</h3>
      <p className="text-gray-600">
        {instanceConfig.fast_track 
          ? 'Provisioning instances immediately...' 
          : 'Setting up your order and payment...'
        }
      </p>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      {showPaymentSummary && transactionData && (
        <PaymentSummary
          transactionData={transactionData}
          onPaymentComplete={handlePaymentComplete}
          onClose={() => setShowPaymentSummary(false)}
        />
      )}
    </div>
  );

  const renderCompletedStep = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {instanceConfig.fast_track ? 'Instances Created!' : 'Payment Completed!'}
      </h3>
      <p className="text-gray-600 mb-6">
        {instanceConfig.fast_track 
          ? 'Your instances have been created and are being provisioned.'
          : 'Your payment was successful and instances are being provisioned.'
        }
      </p>
      
      {transactionData?.data?.instances && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Created Instances:</h4>
          <div className="space-y-2">
            {transactionData.data.instances.map((instance) => (
              <div key={instance.id} className="text-sm bg-gray-50 rounded p-2 text-left">
                <div className="font-medium">{instance.identifier}</div>
                <div className="text-gray-600">Status: {instance.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => window.location.href = '/admin-dashboard/instances'}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
      >
        View Instances
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );

  const renderErrorStep = () => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Creation Failed</h3>
      <p className="text-gray-600 mb-6">
        There was an error creating your instances. Please try again or contact support.
      </p>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setStep('review')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Start Over
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Multi-Instance Creation</h1>
        <p className="text-gray-600">Create and provision multiple cloud instances</p>
      </div>

      {renderStepIndicator()}

      <div className="min-h-96">
        {step === 'configure' && renderConfigurationStep()}
        {step === 'review' && renderReviewStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'payment' && renderPaymentStep()}
        {step === 'completed' && renderCompletedStep()}
        {step === 'error' && renderErrorStep()}
      </div>
    </div>
  );
};

export default MultiInstanceCreation;