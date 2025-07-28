import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  collectionGroup,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { app } from './firebase'; // Ensure you have this file exporting the initialized app

export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Auth Functions ---

export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // Create a user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    role: 'user', // Default role
    createdAt: serverTimestamp(),
  });
  return user;
};

export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserProfile = async (userId) => {
    if (!userId) return null;
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};


// --- Competition Functions ---

export const createCompetition = async (competitionData, ownerId) => {
  const batch = writeBatch(db);

  // 1. Create the main competition document
  const competitionRef = doc(collection(db, 'competitions'));
  batch.set(competitionRef, {
    ...competitionData,
    ownerId,
    createdAt: serverTimestamp(),
    participantIds: [ownerId] // Automatically add owner as a participant
  });

  // 2. Add the owner to the participants subcollection
  const participantRef = doc(db, 'competitions', competitionRef.id, 'participants', ownerId);
  batch.set(participantRef, {
      userId: ownerId,
      cash: competitionData.startingBalance,
      portfolioValue: competitionData.startingBalance,
      stocks: []
  });

  await batch.commit();
  return competitionRef.id;
};

export const getCompetitionDetails = async (competitionId) => {
    const competitionRef = doc(db, 'competitions', competitionId);
    const competitionSnap = await getDoc(competitionRef);
    if (competitionSnap.exists()) {
        return { id: competitionSnap.id, ...competitionSnap.data() };
    } else {
        throw new Error("Competition not found");
    }
};

export const getCompetitionParticipants = async (competitionId) => {
    const participantsCol = collection(db, 'competitions', competitionId, 'participants');
    const participantsSnap = await getDocs(participantsCol);
    return participantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


// --- Invitation Functions ---

export const sendInvitation = async (competitionId, invitedEmail, ownerId) => {
    // 1. Find the user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", invitedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("User with that email not found.");
    }
    const invitedUser = querySnapshot.docs[0].data();
    const invitedUserId = querySnapshot.docs[0].id;

    // 2. Create the invitation document
    const invitationRef = doc(db, 'competitions', competitionId, 'invitations', invitedUserId);
    await setDoc(invitationRef, {
        competitionId,
        invitedBy: ownerId,
        status: 'pending',
        createdAt: serverTimestamp()
    });
};

export const getPendingInvitations = async (userId) => {
    const invitationsQuery = query(
        collectionGroup(db, 'invitations'),
        where('status', '==', 'pending')
    );

    const snapshot = await getDocs(invitationsQuery);
    const invitations = [];
    snapshot.forEach(doc => {
        // This is a workaround because collectionGroup queries don't let you filter by path.
        // We check if the document ID (which is the userId) matches.
        if (doc.id === userId) {
            invitations.push({ id: doc.id, ...doc.data() });
        }
    });
    return invitations;
};

export const acceptInvitation = async (invitation) => {
    const { competitionId, id: userId } = invitation;

    // Get competition details to get starting balance
    const competition = await getCompetitionDetails(competitionId);

    const batch = writeBatch(db);

    // 1. Add user to the participants subcollection
    const participantRef = doc(db, 'competitions', competitionId, 'participants', userId);
    batch.set(participantRef, {
        userId: userId,
        cash: competition.startingBalance,
        portfolioValue: competition.startingBalance,
        stocks: []
    });

    // 2. Add userId to the participantIds array in the main competition doc
    const competitionRef = doc(db, 'competitions', competitionId);
    batch.update(competitionRef, {
        participantIds: arrayUnion(userId)
    });


    // 3. Delete the invitation
    const invitationRef = doc(db, 'competitions', competitionId, 'invitations', userId);
    batch.delete(invitationRef);

    await batch.commit();
};

export const declineInvitation = async (invitation) => {
    const { competitionId, id: userId } = invitation;
    const invitationRef = doc(db, 'competitions', competitionId, 'invitations', userId);
    await deleteDoc(invitationRef);
};


// --- Portfolio and Trading Functions ---
export const getPortfolio = async (competitionId, userId) => {
    const participantRef = doc(db, 'competitions', competitionId, 'participants', userId);
    const docSnap = await getDoc(participantRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

export const executeTrade = async (competitionId, userId, tradeDetails) => {
    const { symbol, quantity, price, type } = tradeDetails;
    const cost = quantity * price;

    const participantRef = doc(db, 'competitions', competitionId, 'participants', userId);

    // This should be a transaction in a real app, but for now, we'll use a batch.
    const batch = writeBatch(db);
    const portfolio = await getPortfolio(competitionId, userId);

    if (!portfolio) throw new Error("Portfolio not found");

    const newCash = type === 'buy' ? portfolio.cash - cost : portfolio.cash + cost;
    if (newCash < 0) throw new Error("Not enough cash to complete purchase.");

    const existingStock = portfolio.stocks.find(s => s.symbol === symbol);
    let newStocks;

    if (type === 'buy') {
        if (existingStock) {
            newStocks = portfolio.stocks.map(s =>
                s.symbol === symbol
                    ? { ...s, quantity: s.quantity + quantity, avgPrice: ((s.avgPrice * s.quantity) + cost) / (s.quantity + quantity) }
                    : s
            );
        } else {
            newStocks = [...portfolio.stocks, { symbol, quantity, avgPrice: price }];
        }
    } else { // Sell
        if (!existingStock || existingStock.quantity < quantity) {
            throw new Error("Not enough shares to sell.");
        }
        newStocks = portfolio.stocks.map(s =>
            s.symbol === symbol
                ? { ...s, quantity: s.quantity - quantity }
                : s
        ).filter(s => s.quantity > 0); // Remove stock if all shares are sold
    }

    batch.update(participantRef, { cash: newCash, stocks: newStocks });
    await batch.commit();
};

// --- API Logging ---
export const logApiCall = async (userId, functionName, params) => {
    if (!userId) return; // Don't log if user is not identified
    try {
        const logsCollection = collection(db, 'api_logs');
        await addDoc(logsCollection, {
            userId,
            functionName,
            params,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging API call:", error);
    }
};

// --- Admin Functions ---

/**
 * Fetches all users from the 'users' collection.
 * Requires admin privileges.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return userList;
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

/**
 * Fetches all competitions from the 'competitions' collection.
 * Requires admin privileges to see all, but is generally readable.
 * @returns {Promise<Array>} A promise that resolves to an array of competition objects.
 */
export const getAllCompetitions = async () => {
  try {
    const competitionsCollection = collection(db, 'competitions');
    const competitionSnapshot = await getDocs(competitionsCollection);
    const competitionList = competitionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return competitionList;
  } catch (error) {
    console.error("Error fetching all competitions:", error);
    throw error;
  }
};

/**
 * Fetches all API logs from the 'api_logs' collection.
 * Requires admin privileges.
 * @returns {Promise<Array>} A promise that resolves to an array of log objects.
 */
export const getApiLogs = async () => {
  try {
    const logsCollection = collection(db, 'api_logs');
    const logSnapshot = await getDocs(logsCollection);
    const logList = logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort logs by timestamp, newest first
    logList.sort((a, b) => {
        const aTimestamp = a.timestamp?.toMillis() || 0;
        const bTimestamp = b.timestamp?.toMillis() || 0;
        return bTimestamp - aTimestamp;
    });
    return logList;
  } catch (error) {
    console.error("Error fetching API logs:", error);
    throw error;
  }
};
