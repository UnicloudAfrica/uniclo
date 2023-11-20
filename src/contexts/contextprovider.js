import { createContext, useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, onSnapshot} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


export const BlogContext = createContext();
export const PageContext = createContext();

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
const db = getFirestore(app)
// State for news data.
const [page, setPage] = useState('Blog');

const[blogArray, setBlogArray] = useState([
    {
      title: "",
      desc: "",
      date: "",
      content: "",
      url: "url"
    }
])

useEffect(() => {
  const colRef = collection(db, 'blog');
  const q = query(colRef, orderBy("date", "desc"));
  onSnapshot(q, (snapshot) => {
    const blog = [];
    snapshot.docs.forEach((doc) => {
      blog.push({ id: doc.id, ...doc.data() });
    });
    setBlogArray(blog);
  });
}, [page, db]);


    return ( 
        <>
        <PageContext.Provider value={[page, setPage]}>
          <BlogContext.Provider value={[blogArray, setBlogArray]}>
              {props.children}
          </BlogContext.Provider>
        </PageContext.Provider>
        </>
     );
}
 
export default ContextProvider;