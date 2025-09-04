/**
 * Basic JSDOM test - No React, just DOM
 */
describe('JSDOM Test', () => {
  test('can modify the DOM directly', () => {
    // Clear any existing content
    document.body.innerHTML = '';
    
    // Create an element
    const div = document.createElement('div');
    div.innerHTML = '<span>JSDOM Test Content</span>';
    
    // Add it to the document
    document.body.appendChild(div);
    
    // Log the document state
    console.log('JSDOM document.body:', document.body.innerHTML);
    
    // Test if the content is there
    expect(document.body).toHaveTextContent('JSDOM Test Content');
    
    // Test querySelector
    const span = screen.queryBySelector('span');
    expect(span).not.toBeNull();
    expect(span).toHaveTextContent('JSDOM Test Content');
  });
});
