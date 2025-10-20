import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Server,
  DollarSign
} from 'lucide-react';
import { designTokens } from '../../styles/designTokens';
import useAdminAuthStore from '../../stores/adminAuthStore';
import config from '../../config';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  transactionData,
  onPaymentComplete 
}) => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);

  const { transaction, order, instances, payment } = transactionData?.data || {};
  const paymentGatewayOptions = payment?.payment_gateway_options || [];

  // Set default payment option
  useEffect(() => {
    if (isOpen && paymentGatewayOptions.length > 0) {
      // Default to Paystack Card if available, otherwise first option
      const paystackCardOption = paymentGatewayOptions.find(
        option => option.name?.toLowerCase().includes('paystack') && 
                 option.payment_type?.toLowerCase() === 'card'
      );
      setSelectedPaymentOption(paystackCardOption || paymentGatewayOptions[0]);
    } else {
      setSelectedPaymentOption(null);
    }
  }, [isOpen, paymentGatewayOptions]);

  // Calculate time remaining for payment
  useEffect(() => {
    if (payment?.expires_at) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const expiry = new Date(payment.expires_at).getTime();
        const remaining = expiry - now;

        if (remaining > 0) {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setTimeRemaining({ hours, minutes, seconds });
        } else {
          setTimeRemaining(null);
          setPaymentStatus('expired');
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [payment?.expires_at]);

  // Poll transaction status
  const pollTransactionStatus = async () => {
    if (!transaction?.id || isPolling) return;

    setIsPolling(true);
    try {
      const { token } = useAdminAuthStore.getState();
      
      const response = await fetch(`${config.baseURL}/business/transactions/${transaction.id}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.status === 'successful') {
          setPaymentStatus('completed');
          if (onPaymentComplete) {
            onPaymentComplete(data.data);
          }
        } else if (data.data.status === 'failed') {
          setPaymentStatus('failed');
        }
      }
    } catch (error) {
      console.error('Failed to poll transaction status:', error);
    } finally {
      setIsPolling(false);
    }
  };

  // Auto-poll every 10 seconds when modal is open and payment is pending
  useEffect(() => {
    if (isOpen && paymentStatus === 'pending' && transaction?.id) {
      const interval = setInterval(pollTransactionStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, paymentStatus, transaction?.id]);

  // Load Paystack script
  useEffect(() => {
    if (isOpen && !window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  const handlePaymentOptionChange = (optionId) => {
    const option = paymentGatewayOptions.find(opt => String(opt.id) === String(optionId));
    setSelectedPaymentOption(option);
  };

  const handlePayNow = () => {
    if (!selectedPaymentOption) return;
    
    if (selectedPaymentOption.payment_type?.toLowerCase() === 'card') {
      // Handle Paystack card payment
      if (selectedPaymentOption.transaction_reference) {
        const paystackKey = process.env.REACT_APP_PAYSTACK_KEY;
        if (paystackKey && window.PaystackPop) {
          const popup = window.PaystackPop.setup({
            key: paystackKey,
            email: transaction?.user?.email || 'user@example.com',
            amount: selectedPaymentOption.total * 100, // Paystack expects amount in kobo
            reference: selectedPaymentOption.transaction_reference,
            channels: ['card'],
            onSuccess: (response) => {
              setPaymentStatus('completed');
              if (onPaymentComplete) {
                onPaymentComplete(response);
              }
            },
            onCancel: () => {
              console.log('Payment cancelled');
            },
            onError: (error) => {
              console.error('Payment failed:', error);
              setPaymentStatus('failed');
            },
          });
          popup.openIframe();
        }
      }
    } else if (selectedPaymentOption.payment_type?.toLowerCase().includes('transfer')) {
      // Handle bank transfer - mark as initiated and show details
      setPaymentStatus('transfer_pending');
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
      case 'expired':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment completed! Your instances are being provisioned and will be available shortly.';
      case 'failed':
        return 'Payment failed. Please try again or contact support.';
      case 'expired':
        return 'Payment link has expired. Please create a new order.';
      default:
        return 'Complete your payment to proceed with instance provisioning.';
    }
  };

  if (!isOpen || !transactionData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={paymentStatus !== 'completed' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: designTokens.colors.neutral[200] }}
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: designTokens.colors.neutral[900] }}
                >
                  {paymentStatus === 'completed' ? 'Payment Successful!' : 'Complete Payment'}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: designTokens.colors.neutral[500] }}
                >
                  Transaction #{transaction?.identifier || transaction?.id}
                </p>
              </div>
            </div>
            {paymentStatus !== 'completed' && (
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Status Message */}
          <div 
            className="px-6 py-4 border-b"
            style={{ 
              backgroundColor: paymentStatus === 'completed' 
                ? designTokens.colors.success[50] 
                : designTokens.colors.neutral[50],
              borderColor: designTokens.colors.neutral[200]
            }}
          >
            <div className="flex items-center justify-between">
              <p 
                className="text-sm font-medium"
                style={{ 
                  color: paymentStatus === 'completed' 
                    ? designTokens.colors.success[800] 
                    : designTokens.colors.neutral[700]
                }}
              >
                {getStatusMessage()}
              </p>
              {timeRemaining && paymentStatus === 'pending' && (
                <div 
                  className="text-sm font-medium"
                  style={{ color: designTokens.colors.warning[600] }}
                >
                  Expires in {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Information */}
              <div className="space-y-4">
                <h4 
                  className="font-semibold flex items-center"
                  style={{ color: designTokens.colors.neutral[900] }}
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Payment Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span style={{ color: designTokens.colors.neutral[600] }}>Amount:</span>
                    <span 
                      className="font-semibold text-lg"
                      style={{ color: designTokens.colors.neutral[900] }}
                    >
                      {transaction?.currency} {transaction?.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: designTokens.colors.neutral[600] }}>Gateway:</span>
                    <span 
                      className="font-medium capitalize px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: designTokens.colors.primary[100],
                        color: designTokens.colors.primary[800]
                      }}
                    >
                      {selectedPaymentOption?.name || 'Paystack'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: designTokens.colors.neutral[600] }}>Method:</span>
                    <span 
                      className="font-medium px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: designTokens.colors.success[100],
                        color: designTokens.colors.success[800]
                      }}
                    >
                      {selectedPaymentOption?.payment_type || 'Card'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span style={{ color: designTokens.colors.neutral[600] }}>Reference:</span>
                    <span 
                      className="font-mono text-xs px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: designTokens.colors.neutral[100],
                        color: designTokens.colors.neutral[700]
                      }}
                    >
                      {selectedPaymentOption?.transaction_reference || 'Generating...'}
                    </span>
                  </div>
                  
                  {/* Payment Method Selection */}
                  {paymentGatewayOptions.length > 1 && (
                    <div className="col-span-full">
                      <label className="block text-xs font-medium mb-2" style={{ color: designTokens.colors.neutral[700] }}>
                        Payment Method:
                      </label>
                      <select
                        value={selectedPaymentOption?.id || ''}
                        onChange={(e) => handlePaymentOptionChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded"
                        style={{ 
                          borderColor: designTokens.colors.neutral[300],
                          backgroundColor: designTokens.colors.neutral[0]
                        }}
                      >
                        {paymentGatewayOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name} ({option.payment_type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Instance Information */}
              <div className="space-y-4">
                <h4 
                  className="font-semibold flex items-center"
                  style={{ color: designTokens.colors.neutral[900] }}
                >
                  <Server className="w-5 h-5 mr-2" />
                  Instances ({instances?.length || 0})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {instances?.map((instance, index) => (
                    <div 
                      key={instance.id} 
                      className="text-sm rounded-lg p-3"
                      style={{ backgroundColor: designTokens.colors.neutral[50] }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span 
                          className="font-medium"
                          style={{ color: designTokens.colors.neutral[900] }}
                        >
                          {instance.name || `Instance ${index + 1}`}
                        </span>
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: designTokens.colors.primary[100],
                            color: designTokens.colors.primary[800]
                          }}
                        >
                          {instance.provider} • {instance.region}
                        </span>
                      </div>
                      <div 
                        className="text-xs"
                        style={{ color: designTokens.colors.neutral[600] }}
                      >
                        Status: <span className="font-medium">{instance.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-t"
            style={{ 
              backgroundColor: designTokens.colors.neutral[25],
              borderColor: designTokens.colors.neutral[200]
            }}
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={pollTransactionStatus}
                disabled={isPolling}
                className="flex items-center text-sm hover:text-blue-600 transition-colors"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
                {isPolling ? 'Checking...' : 'Check Status'}
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {paymentStatus === 'pending' && selectedPaymentOption && (
                <button
                  onClick={handlePayNow}
                  className="inline-flex items-center px-6 py-2 rounded-lg shadow-sm text-sm font-medium text-white transition-all hover:shadow-md"
                  style={{ 
                    backgroundColor: selectedPaymentOption.payment_type?.toLowerCase() === 'card' 
                      ? designTokens.colors.primary[600] 
                      : designTokens.colors.warning[600],
                    borderColor: selectedPaymentOption.payment_type?.toLowerCase() === 'card' 
                      ? designTokens.colors.primary[600] 
                      : designTokens.colors.warning[600]
                  }}
                >
                  {selectedPaymentOption.payment_type?.toLowerCase() === 'card' ? (
                    <CreditCard className="w-4 h-4 mr-2" />
                  ) : (
                    <Server className="w-4 h-4 mr-2" />
                  )}
                  {selectedPaymentOption.payment_type?.toLowerCase() === 'card' 
                    ? 'Pay with Card' 
                    : 'Bank Transfer'
                  }
                  {selectedPaymentOption.payment_type?.toLowerCase() === 'card' && (
                    <ExternalLink className="w-4 h-4 ml-2" />
                  )}
                </button>
              )}

              {paymentStatus === 'completed' && (
                <button
                  onClick={() => {
                    onClose();
                    // Redirect to instances page to see the provisioned instances
                    setTimeout(() => {
                      window.location.href = '/admin-dashboard/instances';
                    }, 500);
                  }}
                  className="inline-flex items-center px-6 py-2 rounded-lg shadow-sm text-sm font-medium text-white transition-all hover:shadow-md"
                  style={{ 
                    backgroundColor: designTokens.colors.success[600],
                    borderColor: designTokens.colors.success[600]
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  View Instances
                </button>
              )}

              {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
                <button
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: designTokens.colors.neutral[100],
                    color: designTokens.colors.neutral[700],
                    borderColor: designTokens.colors.neutral[300]
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Bank Transfer Details */}
          {paymentStatus === 'pending' && selectedPaymentOption?.payment_type?.toLowerCase().includes('transfer') && selectedPaymentOption?.details && (
            <div 
              className="px-6 py-4 border-t"
              style={{ 
                backgroundColor: designTokens.colors.warning[50],
                borderColor: designTokens.colors.warning[200]
              }}
            >
              <h4 
                className="font-semibold mb-3 flex items-center"
                style={{ color: designTokens.colors.warning[800] }}
              >
                <Server className="w-4 h-4 mr-2" />
                Bank Transfer Details
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {selectedPaymentOption.details.account_name && (
                  <div className="flex justify-between">
                    <span style={{ color: designTokens.colors.warning[700] }}>Account Name:</span>
                    <span 
                      className="font-mono font-medium"
                      style={{ color: designTokens.colors.neutral[900] }}
                    >
                      {selectedPaymentOption.details.account_name}
                    </span>
                  </div>
                )}
                {selectedPaymentOption.details.account_number && (
                  <div className="flex justify-between">
                    <span style={{ color: designTokens.colors.warning[700] }}>Account Number:</span>
                    <span 
                      className="font-mono font-medium"
                      style={{ color: designTokens.colors.neutral[900] }}
                    >
                      {selectedPaymentOption.details.account_number}
                    </span>
                  </div>
                )}
                {selectedPaymentOption.details.bank_name && (
                  <div className="flex justify-between">
                    <span style={{ color: designTokens.colors.warning[700] }}>Bank:</span>
                    <span 
                      className="font-medium"
                      style={{ color: designTokens.colors.neutral[900] }}
                    >
                      {selectedPaymentOption.details.bank_name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: designTokens.colors.warning[200] }}>
                  <span style={{ color: designTokens.colors.warning[700] }}>Amount to Transfer:</span>
                  <span 
                    className="font-bold text-lg"
                    style={{ color: designTokens.colors.success[700] }}
                  >
                    ₦{selectedPaymentOption.total?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          {paymentStatus === 'pending' && (
            <div 
              className="px-6 py-3 text-sm border-t"
              style={{ 
                backgroundColor: designTokens.colors.info[50],
                borderColor: designTokens.colors.info[200],
                color: designTokens.colors.info[700]
              }}
            >
              <p className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                {selectedPaymentOption?.payment_type?.toLowerCase().includes('transfer') 
                  ? 'After making the bank transfer, click "Check Status" or wait for automatic verification. Your instances will be provisioned once payment is confirmed.'
                  : 'After completing payment, your instances will be automatically provisioned on Zadara. This modal will update automatically, or you can click "Check Status" to refresh.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;