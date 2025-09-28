import { useEffect, useRef, useState } from "react";
import './image-modal.css'
import { BrainCircuit, Images, Info, Layers, LogOut, Pickaxe, PlusCircle, Server, Settings, Telescope, User2, Wrench, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAuth } from "../../../../hooks/useAuth";
import { useAlert } from "../../../../context/alertContext";
import Image from "next/image";
import axios from "axios";
import { useChat, useImagePlaygound, useWorkspace } from "../../../../context/ChatContext";
import ModalCont from "../../modal/modalCont";

const ImageModal = () => {
    const { expandImage } = useImagePlaygound() as { expandImage?: ImageMetadata };
    const [imageLoaded, setImageLoaded] = useState(false);
    const [image, setImage] = useState(true);
    const [imageError, setImageError] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    if (!expandImage) {
        return null;
    }

    useEffect(() => {
        // Reset states when expandImage changes
        setImageLoaded(false);
        setImageError(false);
        setImage(true);

        const img = new (typeof window !== "undefined" ? window.Image : globalThis.Image)();
        img.src = expandImage.image_url;

        const loadingTimeout = setTimeout(() => {
            if (!imageLoaded) {
                setImageError(true);
                setImageLoaded(true);
            }
        }, 10000); // 10 second timeout

        img.onload = () => {
            clearTimeout(loadingTimeout);
            setImageLoaded(true);
            setImageError(false);
        };

        img.onerror = (error) => {
            console.error("Image failed to load", error);
            clearTimeout(loadingTimeout);
            setImageLoaded(true);
            setImageError(true);
        };

        return () => {
            clearTimeout(loadingTimeout);
        };
    }, [expandImage?.image_url]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: any) => {
            if (e.key === 'Tab' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                setImage(prev => !prev);
            }
        };

        if (modalRef.current) {
            modalRef.current.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            if (modalRef.current) {
                modalRef.current.removeEventListener('keydown', handleKeyPress);
            }
        };
    }, []);

    const formatDate = (dateString: any) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const renderInfoItem = (label: any, value: any) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            return null;
        }

        return (
            <div key={label}>
                <label>{label}:</label>
                <p>{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</p>
            </div>
        );
    };

    return (
        <ModalCont>
            <div ref={modalRef} className="modal-content" tabIndex={-1}>
                {/* Toggle Buttons */}
                <div className="toggle-buttons" role="tablist">
                    <button
                        className={image ? 'active' : ''}
                        onClick={() => setImage(true)}
                        role="tab"
                        aria-selected={image}
                        aria-controls="image-panel"
                        tabIndex={0}
                    >
                        <Images size={14} />
                        <span>Image</span>
                    </button>
                    <button
                        className={!image ? 'active' : ''}
                        onClick={() => setImage(false)}
                        role="tab"
                        aria-selected={!image}
                        aria-controls="info-panel"
                        tabIndex={0}
                    >
                        <Info size={14} />
                        <span>Info</span>
                    </button>
                </div>

                {/* Loading State */}
                {!imageLoaded && (
                    <div className='loading-img' role="status" aria-label="Loading image">
                        <Image
                            src={'/sitraone.png'}
                            alt={'Loading...'}
                            width={40}
                            height={40}
                            priority
                        />
                    </div>
                )}

                {/* Image Panel */}
                {imageLoaded && expandImage && image && (
                    <div id="image-panel" role="tabpanel" aria-labelledby="image-tab">
                        {imageError ? (
                            <div className="image-error" style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: 'rgba(var(--text-color), 0.6)',
                                fontSize: '16px'
                            }}>
                                <p>Failed to load image</p>
                                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                                    The image could not be displayed. Please try again later.
                                </p>
                            </div>
                        ) : (
                            <img
                                src={expandImage.image_url}
                                alt={expandImage.revised_prompt || expandImage.prompt || 'Generated image'}
                                className="expanded-img"
                                loading="lazy"
                                onError={() => setImageError(true)}
                            />
                        )}
                    </div>
                )}

                {/* Info Panel */}
                {!image && (
                    <div id="info-panel" role="tabpanel" aria-labelledby="info-tab" className="image-info">
                        {renderInfoItem('Model', expandImage?.model?.name)}
                        {renderInfoItem('Created', formatDate(expandImage?.created))}
                        {renderInfoItem('Size', expandImage?.config?.size)}
                        {renderInfoItem('Quality', expandImage?.config?.quality)}
                        {renderInfoItem('Style', expandImage?.config?.style)}
                        {expandImage?.revised_prompt && renderInfoItem('Revised Prompt', expandImage.revised_prompt)}
                        {expandImage?.prompt && renderInfoItem('Original Prompt', expandImage.prompt)}
                        {expandImage?.config && Object.keys(expandImage.config).length > 0 &&
                            renderInfoItem('Additional Config',
                                Object.entries(expandImage.config)
                                    .filter(([key]) => !['size', 'quality', 'style'].includes(key))
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')
                            )}
                    </div>
                )}
            </div>
        </ModalCont>
    );
};

export default ImageModal;