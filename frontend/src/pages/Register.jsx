import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HeartPulse, Stethoscope, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { register, registerDoctor, t } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient'); // patient, doctor
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Patient specific fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [medicalHistory, setMedicalHistory] = useState('');
  
  // Doctor specific fields
  const [specialization, setSpecialization] = useState('General Medicine');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [consultationFee, setConsultationFee] = useState('50');
  const [slotsInput, setSlotsInput] = useState('09:00 AM, 11:00 AM, 02:00 PM, 04:00 PM');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const commonData = { name, email, phone, password };

    if (role === 'patient') {
      const patientData = {
        ...commonData,
        role: 'patient',
        age: parseInt(age) || 0,
        gender,
        medical_history: medicalHistory
      };

      const result = await register(patientData);
      setLoading(false);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } else {
      // Doctor Registration
      const docProfileData = {
        specialization,
        license_number: licenseNumber,
        consultation_fee: parseFloat(consultationFee) || 0.0,
        availability_slots: slotsInput.split(',').map(s => s.trim())
      };

      const result = await registerDoctor(commonData, docProfileData);
      setLoading(false);

      if (result.success) {
        setSuccessMsg('Doctor registration submitted successfully! Awaiting administrator approval of your license credentials before you can log in.');
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setLicenseNumber('');
      } else {
        setError(result.error);
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 -z-10 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <h2 className="text-center text-3xl font-extrabold text-slate-900">
          Create Your MediBot Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Log in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          
          {successMsg ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-success-50 border border-success-100 rounded-2xl text-center space-y-4"
            >
              <CheckCircle className="h-12 w-12 text-success-600 mx-auto" />
              <h3 className="text-lg font-bold text-success-900">Registration Received</h3>
              <p className="text-sm text-success-700 leading-relaxed">{successMsg}</p>
              <div className="pt-2">
                <Link to="/login" className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors inline-block">
                  Go to Login
                </Link>
              </div>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              {/* Role Selection Tabs */}
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setRole('patient'); setError(''); }}
                  className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
                    role === 'patient' 
                      ? 'bg-white text-primary-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Register as Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('doctor'); setError(''); }}
                  className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
                    role === 'doctor' 
                      ? 'bg-white text-success-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>Register as Doctor</span>
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-sm text-red-600">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Patient Fields */}
              {role === 'patient' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 border-t border-slate-100 pt-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Age</label>
                      <input
                        type="number"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="34"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase">Existing Medical History</label>
                    <textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      rows="3"
                      placeholder="E.g., Asthma, seasonal allergies, high blood pressure..."
                    ></textarea>
                  </div>
                </motion.div>
              )}

              {/* Doctor Fields */}
              {role === 'doctor' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 border-t border-slate-100 pt-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Specialization</label>
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-success-500"
                      >
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Psychiatry">Psychiatry</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Medical License Number</label>
                      <input
                        type="text"
                        required
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-success-500"
                        placeholder="LIC-CARD-XXXX"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Consultation Fee ($)</label>
                      <input
                        type="number"
                        required
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-success-500"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase">Availability Slots (Comma Separated)</label>
                      <input
                        type="text"
                        required
                        value={slotsInput}
                        onChange={(e) => setSlotsInput(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-success-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${
                    role === 'patient' 
                      ? 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500' 
                      : 'bg-success-600 hover:bg-success-700 focus:ring-success-500'
                  }`}
                >
                  {loading ? 'Submitting Registration...' : 'Register Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
