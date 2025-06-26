
import React, { useState } from 'react';

const LandlordOnboarding = () => {
  const [form, setForm] = useState({ phone: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/onboard/landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSuccess(true);
    } catch (e) {
      console.error('Submission error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4">Landlord Onboarding</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="phone" placeholder="Phone Number" onChange={handleChange} className="w-full border p-2" />
        <input name="company" placeholder="Company (Optional)" onChange={handleChange} className="w-full border p-2" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2">
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        {success && <p className="text-green-600 mt-2">Onboarding Complete</p>}
      </form>
    </div>
  );
};

export default LandlordOnboarding;
