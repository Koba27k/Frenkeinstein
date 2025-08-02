/**
 * Global application context for state management
 */
import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  user: null,
  appointments: [],
  loading: false,
  error: null,
  currentBooking: null,
  availableSlots: [],
  voiceSupported: false
};

// Action types
export const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER: 'SET_USER',
  SET_APPOINTMENTS: 'SET_APPOINTMENTS',
  ADD_APPOINTMENT: 'ADD_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  SET_CURRENT_BOOKING: 'SET_CURRENT_BOOKING',
  SET_AVAILABLE_SLOTS: 'SET_AVAILABLE_SLOTS',
  SET_VOICE_SUPPORTED: 'SET_VOICE_SUPPORTED',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };
    
    case ActionTypes.SET_APPOINTMENTS:
      return { ...state, appointments: action.payload };
    
    case ActionTypes.ADD_APPOINTMENT:
      return { 
        ...state, 
        appointments: [...state.appointments, action.payload] 
      };
    
    case ActionTypes.UPDATE_APPOINTMENT:
      return {
        ...state,
        appointments: state.appointments.map(apt => 
          apt.id === action.payload.id ? action.payload : apt
        )
      };
    
    case ActionTypes.SET_CURRENT_BOOKING:
      return { ...state, currentBooking: action.payload };
    
    case ActionTypes.SET_AVAILABLE_SLOTS:
      return { ...state, availableSlots: action.payload };
    
    case ActionTypes.SET_VOICE_SUPPORTED:
      return { ...state, voiceSupported: action.payload };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Context provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setAppointments: (appointments) => dispatch({ type: ActionTypes.SET_APPOINTMENTS, payload: appointments }),
    addAppointment: (appointment) => dispatch({ type: ActionTypes.ADD_APPOINTMENT, payload: appointment }),
    updateAppointment: (appointment) => dispatch({ type: ActionTypes.UPDATE_APPOINTMENT, payload: appointment }),
    setCurrentBooking: (booking) => dispatch({ type: ActionTypes.SET_CURRENT_BOOKING, payload: booking }),
    setAvailableSlots: (slots) => dispatch({ type: ActionTypes.SET_AVAILABLE_SLOTS, payload: slots }),
    setVoiceSupported: (supported) => dispatch({ type: ActionTypes.SET_VOICE_SUPPORTED, payload: supported })
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}