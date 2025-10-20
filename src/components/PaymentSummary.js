import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Server,
  DollarSign
} from 'lucide-react';

const PaymentSummary = ({ 
  transactionData, 
  onPaymentComplete, 
  onClose,
  className = "" 
}) => {
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const { transaction, order, instances, payment } = transactionData?.data || {};

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
      // Import config and auth store
      const config = require('../config').default;
      const useAdminAuthStore = require('../stores/adminAuthStore').default;
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

  // Auto-poll every 30 seconds
  useEffect(() => {
    if (paymentStatus === 'pending' && transaction?.id) {
      const interval = setInterval(pollTransactionStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [paymentStatus, transaction?.id]);

  const handlePayNow = () => {
    if (payment?.payment_url) {
      window.open(payment.payment_url, '_blank');
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
      case 'expired':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'completed':
        return 'Payment completed! Your instances are being provisioned.';
      case 'failed':
        return 'Payment failed. Please try again or contact support.';
      case 'expired':
        return 'Payment link has expired. Please create a new order.';
      default:
        return 'Payment required to proceed with instance provisioning.';
    }
  };

  if (!transactionData) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Summary
              </h3>
              <p className="text-sm text-gray-500">
                Transaction #{transaction?.identifier || transaction?.id}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">{getStatusMessage()}</p>
          {timeRemaining && paymentStatus === 'pending' && (
            <div className="text-sm text-orange-600 font-medium">
              Expires in {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
            </div>
          )}
        </div>
      </div>

      {/* Order Details */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  {transaction?.currency} {transaction?.amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gateway:</span>
                <span className="font-medium capitalize">
                  {payment?.gateway || 'Paystack'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium text-xs">
                  {payment?.payment_reference || 'Generating...'}
                </span>
              </div>
            </div>
          </div>

          {/* Instance Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Server className="w-5 h-5 mr-2" />
              Instances ({instances?.length || 0})
            </h4>
            <div className="space-y-2">
              {instances?.slice(0, 3).map((instance, index) => (
                <div key={instance.id} className="text-sm bg-gray-50 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {instance.name || `Instance ${index + 1}`}
                    </span>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded">
                      {instance.provider} • {instance.region}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    Status: {instance.status}
                  </div>
                </div>
              ))}
              {instances?.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-2">
                  +{instances.length - 3} more instances
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={pollTransactionStatus}
              disabled={isPolling}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
              {isPolling ? 'Checking...' : 'Check Status'}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {paymentStatus === 'pending' && payment?.payment_url && (
              <button
                onClick={handlePayNow}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay Now
                <ExternalLink className="w-4 h-4 ml-2" />
              </button>
            )}

            {paymentStatus === 'completed' && (
              <button
                onClick={() => window.location.href = '/admin-dashboard/instances'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                View Instances
              </button>
            )}

            {(paymentStatus === 'failed' || paymentStatus === 'expired') && (
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {paymentStatus === 'pending' && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-700">
          <p className="flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            After completing payment, your instances will be automatically provisioned. 
            This page will update automatically, or you can click "Check Status" to refresh.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentSummary;