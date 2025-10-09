import React from "react";
import { Package, HardDrive, Network, Globe, Link } from "lucide-react";

const ProductSummaryStep = ({ pricingRequests, formData }) => {
  // Group items by product type
  const groupItemsByType = () => {
    const grouped = {
      compute: [],
      storage: [],
      network: [],
      other: []
    };

    pricingRequests.forEach((req, index) => {
      const item = {
        index,
        region: req.region,
        months: req.months,
        instances: req.number_of_instances,
        compute: req._display?.compute || 'Unknown Compute',
        os: req._display?.os || 'Unknown OS',
        storage: req._display?.storage || 'Unknown Storage',
        bandwidth: req.bandwidth_count > 0 ? `${req.bandwidth_count} units` : null,
        floatingIps: req.floating_ip_count > 0 ? `${req.floating_ip_count} IPs` : null,
      };

      // Compute instances
      grouped.compute.push({
        ...item,
        type: 'Compute Instance',
        details: `${item.instances}x ${item.compute} (${item.os}) - ${item.months} month(s)`,
        icon: Package
      });

      // Storage
      grouped.storage.push({
        ...item,
        type: 'Storage',
        details: `${item.instances}x ${item.storage} - ${item.months} month(s)`,
        icon: HardDrive
      });

      // Network resources
      if (item.bandwidth) {
        grouped.network.push({
          ...item,
          type: 'Bandwidth',
          details: `${item.bandwidth} - ${item.months} month(s)`,
          icon: Network
        });
      }

      if (item.floatingIps) {
        grouped.network.push({
          ...item,
          type: 'Floating IPs',
          details: `${item.floatingIps} - ${item.months} month(s)`,
          icon: Globe
        });
      }

      // Cross connect if present
      if (req.cross_connect_id) {
        grouped.other.push({
          ...item,
          type: 'Cross Connect',
          details: `Cross Connect - ${item.months} month(s)`,
          icon: Link
        });
      }
    });

    return grouped;
  };

  const groupedItems = groupItemsByType();

  const ProductTypeSection = ({ title, items, bgColor = "bg-gray-50" }) => {
    if (items.length === 0) return null;

    return (
      <div className={`${bgColor} p-4 rounded-lg mb-4`}>
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          {items[0]?.icon && <items[0].icon className="w-5 h-5 mr-2" />}
          {title} ({items.length} item{items.length !== 1 ? 's' : ''})
        </h4>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm text-gray-900">{item.type}</div>
                  <div className="text-sm text-gray-600">{item.details}</div>
                  <div className="text-xs text-gray-500 mt-1">Region: {item.region}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Product Summary</h3>
        <p className="text-sm text-gray-500 mt-1">
          Review your items grouped by product type before finalizing the quote.
        </p>
      </div>

      {/* Total discount preview */}
      {formData.apply_total_discount && formData.total_discount_value && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Total Order Discount Applied</h4>
          <div className="text-sm text-blue-700">
            <div>
              Type: {formData.total_discount_type === 'percent' ? 'Percentage' : 'Fixed Amount'}
            </div>
            <div>
              Value: {formData.total_discount_value}
              {formData.total_discount_type === 'percent' ? '%' : ''}
            </div>
            {formData.total_discount_label && (
              <div>Label: {formData.total_discount_label}</div>
            )}
          </div>
        </div>
      )}

      {/* Product type sections */}
      <ProductTypeSection
        title="Compute Resources"
        items={groupedItems.compute}
        bgColor="bg-blue-50"
      />
      
      <ProductTypeSection
        title="Storage Resources"
        items={groupedItems.storage}
        bgColor="bg-green-50"
      />
      
      <ProductTypeSection
        title="Network Resources"
        items={groupedItems.network}
        bgColor="bg-purple-50"
      />
      
      <ProductTypeSection
        title="Other Resources"
        items={groupedItems.other}
        bgColor="bg-orange-50"
      />

      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-600">Total Items</div>
            <div className="text-lg font-semibold text-gray-900">{pricingRequests.length}</div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Compute</div>
            <div className="text-lg font-semibold text-blue-600">{groupedItems.compute.length}</div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Storage</div>
            <div className="text-lg font-semibold text-green-600">{groupedItems.storage.length}</div>
          </div>
          <div>
            <div className="font-medium text-gray-600">Network</div>
            <div className="text-lg font-semibold text-purple-600">{groupedItems.network.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSummaryStep;