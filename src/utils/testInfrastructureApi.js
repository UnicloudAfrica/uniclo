// Utility to test the new infrastructure API endpoints
// This can be used in the browser console for testing

export const testInfrastructureApi = {
  // Test project infrastructure status
  async getProjectStatus(projectId, region = null) {
    const queryString = region ? `?region=${encodeURIComponent(region)}` : "";
    const url = `/admin/v1/project-infrastructure/${projectId}${queryString}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Infrastructure Status:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch infrastructure status:', error);
      throw error;
    }
  },

  // Test infrastructure overview
  async getInfrastructureOverview(region = null) {
    const queryString = region ? `?region=${encodeURIComponent(region)}` : "";
    const url = `/admin/v1/project-infrastructure${queryString}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Infrastructure Overview:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch infrastructure overview:', error);
      throw error;
    }
  },

  // Test component setup
  async setupComponent(projectId, component, config = {}) {
    const url = `/admin/v1/project-infrastructure`;
    
    const payload = {
      project_identifier: projectId,
      component: component,
      auto_configure: true,
      ...config,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`${component} setup result:`, data);
      return data;
    } catch (error) {
      console.error(`Failed to setup ${component}:`, error);
      throw error;
    }
  },

  // Quick test VPC setup
  async testVpcSetup(projectId, region = 'lagos-1') {
    return this.setupComponent(projectId, 'vpc', {
      region: region,
      name: `test-vpc-${Date.now()}`,
      cidr_block: '10.0.0.0/16',
    });
  },

  // Quick test Edge Networks setup  
  async testEdgeNetworksSetup(projectId, region = 'lagos-1') {
    return this.setupComponent(projectId, 'edge_networks', {
      region: region,
    });
  },
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.testInfraApi = testInfrastructureApi;
}

export default testInfrastructureApi;