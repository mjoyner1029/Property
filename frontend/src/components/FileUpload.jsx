import React, { useRef } from "react";

const FileUpload = ({ onUpload }) => {
  const inputRef = useRef();

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div>
      <input
        aria-label="Upload file"
        type="file"
        ref={inputRef}
        onChange={handleChange}
        className="block"
      />
    </div>
  );
};

export default FileUpload;