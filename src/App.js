import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, query, where, addDoc, getDocs, updateDoc, arrayUnion, increment } from 'firebase/firestore';

// Contexto para Firebase y autenticación
const FirebaseContext = createContext(null);

// Componente proveedor de Firebase
const FirebaseProvider = ({ children }) => {
    const [app, setApp] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loadingFirebase, setLoadingFirebase] = useState(true);
    const [appId, setAppId] = useState(null); // appId ahora es parte del estado del proveedor

    useEffect(() => {
        let firebaseConfig = {};
        let initialAuthToken = null;
        let currentAppId = 'default-app-id';

        // FIX: Acceder a las variables globales a través de window y solo si window está definido.
        // Añadir supresiones de ESLint para evitar 'no-undef' durante la compilación.
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-undef
            currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // eslint-disable-next-line no-undef
            firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
                // Configuración de Firebase real (REEMPLAZA CON LA TUYA)
                apiKey: "AIzaSyBNqUyW6ayNujKbHBRBpBX_BozCBb3WjE0",
                authDomain: "pasaportepanamaapp.firebaseapp.com",
                projectId: "pasaportepanamaapp",
                storageBucket: "pasaportepanamaapp.firebasestorage.app",
                messagingSenderId: "114145620624",
                appId: "1:114145620624:web:81814d8cfffa7a5091de15",
                measurementId: "G-E38Z66B96R"
            };
            // eslint-disable-next-line no-undef
            initialAuthToken = typeof __initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;
        } else {
            // Si window no está definido (ej. durante la compilación en el servidor), usar la configuración predeterminada
            firebaseConfig = {
                apiKey: "AIzaSyBNqUyW6ayNujKbHBRBpBX_BozCBb3WjE0",
                authDomain: "pasaportepanamaapp.firebaseapp.com",
                projectId: "pasaportepanamaapp",
                storageBucket: "pasaportepanamaapp.firebasestorage.app",
                messagingSenderId: "114145620624",
                appId: "1:114145620624:web:81814d8cfffa7a5091de15",
                measurementId: "G-E38Z66B96R"
            };
        }
        
        setAppId(currentAppId); // Se establece el appId en el estado

        const firebaseApp = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(firebaseApp);
        const firebaseAuth = getAuth(firebaseApp);

        setApp(firebaseApp);
        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setLoadingFirebase(false);
            } else {
                try {
                    if (initialAuthToken && initialAuthToken.length > 0) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                } catch (error) {
                    console.error("Error signing in:", error);
                    setLoadingFirebase(false);
                }
            }
        });

        return () => unsubscribe();
    }, []); // Dependencias vacías para que se ejecute solo una vez al montar

    // Se pasa el appId a los componentes hijos para construir las rutas de Firestore
    return (
        <FirebaseContext.Provider value={{ app, db, auth, userId, loadingFirebase, appId }}>
            {children}
        </FirebaseContext.Provider>
    );
};

// Hook para usar el contexto de Firebase
const useFirebase = () => useContext(FirebaseContext);

// Componente para el encabezado de la aplicación
const Header = ({ onNavigate, userId }) => {
    return (
        <header className="bg-gradient-to-r from-blue-700 to-cyan-700 text-white p-4 shadow-lg rounded-b-xl">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center flex-wrap">
                <h1 className="text-3xl font-bold font-inter cursor-pointer mb-3 md:mb-0 text-center md:text-left" onClick={() => onNavigate('home')}>
                    🇵🇦 Pasaporte Virtual Panamá
                </h1>
                <nav className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-4 text-sm md:text-base">
                    <button
                        onClick={() => onNavigate('home')}
                        className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md"
                    >
                        Lugares
                    </button>
                    <button
                        onClick={() => onNavigate('myPassport')}
                        className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md"
                    >
                        Mi Pasaporte
                    </button>
                    <button
                        onClick={() => onNavigate('submitPlace')}
                        className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md"
                    >
                        Solicitar Lugar
                    </button>
                    <button
                        onClick={() => onNavigate('leaderboard')}
                        className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md"
                    >
                        Ranking
                    </button>
                    <button
                        onClick={() => onNavigate('groupTrips')}
                        className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md"
                    >
                        Viajes en Grupo
                    </button>
                    <button
                        onClick={() => onNavigate('createTour')}
                        className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md"
                    >
                        Crear Tour
                    </button>
                    <button
                        onClick={() => onNavigate('toursList')}
                        className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md"
                    >
                        Ver Tours
                    </button>
                </nav>
            </div>
            {userId && (
                <div className="text-center text-sm mt-3">
                    ID de Usuario: <span className="font-mono bg-blue-800 px-2 py-1 rounded-md break-all">{userId}</span>
                </div>
            )}
        </header>
    );
};

// Componente para mostrar mensajes de alerta personalizados
const CustomAlertDialog = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto text-center transform scale-100 animate-fade-in">
                <p className="text-lg text-gray-800 mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300 font-medium shadow-md"
                >
                    Entendido
                </button>
            </div>
        </div>
    );
};

// Componente para renderizar estrellas
const StarRating = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <svg
                key={i}
                className={`w-5 h-5 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
            </svg>
        );
    }
    return <div className="flex">{stars}</div>;
};

// Nuevo componente para la entrada de estrellas clicable
const ClickableStarRating = ({ rating, setRating, maxStars = 5 }) => {
    return (
        <div className="flex">
            {[...Array(maxStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <svg
                        key={starValue}
                        className={`w-6 h-6 cursor-pointer ${
                            starValue <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        onClick={() => setRating(starValue)}
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                    </svg>
                );
            })}
        </div>
    );
};


// Componente para la lista de lugares
const PlaceList = ({ onSelectPlace }) => {
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) { // Asegurarse de que appId esté disponible
            return;
        }

        const placesCollectionRef = collection(db, `artifacts/${appId}/public/data/places`);

        const unsubscribe = onSnapshot(placesCollectionRef, (snapshot) => {
            const fetchedPlaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlaces(fetchedPlaces);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching places:", err);
            setError("No se pudieron cargar los lugares. Inténtalo de nuevo más tarde.");
            setLoading(false);
        });

        // Add initial dummy data if the collection is empty
        const checkAndAddDummyData = async () => {
            const querySnapshot = await getDocs(placesCollectionRef);
            if (querySnapshot.empty) {
                const dummyPlaces = [
                    {
                        name: "Canal de Panamá",
                        description: "Observa los gigantes barcos transitar por las esclusas de Miraflores, una maravilla de la ingeniería moderna.",
                        imageUrl: "https://images.unsplash.com/photo-1596701859666-4171631486d3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        galleryImages: [
                            "https://placehold.co/800x600/007bff/ffffff?text=Canal+1",
                            "https://placehold.co/800x600/007bff/ffffff?text=Canal+2",
                            "https://placehold.co/800x600/007bff/ffffff?text=Canal+3"
                        ],
                        stampImageUrl: "https://placehold.co/100x100/A0A0A0/FFFFFF?text=CANAL%0APTY&font=inter&font-size=20&bold=true&shape=hexagon&border=2&border-color=A0A0A0", // Grey Hexagon
                        activities: [
                            "Observar el tránsito de barcos",
                            "Visitar el museo y el cine",
                            "Disfrutar de las exhibiciones interactivas"
                        ],
                        howToGetThere: "Se puede llegar en taxi, autobús o tour desde la Ciudad de Panamá. Ubicado a unos 20 minutos del centro.",
                        latitude: 8.9904,
                        longitude: -79.5746,
                        difficulty: 1, // 1: Fácil, 2: Moderado, 3: Difícil
                        popularity: 5
                    },
                    {
                        name: "Casco Antiguo",
                        description: "Explora las calles empedradas, la arquitectura colonial y los vibrantes cafés y restaurantes del centro histórico de la Ciudad de Panamá.",
                        imageUrl: "https://images.unsplash.com/photo-1623867664366-2d334e3a479a?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        galleryImages: [
                            "https://placehold.co/800x600/28a745/ffffff?text=Casco+1",
                            "https://placehold.co/800x600/28a745/ffffff?text=Casco+2",
                            "https://placehold.co/800x600/28a745/ffffff?text=Casco+3"
                        ],
                        stampImageUrl: "https://placehold.co/100x100/FF6B6B/FFFFFF?text=CASCO%0APTY&font=inter&font-size=20&bold=true&shape=circle&border=2&border-color=FF6B6B", // Red Circle
                        activities: [
                            "Pasear por las plazas históricas",
                            "Visitar iglesias y museos",
                            "Disfrutar de la gastronomía local y la vida nocturna"
                        ],
                        howToGetThere: "Fácilmente accesible en taxi, Uber o autobús. Es recomendable caminar una vez dentro.",
                        latitude: 8.9500,
                        longitude: -79.5333,
                        difficulty: 2,
                        popularity: 4
                    },
                    {
                        name: "Parque Natural Metropolitano",
                        description: "Un oasis de selva tropical dentro de la ciudad, hogar de una rica biodiversidad y senderos para caminar con vistas panorámicas.",
                        imageUrl: "https://images.unsplash.com/photo-1589182372005-f5b244747192?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        galleryImages: [
                            "https://placehold.co/800x600/ffc107/000000?text=Parque+1",
                            "https://placehold.co/800x600/ffc107/000000?text=Parque+2",
                            "https://placehold.co/800x600/ffc107/000000?text=Parque+3"
                        ],
                        stampImageUrl: "https://placehold.co/100x100/4CAF50/FFFFFF?text=PARQUE%0APTY&font=inter&font-size=20&bold=true&shape=square&border=2&border-color=4CAF50", // Green Square
                        activities: [
                            "Caminatas por los senderos",
                            "Observación de aves y vida silvestre (monos, perezosos)",
                            "Disfrutar de las vistas de la ciudad y el Canal"
                        ],
                        howToGetThere: "Ubicado cerca de la Vía Ricardo J. Alfaro, accesible en taxi o autobús.",
                        latitude: 8.9950,
                        longitude: -79.5580,
                        difficulty: 2,
                        popularity: 3
                    },
                    {
                        name: "Biomuseo",
                        description: "Un museo de historia natural diseñado por Frank Gehry que narra la historia del istmo de Panamá y su impacto en la biodiversidad mundial.",
                        imageUrl: "https://images.unsplash.com/photo-1628170295624-9b5f5f1f7b7f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        galleryImages: [
                            "https://placehold.co/800x600/dc3545/ffffff?text=Biomuseo+1",
                            "https://placehold.co/800x600/dc3545/ffffff?text=Biomuseo+2",
                            "https://placehold.co/800x600/dc3545/ffffff?text=Biomuseo+3"
                        ],
                        stampImageUrl: "https://placehold.co/100x100/2196F3/FFFFFF?text=BIOMUSEO%0APTY&font=inter&font-size=18&bold=true&shape=pentagon&border=2&border-color=2196F3", // Blue Pentagon
                        activities: [
                            "Explorar las ocho galerías permanentes",
                            "Aprender sobre la formación del istmo",
                            "Disfrutar de la arquitectura del edificio y las vistas de la Calzada de Amador"
                        ],
                        howToGetThere: "Situado en la Calzada de Amador, accesible en taxi o autobús.",
                        latitude: 8.9288,
                        longitude: -79.5303,
                        difficulty: 1,
                        popularity: 4
                    },
                    {
                        name: "Cerro Ancón",
                        description: "El punto más alto de la Ciudad de Panamá, ofreciendo vistas espectaculares del Canal, el Casco Antiguo y el horizonte de la ciudad.",
                        imageUrl: "https://images.unsplash.com/photo-1596701859666-4171631486d3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Reusing image for demo
                        galleryImages: [
                            "https://placehold.co/800x600/6c757d/ffffff?text=Ancon+1",
                            "https://placehold.co/800x600/6c757d/ffffff?text=Ancon+2",
                            "https://placehold.co/800x600/6c757d/ffffff?text=Ancon+3"
                        ],
                        stampImageUrl: "https://placehold.co/100x100/FFC107/000000?text=ANCON%0APTY&font=inter&font-size=20&bold=true&shape=diamond&border=2&border-color=FFC107", // Yellow Diamond
                        activities: [
                            "Caminata o subida en coche hasta la cima",
                            "Disfrutar de las vistas panorámicas",
                            "Observar la fauna local"
                        ],
                        howToGetThere: "Se puede acceder en coche o taxi. No hay transporte público directo hasta la cima.",
                        latitude: 8.9600,
                        longitude: -79.5500,
                        difficulty: 3,
                        popularity: 2
                    },
                    {
                        name: "Valle de Antón",
                        description: "Un pueblo pintoresco ubicado en el cráter de un volcán extinto, conocido por sus mercados, cascadas y senderos.",
                        imageUrl: "https://images.unsplash.com/photo-1577741369524-2c2b3e4f7e2d?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        galleryImages: [
                            "https://placehold.co/800x600/8c52ff/ffffff?text=Valle+1",
                            "https://placehold.co/800x600/8c52ff/ffffff?text=Valle+2",
                            "https://placehold.co/800x600/8c52ff/ffffff?text=Valle+3"
                        ],
                        stampImageUrl: "https://placehold.co/100x100/9C27B0/FFFFFF?text=VALLE%0APTY&font=inter&font-size=20&bold=true&shape=star&border=2&border-color=9C27B0", // Purple Star
                        activities: [
                            "Visitar el mercado de artesanías",
                            "Explorar la cascada El Chorro Macho",
                            "Senderismo y observación de aves"
                        ],
                        howToGetThere: "Aproximadamente 2 horas en coche desde la Ciudad de Panamá. Hay autobuses disponibles.",
                        latitude: 8.6000,
                        longitude: -80.1333,
                        difficulty: 2,
                        popularity: 4
                    }
                ];

                for (const place of dummyPlaces) {
                    await addDoc(placesCollectionRef, place);
                }
            }
        };

        checkAndAddDummyData();

        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]); // Añadir appId como dependencia

    const getDifficultyText = (level) => {
        switch (level) {
            case 1: return "Fácil";
            case 2: return "Moderado";
            case 3: return "Difícil";
            default: return "N/A";
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Explora Panamá</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {places.map(place => (
                    <div
                        key={place.id}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
                        onClick={() => onSelectPlace(place)}
                    >
                        {/* Image as background for the card */}
                        <div className="w-full h-48 bg-cover bg-center rounded-t-xl relative"
                             style={{ backgroundImage: `url(${place.imageUrl})` }}
                             onError={(e) => { e.target.onerror = null; e.target.style.backgroundImage = `url(https://placehold.co/600x400/ccc/000?text=${encodeURIComponent(place.name)})`; }}>
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end p-4">
                                <h3 className="text-2xl font-bold text-white drop-shadow-lg">{place.name}</h3>
                            </div>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-600 text-sm line-clamp-3 mb-3">{place.description}</p>
                            <div className="flex justify-between items-center text-gray-700 text-sm mb-4">
                                <div className="flex items-center">
                                    <StarRating rating={place.popularity || 0} />
                                    <span className="ml-1 text-gray-600">({place.popularity || 'N/A'})</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    <span>{getDifficultyText(place.difficulty)}</span>
                                </div>
                            </div>
                            <button
                                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-medium shadow-md"
                            >
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente para los detalles de un lugar
const PlaceDetail = ({ place, onBack, setAlertMessage }) => { // Recibir setAlertMessage como prop
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [isStamped, setIsStamped] = useState(false);
    const [loadingStamp, setLoadingStamp] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [difficultyRating, setDifficultyRating] = useState(0); // Changed to 0 for initial state
    const [experienceRating, setExperienceRating] = useState(0); // Changed to 0 for initial state
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId || !place) { // Asegurarse de que appId esté disponible
            return;
        }

        const visitsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/visits`);
        const q = query(visitsCollectionRef, where("placeId", "==", place.id));

        const unsubscribeVisits = onSnapshot(q, (snapshot) => {
            setIsStamped(!snapshot.empty);
            setLoadingStamp(false);
        }, (err) => {
            console.error("Error checking stamp status:", err);
            setLoadingStamp(false);
        });

        // Fetch comments for this place
        const commentsCollectionRef = collection(db, `artifacts/${appId}/public/data/placeComments/${place.id}/comments`);
        const unsubscribeComments = onSnapshot(query(commentsCollectionRef), (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedComments.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate()); // Sort by newest first
            setComments(fetchedComments);
            setLoadingComments(false);
        }, (err) => {
            console.error("Error fetching comments:", err);
            setLoadingComments(false);
        });


        return () => {
            unsubscribeVisits();
            unsubscribeComments();
        };
    }, [db, loadingFirebase, userId, appId, place]); // Añadir appId como dependencia

    const handleStampClick = async () => {
        if (!db || !userId || !place || !appId) return; // Asegurarse de que appId esté disponible

        setLoadingStamp(true);
        try {
            const visitsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/visits`);
            await addDoc(visitsCollectionRef, {
                placeId: place.id,
                placeName: place.name,
                visitDate: new Date(),
                stampImageUrl: place.stampImageUrl || "https://placehold.co/100x100/ccc/000?text=Sello", // Use unique stamp image
            });

            // 2. Update user's public visit count for leaderboard
            const userStatsDocRef = doc(db, `artifacts/${appId}/public/data/userStats`, userId);
            await setDoc(userStatsDocRef, {
                userId: userId,
                stampedPlacesCount: increment(1),
                lastVisitDate: new Date()
            }, { merge: true }); // Use merge: true to update or create if not exists

            setIsStamped(true);
            setAlertMessage("¡Pasaporte sellado con éxito!");
        } catch (error) {
            console.error("Error stamping passport:", error);
            setAlertMessage("Error al sellar el pasaporte. Inténtalo de nuevo.");
        } finally {
            setLoadingStamp(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId || !place || commentText.trim() === '' || !appId) { // Asegurarse de que appId esté disponible
            setAlertMessage("El comentario no puede estar vacío.");
            return;
        }
        // No need for numeric validation here, as ClickableStarRating ensures valid range
        if (difficultyRating === 0 || experienceRating === 0) {
            setAlertMessage("Por favor, selecciona una calificación de dificultad y experiencia.");
            return;
        }

        try {
            const commentsCollectionRef = collection(db, `artifacts/${appId}/public/data/placeComments/${place.id}/comments`);
            await addDoc(commentsCollectionRef, {
                userId: userId,
                commentText: commentText,
                difficultyRating: difficultyRating,
                experienceRating: experienceRating,
                timestamp: new Date()
            });
            setCommentText('');
            setDifficultyRating(0);
            setExperienceRating(0);
            setAlertMessage("Comentario añadido con éxito.");
        } catch (error) {
            console.error("Error adding comment:", error);
            setAlertMessage("Error al añadir el comentario. Inténtalo de nuevo.");
        }
    };

    const getMapLink = (lat, lon, name) => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        const wazeUrl = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
        return { googleMapsUrl, wazeUrl };
    };

    const mapLinks = place ? getMapLink(place.latitude, place.longitude, place.name) : null;

    const handleSharePlace = async () => {
        const shareText = `¡Mira este increíble lugar en Panamá: ${place.name}! Explora sus actividades y cómo llegar en Pasaporte Virtual Panamá.`;
        const shareUrl = window.location.href; // Current URL of the place detail page

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Pasaporte Virtual Panamá: ${place.name}`,
                    text: shareText,
                    url: shareUrl,
                });
                console.log('Contenido compartido con éxito');
            } else {
                // Fallback for browsers that do not support Web Share API
                setAlertMessage(`Comparte este lugar: ${place.name}\n\n${shareText}\n\nEnlace: ${shareUrl}\n\n(Copia y pega este mensaje para compartir)`);
                // Optionally, copy to clipboard:
                // document.execCommand('copy'); // Use execCommand for clipboard due to iframe restrictions
            }
        } catch (error) {
            console.error('Error al compartir:', error);
            // Specifically handle NotAllowedError from browser permissions
            if (error.name === 'NotAllowedError') {
                setAlertMessage('Permiso denegado para compartir. Asegúrate de que tu navegador permita compartir contenido o copia el mensaje manualmente.');
            } else {
                setAlertMessage('Error al compartir el contenido. Inténtalo de nuevo.');
            }
        }
    };

    if (!place) {
        return <div className="text-center text-gray-600 mt-8">Selecciona un lugar para ver los detalles.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {/* setAlertMessage ahora se pasa como prop */}
            <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />
            <button
                onClick={onBack}
                className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 font-medium shadow-md flex items-center"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Volver a Lugares
            </button>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6">
                {/* Main Image and Gallery */}
                <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-full h-80 object-cover rounded-lg mb-6 shadow-md"
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/800x400/ccc/000?text=${encodeURIComponent(place.name)}`; }}
                />
                {place.galleryImages && place.galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {place.galleryImages.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`${place.name} - Galería ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-sm"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/300x200/eee/333?text=Imagen+${index + 1}`; }}
                            />
                        ))}
                    </div>
                )}

                <h2 className="text-5xl font-extrabold text-gray-900 mb-4">{place.name}</h2>
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">{place.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-3 flex items-center">
                            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                            Actividades y Tips
                        </h3>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            {place.activities.map((activity, index) => (
                                <li key={index}>{activity}</li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-3 flex items-center">
                            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0L6.343 16.657m10.607-10.607L13.414 3.1a1.998 1.998 0 00-2.828 0L6.343 6.657m10.607 10.607V20m0-3.343s-2.783-1.67-5.657-1.67C9.343 15 6.343 16.657 6.343 16.657V20M6.343 6.657V3m0 3.343s2.783 1.67 5.657 1.67C14.657 8.33 17.657 6.657 17.657 6.657V3"></path></svg>
                            Cómo Llegar
                        </h3>
                        <p className="text-gray-600 mb-3">{place.howToGetThere}</p>
                        {mapLinks && (
                            <div className="flex space-x-4 mt-2">
                                <a href={mapLinks.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                    <img src="https://www.google.com/s2/favicons?domain=maps.google.com&sz=32" alt="Google Maps icon" className="w-6 h-6 mr-1" />
                                    Google Maps
                                </a>
                                <a href={mapLinks.wazeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                    <img src="https://www.google.com/s2/favicons?domain=waze.com&sz=32" alt="Waze icon" className="w-6 h-6 mr-1" />
                                    Waze
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center flex flex-col sm:flex-row justify-center gap-4">
                    {loadingStamp ? (
                        <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="ml-3 text-blue-600">Verificando sello...</p>
                        </div>
                    ) : (
                        isStamped ? (
                            <div className="flex flex-col items-center justify-center">
                                <img src={place.stampImageUrl || "https://placehold.co/100x100/ccc/000?text=Sello"} alt="Sello digital" className="w-24 h-24 object-contain mb-2 shadow-lg" />
                                <p className="text-emerald-600 text-2xl font-bold">¡Pasaporte Sellado!</p>
                                <p className="text-gray-600 text-md">Ya visitaste este lugar.</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleStampClick}
                                className="px-8 py-4 bg-indigo-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                            >
                                Sellar Pasaporte
                            </button>
                        )
                    )}
                    <button
                        onClick={handleSharePlace}
                        className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    >
                        Compartir Lugar
                    </button>
                </div>

                {/* Comments Section */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Comentarios de Usuarios</h3>
                    <form onSubmit={handleCommentSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-3 resize-y"
                            rows="3"
                            placeholder="Añade tu comentario sobre este lugar..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        ></textarea>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Nivel de Dificultad</label>
                                <ClickableStarRating rating={difficultyRating} setRating={setDifficultyRating} maxStars={3} />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Calificación de Experiencia</label>
                                <ClickableStarRating rating={experienceRating} setRating={setExperienceRating} maxStars={5} />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition duration-300 shadow-md"
                        >
                            Publicar Comentario
                        </button>
                    </form>

                    {loadingComments ? (
                        <div className="flex justify-center items-center h-24">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            <p className="ml-3 text-gray-600">Cargando comentarios...</p>
                        </div>
                    ) : (
                        comments.length === 0 ? (
                            <p className="text-center text-gray-600">Sé el primero en comentar este lugar.</p>
                        ) : (
                            <div className="space-y-4">
                                {comments.map(comment => (
                                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                        <p className="text-gray-800 font-medium">{comment.commentText}</p>
                                        <div className="flex items-center space-x-4 mt-2 text-sm">
                                            {comment.difficultyRating !== null && (
                                                <div className="flex items-center">
                                                    <span className="text-gray-700 mr-1">Dificultad:</span>
                                                    <StarRating rating={comment.difficultyRating} />
                                                </div>
                                            )}
                                            {comment.experienceRating !== null && (
                                                <div className="flex items-center">
                                                    <span className="text-gray-700 mr-1">Experiencia:</span>
                                                    <StarRating rating={comment.experienceRating} />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">
                                            Por <span className="font-mono">{comment.userId}</span> el {new Date(comment.timestamp.toDate()).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente para "Mi Pasaporte"
const MyPassport = () => {
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) { // Asegurarse de que appId esté disponible
            return;
        }

        const visitsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/visits`);

        const unsubscribe = onSnapshot(visitsCollectionRef, (snapshot) => {
            const fetchedVisits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort visits by date, newest first
            fetchedVisits.sort((a, b) => b.visitDate.toDate() - a.visitDate.toDate());
            setVisits(fetchedVisits);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching visits:", err);
            setError("No se pudieron cargar tus visitas. Inténtalo de nuevo más tarde.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]); // Añadir appId como dependencia

    const handleDownloadPassport = () => {
        // This is a placeholder for the actual download functionality.
        // To implement this, you would typically use a library like 'html2canvas'
        // to capture a specific part of the DOM (e.g., a div containing all stamps)
        // and then trigger a download of the generated image.
        // Example:
        // import html2canvas from 'html2canvas';
        // html2canvas(document.querySelector("#passport-stamps-container")).then(canvas => {
        //     const link = document.createElement('a');
        //     link.download = 'mi_pasaporte_panama.png';
        //     link.href = canvas.toDataURL('image/png');
        //     link.click();
        // });
        setAlertMessage("La funcionalidad de descarga del pasaporte está en desarrollo. ¡Pronto podrás compartir tus sellos!");
    };

    if (loading || loadingFirebase) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-gray-700">Cargando tu pasaporte...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-rose-500 mt-8 text-lg">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-8 mt-4 text-center">Mi Pasaporte Sellado</h2>
            {visits.length === 0 ? (
                <div className="text-center text-gray-600 text-lg p-8 bg-white rounded-xl shadow-lg">
                    <p className="mb-4">¡Aún no has sellado ningún lugar!</p>
                    <p>Empieza a explorar y sella tu pasaporte.</p>
                </div>
            ) : (
                <>
                    <div id="passport-stamps-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {visits.map(visit => (
                            <div key={visit.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center space-y-3 transform hover:scale-105 transition-transform duration-300">
                                <img src={visit.stampImageUrl || "https://placehold.co/100x100/ccc/000?text=Sello"} alt={`Sello de ${visit.placeName}`} className="w-28 h-28 object-contain rounded-full shadow-md" />
                                <h3 className="text-xl font-semibold text-gray-900 text-center">{visit.placeName}</h3>
                                <p className="text-gray-600 text-sm">
                                    Visitado el: {new Date(visit.visitDate.toDate()).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <button
                            onClick={handleDownloadPassport}
                            className="px-8 py-4 bg-emerald-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-emerald-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                        >
                            Descargar Mi Pasaporte
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// Componente para solicitar añadir un lugar
const SubmitPlace = () => {
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        galleryImages: '', // Comma-separated URLs
        stampImageUrl: '',
        activities: '',
        howToGetThere: '',
        difficulty: '',
        popularity: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null); // FIX: setAlertMessage defined here

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId || !appId) { // Asegurarse de que appId esté disponible
            setAlertMessage("Error: No se pudo conectar con la base de datos.");
            return;
        }

        setSubmitting(true);
        try {
            const pendingPlacesCollectionRef = collection(db, `artifacts/${appId}/public/data/pendingPlaces`);

            await addDoc(pendingPlacesCollectionRef, { // FIX: Use pendingPlacesCollectionRef instead of pendingPlacesRef
                ...formData,
                activities: formData.activities.split(',').map(item => item.trim()).filter(item => item !== ''),
                galleryImages: formData.galleryImages.split(',').map(item => item.trim()).filter(item => item !== ''),
                popularity: parseInt(formData.popularity) || 0,
                difficulty: parseInt(formData.difficulty) || 0, // Ensure difficulty is stored as number
                submittedBy: userId,
                submissionDate: new Date(),
                status: 'pending' // For future admin review
            });
            setAlertMessage("¡Solicitud enviada con éxito! Gracias por tu contribución.");
            setFormData({
                name: '',
                description: '',
                imageUrl: '',
                galleryImages: '',
                stampImageUrl: '',
                activities: '',
                howToGetThere: '',
                difficulty: '',
                popularity: ''
            });
        } catch (error) {
            console.error("Error submitting place:", error);
            setAlertMessage("Error al enviar la solicitud. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingFirebase) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-gray-700">Cargando formulario...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {alertMessage && <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />}
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Solicitar Añadir un Lugar</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                <p className="text-gray-700 mb-6 text-center">
                    ¿Conoces un lugar increíble en Panamá que debería estar en nuestro pasaporte? ¡Cuéntanos!
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Nombre del Lugar</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-gray-700 font-medium mb-1">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="imageUrl" className="block text-gray-700 font-medium mb-1">URL de Imagen Principal</label>
                        <input
                            type="url"
                            id="imageUrl"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: https://ejemplo.com/imagen.jpg"
                        />
                    </div>
                    <div>
                        <label htmlFor="galleryImages" className="block text-gray-700 font-medium mb-1">URLs de Galería (separadas por coma)</label>
                        <textarea
                            id="galleryImages"
                            name="galleryImages"
                            value={formData.galleryImages}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: url1.jpg, url2.jpg"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="stampImageUrl" className="block text-gray-700 font-medium mb-1">URL de Imagen del Sello</label>
                        <input
                            type="url"
                            id="stampImageUrl"
                            name="stampImageUrl"
                            value={formData.stampImageUrl}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="activities" className="block text-gray-700 font-medium mb-1">Actividades y Tips (separados por coma)</label>
                        <textarea
                            id="activities"
                            name="activities"
                            value={formData.activities}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Observar barcos, Visitar museo, Disfrutar cine"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="howToGetThere" className="block text-gray-700 font-medium mb-1">Cómo Llegar</label>
                        <textarea
                            id="howToGetThere"
                            name="howToGetThere"
                            value={formData.howToGetThere}
                            onChange={handleChange}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="difficulty" className="block text-gray-700 font-medium mb-1">Dificultad (1-3: Fácil, Moderado, Difícil)</label>
                        <input
                            type="number"
                            id="difficulty"
                            name="difficulty"
                            value={formData.difficulty}
                            onChange={handleChange}
                            min="1"
                            max="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="popularity" className="block text-gray-700 font-medium mb-1">Popularidad (1-5)</label>
                        <input
                            type="number"
                            id="popularity"
                            name="popularity"
                            value={formData.popularity}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {submitting && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>}
                        {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Componente para el Ranking de Usuarios
const Leaderboard = () => {
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) { // Asegurarse de que appId esté disponible
            return;
        }

        const userStatsCollectionRef = collection(db, `artifacts/${appId}/public/data/userStats`);

        const unsubscribe = onSnapshot(userStatsCollectionRef, (snapshot) => {
            const fetchedStats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by stampedPlacesCount in descending order
            fetchedStats.sort((a, b) => b.stampedPlacesCount - a.stampedPlacesCount);
            setLeaderboardData(fetchedStats);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching leaderboard:", err);
            setError("No se pudo cargar el ranking. Inténtalo de nuevo más tarde.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]); // Añadir appId como dependencia

    if (loading || loadingFirebase) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-gray-700">Cargando ranking...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-rose-500 mt-8 text-lg">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Ranking de Exploradores</h2>
            {leaderboardData.length === 0 ? (
                <div className="text-center text-gray-600 text-lg p-8 bg-white rounded-xl shadow-lg">
                    <p>¡Nadie ha sellado lugares aún! Sé el primero en aparecer aquí.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Posición</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID de Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Lugares Visitados</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaderboardData.map((entry, index) => (
                                <tr key={entry.userId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono break-all">{entry.userId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.stampedPlacesCount || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Componente para Viajes en Grupo
const GroupTrips = () => {
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [trips, setTrips] = useState([]);
    const [newTripData, setNewTripData] = useState({
        placeName: '',
        date: '',
        time: '', // New field for time
        description: '',
        capacity: ''
    });
    const [submittingTrip, setSubmittingTrip] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null); // FIX: setAlertMessage defined here

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) { // Asegurarse de que appId esté disponible
            return;
        }

        const groupTripsCollectionRef = collection(db, `artifacts/${appId}/public/data/groupTrips`);

        const unsubscribe = onSnapshot(groupTripsCollectionRef, (snapshot) => {
            const fetchedTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrips(fetchedTrips);
        }, (err) => {
            console.error("Error fetching group trips:", err);
            setAlertMessage("No se pudieron cargar los viajes en grupo.");
        });

        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]); // Añadir appId como dependencia

    const handleNewTripChange = (e) => {
        const { name, value } = e.target;
        setNewTripData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateTrip = async (e) => {
        e.preventDefault();
        if (!db || !userId || !appId) { // Asegurarse de que appId esté disponible
            setAlertMessage("Error: No se pudo conectar con la base de datos.");
            return;
        }
        if (!newTripData.placeName || !newTripData.date || !newTripData.capacity || !newTripData.time) {
            setAlertMessage("Por favor, completa el nombre del lugar, la fecha, la hora y la capacidad del viaje.");
            return;
        }
        if (parseInt(newTripData.capacity) <= 0) {
            setAlertMessage("La capacidad debe ser un número positivo.");
            return;
        }

        setSubmittingTrip(true);
        try {
            const groupTripsCollectionRef = collection(db, `artifacts/${appId}/public/data/groupTrips`);

            await addDoc(groupTripsCollectionRef, {
                ...newTripData,
                date: new Date(`${newTripData.date}T${newTripData.time}`), // Combine date and time
                capacity: parseInt(newTripData.capacity),
                creatorId: userId,
                participants: [userId],
                createdAt: new Date()
            });
            setAlertMessage("¡Viaje en grupo creado con éxito!");
            setNewTripData({ placeName: '', date: '', time: '', description: '', capacity: '' });
        } catch (error) {
            console.error("Error creating group trip:", error);
            setAlertMessage("Error al crear el viaje en grupo. Inténtalo de nuevo.");
        } finally {
            setSubmittingTrip(false);
        }
    };

    const handleJoinTrip = async (tripId, currentParticipants, capacity) => {
        if (!db || !userId || !appId) { // Asegurarse de que appId esté disponible
            setAlertMessage("Error: No se pudo conectar con la base de datos.");
            return;
        }
        if (currentParticipants.includes(userId)) {
            setAlertMessage("Ya estás unido a este viaje.");
            return;
        }
        if (currentParticipants.length >= capacity) {
            setAlertMessage("Este viaje ya está lleno. No hay más espacios disponibles.");
            return;
        }

        try {
            const tripDocRef = doc(db, `artifacts/${appId}/public/data/groupTrips`, tripId);
            await updateDoc(tripDocRef, {
                participants: arrayUnion(userId)
            });
            setAlertMessage("¡Te has unido al viaje con éxito!");
        } catch (error) {
            console.error("Error joining trip:", error);
            setAlertMessage("Error al unirte al viaje. Inténtalo de nuevo.");
        }
    };

    const handleInviteToTrip = async (trip) => {
        const tripDateTime = new Date(trip.date.toDate()).toLocaleString('es-PA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const inviteMessage = `¡Hola! Te invito a unirte a mi viaje a ${trip.placeName} el ${tripDateTime} en Pasaporte Virtual Panamá. ¡Exploremos juntos!`;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Invitación a Viaje: ${trip.placeName}`,
                    text: inviteMessage,
                    url: window.location.href, // Current URL of the group trips page
                });
                console.log('Invitación compartida con éxito');
            } else {
                setAlertMessage(`¡Generando "boarding pass" para ${trip.placeName}!\n\nMensaje para compartir: "${inviteMessage}"\n\n(Esta es una simulación. La funcionalidad real de envío y generación de imagen requeriría más desarrollo.)`);
            }
        } catch (error) {
            console.error('Error al compartir invitación:', error);
            if (error.name === 'NotAllowedError') {
                setAlertMessage('Permiso denegado para compartir. Asegúrate de que tu navegador permita compartir contenido o copia el mensaje manualmente.');
            } else {
                setAlertMessage('Error al compartir la invitación. Inténtalo de nuevo.');
            }
        }
    };

    if (loadingFirebase) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-gray-700">Cargando viajes en grupo...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {alertMessage && <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />}
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Viajes en Grupo</h2>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Crea un Nuevo Viaje</h3>
                <form onSubmit={handleCreateTrip} className="space-y-4">
                    <div>
                        <label htmlFor="tripPlaceName" className="block text-gray-700 font-medium mb-1">Lugar del Viaje</label>
                        <input
                            type="text"
                            id="tripPlaceName"
                            name="placeName"
                            value={newTripData.placeName}
                            onChange={handleNewTripChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tripDate" className="block text-gray-700 font-medium mb-1">Fecha del Viaje</label>
                            <input
                                type="date"
                                id="tripDate"
                                name="date"
                                value={newTripData.date}
                                onChange={handleNewTripChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="tripTime" className="block text-gray-700 font-medium mb-1">Hora del Viaje</label>
                            <input
                                type="time"
                                id="tripTime"
                                name="time"
                                value={newTripData.time}
                                onChange={handleNewTripChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="tripCapacity" className="block text-gray-700 font-medium mb-1">Capacidad de Personas</label>
                        <input
                            type="number"
                            id="tripCapacity"
                            name="capacity"
                            value={newTripData.capacity}
                            onChange={handleNewTripChange}
                            min="1"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="tripDescription" className="block text-gray-700 font-medium mb-1">Descripción (Opcional)</label>
                        <textarea
                            id="tripDescription"
                            name="description"
                            value={newTripData.description}
                            onChange={handleNewTripChange}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={submittingTrip}
                        className="w-full bg-cyan-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-cyan-700 transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {submittingTrip && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>}
                        {submittingTrip ? 'Creando...' : 'Crear Viaje'}
                    </button>
                </form>
            </div>

            <h3 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Próximos Viajes</h3>
            {trips.length === 0 ? (
                <div className="text-center text-gray-600 text-lg p-8 bg-white rounded-xl shadow-lg">
                    <p>¡No hay viajes en grupo programados aún! Sé el primero en crear uno.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                            <div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-2">{trip.placeName}</h4>
                                <p className="text-gray-600 text-sm mb-1">
                                    Fecha: {new Date(trip.date.toDate()).toLocaleDateString()} Hora: {new Date(trip.date.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {trip.description && <p className="text-gray-700 text-md mb-3">{trip.description}</p>}
                                <p className="text-gray-500 text-xs mb-3">Creado por: <span className="font-mono break-all">{trip.creatorId}</span></p>
                                <div className="text-gray-700 text-sm mb-4">
                                    Participantes: {trip.participants ? trip.participants.length : 0} / {trip.capacity}
                                    <ul className="list-disc list-inside text-xs mt-1 max-h-20 overflow-y-auto">
                                        {trip.participants && trip.participants.map((p, i) => (
                                            <li key={i} className="font-mono break-all">{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-col space-y-2">
                                {trip.participants && trip.participants.includes(userId) ? (
                                    <p className="text-emerald-600 font-semibold text-center">¡Ya estás en este viaje!</p>
                                ) : (
                                    <button
                                        onClick={() => handleJoinTrip(trip.id, trip.participants || [], trip.capacity)}
                                        disabled={(trip.participants?.length >= trip.capacity)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        { (trip.participants?.length >= trip.capacity) ? 'Viaje Lleno' : 'Unirme a este viaje' }
                                    </button>
                                )}
                                <button
                                    onClick={() => handleInviteToTrip(trip)}
                                    className="w-full bg-indigo-500 text-white py-2 rounded-lg font-medium hover:bg-indigo-600 transition duration-300 shadow-md"
                                >
                                    Invitar (Boarding Pass)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Componente para Crear Tours
const CreateTour = ({ onNavigate, setAlertMessage }) => { // Recibir setAlertMessage como prop
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [tourName, setTourName] = useState('');
    const [tourDescription, setTourDescription] = useState('');
    const [allPlaces, setAllPlaces] = useState([]);
    const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) { // Asegurarse de que appId esté disponible
            return;
        }
        const placesCollectionRef = collection(db, `artifacts/${appId}/public/data/places`);
        const unsubscribe = onSnapshot(placesCollectionRef, (snapshot) => {
            setAllPlaces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]); // Añadir appId como dependencia

    const handlePlaceSelection = (placeId) => {
        setSelectedPlaceIds(prev =>
            prev.includes(placeId) ? prev.filter(id => id !== placeId) : [...prev, placeId]
        );
    };

    const handleSubmitTour = async (e) => {
        e.preventDefault();
        if (!db || !userId || !appId) { // Asegurarse de que appId esté disponible
            setAlertMessage("Error: No se pudo conectar con la base de datos.");
            return;
        }
        if (!tourName.trim() || selectedPlaceIds.length === 0) {
            setAlertMessage("Por favor, introduce un nombre para el tour y selecciona al menos un lugar.");
            return;
        }

        setSubmitting(true);
        try {
            const toursCollectionRef = collection(db, `artifacts/${appId}/public/data/tours`);
            await addDoc(toursCollectionRef, {
                name: tourName,
                description: tourDescription,
                places: selectedPlaceIds,
                isPlatformMade: false, // Community-made tour
                creatorId: userId,
                createdAt: new Date()
            });
            setAlertMessage("¡Tour creado con éxito!");
            setTourName('');
            setTourDescription('');
            setSelectedPlaceIds([]);
            onNavigate('toursList'); // Navigate to tours list after creation
        } catch (error) {
            console.error("Error creating tour:", error);
            setAlertMessage("Error al crear el tour. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingFirebase) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-gray-700">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {alertMessage && <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />}
            <button
                onClick={() => onNavigate('home')}
                className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 font-medium shadow-md flex items-center"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Volver
            </button>
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Crea Tu Propio Tour</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
                <form onSubmit={handleSubmitTour} className="space-y-4">
                    <div>
                        <label htmlFor="tourName" className="block text-gray-700 font-medium mb-1">Nombre del Tour</label>
                        <input
                            type="text"
                            id="tourName"
                            value={tourName}
                            onChange={(e) => setTourName(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="tourDescription" className="block text-gray-700 font-medium mb-1">Descripción del Tour (Opcional)</label>
                        <textarea
                            id="tourDescription"
                            value={tourDescription}
                            onChange={(e) => setTourDescription(e.target.value)}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">Selecciona Lugares para tu Tour:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                            {allPlaces.map(place => (
                                <div
                                    key={place.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition duration-200 ${
                                        selectedPlaceIds.includes(place.id) ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-300 bg-white hover:bg-gray-50'
                                    }`}
                                    onClick={() => handlePlaceSelection(place.id)}
                                >
                                    <h4 className="font-medium text-gray-900">{place.name}</h4>
                                    <p className="text-gray-600 text-sm line-clamp-1">{place.description}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-600 text-sm mt-2">Lugares seleccionados: {selectedPlaceIds.length}</p>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {submitting && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>}
                        {submitting ? 'Creando Tour...' : 'Crear Tour'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Componente para ver detalles de un Tour
const TourDetail = ({ tour, onBack, onNavigate, setAlertMessage }) => { // Recibir setAlertMessage como prop
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [placesInTour, setPlacesInTour] = useState([]);
    const [loadingPlaces, setLoadingPlaces] = useState(true);

    useEffect(() => {
        if (!db || loadingFirebase || !tour || !tour.places || !appId) { // Asegurarse de que appId esté disponible
            return;
        }
        const placesCollectionRef = collection(db, `artifacts/${appId}/public/data/places`);

        const fetchTourPlaces = async () => {
            const fetched = [];
            for (const placeId of tour.places) {
                const docRef = doc(placesCollectionRef, placeId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    fetched.push({ id: docSnap.id, ...docSnap.data() });
                }
            }
            setPlacesInTour(fetched);
            setLoadingPlaces(false);
        };

        fetchTourPlaces();
    }, [db, loadingFirebase, tour, appId]); // Añadir appId como dependencia

    const handleScheduleTour = async () => {
        if (!db || !userId || !tour || !appId) return; // Asegurarse de que appId esté disponible

        try {
            const scheduledToursCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/scheduledTours`);
            await addDoc(scheduledToursCollectionRef, {
                tourId: tour.id,
                tourName: tour.name,
                scheduledDate: new Date(), // Could add a date picker for scheduling
                places: tour.places,
                creatorId: tour.creatorId,
                isPlatformMade: tour.isPlatformMade
            });
            setAlertMessage(`¡Tour "${tour.name}" agendado con éxito!`);
        } catch (error) {
            console.error("Error scheduling tour:", error);
            setAlertMessage("Error al agendar el tour. Inténtalo de nuevo.");
        }
    };

    const handleGoToTour = () => {
        setAlertMessage(`¡Iniciando el tour "${tour.name}"!\n\n(Aquí se integraría la lógica para guiar al usuario a través de los lugares del tour, por ejemplo, abriendo mapas o mostrando el primer lugar.)`);
    };

    if (!tour) {
        return <div className="text-center text-gray-600 mt-8">Selecciona un tour para ver los detalles.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            {/* setAlertMessage ahora se pasa como prop */}
            <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />
            <button
                onClick={() => onNavigate('toursList')}
                className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 font-medium shadow-md flex items-center"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Volver a Tours
            </button>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{tour.name}</h2>
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">{tour.description}</p>
                <p className="text-gray-500 text-sm mb-6">
                    {tour.isPlatformMade ? 'Tour oficial de la plataforma' : `Creado por: ${tour.creatorId}`}
                </p>

                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Lugares en este Tour:</h3>
                {loadingPlaces ? (
                    <div className="flex justify-center items-center h-24">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="ml-3 text-gray-600">Cargando lugares del tour...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {placesInTour.map(place => (
                            <div key={place.id} className="bg-gray-50 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                                <img src={place.imageUrl} alt={place.name} className="w-16 h-16 object-cover rounded-lg" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/64x64/ccc/000?text=${encodeURIComponent(place.name.substring(0,2))}`; }} />
                                <div>
                                    <h4 className="font-semibold text-gray-900">{place.name}</h4>
                                    <p className="text-gray-600 text-sm line-clamp-2">{place.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={handleScheduleTour}
                        className="px-8 py-4 bg-emerald-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-emerald-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                    >
                        Agendar Tour
                    </button>
                    <button
                        onClick={handleGoToTour}
                        className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    >
                        Ir al Tour
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente para Listar Tours
const ToursList = ({ onNavigate }) => {
    const { db, loadingFirebase, userId, appId } = useFirebase(); // Obtener appId del contexto
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [placesMap, setPlacesMap] = useState({}); // To map place IDs to names

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) { // Asegurarse de que appId esté disponible
            return;
        }

        const toursCollectionRef = collection(db, `artifacts/${appId}/public/data/tours`);
        const placesCollectionRef = collection(db, `artifacts/${appId}/public/data/places`);

        // Fetch all places to build a map for display
        const fetchPlaces = async () => {
            const snapshot = await getDocs(placesCollectionRef);
            const map = {};
            snapshot.docs.forEach(doc => {
                map[doc.id] = doc.data().name;
            });
            setPlacesMap(map);
        };
        fetchPlaces();

        const unsubscribe = onSnapshot(toursCollectionRef, (snapshot) => {
            const fetchedTours = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTours(fetchedTours);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching tours:", err);
            setError("No se pudieron cargar los tours. Inténtalo de nuevo más tarde.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]); // Añadir appId como dependencia

    if (loading || loadingFirebase) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="ml-4 text-gray-700">Cargando tours...</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-rose-500 mt-8 text-lg">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <button
                onClick={() => onNavigate('home')}
                className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 font-medium shadow-md flex items-center"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Volver
            </button>
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Tours Disponibles</h2>
            {tours.length === 0 ? (
                <div className="text-center text-gray-600 text-lg p-8 bg-white rounded-xl shadow-lg">
                    <p>¡No hay tours creados aún! Sé el primero en crear uno.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map(tour => (
                        <div key={tour.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tour.name}</h3>
                                <p className="text-gray-700 text-md mb-3">{tour.description}</p>
                                <div className="text-gray-600 text-sm mb-2">
                                    Lugares en el tour:
                                    <ul className="list-disc list-inside text-xs mt-1">
                                        {tour.places && tour.places.map((placeId, index) => (
                                            <li key={index}>{placesMap[placeId] || 'Lugar Desconocido'}</li>
                                        ))}
                                    </ul>
                                </div>
                                <p className="text-gray-500 text-xs">
                                    {tour.isPlatformMade ? 'Creado por la plataforma' : `Creado por: ${tour.creatorId}`}
                                </p>
                            </div>
                            <button
                                onClick={() => onNavigate('tourDetail', tour)}
                                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition duration-300 shadow-md"
                            >
                                Ver Tour
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// Componente principal de la aplicación
const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [selectedTour, setSelectedTour] = useState(null); // New state for selected tour
    const [alertMessage, setAlertMessage] = useState(null); // Centralizar el estado de la alerta
    const { userId } = useFirebase(); // Get userId from context

    const navigateTo = (page, data = null) => {
        setCurrentPage(page);
        if (page === 'placeDetail') {
            setSelectedPlace(data);
            setSelectedTour(null);
        } else if (page === 'tourDetail') {
            setSelectedTour(data);
            setSelectedPlace(null);
        } else {
            setSelectedPlace(null);
            setSelectedTour(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-inter antialiased">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                /* Custom animation for alert dialog */
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                `}
            </style>
            <Header onNavigate={navigateTo} userId={userId} />

            <main className="py-8">
                {/* CustomAlertDialog se renderiza aquí para que esté disponible globalmente */}
                {alertMessage && <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />}

                {(() => {
                    switch (currentPage) {
                        case 'home':
                            return <PlaceList onSelectPlace={(place) => navigateTo('placeDetail', place)} />;
                        case 'placeDetail':
                            // Pasar setAlertMessage como prop
                            return <PlaceDetail place={selectedPlace} onBack={() => navigateTo('home')} setAlertMessage={setAlertMessage} />;
                        case 'myPassport':
                            return <MyPassport setAlertMessage={setAlertMessage} />; // Pasar setAlertMessage como prop
                        case 'submitPlace':
                            return <SubmitPlace setAlertMessage={setAlertMessage} />; // Pasar setAlertMessage como prop
                        case 'leaderboard':
                            return <Leaderboard />;
                        case 'groupTrips':
                            return <GroupTrips setAlertMessage={setAlertMessage} />; // Pasar setAlertMessage como prop
                        case 'createTour':
                            return <CreateTour onNavigate={navigateTo} setAlertMessage={setAlertMessage} />; // Pasar setAlertMessage como prop
                        case 'toursList':
                            return <ToursList onNavigate={navigateTo} />;
                        case 'tourDetail':
                            // Pasar setAlertMessage como prop
                            return <TourDetail tour={selectedTour} onNavigate={navigateTo} setAlertMessage={setAlertMessage} />;
                        default:
                            return <PlaceList onSelectPlace={(place) => navigateTo('placeDetail', place)} />;
                    }
                })()}
            </main>

            <footer className="bg-gray-800 text-white text-center p-4 mt-8 rounded-t-xl shadow-inner">
                <p>&copy; 2025 Pasaporte Virtual Panamá. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

// Envolver la aplicación con el proveedor de Firebase
export default function WrappedApp() {
    return (
        <FirebaseProvider>
            <App />
        </FirebaseProvider>
    );
}

