import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const navigate = useNavigate();
    const reference = searchParams.get('reference');

  useEffect(() => {
    const verify = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/api/payments/verify/${reference}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        }
    };
    verify();
}, [reference]);

    if (status === 'verifying') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <h2 className="text-xl font-bold">Verifying Transaction...</h2>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                {status === 'success' ? (
                    <>
                        <CheckCircle size={80} className="text-green-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Secured!</h1>
                        <p className="text-slate-500 mb-8">Your tuition has been cleared. Welcome to the flight deck.</p>
                        <Link to="/student-portal" className="block w-full bg-blue-600 text-white py-4 rounded-xl font-bold">
                            Return to Portal
                        </Link>
                    </>
                ) : (
                    <>
                        <XCircle size={80} className="text-red-500 mx-auto mb-6" />
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Verification Failed</h1>
                        <p className="text-slate-500 mb-8">We couldn't confirm the payment. If you were debited, please contact support.</p>
                        <button onClick={() => navigate('/student-portal')} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold">
                            Go Back
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
