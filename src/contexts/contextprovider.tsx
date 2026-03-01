import { createContext, useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, collection, query, onSnapshot } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import blogData from "../../content/blog.json";
import boardData from "../../content/board.json";
import careerData from "../../content/career.json";
import casesData from "../../content/cases.json";
import generalData from "../../content/general.json";
import manageData from "../../content/manage.json";
import partnerData from "../../content/Partner.json";
import resourcesData from "../../content/resources.json";
import solutionsData from "../../content/solutions.json";

type CollectionItem = Record<string, unknown> & {
  id?: string;
};

type CollectionContextValue = [CollectionItem[], Dispatch<SetStateAction<CollectionItem[]>>?];

type PageContextValue = [string, Dispatch<SetStateAction<string>>];

type GeneralItem = {
  logourl?: string;
  address?: string;
  email?: string;
  fb?: string;
  ig?: string;
  twitter?: string;
  whatsapp?: string;
  linkedin?: string;
  [key: string]: unknown;
};

type GeneralContextValue = [GeneralItem, Dispatch<SetStateAction<GeneralItem>>];

const emptyCollection: CollectionItem[] = [];
const noopSetter: Dispatch<SetStateAction<string>> = () => {};
const noopGeneralSetter: Dispatch<SetStateAction<GeneralItem>> = () => {};

export const BlogContext = createContext<CollectionContextValue>([emptyCollection]);
export const PageContext = createContext<PageContextValue>(["", noopSetter]);
export const EventsContext = createContext<CollectionContextValue>([emptyCollection]);
export const ResourcesContext = createContext<CollectionContextValue>([emptyCollection]);
export const SolutionsContext = createContext<CollectionContextValue>([emptyCollection]);
export const CasesContext = createContext<CollectionContextValue>([emptyCollection]);
export const PartnerContext = createContext<CollectionContextValue>([emptyCollection]);
export const BoardContext = createContext<CollectionContextValue>([emptyCollection]);
export const ManageContext = createContext<CollectionContextValue>([emptyCollection]);
export const CareerContext = createContext<CollectionContextValue>([emptyCollection]);
export const GeneralContext = createContext<GeneralContextValue>([{}, noopGeneralSetter]);

// Custom hook to fetch data from Firestore
const useFirestoreData = <T extends CollectionItem>(
  db: Firestore,
  collectionName: string,
  initialData: T[] = []
): T[] => {
  const [dataArray, setDataArray] = useState<T[]>(initialData);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const q = query(colRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: T[] = [];
      snapshot.docs.forEach((doc) => {
        data.push({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as T);
      });
      setDataArray(data);
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [db, collectionName]);

  return dataArray;
};

type ContextProviderProps = {
  children: ReactNode;
};

const ContextProvider = ({ children }: ContextProviderProps): JSX.Element => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [page, setPage] = useState("General");

  // Define your context values using the custom hook
  const blogArray = useFirestoreData<CollectionItem>(
    db,
    "blog",
    Array.isArray(blogData) ? (blogData as CollectionItem[]) : []
  );
  const eventArray = useFirestoreData<CollectionItem>(db, "events", []);
  const resourceArray = useFirestoreData(
    db,
    "resources",
    Array.isArray(resourcesData) ? (resourcesData as CollectionItem[]) : []
  );
  const solutionArray = useFirestoreData(
    db,
    "solutions",
    Array.isArray(solutionsData) ? (solutionsData as CollectionItem[]) : []
  );
  const caseArray = useFirestoreData<CollectionItem>(
    db,
    "cases",
    Array.isArray(casesData) ? (casesData as CollectionItem[]) : []
  );
  const partnersArray = useFirestoreData(
    db,
    "Partner",
    Array.isArray(partnerData) ? (partnerData as CollectionItem[]) : []
  );
  const boardArray = useFirestoreData<CollectionItem>(
    db,
    "board",
    Array.isArray(boardData) ? (boardData as CollectionItem[]) : []
  );
  const manageArray = useFirestoreData<CollectionItem>(
    db,
    "manage",
    Array.isArray(manageData) ? (manageData as CollectionItem[]) : []
  );
  const careerArray = useFirestoreData(
    db,
    "career",
    Array.isArray(careerData) ? (careerData as CollectionItem[]) : []
  );
  const initialGeneral =
    Array.isArray(generalData) && generalData.length > 0
      ? (generalData[0] as GeneralItem)
      : ((generalData as GeneralItem) ?? {});
  const [generalitem, setGeneralItem] = useState<GeneralItem>(initialGeneral);

  useEffect(() => {
    const colRef = collection(db, "general");
    const q = query(colRef);
    onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        setGeneralItem(doc.data() as GeneralItem);
      });
    });
  }, [auth, db]);

  return (
    <>
      <PageContext.Provider value={[page, setPage]}>
        <EventsContext.Provider value={[eventArray]}>
          <ResourcesContext.Provider value={[resourceArray]}>
            <SolutionsContext.Provider value={[solutionArray]}>
              <CasesContext.Provider value={[caseArray]}>
                <PartnerContext.Provider value={[partnersArray]}>
                  <BoardContext.Provider value={[boardArray]}>
                    <ManageContext.Provider value={[manageArray]}>
                      <CareerContext.Provider value={[careerArray]}>
                        <GeneralContext.Provider value={[generalitem, setGeneralItem]}>
                          <BlogContext.Provider value={[blogArray]}>
                            {children}
                          </BlogContext.Provider>
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
    </>
  );
};

export default ContextProvider;
