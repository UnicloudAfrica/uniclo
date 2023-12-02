import { createContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const BlogContext = createContext();
export const PageContext = createContext();
export const EventsContext = createContext();
export const ResourcesContext = createContext();
export const SolutionsContext = createContext();
export const CasesContext = createContext();
export const PartnerContext = createContext();
export const BoardContext = createContext();
export const CareerContext = createContext();
export const GeneralContext = createContext();

// Custom hook to fetch data from Firestore
const useFirestoreData = (db, collectionName) => {
  const [dataArray, setDataArray] = useState([]);

  useEffect(() => {
    const colRef = collection(db, collectionName);
    const q = query(colRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.docs.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setDataArray(data);
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [db, collectionName]);

  return dataArray;
};

const ContextProvider = (props) => {
  
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth();
  const db = getFirestore(app);

  const [page, setPage] = useState('General');

  // Define your context values using the custom hook
  const blogArray = useFirestoreData(db, 'blog');
  const eventArray = useFirestoreData(db, 'events');
  const resourceArray = useFirestoreData(db, 'resources');
  const solutionArray = useFirestoreData(db, 'solutions');
  const caseArray = useFirestoreData(db, 'cases');
  const partnersArray = useFirestoreData(db, 'Partner');
  const boardArray = useFirestoreData(db, 'board');
  const careerArray = useFirestoreData(db, 'career');
  const [generalitem, setGeneralItem] = useState([])
  
  useEffect(()=>{
    const colRef = collection(db, 'general');
    const q = query(colRef)
    onSnapshot(q,(snapshot)=>{
      snapshot.docs.forEach((doc)=>{
          setGeneralItem(doc.data())
      })
    })
        
},[auth, db]);

  return (
    <>
      <PageContext.Provider value={[page, setPage]}>
        <EventsContext.Provider value={[eventArray]}>
          <ResourcesContext.Provider value={[resourceArray]}>
            <SolutionsContext.Provider value={[solutionArray]}>
              <CasesContext.Provider value={[caseArray]}>
                <PartnerContext.Provider value={[partnersArray]}>
                  <BoardContext.Provider value={[boardArray]}>
                    <CareerContext.Provider value={[careerArray]}>
                      <GeneralContext.Provider value={[generalitem, setGeneralItem]}>
                        <BlogContext.Provider value={[blogArray]}>
                          {props.children}
                        </BlogContext.Provider>
                      </GeneralContext.Provider>
                    </CareerContext.Provider>
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
