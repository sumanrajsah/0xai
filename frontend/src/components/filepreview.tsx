// components/FilePreview.tsx
import React from 'react';
import './filepreview.css'

type FilePreviewProps = {
    fileUrl: string;
    fileName: string;
    show: boolean;
};

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, fileName, show }) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    // Image preview
    if (extension && ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
        return <img src={fileUrl} alt={fileName} className="image-preview" />;
    }
    function shortFileName(name: string) {
        const parts = name.split(".");
        if (parts.length < 2) return name; // no extension

        const ext = parts.pop(); // last part = extension
        const base = parts.join("."); // filename without extension

        return `${base.slice(0, 15)}...${ext}`;
    }

    // Card for non-image
    return (
        <div className="file-card">
            <div className="file-icon">📄</div>
            {show && <div className="file-info">
                <p className="file-name"><span>{shortFileName(fileName)}</span>
                </p>
            </div>}
        </div>
    );
};

export default FilePreview;
