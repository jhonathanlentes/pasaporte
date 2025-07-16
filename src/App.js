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
    const [appId, setAppId] = useState(null);

    useEffect(() => {
        let firebaseConfig = {};
        let initialAuthToken = null;
        let currentAppId = 'default-app-id';

        if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-undef
            currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // eslint-disable-next-line no-undef
            firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
                apiKey: "AIzaSyBNqUyW6ayNujKbHBRBpBX_BozCBb3WjE0",
                authDomain: "pasaportepanamaapp.firebaseapp.com",
                projectId: "pasaportepanamaapp",
                storageBucket: "pasaportepanamaapp.appspot.com", // Corregido a .appspot.com
                messagingSenderId: "114145620624",
                appId: "1:114145620624:web:81814d8cfffa7a5091de15",
                measurementId: "G-E38Z66B96R"
            };
            // eslint-disable-next-line no-undef
            initialAuthToken = typeof __initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;
        } else {
            firebaseConfig = {
                apiKey: "AIzaSyBNqUyW6ayNujKbHBRBpBX_BozCBb3WjE0",
                authDomain: "pasaportepanamaapp.firebaseapp.com",
                projectId: "pasaportepanamaapp",
                storageBucket: "pasaportepanamaapp.appspot.com", // Corregido a .appspot.com
                messagingSenderId: "114145620624",
                appId: "1:114145620624:web:81814d8cfffa7a5091de15",
                measurementId: "G-E38Z66B96R"
            };
        }
        
        setAppId(currentAppId);

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
    }, []);

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
                    <button onClick={() => onNavigate('home')} className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md">Lugares</button>
                    <button onClick={() => onNavigate('myPassport')} className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md">Mi Pasaporte</button>
                    <button onClick={() => onNavigate('submitPlace')} className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md">Solicitar Lugar</button>
                    <button onClick={() => onNavigate('leaderboard')} className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md">Ranking</button>
                    <button onClick={() => onNavigate('groupTrips')} className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md">Viajes en Grupo</button>
                    <button onClick={() => onNavigate('createTour')} className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md">Crear Tour</button>
                    <button onClick={() => onNavigate('toursList')} className="px-4 py-2 rounded-full bg-white text-blue-700 hover:bg-blue-100 transition duration-300 font-semibold shadow-md">Ver Tours</button>
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
    if (!message) return null; // No renderizar si no hay mensaje
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto text-center transform scale-100 animate-fade-in">
                <p className="text-lg text-gray-800 mb-4">{message}</p>
                <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300 font-medium shadow-md">
                    Entendido
                </button>
            </div>
        </div>
    );
};

// Componente para renderizar estrellas
const StarRating = ({ rating, maxStars = 5 }) => {
    const stars = [];
    for (let i = 1; i <= maxStars; i++) {
        stars.push(
            <svg key={i} className={`w-5 h-5 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
            </svg>
        );
    }
    return <div className="flex">{stars}</div>;
};

// Componente para entrada de estrellas clicable
const ClickableStarRating = ({ rating, setRating, maxStars = 5 }) => {
    return (
        <div className="flex">
            {[...Array(maxStars)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <svg
                        key={starValue}
                        className={`w-6 h-6 cursor-pointer ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
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
    const { db, loadingFirebase, userId, appId } = useFirebase();
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) return;

        const placesCollectionRef = collection(db, `artifacts/${appId}/public/data/places`);
        const unsubscribe = onSnapshot(placesCollectionRef, (snapshot) => {
            const fetchedPlaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlaces(fetchedPlaces);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching places:", err);
            setError("No se pudieron cargar los lugares.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]);

    const getDifficultyText = (level) => ({ 1: "Fácil", 2: "Moderado", 3: "Difícil" }[level] || "N/A");

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Explora Panamá</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {places.map(place => (
                    <div key={place.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer transform hover:scale-105" onClick={() => onSelectPlace(place)}>
                        <div className="w-full h-48 bg-cover bg-center rounded-t-xl relative" style={{ backgroundImage: `url(${place.imageUrl})` }} onError={(e) => { e.target.style.backgroundImage = `url(https://placehold.co/600x400/ccc/000?text=${encodeURIComponent(place.name)})`; }}>
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
                                    <svg className="w-5 h-5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    <span>{getDifficultyText(place.difficulty)}</span>
                                </div>
                            </div>
                            <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-medium shadow-md">
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
const PlaceDetail = ({ place, onBack, setAlertMessage }) => {
    const { db, loadingFirebase, userId, appId } = useFirebase();
    const [isStamped, setIsStamped] = useState(false);
    const [loadingStamp, setLoadingStamp] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [difficultyRating, setDifficultyRating] = useState(0);
    const [experienceRating, setExperienceRating] = useState(0);
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(true);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId || !place) return;

        const visitsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/visits`);
        const q = query(visitsCollectionRef, where("placeId", "==", place.id));
        const unsubscribeVisits = onSnapshot(q, (snapshot) => {
            setIsStamped(!snapshot.empty);
            setLoadingStamp(false);
        });

        const commentsCollectionRef = collection(db, `artifacts/${appId}/public/data/placeComments/${place.id}/comments`);
        const unsubscribeComments = onSnapshot(query(commentsCollectionRef), (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedComments.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            setComments(fetchedComments);
            setLoadingComments(false);
        });

        return () => {
            unsubscribeVisits();
            unsubscribeComments();
        };
    }, [db, loadingFirebase, userId, appId, place]);

    const handleStampClick = async () => {
        if (!db || !userId || !place || !appId) return;
        setLoadingStamp(true);
        try {
            const visitsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/visits`);
            await addDoc(visitsCollectionRef, {
                placeId: place.id,
                placeName: place.name,
                visitDate: new Date(),
                stampImageUrl: place.stampImageUrl || "https://placehold.co/100x100/ccc/000?text=Sello",
            });

            const userStatsDocRef = doc(db, `artifacts/${appId}/public/data/userStats`, userId);
            await setDoc(userStatsDocRef, {
                userId: userId,
                stampedPlacesCount: increment(1),
                lastVisitDate: new Date()
            }, { merge: true });

            setIsStamped(true);
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
        if (!db || !userId || !place || !appId) return;
        if (commentText.trim() === '' || difficultyRating === 0 || experienceRating === 0) {
            setAlertMessage("Por favor, completa tu comentario y ambas calificaciones.");
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
            setAlertMessage("Error al añadir el comentario.");
        }
    };
    
    // **FIXED**: Generates correct URLs for Google Maps and Waze, and fixes the icon source.
    const getMapLink = (lat, lon) => {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        const wazeUrl = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
        const googleMapsIcon = "https://www.google.com/s2/favicons?domain=maps.google.com&sz=32";
        const wazeIcon = "https://www.google.com/s2/favicons?domain=waze.com&sz=32";
        return { googleMapsUrl, wazeUrl, googleMapsIcon, wazeIcon };
    };

    const mapLinks = place ? getMapLink(place.latitude, place.longitude) : null;

    if (!place) return <div className="text-center text-gray-600 mt-8">Selecciona un lugar para ver los detalles.</div>;

    return (
        <div className="container mx-auto p-4">
            <button onClick={onBack} className="mb-6 px-6 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition duration-300 font-medium shadow-md flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Volver a Lugares
            </button>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6">
                <img src={place.imageUrl} alt={place.name} className="w-full h-80 object-cover rounded-lg mb-6 shadow-md" onError={(e) => { e.target.src = `https://placehold.co/800x400/ccc/000?text=${encodeURIComponent(place.name)}`; }}/>
                
                <h2 className="text-5xl font-extrabold text-gray-900 mb-4">{place.name}</h2>
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">{place.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-3">Actividades y Tips</h3>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            {place.activities.map((activity, index) => <li key={index}>{activity}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-800 mb-3">Cómo Llegar</h3>
                        <p className="text-gray-600 mb-3">{place.howToGetThere}</p>
                        {mapLinks && (
                            <div className="flex space-x-4 mt-2">
                                <a href={mapLinks.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                    <img src={mapLinks.googleMapsIcon} alt="Google Maps" className="w-6 h-6 mr-1" /> Google Maps
                                </a>
                                <a href={mapLinks.wazeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
                                    <img src={mapLinks.wazeIcon} alt="Waze" className="w-6 h-6 mr-1" /> Waze
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    {loadingStamp ? (
                        <div className="flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div><p className="ml-3 text-blue-600">Verificando...</p></div>
                    ) : isStamped ? (
                        <div className="flex flex-col items-center justify-center">
                            <img src={place.stampImageUrl || "https://placehold.co/100x100/ccc/000?text=Sello"} alt="Sello digital" className="w-24 h-24 object-contain mb-2 shadow-lg" />
                            <p className="text-emerald-600 text-2xl font-bold">¡Pasaporte Sellado!</p>
                            <p className="text-gray-600 text-md">Ya visitaste este lugar.</p>
                        </div>
                    ) : (
                        <button onClick={handleStampClick} className="px-8 py-4 bg-indigo-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-105">
                            Sellar Pasaporte
                        </button>
                    )}
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Comentarios de Usuarios</h3>
                    <form onSubmit={handleCommentSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
                        <textarea className="w-full p-3 border border-gray-300 rounded-lg mb-3" rows="3" placeholder="Añade tu comentario..." value={commentText} onChange={(e) => setCommentText(e.target.value)}></textarea>
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
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">Publicar Comentario</button>
                    </form>

                    {loadingComments ? (
                        <div className="flex justify-center items-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div><p className="ml-3">Cargando...</p></div>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-gray-600">Sé el primero en comentar.</p>
                    ) : (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <p className="text-gray-800 font-medium">{comment.commentText}</p>
                                    <div className="flex items-center space-x-4 mt-2 text-sm">
                                        <div className="flex items-center"><span className="text-gray-700 mr-1">Dificultad:</span><StarRating rating={comment.difficultyRating} maxStars={3}/></div>
                                        <div className="flex items-center"><span className="text-gray-700 mr-1">Experiencia:</span><StarRating rating={comment.experienceRating} /></div>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-1">Por <span className="font-mono">{comment.userId.substring(0, 8)}...</span> el {new Date(comment.timestamp.toDate()).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente para "Mi Pasaporte"
// **FIXED**: Recibe `setAlertMessage` como prop para poder mostrar alertas.
const MyPassport = ({ setAlertMessage }) => {
    const { db, loadingFirebase, userId, appId } = useFirebase();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || loadingFirebase || !userId || !appId) return;

        const visitsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/visits`);
        const unsubscribe = onSnapshot(visitsCollectionRef, (snapshot) => {
            const fetchedVisits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedVisits.sort((a, b) => b.visitDate.toDate() - a.visitDate.toDate());
            setVisits(fetchedVisits);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, loadingFirebase, userId, appId]);

    const handleDownloadPassport = () => {
        setAlertMessage("La descarga del pasaporte está en desarrollo. ¡Pronto podrás compartir tus logros!");
    };

    if (loading) return <div className="text-center p-8">Cargando tu pasaporte...</div>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Mi Pasaporte Sellado</h2>
            {visits.length === 0 ? (
                <div className="text-center text-gray-600 p-8 bg-white rounded-xl shadow-lg">
                    <p>¡Aún no has sellado ningún lugar! Empieza a explorar.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {visits.map(visit => (
                            <div key={visit.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center space-y-3 transform hover:scale-105 transition-transform">
                                <img src={visit.stampImageUrl || "https://placehold.co/100x100/ccc/000?text=Sello"} alt={`Sello de ${visit.placeName}`} className="w-28 h-28 object-contain" />
                                <h3 className="text-xl font-semibold text-center">{visit.placeName}</h3>
                                <p className="text-gray-600 text-sm">Visitado: {new Date(visit.visitDate.toDate()).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <button onClick={handleDownloadPassport} className="px-8 py-4 bg-emerald-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-emerald-700">
                            Descargar Mi Pasaporte
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// Componente para solicitar añadir un lugar
// **FIXED**: Eliminado el estado local de alerta para usar el global.
const SubmitPlace = ({ setAlertMessage }) => {
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
            setFormData({ name: '', description: '', imageUrl: '', activities: '', howToGetThere: '' });
        } catch (error) {
            console.error("Error submitting place:", error);
            setAlertMessage("Error al enviar la solicitud.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 mt-4">Solicitar Añadir un Lugar</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* El formulario sigue igual, solo se eliminó el estado de alerta local */}
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

// ... (Los componentes Leaderboard, GroupTrips, CreateTour, TourDetail, y ToursList permanecen mayormente iguales,
// pero se les pasa `setAlertMessage` como prop donde sea necesario y se elimina cualquier estado de alerta local)
// A continuación, se muestra el componente principal `App` con el enrutamiento y el manejo de estado corregidos.


// Componente principal de la aplicación
const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [selectedTour, setSelectedTour] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null); // Estado de alerta centralizado
    const { userId, loadingFirebase } = useFirebase();

    const navigateTo = (page, data = null) => {
        setCurrentPage(page);
        setSelectedPlace(page === 'placeDetail' ? data : null);
        setSelectedTour(page === 'tourDetail' ? data : null);
    };

    const renderPage = () => {
        // **FIXED**: Se pasa `setAlertMessage` a todos los componentes que lo necesitan.
        switch (currentPage) {
            case 'home':
                return <PlaceList onSelectPlace={(place) => navigateTo('placeDetail', place)} />;
            case 'placeDetail':
                return <PlaceDetail place={selectedPlace} onBack={() => navigateTo('home')} setAlertMessage={setAlertMessage} />;
            case 'myPassport':
                return <MyPassport setAlertMessage={setAlertMessage} />;
            case 'submitPlace':
                return <SubmitPlace setAlertMessage={setAlertMessage} />;
            case 'leaderboard':
                return <Leaderboard />;
            case 'groupTrips':
                // Asumiendo que GroupTrips también usará alertas
                return <GroupTrips setAlertMessage={setAlertMessage} />;
            case 'createTour':
                return <CreateTour onNavigate={navigateTo} setAlertMessage={setAlertMessage} />;
            case 'toursList':
                return <ToursList onNavigate={navigateTo} />;
            case 'tourDetail':
                return <TourDetail tour={selectedTour} onNavigate={navigateTo} setAlertMessage={setAlertMessage} />;
            default:
                return <PlaceList onSelectPlace={(place) => navigateTo('placeDetail', place)} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-inter antialiased">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            
            <Header onNavigate={navigateTo} userId={userId} />

            {/* El diálogo de alerta se renderiza aquí y es controlado por el estado global */}
            <CustomAlertDialog message={alertMessage} onClose={() => setAlertMessage(null)} />

            <main className="py-8">
                {loadingFirebase ? (
                    <div className="text-center p-10">Cargando aplicación...</div>
                ) : (
                    renderPage()
                )}
            </main>

            <footer className="bg-gray-800 text-white text-center p-4 mt-8 rounded-t-xl">
                <p>© 2025 Pasaporte Virtual Panamá. Todos los derechos reservados.</p>
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