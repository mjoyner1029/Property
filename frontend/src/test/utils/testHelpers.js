// frontend/src/test/utils/testHelpers.js
import { screen } from '@testing-library/react';

/**
 * Helper function to get input elements by name attribute
 * @param {string} name - The name attribute to search for
 * @returns {HTMLElement} The found input element
 */
export const getInputByName = (name) => {
  return screen.getByRole('textbox', { name: new RegExp(name, 'i') }) || 
         screen.getByLabelText(new RegExp(name, 'i')) ||
         document.querySelector(`[name="${name}"]`);
};

/**
 * Helper function to get select elements by name attribute
 * @param {string} name - The name attribute to search for
 * @returns {HTMLElement} The found select element
 */
export const getSelectByName = (name) => {
  return screen.getByRole('combobox', { name: new RegExp(name, 'i') }) || 
         screen.getByLabelText(new RegExp(name, 'i')) ||
         document.querySelector(`[name="${name}"]`);
};

/**
 * Helper function to wait for element to be removed
 * @param {HTMLElement} element - The element to wait for removal
 * @returns {Promise} A promise that resolves when the element is removed
 */
export const waitForElementToBeRemoved = (element) => {
  return new Promise(resolve => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Check immediately in case the element is already removed
    if (!document.contains(element)) {
      observer.disconnect();
      resolve();
    }
  });
};
