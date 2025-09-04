// Simple script to clear demo data from localStorage
console.log('Resetting demo data from localStorage...');

if (typeof localStorage !== 'undefined') {
  // This script can run in Node or browser context
  console.log('localStorage is available. Clearing demo_db key...');
  localStorage.removeItem('demo_db');
  localStorage.removeItem('demo_access_token');
  localStorage.removeItem('demo_refresh_token');
  console.log('Demo data has been reset.');
} else {
  // Running in Node environment where localStorage is not available
  console.log('This script must be run in a browser environment to clear localStorage.');
  console.log('To clear demo data, open your browser console and run:');
  console.log('localStorage.removeItem("demo_db")');
  console.log('localStorage.removeItem("demo_access_token")');
  console.log('localStorage.removeItem("demo_refresh_token")');
}
