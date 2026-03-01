import React, { useState } from "react";
import {
  BlogContext,
  BoardContext,
  CareerContext,
  CasesContext,
  EventsContext,
  GeneralContext,
  ManageContext,
  PageContext,
  PartnerContext,
  ResourcesContext,
  SolutionsContext,
} from "./contextprovider";
import blogData from "../../content/blog.json";
import boardData from "../../content/board.json";
import careerData from "../../content/career.json";
import casesData from "../../content/cases.json";
import generalData from "../../content/general.json";
import manageData from "../../content/manage.json";
import partnerData from "../../content/Partner.json";
import resourcesData from "../../content/resources.json";
import solutionsData from "../../content/solutions.json";

const StaticMarketingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  type GeneralItem = Record<string, unknown>;
  type CollectionItem = Record<string, unknown> & { id?: string };
  const [page, setPage] = useState("General");
  const blogList = Array.isArray(blogData) ? blogData : [];
  const boardList = Array.isArray(boardData) ? boardData : [];
  const careerList = Array.isArray(careerData) ? careerData : [];
  const casesList = Array.isArray(casesData) ? casesData : [];
  const manageList = Array.isArray(manageData) ? manageData : [];
  const partnerList = Array.isArray(partnerData) ? partnerData : [];
  const resourcesList = Array.isArray(resourcesData) ? resourcesData : [];
  const solutionsList = Array.isArray(solutionsData) ? solutionsData : [];
  const generalItem: GeneralItem = Array.isArray(generalData)
    ? ((generalData[0] as GeneralItem | undefined) ?? {})
    : ((generalData as GeneralItem) ?? {});
  const [generalState, setGeneralState] = useState<GeneralItem>(generalItem);
  const emptyList: CollectionItem[] = [];

  return (
    <PageContext.Provider value={[page, setPage]}>
      <EventsContext.Provider value={[emptyList]}>
        <ResourcesContext.Provider value={[resourcesList]}>
          <SolutionsContext.Provider value={[solutionsList]}>
            <CasesContext.Provider value={[casesList]}>
              <PartnerContext.Provider value={[partnerList]}>
                <BoardContext.Provider value={[boardList]}>
                  <ManageContext.Provider value={[manageList]}>
                    <CareerContext.Provider value={[careerList]}>
                      <GeneralContext.Provider value={[generalState, setGeneralState]}>
                        <BlogContext.Provider value={[blogList]}>{children}</BlogContext.Provider>
                      </GeneralContext.Provider>
                    </CareerContext.Provider>
                  </ManageContext.Provider>
                </BoardContext.Provider>
              </PartnerContext.Provider>
            </CasesContext.Provider>
          </SolutionsContext.Provider>
        </ResourcesContext.Provider>
      </EventsContext.Provider>
    </PageContext.Provider>
  );
};

export default StaticMarketingProvider;
