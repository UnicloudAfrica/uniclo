import React from "react";
import DynamicDocPage from "@/docs/renderer/DynamicDocPage";
import { loadClientDoc } from "@/docs/config/clientDocs";

const ClientDocPage: React.FC = () => <DynamicDocPage loadDoc={loadClientDoc} scope="client" />;

export default ClientDocPage;
