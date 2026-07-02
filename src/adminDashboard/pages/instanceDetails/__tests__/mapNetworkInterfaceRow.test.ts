import { describe, it, expect } from "vitest";

import { mapNetworkInterfaceRow } from "../instanceDetailsUtils";

describe("mapNetworkInterfaceRow", () => {
  it("reads all eight fields from a backend flat_addresses NIC", () => {
    const nic = {
      addr: "172.31.0.168",
      mac_addr: "fa:16:3e:aa:bb:cc",
      dns_name: "web-1.internal",
      device_index: 0,
      port_id: "port-123",
      security_groups: ["default"],
      subnet_name: "private-subnet",
      cidr: "172.31.0.0/20",
    };

    const row = mapNetworkInterfaceRow(nic);

    expect(row.ip).toBe("172.31.0.168");
    expect(row.mac).toBe("fa:16:3e:aa:bb:cc");
    expect(row.subnet).toBe("private-subnet");
    expect(row.cidr).toBe("172.31.0.0/20");
    expect(row.dnsName).toBe("web-1.internal");
    expect(row.deviceIndex).toBe(0);
    expect(row.portId).toBe("port-123");
  });

  it("falls back to OpenStack-style aliases", () => {
    const row = mapNetworkInterfaceRow({
      ip_address: "10.0.0.5",
      "OS-EXT-IPS-MAC:mac_addr": "de:ad:be:ef:00:01",
      network_name: "net-a",
      network_id: "net-1",
    });

    expect(row.ip).toBe("10.0.0.5");
    expect(row.mac).toBe("de:ad:be:ef:00:01");
    expect(row.subnet).toBe("net-a");
    expect(row.portId).toBe("net-1");
  });

  it("leaves missing fields undefined", () => {
    const row = mapNetworkInterfaceRow({ addr: "1.2.3.4" });
    expect(row.ip).toBe("1.2.3.4");
    expect(row.mac).toBeUndefined();
    expect(row.subnet).toBeUndefined();
    expect(row.cidr).toBeUndefined();
    expect(row.dnsName).toBeUndefined();
  });
});
