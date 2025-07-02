import React from "react";

const Support = () => (
  <div className="max-w-md mx-auto mt-10">
    <h2 className="text-2xl font-semibold mb-4">Support & Help</h2>
    <div className="mb-4">
      <h3 className="font-bold">FAQ</h3>
      <ul className="list-disc ml-6">
        <li>How do I reset my password?</li>
        <li>How do I contact my landlord?</li>
        <li>How do I upload documents?</li>
      </ul>
    </div>
    <form className="space-y-2">
      <label className="block font-medium">Contact Support</label>
      <input className="w-full border p-2" placeholder="Your email" />
      <textarea className="w-full border p-2" placeholder="How can we help?" />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
        Send
      </button>
    </form>
  </div>
);

export default Support;