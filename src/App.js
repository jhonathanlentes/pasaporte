import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, query, where, addDoc, getDocs, updateDoc, arrayUnion, increment } from 'firebase/firestore';

// --- Firebase Context ---
// This context provides Firebase instances (app, db, auth) and user data to all components.
const FirebaseContext = createContext(null);

// --- Firebase Provider Component ---
// Initializes Firebase and handles user authentication state.
const FirebaseProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loadingFirebase, setLoadingFirebase] = useState(true);
    const [appId, setAppId] = useState(null);

    useEffect(() => {
        // These variables are expected to be globally available in the execution environment.
        // eslint-disable-next-line no-undef
        const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        // eslint-disable-next-line no-undef
        const firebaseConfig = typeof __firebase_config !== 'undefined' 
            ? JSON.parse(__firebase_config)
            : {
                // Fallback config for local development
                apiKey: "AIzaSyBNqUyW6ayNujKbHBRBpBX_BozCBb3WjE0",
                authDomain: "pasaportepanamaapp.firebaseapp.com",
                projectId: "pasaportepanamaapp",
                storageBucket: "pasaportepanamaapp.appspot.com",
                messagingSenderId: "114145620624",
                appId: "1:114145620624:web:81814d8cfffa7a5091de15",
                measurementId: "G-E38Z66B96R"
            };
        // eslint-disable-next-line no-undef
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        setAppId(currentAppId);

        // Initialize Firebase services
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setLoadingFirebase(false);
            } else {
                // If no user, sign in anonymously or with a custom token if available
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                } catch (error) {
                    console.error("Error during sign-in:", error);
                    setLoadingFirebase(false);
                }
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <FirebaseContext.Provider value={{ db, auth, userId, loadingFirebase, appId }}>
            {children}
        </FirebaseContext.Provider>
    );
};

// Custom hook to easily access Firebase context
const useFirebase = () => useContext(FirebaseContext);


// --- UI Components ---

// Header Component
const Header = ({ onNavigate, userId }) => {
    return (
        <header className="bg-gradient-to-r from-blue-700 to-cyan-500 text-white p-4 shadow-lg rounded-b-xl sticky top-0 z-40">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center flex-wrap">
                <h1 className="text-3xl font-bold font-inter cursor-pointer mb-3 md:mb-0 text-center md:text-left" onClick={() => onNavigate('home')}>
                    🇵🇦 Pasaporte Virtual Panamá
                </h1>
                <nav className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-4 text-sm md:text-base">
                    <button onClick={() => onNavigate('home')} className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 font-semibold">Lugares</button>
                    <button onClick={() => onNavigate('myPassport')} className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 font-semibold">Mi Pasaporte</button>
                    <button onClick={() => onNavigate('submitPlace')} className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 font-semibold">Solicitar Lugar</button>
                    <button onClick={() => onNavigate('leaderboard')} className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 font-semibold">Ranking</button>
                    <button onClick={() => onNavigate('groupTrips')} className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 font-semibold">Viajes</button>
                    <button onClick={() => onNavigate('toursList')} className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 font-semibold">Tours</button>
                </nav>
            </div>
            {userId && (
                <div className="text-center text-xs mt-3 opacity-80">
                    ID de Usuario: <span className="font-mono bg-black/20 px-2 py-1 rounded-md break-all">{userId}</span>
                </div>
            )}
        </header>
    );
};

// Generic Modal Component
const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full text-center transform scale-100" onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

// Custom Alert Dialog Component
const CustomAlertDialog = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <Modal onClose={onClose}>
             <p className="text-lg text-gray-800 mb-6">{message}</p>
             <button onClick={onClose} className="px-8 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300 font-medium shadow-md">
                 Entendido
             </button>
        </Modal>
    );
};

// Star Rating Display Component
const StarRating = ({ rating, maxStars = 5 }) => (
    <div className="flex">
        {[...Array(maxStars)].map((_, i) => (
            <svg key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

// Clickable Star Rating Input Component
const ClickableStarRating = ({ rating, setRating, maxStars = 5 }) => (
    <div className="flex">
        {[...Array(maxStars)].map((_, index) => {
            const starValue = index + 1;
            return (
                <svg key={starValue} className={`w-7 h-7 cursor-pointer transition-transform hover:scale-110 ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20" onClick={() => setRating(starValue)}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
            );
        })}
    </div>
);

// --- Page Components ---

// PlaceList Component (Home Page)
const PlaceList = ({ onSelectPlace }) => {
    const { db, appId } = useFirebase();
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('all');

    useEffect(() => {
        if (!db || !appId) return;
        const placesCollectionRef = collection(db, `artifacts/${appId}/public/data/places`);
        
        const unsubscribe = onSnapshot(placesCollectionRef, async (snapshot) => {
             if (snapshot.empty) {
                // If the collection is empty, add dummy data
                const dummyPlaces = [
                    { name: "Canal de Panamá", description: "Observa los gigantes barcos transitar por las esclusas de Miraflores.", imageUrl: "https://picsum.photos/800/600?random=1", galleryImages: ["https://picsum.photos/800/600?random=2", "https://picsum.photos/800/600?random=3"], stampImageUrl: "https://placehold.co/150x150/007BFF/FFFFFF?text=Canal%0APTY&font=Inter&shape=hexagon", activities: ["Observar el tránsito de barcos", "Visitar el museo y el cine"], howToGetThere: "Se puede llegar en taxi o tour desde la Ciudad de Panamá.", latitude: 8.9904, longitude: -79.5746, difficulty: 1, popularity: 5 },
                    { name: "Casco Antiguo", description: "Explora las calles empedradas y la arquitectura colonial del centro histórico.", imageUrl: "https://picsum.photos/800/600?random=4", galleryImages: ["https://picsum.photos/800/600?random=5", "https://picsum.photos/800/600?random=6"], stampImageUrl: "https://placehold.co/150x150/FF6B6B/FFFFFF?text=Casco%0APTY&font=Inter&shape=circle", activities: ["Pasear por las plazas históricas", "Visitar iglesias y museos"], howToGetThere: "Fácilmente accesible en taxi o Uber.", latitude: 8.9500, longitude: -79.5333, difficulty: 2, popularity: 4 },
                    { name: "Parque Natural Metropolitano", description: "Un oasis de selva tropical dentro de la ciudad, hogar de una rica biodiversidad.", imageUrl: "https://picsum.photos/800/600?random=7", galleryImages: ["https://picsum.photos/800/600?random=8", "https://picsum.photos/800/600?random=9"], stampImageUrl: "https://placehold.co/150x150/4CAF50/FFFFFF?text=Parque%0APTY&font=Inter&shape=square", activities: ["Caminatas por los senderos", "Observación de aves y vida silvestre"], howToGetThere: "Ubicado cerca de la Vía Ricardo J. Alfaro.", latitude: 8.9950, longitude: -79.5580, difficulty: 2, popularity: 3 },
                    { name: "Biomuseo", description: "Un museo de historia natural diseñado por Frank Gehry que narra la historia del istmo.", imageUrl: "https://picsum.photos/800/600?random=10", galleryImages: ["https://picsum.photos/800/600?random=11", "https://picsum.photos/800/600?random=12"], stampImageUrl: "https://placehold.co/150x150/2196F3/FFFFFF?text=Biomuseo%0APTY&font=Inter&shape=pentagon", activities: ["Explorar las ocho galerías permanentes", "Disfrutar de la arquitectura"], howToGetThere: "Situado en la Calzada de Amador.", latitude: 8.9288, longitude: -79.5303, difficulty: 1, popularity: 4 },
                    { name: "Cerro Ancón", description: "El punto más alto de la Ciudad de Panamá, ofreciendo vistas espectaculares.", imageUrl: "https://picsum.photos/800/600?random=13", galleryImages: ["https://picsum.photos/800/600?random=14", "https://picsum.photos/800/600?random=15"], stampImageUrl: "https://placehold.co/150x150/FFC107/000000?text=Ancón%0APTY&font=Inter&shape=diamond", activities: ["Caminata hasta la cima", "Disfrutar de las vistas panorámicas"], howToGetThere: "Se puede acceder en coche o taxi.", latitude: 8.9600, longitude: -79.5500, difficulty: 3, popularity: 2 },
                    { name: "Valle de Antón", description: "Un pueblo pintoresco en el cráter de un volcán, conocido por sus mercados y cascadas.", imageUrl: "https://picsum.photos/800/600?random=16", galleryImages: ["https://picsum.photos/800/600?random=17", "https://picsum.photos/800/600?random=18"], stampImageUrl: "https://placehold.co/150x150/9C27B0/FFFFFF?text=Valle%0APTY&font=Inter&shape=star", activities: ["Visitar el mercado de artesanías", "Explorar la cascada El Chorro Macho"], howToGetThere: "Aproximadamente 2 horas en coche desde la Ciudad de Panamá.", latitude: 8.6000, longitude: -80.1333, difficulty: 2, popularity: 4 }
                ];
                for (const place of dummyPlaces) { await addDoc(placesCollectionRef, place); }
            }
            const fetchedPlaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlaces(fetchedPlaces);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    const filteredPlaces = useMemo(() => {
        return places
            .filter(place => place.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(place => difficultyFilter === 'all' || place.difficulty === parseInt(difficultyFilter));
    }, [places, searchTerm, difficultyFilter]);

    const getDifficultyText = (level) => ({ 1: "Fácil", 2: "Moderado", 3: "Difícil" }[level] || "N/A");

    if (loading) return <div className="text-center p-10">Cargando lugares...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-4 mt-4">Explora Panamá</h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">Descubre los tesoros escondidos y los lugares más icónicos de Panamá, filtrados a tu gusto.</p>
            
            <div className="mb-10 p-4 bg-white rounded-xl shadow-md flex flex-col sm:flex-row gap-4 items-center">
                <input type="text" placeholder="Buscar por nombre..." className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <div className="w-full sm:w-1/2">
                    <label htmlFor="difficulty" className="sr-only">Filtrar por dificultad</label>
                    <select id="difficulty" className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
                        <option value="all">Toda Dificultad</option>
                        <option value="1">Fácil</option>
                        <option value="2">Moderado</option>
                        <option value="3">Difícil</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPlaces.map(place => (
                    <div key={place.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group" onClick={() => onSelectPlace(place)}>
                        <div className="w-full h-56 bg-cover bg-center rounded-t-xl relative overflow-hidden">
                             <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = `https://picsum.photos/600/400`; }}/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white drop-shadow-lg">{place.name}</h3>
                        </div>
                        <div className="p-5">
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{place.description}</p>
                            <div className="flex justify-between items-center text-gray-700 text-sm">
                                <div className="flex items-center gap-1"><StarRating rating={place.popularity || 0} /><span className="text-gray-500">({place.popularity || 'N/A'})</span></div>
                                <div className="flex items-center gap-1 font-medium"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg><span>{getDifficultyText(place.difficulty)}</span></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PlaceDetail = ({ place, onBack, setAlertMessage }) => {
    const { db, userId, appId } = useFirebase();
    const [isStamped, setIsStamped] = useState(false);
    const [loadingStamp, setLoadingStamp] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [difficultyRating, setDifficultyRating] = useState(0);
    const [experienceRating, setExperienceRating] = useState(0);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);

    useEffect(() => {
        if (!db || !userId || !appId || !place) return;

        const visitsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/visits`), where("placeId", "==", place.id));
        const unsubscribeVisits = onSnapshot(visitsQuery, (snapshot) => {
            setIsStamped(!snapshot.empty);
            setLoadingStamp(false);
        });

        const commentsRef = collection(db, `artifacts/${appId}/public/data/placeComments/${place.id}/comments`);
        const unsubscribeComments = onSnapshot(query(commentsRef), (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedComments.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setComments(fetchedComments);
            setLoadingComments(false);
        });

        return () => {
            unsubscribeVisits();
            unsubscribeComments();
        };
    }, [db, userId, appId, place]);
    
    const averageRatings = useMemo(() => {
        if (comments.length === 0) return { difficulty: 0, experience: 0 };
        const totalDifficulty = comments.reduce((acc, c) => acc + c.difficultyRating, 0);
        const totalExperience = comments.reduce((acc, c) => acc + c.experienceRating, 0);
        return {
            difficulty: totalDifficulty / comments.length,
            experience: totalExperience / comments.length
        };
    }, [comments]);


    const handleStampClick = async () => {
        if (!db || !userId || !place || !appId) return;
        setLoadingStamp(true);
        try {
            await addDoc(collection(db, `artifacts/${appId}/users/${userId}/visits`), {
                placeId: place.id,
                placeName: place.name,
                visitDate: new Date(),
                stampImageUrl: place.stampImageUrl,
            });
            const userStatsRef = doc(db, `artifacts/${appId}/public/data/userStats`, userId);
            await setDoc(userStatsRef, { stampedPlacesCount: increment(1), userId }, { merge: true });
            setAlertMessage("¡Pasaporte sellado con éxito!");
        } catch (error) {
            console.error("Error stamping passport:", error);
            setAlertMessage("Error al sellar el pasaporte.");
        } finally {
            setLoadingStamp(false);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || difficultyRating === 0 || experienceRating === 0) {
            setAlertMessage("Por favor, completa tu comentario y ambas calificaciones.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/placeComments/${place.id}/comments`), {
                userId,
                commentText,
                difficultyRating,
                experienceRating,
                timestamp: new Date()
            });
            setCommentText('');
            setDifficultyRating(0);
            setExperienceRating(0);
            setAlertMessage("Comentario añadido con éxito.");
        } catch (error) {
            console.error("Error adding comment:", error);
            setAlertMessage("Error al añadir el comentario.");
        }
    };

    const handleSharePlace = async () => {
        const shareText = `¡Mira este increíble lugar en Panamá: ${place.name}! Explora más en Pasaporte Virtual Panamá.`;
        const shareUrl = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: `Pasaporte Virtual Panamá: ${place.name}`, text: shareText, url: shareUrl });
            } else {
                navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                setAlertMessage("¡Enlace copiado al portapapeles!");
            }
        } catch (error) {
            console.error('Error al compartir:', error);
            setAlertMessage('No se pudo compartir el contenido.');
        }
    };

    const getMapLink = (lat, lon) => ({
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
        wazeUrl: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`,
    });

    const mapLinks = place ? getMapLink(place.latitude, place.longitude) : null;

    if (!place) return <div className="text-center p-10">Selecciona un lugar para ver detalles.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <button onClick={onBack} className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 font-medium shadow-md flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Volver a Lugares
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">{place.name}</h1>
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>
                    <span className="font-bold">{averageRatings.experience.toFixed(1)}</span>
                    <span>({comments.length} opiniones)</span>
                </div>
                <span>·</span>
                <span>{place.name}</span>
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 rounded-2xl overflow-hidden h-96">
                <div className="col-span-2 row-span-2">
                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover cursor-pointer" onError={(e) => { e.target.src = `https://picsum.photos/1200/800`; }}/>
                </div>
                {place.galleryImages?.slice(0, 2).map((img, index) => (
                    <div key={index} className="col-span-1 row-span-1">
                        <img src={img} alt={`${place.name} ${index+1}`} className="w-full h-full object-cover cursor-pointer" onError={(e) => { e.target.src = `https://picsum.photos/600/400`; }}/>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
                <div className="lg:col-span-2">
                    <p className="text-gray-700 text-lg mb-8 leading-relaxed">{place.description}</p>
                    <div className="border-t border-gray-200 my-8"></div>
                    
                    {/* Activities Section */}
                    <h3 className="text-2xl font-semibold mb-4">Actividades y Tips</h3>
                    <div className="space-y-4">
                        {place.activities?.map((activity, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="bg-blue-100 p-2 rounded-lg"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></div>
                                <span>{activity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 my-8"></div>
                    
                    {/* Comments Section */}
                    <h3 className="text-2xl font-semibold mb-4">{comments.length} Opiniones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <div className="flex justify-between items-center mb-1"><span>Dificultad</span><span>{averageRatings.difficulty.toFixed(1)}</span></div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${(averageRatings.difficulty/3)*100}%`}}></div></div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1"><span>Experiencia</span><span>{averageRatings.experience.toFixed(1)}</span></div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${(averageRatings.experience/5)*100}%`}}></div></div>
                        </div>
                    </div>
                    
                    {/* Leave a comment Form */}
                    <div className="border-t border-gray-200 my-8"></div>
                     <h3 className="text-2xl font-semibold mb-4">Deja tu opinión</h3>
                     <form onSubmit={handleCommentSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <textarea className="w-full p-3 border rounded-lg mb-3" rows="3" placeholder="Añade tu comentario..." value={commentText} onChange={(e) => setCommentText(e.target.value)}></textarea>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <label className="block font-medium mb-1">Dificultad</label>
                                <ClickableStarRating rating={difficultyRating} setRating={setDifficultyRating} maxStars={3} />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Experiencia</label>
                                <ClickableStarRating rating={experienceRating} setRating={setExperienceRating} />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">Publicar</button>
                    </form>


                    <div className="space-y-6">
                        {comments.slice(0, 4).map(comment => (
                            <div key={comment.id}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{comment.userId.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <p className="font-semibold">{comment.userId.substring(0,8)}...</p>
                                        <p className="text-sm text-gray-500">{new Date(comment.timestamp.toDate()).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p>{comment.commentText}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sticky Action Box */}
                <div className="lg:col-span-1">
                    <div className="sticky top-28 p-6 bg-white rounded-2xl shadow-xl border">
                        <h3 className="text-xl font-bold mb-4">¿Listo para la aventura?</h3>
                        {loadingStamp ? <div className="text-center">Cargando...</div> : isStamped ? (
                            <div className="text-center">
                                <img src={place.stampImageUrl} alt="Sello digital" className="w-24 h-24 object-contain mb-2 mx-auto" />
                                <p className="text-emerald-600 font-bold">¡Ya tienes este sello!</p>
                            </div>
                        ) : (
                             <button onClick={handleStampClick} className="w-full px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-blue-700 transition">Sellar Pasaporte</button>
                        )}
                        <button onClick={handleSharePlace} className="w-full mt-4 px-8 py-3 bg-gray-200 text-gray-800 text-lg font-bold rounded-lg hover:bg-gray-300 transition">Compartir</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyPassport = ({ setAlertMessage }) => {
    const { db, userId, appId } = useFirebase();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !userId || !appId) return;
        const visitsRef = collection(db, `artifacts/${appId}/users/${userId}/visits`);
        const unsubscribe = onSnapshot(visitsRef, (snapshot) => {
            const fetchedVisits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedVisits.sort((a, b) => (b.visitDate?.toDate() || 0) - (a.visitDate?.toDate() || 0));
            setVisits(fetchedVisits);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, userId, appId]);

    const handleDownloadPassport = () => {
        setAlertMessage("La funcionalidad de descarga está en desarrollo.");
    };

    if (loading) return <div className="text-center p-10">Cargando tu pasaporte...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-center mb-8 mt-4">Mi Pasaporte Sellado</h2>
            {visits.length === 0 ? <p className="text-center">Aún no has sellado ningún lugar.</p> : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-8">
                        {visits.map(visit => (
                            <div key={visit.id} className="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center text-center">
                                <img src={visit.stampImageUrl} alt={`Sello de ${visit.placeName}`} className="w-28 h-28 object-contain mb-2" />
                                <h3 className="font-semibold">{visit.placeName}</h3>
                                <p className="text-sm text-gray-500">{new Date(visit.visitDate?.toDate()).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <button onClick={handleDownloadPassport} className="px-8 py-4 bg-emerald-600 text-white text-xl font-bold rounded-full shadow-lg">Descargar Pasaporte</button>
                    </div>
                </>
            )}
        </div>
    );
};

const SubmitPlace = ({ setAlertMessage, onNavigate }) => {
    const { db, userId, appId } = useFirebase();
    const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '', activities: '', howToGetThere: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId || !appId) {
            setAlertMessage("Error: No se pudo conectar.");
            return;
        }
        setSubmitting(true);
        try {
            const pendingPlacesRef = collection(db, `artifacts/${appId}/public/data/pendingPlaces`);
            await addDoc(pendingPlacesRef, {
                ...formData,
                activities: formData.activities.split(',').map(item => item.trim()).filter(Boolean),
                submittedBy: userId,
                submissionDate: new Date(),
                status: 'pending'
            });
            setAlertMessage("¡Solicitud enviada con éxito! Gracias.");
            onNavigate('home');
        } catch (error) {
            console.error("Error submitting place:", error);
            setAlertMessage("Error al enviar la solicitud.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Solicitar Añadir un Lugar</h2>
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Nombre del Lugar</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-gray-700 font-medium mb-1">Descripción</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows="4" className="w-full px-4 py-2 border rounded-lg"></textarea>
                    </div>
                    <div>
                        <label htmlFor="imageUrl" className="block text-gray-700 font-medium mb-1">URL de Imagen Principal</label>
                        <input type="url" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg" placeholder="https://ejemplo.com/imagen.jpg"/>
                    </div>
                     <div>
                        <label htmlFor="activities" className="block text-gray-700 font-medium mb-1">Actividades (separadas por coma)</label>
                        <textarea id="activities" name="activities" value={formData.activities} onChange={handleChange} rows="2" className="w-full px-4 py-2 border rounded-lg" placeholder="Observar barcos, Visitar museo..."></textarea>
                    </div>
                    <div>
                        <label htmlFor="howToGetThere" className="block text-gray-700 font-medium mb-1">Cómo Llegar</label>
                        <textarea id="howToGetThere" name="howToGetThere" value={formData.howToGetThere} onChange={handleChange} required rows="2" className="w-full px-4 py-2 border rounded-lg"></textarea>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50">
                        {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Leaderboard = () => {
    const { db, appId } = useFirebase();
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !appId) return;
        const userStatsRef = collection(db, `artifacts/${appId}/public/data/userStats`);
        const q = query(userStatsRef); 
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const stats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            stats.sort((a, b) => (b.stampedPlacesCount || 0) - (a.stampedPlacesCount || 0));
            setLeaderboardData(stats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, appId]);

    if (loading) return <div className="text-center p-10">Cargando ranking...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Ranking de Exploradores</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posición</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lugares Visitados</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leaderboardData.map((entry, index) => (
                            <tr key={entry.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">{entry.id.substring(0, 12)}...</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.stampedPlacesCount || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GroupTrips = ({ setAlertMessage }) => {
     const { db, userId, appId } = useFirebase();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTripData, setNewTripData] = useState({ placeName: '', date: '', time: '', description: '', capacity: '' });
    const [boardingPass, setBoardingPass] = useState(null);

    useEffect(() => {
        if (!db || !appId) return;
        const tripsRef = collection(db, `artifacts/${appId}/public/data/groupTrips`);
        const unsubscribe = onSnapshot(tripsRef, (snapshot) => {
            const fetchedTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrips(fetchedTrips);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    const handleNewTripChange = (e) => {
        const { name, value } = e.target;
        setNewTripData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateTrip = async (e) => {
        e.preventDefault();
        if (!newTripData.placeName || !newTripData.date || !newTripData.time || !newTripData.capacity) {
            setAlertMessage("Por favor completa todos los campos para crear el viaje.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/groupTrips`), {
                ...newTripData,
                capacity: parseInt(newTripData.capacity),
                creatorId: userId,
                participants: [userId],
                createdAt: new Date()
            });
            setAlertMessage("¡Viaje creado con éxito!");
            setNewTripData({ placeName: '', date: '', time: '', description: '', capacity: '' });
        } catch (error) {
            setAlertMessage("Error al crear el viaje.");
            console.error(error);
        }
    };
    
    const handleJoinTrip = async (tripId, participants, capacity) => {
        if (participants.includes(userId)) {
            setAlertMessage("Ya estás en este viaje.");
            return;
        }
        if (participants.length >= capacity) {
            setAlertMessage("Este viaje ya está lleno.");
            return;
        }
        try {
            const tripRef = doc(db, `artifacts/${appId}/public/data/groupTrips`, tripId);
            await updateDoc(tripRef, { participants: arrayUnion(userId) });
            setAlertMessage("¡Te has unido al viaje!");
        } catch (error) {
            setAlertMessage("Error al unirse al viaje.");
            console.error(error);
        }
    };
    
    const handleInviteToTrip = (trip) => {
        setBoardingPass(trip);
    };

    if (loading) return <div className="text-center p-10">Cargando viajes...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            {boardingPass && (
                <Modal onClose={() => setBoardingPass(null)}>
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-dashed border-blue-300 relative">
                        <div className="absolute top-4 right-4 text-blue-800 font-bold">BOARDING PASS</div>
                        <h3 className="text-2xl font-bold text-blue-800 mt-8">Invitación de Viaje</h3>
                        <p className="text-lg mt-2">Estás invitado a unirte a la aventura en:</p>
                        <p className="text-3xl font-extrabold text-blue-600 my-4">{boardingPass.placeName}</p>
                        <div className="flex justify-around text-center my-4">
                            <div>
                                <p className="text-sm text-gray-500">FECHA</p>
                                <p className="font-bold">{boardingPass.date}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">HORA</p>
                                <p className="font-bold">{boardingPass.time}</p>
                            </div>
                        </div>
                         <div className="border-t-2 border-dashed border-blue-300 my-4"></div>
                         <p className="text-sm text-gray-600">¡Comparte este pase para invitar a tus amigos!</p>
                    </div>
                </Modal>
            )}
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Viajes en Grupo</h2>
            <div className="bg-white rounded-xl shadow-lg p-8 mb-10 max-w-2xl mx-auto">
                 <h3 className="text-2xl font-semibold mb-4">Crear un Nuevo Viaje</h3>
                 <form onSubmit={handleCreateTrip} className="space-y-6">
                    <input type="text" name="placeName" value={newTripData.placeName} onChange={handleNewTripChange} placeholder="Nombre del Lugar" required className="w-full p-2 border rounded"/>
                    <div className="flex gap-4">
                        <input type="date" name="date" value={newTripData.date} onChange={handleNewTripChange} required className="w-full p-2 border rounded"/>
                        <input type="time" name="time" value={newTripData.time} onChange={handleNewTripChange} required className="w-full p-2 border rounded"/>
                    </div>
                    <input type="number" name="capacity" value={newTripData.capacity} onChange={handleNewTripChange} placeholder="Capacidad de personas" required min="1" className="w-full p-2 border rounded"/>
                    <textarea name="description" value={newTripData.description} onChange={handleNewTripChange} placeholder="Descripción (opcional)" className="w-full p-2 border rounded"></textarea>
                    <button type="submit" className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold">Crear Viaje</button>
                 </form>
            </div>
            
            <h3 className="text-3xl font-semibold text-center mb-6">Próximos Viajes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map(trip => (
                    <div key={trip.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
                        <div>
                            <h4 className="text-2xl font-bold mb-2">{trip.placeName}</h4>
                            <p className="text-sm text-gray-600">{trip.date} a las {trip.time}</p>
                            <p className="my-2">{trip.description}</p>
                            <p className="text-sm">Participantes: {trip.participants.length} / {trip.capacity}</p>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                             <button onClick={() => handleJoinTrip(trip.id, trip.participants, trip.capacity)} disabled={trip.participants.includes(userId) || trip.participants.length >= trip.capacity} className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400">
                                {trip.participants.includes(userId) ? 'Ya estás unido' : trip.participants.length >= trip.capacity ? 'Lleno' : 'Unirme'}
                             </button>
                             <button onClick={() => handleInviteToTrip(trip)} className="w-full bg-indigo-500 text-white py-2 rounded-lg">Invitar (Boarding Pass)</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CreateTour = ({ onNavigate, setAlertMessage }) => {
    const { db, userId, appId } = useFirebase();
    const [tourName, setTourName] = useState('');
    const [tourDescription, setTourDescription] = useState('');
    const [allPlaces, setAllPlaces] = useState([]);
    const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!db || !appId) return;
        const placesRef = collection(db, `artifacts/${appId}/public/data/places`);
        const unsubscribe = onSnapshot(placesRef, (snapshot) => {
            setAllPlaces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [db, appId]);

    const handlePlaceSelection = (placeId) => {
        setSelectedPlaceIds(prev =>
            prev.includes(placeId) ? prev.filter(id => id !== placeId) : [...prev, placeId]
        );
    };

    const handleSubmitTour = async (e) => {
        e.preventDefault();
        if (!tourName.trim() || selectedPlaceIds.length === 0) {
            setAlertMessage("Por favor, introduce un nombre y selecciona al menos un lugar.");
            return;
        }
        setSubmitting(true);
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/tours`), {
                name: tourName,
                description: tourDescription,
                places: selectedPlaceIds,
                creatorId: userId,
                createdAt: new Date()
            });
            setAlertMessage("¡Tour creado con éxito!");
            onNavigate('toursList');
        } catch (error) {
            setAlertMessage("Error al crear el tour.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Crea Tu Propio Tour</h2>
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
                <form onSubmit={handleSubmitTour} className="space-y-6">
                    <div>
                        <label htmlFor="tourName" className="block text-gray-700 font-medium mb-1">Nombre del Tour</label>
                        <input type="text" id="tourName" value={tourName} onChange={(e) => setTourName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg"/>
                    </div>
                    <div>
                        <label htmlFor="tourDescription" className="block text-gray-700 font-medium mb-1">Descripción (Opcional)</label>
                        <textarea id="tourDescription" value={tourDescription} onChange={(e) => setTourDescription(e.target.value)} rows="3" className="w-full px-4 py-2 border rounded-lg"></textarea>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-3">Selecciona Lugares:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto p-2 border rounded-lg">
                            {allPlaces.map(place => (
                                <div key={place.id} className={`p-3 rounded-lg border cursor-pointer ${selectedPlaceIds.includes(place.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`} onClick={() => handlePlaceSelection(place.id)}>
                                    <h4 className="font-medium">{place.name}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50">
                        {submitting ? 'Creando...' : 'Crear Tour'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ToursList = ({ onNavigate }) => {
    const { db, appId } = useFirebase();
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !appId) return;
        const toursRef = collection(db, `artifacts/${appId}/public/data/tours`);
        const unsubscribe = onSnapshot(toursRef, (snapshot) => {
            setTours(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    if (loading) return <div className="text-center p-10">Cargando tours...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-extrabold text-gray-800">Tours Disponibles</h2>
                <button onClick={() => onNavigate('createTour')} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700">Crear Tour</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map(tour => (
                    <div key={tour.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">{tour.name}</h3>
                            <p className="text-gray-600 mb-4">{tour.description}</p>
                            <p className="text-sm font-medium">Lugares: {tour.places.length}</p>
                        </div>
                        <button onClick={() => onNavigate('tourDetail', tour)} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg font-medium">Ver Tour</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TourDetail = ({ tour, onBack, setAlertMessage }) => {
    const { db, appId } = useFirebase();
    const [placesInTour, setPlacesInTour] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !appId || !tour?.places) return;
        const fetchPlaces = async () => {
            const placeDocs = await Promise.all(
                tour.places.map(id => getDoc(doc(db, `artifacts/${appId}/public/data/places`, id)))
            );
            setPlacesInTour(placeDocs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchPlaces();
    }, [db, appId, tour]);

    if (loading) return <div className="text-center p-10">Cargando detalles del tour...</div>;
    if (!tour) return <div className="text-center p-10">Tour no encontrado.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
             <button onClick={onBack} className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300">Volver a Tours</button>
            <div className="bg-white rounded-xl shadow-xl p-8">
                <h2 className="text-4xl font-extrabold mb-4">{tour.name}</h2>
                <p className="text-lg text-gray-600 mb-6">{tour.description}</p>
                <h3 className="text-2xl font-semibold mb-4">Lugares en este Tour:</h3>
                <div className="space-y-4">
                    {placesInTour.map((place, index) => (
                        <div key={place.id} className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                            <span className="text-xl font-bold text-blue-600">{index + 1}</span>
                            <img src={place.imageUrl} alt={place.name} className="w-16 h-16 object-cover rounded-md" />
                            <div>
                                <h4 className="font-semibold">{place.name}</h4>
                                <p className="text-sm text-gray-500">{place.description.substring(0, 50)}...</p>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="mt-8 text-center">
                     <button onClick={() => setAlertMessage("¡Tour iniciado! Sigue la ruta.")} className="px-8 py-4 bg-emerald-600 text-white text-xl font-bold rounded-full shadow-lg">Comenzar Tour</button>
                 </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
// Manages routing and global state like alerts.
const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [selectedTour, setSelectedTour] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null);
    const { userId, loadingFirebase } = useFirebase();

    const navigateTo = (page, data = null) => {
        window.scrollTo(0, 0); // Scroll to top on page change
        setCurrentPage(page);
        setSelectedPlace(page === 'placeDetail' ? data : null);
        setSelectedTour(page === 'tourDetail' ? data : null);
    };

    const renderPage = () => {
        if (loadingFirebase) {
            return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div></div>;
        }
        const pageComponents = {
            home: <PlaceList onSelectPlace={(place) => navigateTo('placeDetail', place)} />,
            placeDetail: <PlaceDetail place={selectedPlace} onBack={() => navigateTo('home')} setAlertMessage={setAlertMessage} />,
            myPassport: <MyPassport setAlertMessage={setAlertMessage} />,
            submitPlace: <SubmitPlace setAlertMessage={setAlertMessage} onNavigate={navigateTo} />,
            leaderboard: <Leaderboard />,
            groupTrips: <GroupTrips setAlertMessage={setAlertMessage} />,
            createTour: <CreateTour onNavigate={navigateTo} setAlertMessage={setAlertMessage} />,
            toursList: <ToursList onNavigate={navigateTo} />,
            tourDetail: <TourDetail tour={selectedTour} onBack={() => navigateTo('toursList')} setAlertMessage={setAlertMessage} />,
        };
        return pageComponents[currentPage] || pageComponents['home'];
    };

    return (
        <div className="min-h-screen bg-gray-50 font-inter antialiased">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.98); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
            `}</style>
            
            <Header onNavigate={navigateTo} userId={userId} />
            <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />
            <main className="py-8">{renderPage()}</main>
            <footer className="bg-gray-800 text-white text-center p-6 mt-12 rounded-t-xl">
                <p>&copy; ${new Date().getFullYear()} Pasaporte Virtual Panamá. Una nueva forma de explorar.</p>
            </footer>
        </div>
    );
};

// --- Entry Point ---
// Wraps the main App with the FirebaseProvider.
export default function WrappedApp() {
    return (
        <FirebaseProvider>
            <App />
        </FirebaseProvider>
    );
}