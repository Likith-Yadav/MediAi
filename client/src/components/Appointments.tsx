import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/use-auth';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  doctorName: string;
  date: string;
  time: string;
  status: string;
  reason: string;
  appointmentId: string;
  timestamp: string;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser) return;

      try {
        // First try to get appointments from Firestore
        const consultationsRef = collection(db, 'consultations');
        const q = query(consultationsRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        // First collect all messages with appointment info
        const appointmentMessages: {[id: string]: any[]} = {};
        
        querySnapshot.forEach((doc) => {
          const consultation = doc.data();
          // Group messages by appointment ID
          consultation.messages?.forEach((msg: any) => {
            if (msg.appointmentId) {
              if (!appointmentMessages[msg.appointmentId]) {
                appointmentMessages[msg.appointmentId] = [];
              }
              appointmentMessages[msg.appointmentId].push({
                ...msg,
                consultationData: {
                  symptoms: consultation.symptoms,
                  doctorName: consultation.doctorName
                }
              });
            }
          });
        });
        
        // Process each group of messages per appointment
        const appointmentsList: Appointment[] = [];
        
        for (const [appointmentId, messages] of Object.entries(appointmentMessages)) {
          // Sort messages by timestamp to get the sequence
          messages.sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          });
          
          // Extract appointment info - prioritize the booking request message
          const bookingMessage = messages.find(msg => 
            msg.content && msg.content.includes("Appointment request sent!")
          );
          
          let doctorName = "Unknown Doctor";
          let appointmentDate = "Unknown Date";
          let appointmentTime = "Unknown Time";
          let status = "pending";
          let reason = "Medical Consultation";
          let timestamp = "";
          
          // Extract from booking message first
          if (bookingMessage) {
            // Extract doctor, date, time
            const match = bookingMessage.content.match(/notified once ([^]+?) confirms for (\d{4}-\d{2}-\d{2}) at (\d{2}:\d{2})/);
            if (match) {
              doctorName = match[1].trim();
              appointmentDate = match[2];
              appointmentTime = match[3];
              timestamp = bookingMessage.timestamp;
              reason = bookingMessage.consultationData.symptoms || 'Medical Consultation';
            }
          }
          
          // Check if there's an approval message
          const approvalMessage = messages.find(msg => 
            msg.isAppointmentUpdate && msg.content && msg.content.includes("approved")
          );
          
          if (approvalMessage) {
            status = "approved";
            
            // Try to extract updated doctor name from approval message, if available
            const match = approvalMessage.content.match(/Dr\.\s*([^]+?)\s+has approved/);
            if (match && match[1] && match[1] !== "The doctor") {
              doctorName = match[1].trim();
            }
            
            // Try to extract updated date and time, but only if they're not undefined
            const dateTimeMatch = approvalMessage.content.match(/for\s+(\S+)\s+at\s+(\S+)/);
            if (dateTimeMatch && dateTimeMatch[1] && dateTimeMatch[1] !== "undefined") {
              appointmentDate = dateTimeMatch[1];
            }
            if (dateTimeMatch && dateTimeMatch[2] && dateTimeMatch[2] !== "undefined") {
              appointmentTime = dateTimeMatch[2];
            }
          }
          
          // For messages with "cancelled" content
          const cancellationMessage = messages.find(msg => 
            msg.content && msg.content.includes("cancelled")
          );
          
          if (cancellationMessage) {
            status = "cancelled";
          }
          
          appointmentsList.push({
            id: appointmentId,
            doctorName,
            date: appointmentDate,
            time: appointmentTime,
            status,
            reason,
            appointmentId,
            timestamp
          });
        }

        setAppointments(appointmentsList);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, [currentUser]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!currentUser) return;

    try {
      // Update the appointment status in Firestore
      const consultationsRef = collection(db, 'consultations');
      const q = query(consultationsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      for (const docRef of querySnapshot.docs) {
        const consultation = docRef.data();
        const updatedMessages = consultation.messages.map((msg: any) => {
          if (msg.appointmentId === appointmentId) {
            return {
              ...msg,
              content: 'Appointment cancelled by user',
              isAppointmentUpdate: true
            };
          }
          return msg;
        });

        await updateDoc(doc(db, 'consultations', docRef.id), {
          messages: updatedMessages
        });
      }

      // Update local state
      setAppointments(prev => 
        prev.map(appt => 
          appt.appointmentId === appointmentId 
            ? { ...appt, status: 'cancelled' }
            : appt
        )
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Appointments</h2>
      {appointments.length === 0 ? (
        <p className="text-muted-foreground">No appointments scheduled</p>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Appointment with Dr. {appointment.doctorName}</CardTitle>
                <Badge variant={appointment.status === 'approved' ? 'default' : (appointment.status === 'cancelled' ? 'destructive' : 'secondary')}>
                  {appointment.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Date:</strong> {appointment.date}</p>
                  <p><strong>Time:</strong> {appointment.time}</p>
                  <p><strong>Reason:</strong> {appointment.reason}</p>
                  {appointment.timestamp && (
                    <p className="text-xs text-muted-foreground">Requested: {format(new Date(appointment.timestamp), 'PPp')}</p>
                  )}
                </div>
                {appointment.status !== 'cancelled' && (
                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={() => handleCancelAppointment(appointment.appointmentId)}
                  >
                    Cancel Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;