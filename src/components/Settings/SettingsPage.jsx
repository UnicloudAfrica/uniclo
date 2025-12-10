import React, { useState, useEffect } from "react";
import { Card, Row, Col, Menu, Button, message, Spin } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  CreditCardOutlined,
  BuildingOutlined,
  LinkOutlined,
  ServerOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  getAvailableSettings,
  getSettingNavigation,
  SETTINGS_API,
} from "../../config/settingsConfig";
import PersonalSettings from "./PersonalSettings";
import InterfaceSettings from "./InterfaceSettings";
import NotificationSettings from "./NotificationSettings";
import BillingSettings from "./BillingSettings";
import BusinessSettings from "./BusinessSettings";
import IntegrationSettings from "./IntegrationSettings";
import SystemSettings from "./SystemSettings";
import ReportingSettings from "./ReportingSettings";
import { useAuth } from "../../hooks/useAuth"; // Assuming you have this hook
import { apiCall } from "../../utils/api"; // Assuming you have this utility

const COMPONENT_MAP = {
  personal: PersonalSettings,
  interface: InterfaceSettings,
  notifications: NotificationSettings,
  billing: BillingSettings,
  business: BusinessSettings,
  integrations: IntegrationSettings,
  system: SystemSettings,
  reporting: ReportingSettings,
};

const ICON_MAP = {
  personal: UserOutlined,
  interface: SettingOutlined,
  notifications: BellOutlined,
  billing: CreditCardOutlined,
  business: BuildingOutlined,
  integrations: LinkOutlined,
  system: ServerOutlined,
  reporting: BarChartOutlined,
};

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeKey, setActiveKey] = useState("personal");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const userRole = user?.role?.toUpperCase() || "CLIENT";
  const availableSettings = getAvailableSettings(userRole);
  const navigation = getSettingNavigation(userRole);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiCall("GET", SETTINGS_API.profile);
      if (response.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      message.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (category, key, value) => {
    try {
      setSaving(true);
      const response = await apiCall("PUT", SETTINGS_API.profile, {
        category,
        key,
        value,
      });

      if (response.success) {
        setSettings((prev) => ({
          ...prev,
          [category]: {
            ...prev[category],
            [key]: value,
          },
        }));
        message.success("Setting updated successfully");
      }
    } catch (error) {
      message.error("Failed to update setting");
    } finally {
      setSaving(false);
    }
  };

  const updateMultipleSettings = async (updates) => {
    try {
      setSaving(true);
      const response = await apiCall("PUT", `${SETTINGS_API.profile}/batch`, {
        settings: updates,
      });

      if (response.success) {
        const newSettings = { ...settings };
        updates.forEach(({ category, key, value }) => {
          if (!newSettings[category]) newSettings[category] = {};
          newSettings[category][key] = value;
        });
        setSettings(newSettings);
        message.success("Settings updated successfully");
      }
    } catch (error) {
      message.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const resetCategorySettings = async (category) => {
    try {
      setSaving(true);
      const response = await apiCall("POST", SETTINGS_API.reset, { category });

      if (response.success) {
        await loadSettings();
        message.success("Settings reset successfully");
      }
    } catch (error) {
      message.error("Failed to reset settings");
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = async () => {
    try {
      const response = await apiCall("GET", SETTINGS_API.export);
      if (response.success) {
        const blob = new Blob([JSON.stringify(response.data.settings, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `settings-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message.success("Settings exported successfully");
      }
    } catch (error) {
      message.error("Failed to export settings");
    }
  };

  const menuItems = navigation.map(({ key, path }) => {
    const config = availableSettings[key];
    const IconComponent = ICON_MAP[key];

    return {
      key,
      icon: IconComponent ? <IconComponent /> : null,
      label: config?.label || key,
    };
  });

  const ActiveComponent = COMPONENT_MAP[activeKey];
  const activeConfig = availableSettings[activeKey];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Row>
        <Col span={6}>
          <Card style={{ margin: "24px", minHeight: "calc(100vh - 48px)" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2>Settings</h2>
              <p style={{ color: "#666", fontSize: "14px" }}>
                Manage your {userRole.toLowerCase()} preferences
              </p>
            </div>

            <Menu
              mode="vertical"
              selectedKeys={[activeKey]}
              items={menuItems}
              onClick={({ key }) => setActiveKey(key)}
              style={{ border: "none" }}
            />

            <div style={{ marginTop: "24px", borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
              <Button
                type="link"
                size="small"
                onClick={exportSettings}
                style={{ padding: 0, color: "#666" }}
              >
                Export Settings
              </Button>
            </div>
          </Card>
        </Col>

        <Col span={18}>
          <Card style={{ margin: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2>{activeConfig?.label}</h2>
              <p style={{ color: "#666", marginBottom: "24px" }}>{activeConfig?.description}</p>
            </div>

            {ActiveComponent && (
              <ActiveComponent
                settings={settings[activeKey] || {}}
                onUpdate={(key, value) => updateSetting(activeKey, key, value)}
                onBatchUpdate={(updates) => {
                  const formattedUpdates = updates.map(({ key, value }) => ({
                    category: activeKey,
                    key,
                    value,
                  }));
                  updateMultipleSettings(formattedUpdates);
                }}
                onReset={() => resetCategorySettings(activeKey)}
                loading={saving}
                userRole={userRole}
              />
            )}

            {!ActiveComponent && (
              <div style={{ textAlign: "center", padding: "50px 0", color: "#999" }}>
                <h3>Coming Soon</h3>
                <p>This settings section is under development.</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SettingsPage;
