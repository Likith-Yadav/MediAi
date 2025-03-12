import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { FirebaseUser, FirebaseConsultation, FirebaseUpload, usersCollection, consultationsCollection, uploadsCollection } from '@/lib/firebase';

// User Profile Hooks
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const userDoc = await getDoc(doc(db, usersCollection, userId));
      return userDoc.exists() ? userDoc.data() as FirebaseUser : null;
    },
    enabled: !!userId
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<FirebaseUser> }) => {
      const userRef = doc(db, usersCollection, userId);
      await updateDoc(userRef, data);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    }
  });
}

// Consultations Hooks
export function useConsultations(userId: string | undefined) {
  return useQuery({
    queryKey: ['consultations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const consultationsRef = collection(db, consultationsCollection);
      const q = query(consultationsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirebaseConsultation[];
    },
    enabled: !!userId
  });
}

export function useCreateConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (consultation: Omit<FirebaseConsultation, 'id'>) => {
      const consultationRef = doc(collection(db, consultationsCollection));
      const newConsultation = { ...consultation, id: consultationRef.id };
      await setDoc(consultationRef, newConsultation);
      return newConsultation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', variables.userId] });
    }
  });
}

export function useUpdateConsultation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ consultationId, data }: { consultationId: string; data: Partial<FirebaseConsultation> }) => {
      const consultationRef = doc(db, consultationsCollection, consultationId);
      await updateDoc(consultationRef, data);
      return data;
    },
    onSuccess: (_, variables) => {
      const consultation = queryClient.getQueryData<FirebaseConsultation>(['consultation', variables.consultationId]);
      if (consultation) {
        queryClient.invalidateQueries({ queryKey: ['consultations', consultation.userId] });
      }
    }
  });
}

// Upload Hooks
export function useUploads(consultationId: string | undefined) {
  return useQuery({
    queryKey: ['uploads', consultationId],
    queryFn: async () => {
      if (!consultationId) return [];
      const uploadsRef = collection(db, uploadsCollection);
      const q = query(uploadsRef, where('consultationId', '==', consultationId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FirebaseUpload[];
    },
    enabled: !!consultationId
  });
}

export function useCreateUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (upload: Omit<FirebaseUpload, 'id'>) => {
      const uploadRef = doc(collection(db, uploadsCollection));
      const newUpload = { ...upload, id: uploadRef.id };
      await setDoc(uploadRef, newUpload);
      return newUpload;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['uploads', variables.consultationId] });
    }
  });
}

export function useUpdateUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ uploadId, data }: { uploadId: string; data: Partial<FirebaseUpload> }) => {
      const uploadRef = doc(db, uploadsCollection, uploadId);
      await updateDoc(uploadRef, data);
      return data;
    },
    onSuccess: (_, variables) => {
      const upload = queryClient.getQueryData<FirebaseUpload>(['upload', variables.uploadId]);
      if (upload) {
        queryClient.invalidateQueries({ queryKey: ['uploads', upload.consultationId] });
      }
    }
  });
}