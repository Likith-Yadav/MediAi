import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, FirebaseUser, FirebaseConsultation, FirebaseUpload } from "@/lib/firebase";

// User profile hooks
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        return { 
          uid: docSnap.id, 
          name: userData.name || '',
          email: userData.email || '',
          createdAt: userData.createdAt ? (userData.createdAt as Timestamp).toDate() : new Date(),
          age: userData.age,
          bloodType: userData.bloodType,
          allergies: userData.allergies
        } as FirebaseUser;
      }
      
      return null;
    },
    enabled: !!userId,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string, data: Partial<FirebaseUser> }) => {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    }
  });
}

// Consultations hooks
export function useConsultations(userId: string | undefined) {
  return useQuery({
    queryKey: ['consultations', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const q = query(
        collection(db, 'consultations'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const consultations: FirebaseConsultation[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        consultations.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          status: data.status,
          date: data.date ? (data.date as Timestamp).toDate() : new Date(),
          symptoms: data.symptoms || [],
          diagnosis: data.diagnosis || '',
          recommendations: data.recommendations || []
        });
      });
      
      return consultations;
    },
    enabled: !!userId,
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, title }: { userId: string, title: string }) => {
      const newConsultation = {
        userId,
        title,
        status: 'ongoing' as const,
        date: serverTimestamp(),
        symptoms: [],
        diagnosis: '',
        recommendations: []
      };
      
      const docRef = await addDoc(collection(db, 'consultations'), newConsultation);
      return { id: docRef.id, ...newConsultation, date: new Date() };
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', userId] });
    }
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      consultationId, 
      data, 
      userId 
    }: { 
      consultationId: string, 
      data: Partial<Omit<FirebaseConsultation, 'id' | 'userId'>>,
      userId: string
    }) => {
      const consultationRef = doc(db, 'consultations', consultationId);
      await updateDoc(consultationRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', userId] });
    }
  });
}

// Uploads hooks
export function useUploads(consultationId: string | undefined) {
  return useQuery({
    queryKey: ['uploads', consultationId],
    queryFn: async () => {
      if (!consultationId) return [];
      
      const q = query(
        collection(db, 'uploads'),
        where('consultationId', '==', consultationId)
      );
      
      const querySnapshot = await getDocs(q);
      const uploads: FirebaseUpload[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        uploads.push({
          id: doc.id,
          consultationId: data.consultationId,
          userId: data.userId,
          fileName: data.fileName,
          fileType: data.fileType,
          url: data.url,
          uploadedAt: data.uploadedAt ? (data.uploadedAt as Timestamp).toDate() : new Date(),
          analysisResult: data.analysisResult
        });
      });
      
      return uploads;
    },
    enabled: !!consultationId,
  });
}

export function useCreateUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      consultationId, 
      userId,
      file 
    }: { 
      consultationId: string, 
      userId: string,
      file: File
    }) => {
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `uploads/${userId}/${consultationId}/${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      
      // 2. Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      // 3. Create upload record in Firestore
      const newUpload = {
        consultationId,
        userId,
        fileName: file.name,
        fileType: file.type,
        url: downloadURL,
        uploadedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'uploads'), newUpload);
      return { id: docRef.id, ...newUpload, uploadedAt: new Date() };
    },
    onSuccess: (_, { consultationId }) => {
      queryClient.invalidateQueries({ queryKey: ['uploads', consultationId] });
    }
  });
}

export function useUpdateUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      uploadId, 
      analysisResult,
      consultationId
    }: { 
      uploadId: string, 
      analysisResult: any,
      consultationId: string
    }) => {
      const uploadRef = doc(db, 'uploads', uploadId);
      await updateDoc(uploadRef, {
        analysisResult,
        updatedAt: serverTimestamp()
      });
      return true;
    },
    onSuccess: (_, { consultationId }) => {
      queryClient.invalidateQueries({ queryKey: ['uploads', consultationId] });
    }
  });
}