// TODO: Replace with your actual appointment API base URL
const API_BASE_URL = 'https://doctor-appointment-backend-7htx.onrender.com/api'; // Make sure this is correct!

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('appointment_auth_token');
};

// Helper function to create headers with auth token
const createAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Function to check if user is authenticated for appointment system
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Function to fetch REAL doctors from the API
export const fetchDoctors = async (specialty?: string): Promise<any[]> => {
  console.log(`Fetching REAL doctors... Specialty: ${specialty}`);
  try {
    const url = specialty ? `${API_BASE_URL}/doctors?specialty=${encodeURIComponent(specialty)}` : `${API_BASE_URL}/doctors`;
    console.log(`Calling API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: createAuthHeaders()
    });

    if (!response.ok) {
      // Log more details on failure
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch doctors. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received doctors:", data);
    return data; // Return the actual data from the API
  } catch (error) {
    console.error("Error in fetchDoctors:", error);
    // Re-throw the error or return an empty array/handle appropriately
    throw error; // Re-throw to be caught by the calling component
  }
};

// Function to fetch REAL availability from the API
export const fetchAvailability = async (doctorId: string): Promise<any[]> => {
  if (!doctorId) {
    console.error("Missing doctor ID");
    throw new Error("Doctor ID is required");
  }
  
  console.log(`Fetching REAL availability for doctor ${doctorId}...`);
  try {
    // Try the alternative format if your API expects a query parameter instead of path parameter
    // const url = `${API_BASE_URL}/availability?doctorId=${doctorId}`;
    
    // Standard RESTful format
    const url = `${API_BASE_URL}/doctors/${doctorId}/availability`;
    
    console.log(`Calling API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: createAuthHeaders()
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
      
      // Parse the error body to get more details
      let errorMessage = `Failed to fetch availability. Status: ${response.status}`;
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError && parsedError.message) {
          errorMessage = `API Error: ${parsedError.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, just use the original error
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Received availability:", data);
    
    // Handle both array responses and responses with a data property
    const slots = Array.isArray(data) ? data : (data.data || data.slots || data.availability || []);
    
    // If we got no slots, log it but return an empty array rather than throwing
    if (!slots.length) {
      console.log("No availability slots returned from API");
    }
    
    return slots; 
  } catch (error) {
    console.error("Error in fetchAvailability:", error);
    throw error;
  }
};

// Helper to check if a string is a valid MongoDB ObjectId format
const isValidMongoObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Helper to format IDs correctly for the API
const formatIdForApi = (id: string, fieldName: string): string => {
  // Log for debugging
  console.log(`Formatting ID for ${fieldName}:`, id);
  
  // If it's already a valid MongoDB ObjectId, use it as is
  if (isValidMongoObjectId(id)) {
    return id;
  }
  
  // For patientId, we'll use a special prefix to indicate it's a non-MongoDB ID
  // This assumes the backend has been modified to handle these special IDs
  if (fieldName === 'patientId') {
    return `firebase_${id}`;
  }
  
  // For other IDs, return as is but log a warning
  console.warn(`Warning: ${fieldName} may not be a valid MongoDB ObjectId:`, id);
  return id;
};

// Function to register a patient with the appointment system
export const createPatient = async (patientData: any): Promise<any> => {
  console.log('Creating patient with data:', patientData);
  
  if (!patientData.name) {
    throw new Error("Patient name is required");
  }
  
  try {
    // Create a copy of the data
    const formattedData = { ...patientData };
    
    // API endpoint for patient creation
    const url = `${API_BASE_URL}/patients`;
    
    console.log(`Calling API URL: ${url}`);
    console.log(`Request method: POST`);
    console.log(`Request body:`, formattedData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(formattedData)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
      
      let errorMessage = `Failed to create patient. Status: ${response.status}`;
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError && parsedError.message) {
          errorMessage = `API Error: ${parsedError.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, just use the original error
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Patient creation response:", data);
    return data; // Return the response with patient ID
  } catch (error) {
    console.error("Error in createPatient:", error);
    throw error;
  }
};

// Function to find a patient by external ID (e.g., Firebase UID)
export const findPatientByExternalId = async (externalId: string): Promise<any> => {
  console.log('Finding patient with external ID:', externalId);
  
  try {
    // API endpoint for patient lookup by external ID
    const url = `${API_BASE_URL}/patients/external/${externalId}`;
    
    console.log(`Calling API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: createAuthHeaders()
    });

    // If 404, patient doesn't exist, which is fine - we'll create one
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
      
      let errorMessage = `Failed to find patient. Status: ${response.status}`;
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError && parsedError.message) {
          errorMessage = `API Error: ${parsedError.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, just use the original error
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Patient lookup response:", data);
    return data; // Return the patient data
  } catch (error) {
    console.error("Error in findPatientByExternalId:", error);
    // Don't throw here - we'll create a patient if not found
    return null;
  }
};

// Function to REALLY request an appointment through the API
export const requestAppointment = async (details: any): Promise<any> => {
  console.log('Requesting REAL appointment with data:', details);
  
  // Check for minimum required fields (adjust based on your API requirements)
  if (!details.doctorId) {
    throw new Error("doctorId is required for appointment booking");
  }
  
  // Make sure we have some form of date/time information
  if (!details.date && !details.dateTime) {
    throw new Error("Date information is required for appointment booking");
  }
  
  try {
    // Create a copy of the details to avoid modifying the original
    const formattedDetails = { ...details };
    
    // Format doctorId if needed (ensure it's a valid MongoDB ID)
    if (formattedDetails.doctorId) {
      formattedDetails.doctorId = formatIdForApi(formattedDetails.doctorId, 'doctorId');
    }
    
    // Direct approach: Embed patient information in the appointment request
    // This assumes the API will handle patient registration if needed
    
    // If we have the Firebase UID, pass it along in a way the API can recognize
    if (formattedDetails.externalPatientId) {
      formattedDetails.patientExternalId = formattedDetails.externalPatientId;
    }
    
    // Format slot ID if present
    if (formattedDetails.slotId) {
      formattedDetails.slotId = formatIdForApi(formattedDetails.slotId, 'slotId');
    }
    
    // Log what we're sending
    console.log("Appointment request payload:", JSON.stringify(formattedDetails, null, 2));
    
    // Direct call to the appointments endpoint
    const url = `${API_BASE_URL}/appointments`;
    
    console.log(`Calling API URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(formattedDetails)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
      
      // Try to parse error for more details
      let errorMessage = `Failed to request appointment. Status: ${response.status}`;
      try {
        const parsedError = JSON.parse(errorBody);
        if (parsedError && parsedError.message) {
          errorMessage = `API Error: ${parsedError.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, just use the original error
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Appointment request response:", data);
    return data; // Return the actual response from API
  } catch (error) {
    console.error("Error in requestAppointment:", error);
    throw error;
  }
};

// Function to check appointment status from the API
export const checkAppointmentStatus = async (appointmentId: string): Promise<any> => {
  console.log(`Checking REAL status for appointment ${appointmentId}...`);
  try {
    const url = `${API_BASE_URL}/appointments/${appointmentId}/status`;
    console.log(`Calling API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: createAuthHeaders()
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorBody);
      throw new Error(`Failed to check appointment status. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Status check response:", data);
    return data; // Return the actual status from API
  } catch (error) {
    console.error("Error in checkAppointmentStatus:", error);
    throw error;
  }
}; 